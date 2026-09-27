// Towns & cities that have gyms (built from the gym data by scripts/fetch-gyms-overture.py).
import { distanceKm } from "./gyms";

export interface Town {
  name: string;
  lat: number;
  lng: number;
  gyms: number;
  state: string;
}

const STATES: Record<string, string> = {
  AN: "Andaman & Nicobar", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CH: "Chandigarh",
  CT: "Chhattisgarh", DN: "Dadra & Nagar Haveli", DD: "Daman & Diu", DL: "Delhi", GA: "Goa", GOA: "Goa", GJ: "Gujarat",
  HR: "Haryana", HP: "Himachal Pradesh", JK: "Jammu & Kashmir", JH: "Jharkhand", KA: "Karnataka", KL: "Kerala",
  LA: "Ladakh", LD: "Lakshadweep", MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur", ML: "Meghalaya",
  MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", OD: "Odisha", PY: "Puducherry", PB: "Punjab", RJ: "Rajasthan",
  SK: "Sikkim", TN: "Tamil Nadu", TG: "Telangana", TS: "Telangana", TR: "Tripura", UP: "Uttar Pradesh",
  UT: "Uttarakhand", UK: "Uttarakhand", WB: "West Bengal",
};
export const stateName = (code: string) => STATES[code] ?? "";

let cache: Promise<Town[]> | null = null;

/** Loads the town list once (≈50 KB). Same name + state appears once, biggest cluster first. */
export function loadTowns(): Promise<Town[]> {
  cache ??= fetch("/data/cities.json")
    .then((r) => r.json() as Promise<[string, number, number, number, string][]>)
    .then((rows) => {
      const seen = new Set<string>();
      const out: Town[] = [];
      for (const [name, lat, lng, gyms, state] of rows) {
        const key = `${name}|${state}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, lat, lng, gyms, state });
      }
      return out;
    })
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}

/** The town you are in: the one whose centre is closest. */
export function nearestTown(p: { lat: number; lng: number }, towns: Town[]): Town | null {
  let best: Town | null = null;
  let bestD = Infinity;
  for (const t of towns) {
    const d = distanceKm(p, t);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}
