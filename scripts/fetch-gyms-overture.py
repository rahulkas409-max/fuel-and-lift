"""
Builds data/gyms/tiles/*.json — every gym / fitness studio in India from Overture Maps
"places" (open data: CDLA-Permissive-2.0, with some Apache-2.0 / CC0 sources).

Reads only the parquet row groups that overlap India, straight from the public S3 bucket.
  pip install pyarrow
  python scripts/fetch-gyms-overture.py [release]          # e.g. 2026-09-23.1
  python scripts/fetch-gyms-overture.py --from-raw raw.json  # rebuild tiles only
"""
import json, os, re, sys, collections, datetime
from urllib.parse import urlparse

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "gyms")
INDIA = (68.0, 97.5, 6.5, 35.8)  # lng0, lng1, lat0, lat1
GYM_TAX = {"gym", "yoga_studio", "pilates_studio", "boxing_class", "boxing_gym", "kickboxing_club", "martial_arts_club", "fitness_studio"}
GYM_BASIC = {"gym", "fitness_studio"}
NAME_OK = re.compile(r"gym|fitness|fit\b|crossfit|yoga|health club|muscle|iron|workout|body ?build|pilates|zumba|boxing|mma", re.I)
# Overture sometimes files shops/pharmacies/restaurants under fitness categories. Drop those
# unless the name also clearly says it's a gym / studio.
NOT_A_GYM = re.compile(
    r"equipment|store\b|shop\b|wholesale|supplier|dealer|manufactur|showroom|trading|enterprises|ayurved|hospital|clinic|physiotherap|school\b|college"
    r"|pharmac|chemist|medical|nutrition|supplement|diagnostic|pathlab|salon|beauty|parlou?r|\bbank\b|\batm\b|restaurant|\bcafe\b|dhaba|hotel|resort"
    r"|\bpg\b|hostel|mobile|electronic|tailor|jewell|\bvet\b|dental|eye care|optical|kirana|\bmart\b|super ?market|bakery|sweets",
    re.I,
)
CLEARLY_GYM = re.compile(r"gym|fitness|yoga|crossfit|health club|workout|pilates|zumba|boxing|mma|martial|taekwondo|karate|kick ?box|dance studio", re.I)


def s3():
    import pyarrow.fs as pafs
    kw = {}
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        u = urlparse(proxy)
        kw["proxy_options"] = {"scheme": u.scheme or "http", "host": u.hostname, "port": u.port or 80}
    return pafs.S3FileSystem(anonymous=True, region="us-west-2", **kw)


