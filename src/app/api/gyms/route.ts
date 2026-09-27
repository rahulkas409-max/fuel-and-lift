import { readFile } from "node:fs/promises";
import path from "node:path";
import { distanceKm, estimatePrice, inIndia, inferAudience, inferOffers, type Gym } from "@/lib/gyms";

// Nearby gyms, in order of preference:
//   1. Google Places (New) — only when GOOGLE_MAPS_API_KEY is set (ratings, hours)
//   2. Bundled open data: ~36k Indian gyms from Overture Maps (data/gyms, CDLA-Permissive-2.0)
//   3. Live OpenStreetMap via Overpass — if the bundled data has nothing nearby

const OVERPASS = (process.env.OVERPASS_URL?.split(",") ?? [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]).map((u) => u.trim());
const GOOGLE_BASE = process.env.GOOGLE_PLACES_URL ?? "https://places.googleapis.com/v1";

const mapsLink = (name: string, lat: number, lng: number, placeId?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}%20${lat},${lng}${placeId ? `&query_place_id=${placeId}` : ""}`;

function build(base: Omit<Gym, "audience" | "audienceBasis" | "offers" | "price" | "distanceKm" | "brand">, at: { lat: number; lng: number }, tags: Record<string, string> = {}, priceLevel?: string): Gym {
  const { audience, basis } = inferAudience(base.name, tags);
  const price = estimatePrice(base.name + " " + (tags.brand ?? ""), base, priceLevel);
  return {
    ...base,
    audience,
    audienceBasis: basis,
    offers: inferOffers(base.name, tags),
    brand: price.brand ?? tags.brand,
    price: { min: price.min, max: price.max, basis: price.basis },
    distanceKm: Math.round(distanceKm(at, base) * 10) / 10,
  };
}

// ── Bundled Overture data ──
// Row: [name, lat, lng, phone, website, address, city, pincode, category, brand]
type Row = [string, number, number, string | null, string | null, string, string | null, string | null, string | null, string | null];
const tileCache = new Map<string, Promise<Row[]>>();
const TILE_DIR = path.join(process.cwd(), "data", "gyms", "tiles");
const CATEGORY_TAGS: Record<string, Record<string, string>> = {
  yoga_studio: { sport: "yoga" }, pilates_studio: { sport: "pilates" }, martial_arts_club: { sport: "martial_arts" },
  boxing_class: { sport: "boxing" }, boxing_gym: { sport: "boxing" }, kickboxing_club: { sport: "boxing" }, dance_studio: { sport: "aerobics" },
};

function loadTile(ty: number, tx: number): Promise<Row[]> {
  const key = `${ty}_${tx}`;
  let p = tileCache.get(key);
  if (!p) {
    p = readFile(path.join(TILE_DIR, `${key}.json`), "utf8")
      .then((t) => JSON.parse(t) as Row[])
      .catch(() => []); // no gyms mapped in this square
    tileCache.set(key, p);
  }
  return p;
}

async function fromOverture(at: { lat: number; lng: number }, radiusKm: number): Promise<Gym[]> {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((at.lat * Math.PI) / 180));
  const tiles: Promise<Row[]>[] = [];
  for (let ty = Math.floor(at.lat - dLat); ty <= Math.floor(at.lat + dLat); ty++)
    for (let tx = Math.floor(at.lng - dLng); tx <= Math.floor(at.lng + dLng); tx++) tiles.push(loadTile(ty, tx));
  const rows = (await Promise.all(tiles)).flat();
  const gyms: Gym[] = [];
  for (const [name, lat, lng, phone, website, address, city, pin, cat, brand] of rows) {
    if (Math.abs(lat - at.lat) > dLat || Math.abs(lng - at.lng) > dLng) continue;
    const full = [address, address && city && address.toLowerCase().includes(city.toLowerCase()) ? null : city, pin].filter(Boolean).join(", ");
    gyms.push(
      build(
        { id: `ov-${lat}-${lng}-${name.length}`, name, lat, lng, address: full || undefined, phone: phone ?? undefined, website: website ?? undefined, mapsUrl: mapsLink(name, lat, lng), source: "overture" },
        at,
        { ...(cat ? CATEGORY_TAGS[cat] : {}), ...(brand ? { brand } : {}) },
      ),
    );
  }
  return gyms;
}

// ── OpenStreetMap ──
interface OsmEl { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

async function fromOsm(at: { lat: number; lng: number }, radiusM: number): Promise<Gym[]> {
  const q = `[out:json][timeout:25];(
  nwr["leisure"="fitness_centre"](around:${radiusM},${at.lat},${at.lng});
  nwr["amenity"="gym"](around:${radiusM},${at.lat},${at.lng});
  nwr["leisure"="sports_centre"]["sport"~"fitness|weightlifting|crossfit|yoga|boxing|martial_arts"](around:${radiusM},${at.lat},${at.lng});
);out center tags 200;`;
  let lastErr: unknown;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "FuelAndLift/1.0 (gym finder)" },
        body: "data=" + encodeURIComponent(q),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = (await res.json()) as { elements: OsmEl[] };
      return data.elements
        .map((e): Gym | null => {
          const t = e.tags ?? {};
          const lat = e.lat ?? e.center?.lat;
          const lng = e.lon ?? e.center?.lon;
          if (!t.name || lat == null || lng == null) return null;
          const address = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:city"], t["addr:postcode"]].filter(Boolean).join(", ") || t["addr:full"];
          return build(
            {
              id: `osm-${e.type}-${e.id}`,
              name: t.name,
              lat,
              lng,
              address: address || undefined,
              phone: t.phone ?? t["contact:phone"] ?? t["contact:mobile"],
              website: t.website ?? t["contact:website"],
              mapsUrl: mapsLink(t.name, lat, lng),
              hours: t.opening_hours ? [t.opening_hours] : undefined,
              source: "osm",
            },
            at,
            t,
          );
        })
        .filter((g): g is Gym => !!g);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("OpenStreetMap unavailable");
}

// ── Google Places (New) ──
interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  priceLevel?: string;
  businessStatus?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[]; openNow?: boolean };
  currentOpeningHours?: { openNow?: boolean };
}
const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.location", "places.rating", "places.userRatingCount",
  "places.nationalPhoneNumber", "places.websiteUri", "places.googleMapsUri", "places.priceLevel", "places.businessStatus",
  "places.regularOpeningHours", "places.currentOpeningHours.openNow", "nextPageToken",
].join(",");

async function fromGoogle(key: string, at: { lat: number; lng: number }, radiusM: number): Promise<Gym[]> {
  const places: GPlace[] = [];
  let pageToken: string | undefined;
  // Text search returns up to 20 per page. Each page is one billable request, so keep
  // this small (GOOGLE_PAGES, default 2 → up to 40 gyms per search).
  const maxPages = Math.min(3, Math.max(1, Number(process.env.GOOGLE_PAGES) || 2));
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(`${GOOGLE_BASE}/places:searchText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify({
        textQuery: "gym fitness centre",
        includedType: "gym",
        regionCode: "IN",
        languageCode: "en",
        pageSize: 20,
        locationBias: { circle: { center: { latitude: at.lat, longitude: at.lng }, radius: Math.min(radiusM, 50000) } },
        ...(pageToken ? { pageToken } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { places?: GPlace[]; nextPageToken?: string };
    places.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return places
    .filter((p) => p.location && p.displayName?.text && p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) =>
      build(
        {
          id: `g-${p.id}`,
          name: p.displayName!.text,
          lat: p.location!.latitude,
          lng: p.location!.longitude,
          address: p.formattedAddress,
          phone: p.nationalPhoneNumber,
          website: p.websiteUri,
          mapsUrl: p.googleMapsUri ?? mapsLink(p.displayName!.text, p.location!.latitude, p.location!.longitude, p.id),
          rating: p.rating,
          ratingCount: p.userRatingCount,
          hours: p.regularOpeningHours?.weekdayDescriptions,
          openNow: p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow,
          source: "google",
        },
        at,
        {},
        p.priceLevel,
      ),
    );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusKm = Math.min(25, Math.max(1, Number(url.searchParams.get("radius")) || 5));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndia(lat, lng)) {
    return Response.json({ error: "The gym finder covers India only. Pick an Indian city." }, { status: 400 });
  }
  const at = { lat, lng };
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  try {
    let gyms: Gym[] = [];
    let source: Gym["source"] = "overture";
    if (key) {
      try {
        gyms = await fromGoogle(key, at, radiusKm * 1000);
        source = "google";
      } catch (err) {
        console.error("[gyms] Google Places failed, falling back to OpenStreetMap:", err);
      }
    }
    if (source === "overture") gyms = await fromOverture(at, radiusKm);
    if (source === "overture" && !gyms.length) {
      try {
        gyms = await fromOsm(at, radiusKm * 1000);
        source = "osm";
      } catch (err) {
        console.error("[gyms] OpenStreetMap fallback failed:", err);
      }
    }

    // De-duplicate (same name within ~60 m) and keep the radius
    const seen: Gym[] = [];
    for (const g of gyms.sort((a, b) => a.distanceKm - b.distanceKm)) {
      if (g.distanceKm > radiusKm * 1.2) continue;
      if (seen.some((s) => s.name.toLowerCase() === g.name.toLowerCase() && Math.abs(s.distanceKm - g.distanceKm) < 0.06)) continue;
      seen.push(g);
    }
    return Response.json({ source, count: seen.length, gyms: seen }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    console.error("[gyms] lookup failed", err);
    return Response.json({ error: "Couldn't load gyms right now. Please try again in a minute." }, { status: 502 });
  }
}