def extract(release):
    import pyarrow.fs as pafs, pyarrow.parquet as pq
    fs = s3()
    base = f"overturemaps-us-west-2/release/{release}/theme=places/type=place"
    out = []
    for f in sorted(x.path for x in fs.get_file_info(pafs.FileSelector(base))):
        pf = pq.ParquetFile(f, filesystem=fs)
        md = pf.metadata
        names = [md.schema.column(i).path for i in range(md.num_columns)]
        ix = {k: names.index(k) for k in ("bbox.xmin", "bbox.xmax", "bbox.ymin", "bbox.ymax")}
        for r in range(md.num_row_groups):
            st = {k: md.row_group(r).column(i).statistics for k, i in ix.items()}
            if all(s and s.has_min_max for s in st.values()) and (
                st["bbox.xmax"].max < INDIA[0] or st["bbox.xmin"].min > INDIA[1] or st["bbox.ymax"].max < INDIA[2] or st["bbox.ymin"].min > INDIA[3]
            ):
                continue
            small = pf.read_row_group(r, columns=["basic_category", "taxonomy", "bbox"]).to_pylist()
            idx = []
            for i, row in enumerate(small):
                b = row["bbox"]
                lng, lat = (b["xmin"] + b["xmax"]) / 2, (b["ymin"] + b["ymax"]) / 2
                tax = (row["taxonomy"] or {}).get("primary")
                if INDIA[2] < lat < INDIA[3] and INDIA[0] < lng < INDIA[1] and (
                    row["basic_category"] in GYM_BASIC or tax in GYM_TAX or row["basic_category"] == "sport_or_fitness_facility"
                ):
                    idx.append(i)
            if not idx:
                continue
            cols = ["id", "names", "confidence", "websites", "phones", "addresses", "basic_category", "taxonomy", "brand", "operating_status", "bbox"]
            for row in pf.read_row_group(r, columns=cols).take(idx).to_pylist():
                name = ((row["names"] or {}).get("primary") or "").strip()
                tax = (row["taxonomy"] or {}).get("primary")
                if not name:
                    continue
                if row["basic_category"] == "sport_or_fitness_facility" and tax not in GYM_TAX and not NAME_OK.search(name):
                    continue
                if row["operating_status"] and row["operating_status"] != "open":
                    continue
                if (row["confidence"] or 0) < 0.4:
                    continue
                a = (row["addresses"] or [{}])[0] or {}
                if a.get("country") and a["country"] != "IN":
                    continue
                b = row["bbox"]
                out.append({
                    "id": row["id"], "n": name,
                    "lat": round((b["ymin"] + b["ymax"]) / 2, 6), "lng": round((b["xmin"] + b["xmax"]) / 2, 6),
                    "ph": (row["phones"] or [None])[0], "web": (row["websites"] or [None])[0],
                    "adr": a.get("freeform"), "city": a.get("locality"), "pin": a.get("postcode"), "st": a.get("region"),
                    "cat": tax or row["basic_category"], "brand": ((row["brand"] or {}).get("names") or {}).get("primary"),
                    "conf": round(row["confidence"] or 0, 2),
                })
        print(f[-40:], len(out), flush=True)
    return out


def build_tiles(raw, release):
    seen, gyms = set(), []
    for g in raw:
        if NOT_A_GYM.search(g["n"]) and not CLEARLY_GYM.search(g["n"]):
            continue
        key = (g["n"].lower(), round(g["lat"], 3), round(g["lng"], 3))
        if key in seen:
            continue
        seen.add(key)
        gyms.append(g)
    tiles = collections.defaultdict(list)
    for g in gyms:
        # Compact row: [name, lat, lng, phone, website, address, city, pincode, category, brand]
        adr = g.get("adr") or ""
        tiles[(int(g["lat"] // 1), int(g["lng"] // 1))].append(
            [g["n"], g["lat"], g["lng"], g.get("ph"), g.get("web"), adr, g.get("city"), g.get("pin"), g.get("cat"), g.get("brand")]
        )
    tdir = os.path.join(OUT_DIR, "tiles")
    os.makedirs(tdir, exist_ok=True)
    for f in os.listdir(tdir):
        os.remove(os.path.join(tdir, f))
    for (ty, tx), rows in tiles.items():
        with open(os.path.join(tdir, f"{ty}_{tx}.json"), "w") as fh:
            json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    meta = {
        "source": "Overture Maps Foundation — places theme",
        "release": release,
        "license": "CDLA-Permissive-2.0 (some records Apache-2.0 / CC0-1.0)",
        "built": datetime.date.today().isoformat(),
        "gyms": len(gyms),
        "tiles": len(tiles),
        "row": ["name", "lat", "lng", "phone", "website", "address", "city", "pincode", "category", "brand"],
    }
    json.dump(meta, open(os.path.join(OUT_DIR, "meta.json"), "w"), indent=2)
    print(f"{len(gyms)} gyms (dropped {len(raw) - len(gyms)}) in {len(tiles)} tiles")


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--from-raw":
        build_tiles(json.load(open(sys.argv[2])), sys.argv[3] if len(sys.argv) > 3 else "unknown")
    else:
        rel = sys.argv[1] if len(sys.argv) > 1 else "2026-09-23.1"
        build_tiles(extract(rel), rel)
