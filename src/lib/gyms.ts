// Shared gym-finder logic (used by the /api/gyms route and the client).

export type Audience = "women" | "men" | "unisex";

export interface Gym {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  mapsUrl: string;
  rating?: number; // Google rating, 1–5
  ratingCount?: number;
  hours?: string[];
  openNow?: boolean;
  source: "google" | "osm";
  audience: Audience;
  /** "listed" = the listing says so; "name" = guessed from the gym's name; "assumed" = no info, most Indian gyms are unisex */
  audienceBasis: "listed" | "name" | "assumed";
  offers: string[];
  brand?: string;
  price: { min: number; max: number; basis: string };
  distanceKm: number;
}

export interface Place {
  lat: number;
  lng: number;
  label: string;
  source: "gps" | "ip" | "city";
}

/** Major cities (approximate centres) for the city picker and pricing tiers. */
export const CITIES: { name: string; lat: number; lng: number; tier: 1 | 2 }[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777, tier: 1 },
  { name: "Delhi", lat: 28.6139, lng: 77.209, tier: 1 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, tier: 1 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867, tier: 1 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, tier: 1 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, tier: 1 },
  { name: "Pune", lat: 18.5204, lng: 73.8567, tier: 1 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, tier: 1 },
  { name: "Gurugram", lat: 28.4595, lng: 77.0266, tier: 1 },
  { name: "Noida", lat: 28.5355, lng: 77.391, tier: 1 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, tier: 2 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, tier: 2 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, tier: 2 },
  { name: "Indore", lat: 22.7196, lng: 75.8577, tier: 2 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, tier: 2 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, tier: 2 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, tier: 2 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, tier: 2 },
  { name: "Surat", lat: 21.1702, lng: 72.8311, tier: 2 },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812, tier: 2 },
  { name: "Patna", lat: 25.5941, lng: 85.1376, tier: 2 },
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, tier: 2 },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362, tier: 2 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, tier: 2 },
  { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, tier: 2 },
  { name: "Dehradun", lat: 30.3165, lng: 78.0322, tier: 2 },
  { name: "Ranchi", lat: 23.3441, lng: 85.3096, tier: 2 },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, tier: 2 },
  { name: "Panaji (Goa)", lat: 15.4909, lng: 73.8278, tier: 2 },
  { name: "Srinagar", lat: 34.0837, lng: 74.7973, tier: 2 },
];

/** Rough India bounding box — good enough to tell "in India" from "abroad". */
export const inIndia = (lat: number, lng: number) => lat > 6.5 && lat < 35.8 && lng > 68 && lng < 97.5;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const nearestCity = (p: { lat: number; lng: number }) =>
  CITIES.reduce((best, c) => (distanceKm(p, c) < distanceKm(p, best) ? c : best), CITIES[0]);

// ── Audience (women / men / unisex) ──
const WOMEN = /\b(ladies|lady|women'?s?|womens|female|girls?|for her|mahila|she ?fit|her gym)\b/i;
const MEN = /\b(men'?s only|gents|male only|boys'? gym)\b/i;

export function inferAudience(name: string, tags: Record<string, string> = {}): { audience: Audience; basis: Gym["audienceBasis"] } {
  if (tags.female === "only" || (tags.female === "yes" && tags.male === "no")) return { audience: "women", basis: "listed" };
  if (tags.male === "only" || (tags.male === "yes" && tags.female === "no")) return { audience: "men", basis: "listed" };
  if (tags.unisex === "yes" || (tags.female === "yes" && tags.male === "yes")) return { audience: "unisex", basis: "listed" };
  if (WOMEN.test(name)) return { audience: "women", basis: "name" };
  if (MEN.test(name)) return { audience: "men", basis: "name" };
  return { audience: "unisex", basis: "assumed" };
}

// ── What they offer ──
const OFFER_RULES: [RegExp, string][] = [
  [/crossfit|cross fit|functional/i, "CrossFit / Functional"],
  [/yoga/i, "Yoga"],
  [/zumba|dance|aerobic/i, "Zumba / Dance"],
  [/mma|boxing|kick ?boxing|martial|karate|taekwondo|muay/i, "Boxing / MMA"],
  [/power ?lift|weight ?lift|strength|barbell|iron|muscle|bodybuild/i, "Strength / Weights"],
  [/swim|pool|aqua/i, "Swimming"],
  [/spa|sauna|steam/i, "Spa / Sauna"],
  [/pilates/i, "Pilates"],
  [/cardio|spin|cycling/i, "Cardio"],
];
const OSM_SPORT: Record<string, string> = {
  fitness: "Strength / Weights", weightlifting: "Strength / Weights", crossfit: "CrossFit / Functional", yoga: "Yoga",
  boxing: "Boxing / MMA", martial_arts: "Boxing / MMA", swimming: "Swimming", pilates: "Pilates", aerobics: "Zumba / Dance",
};

export function inferOffers(name: string, tags: Record<string, string> = {}): string[] {
  const out = new Set<string>();
  for (const [re, label] of OFFER_RULES) if (re.test(name)) out.add(label);
  for (const s of (tags.sport ?? "").split(";")) if (OSM_SPORT[s.trim()]) out.add(OSM_SPORT[s.trim()]);
  if (tags.swimming_pool === "yes") out.add("Swimming");
  if (!out.size) out.add("Gym & Cardio");
  return [...out];
}

// ── Estimated monthly membership (₹) ──
// Chains: typical monthly ranges seen on their Indian pricing pages / aggregators (they vary by branch & offers).
const CHAINS: [RegExp, string, number, number][] = [
  [/\bcult(\.fit| ?fit|pass)?\b/i, "Cult", 1500, 4000],
  [/gold'?s gym/i, "Gold's Gym", 2000, 5000],
  [/anytime fitness/i, "Anytime Fitness", 2500, 5000],
  [/snap fitness/i, "Snap Fitness", 2000, 4000],
  [/fitness first/i, "Fitness First", 3000, 6000],
  [/talwalkars/i, "Talwalkars", 1500, 4000],
  [/powerworld|power world/i, "Powerworld Gyms", 1500, 3500],
  [/f45/i, "F45", 4000, 8000],
  [/crunch fitness/i, "Crunch Fitness", 1500, 3500],
  [/multifit/i, "Multifit", 2000, 4000],
];
const TIER_RANGE = { 1: [1000, 2500], 2: [700, 1800], 3: [500, 1200] } as const;
const GOOGLE_PRICE: Record<string, [number, number]> = {
  PRICE_LEVEL_INEXPENSIVE: [500, 1200],
  PRICE_LEVEL_MODERATE: [1000, 2500],
  PRICE_LEVEL_EXPENSIVE: [2500, 5000],
  PRICE_LEVEL_VERY_EXPENSIVE: [5000, 10000],
};

export function estimatePrice(name: string, at: { lat: number; lng: number }, googlePriceLevel?: string): Gym["price"] & { brand?: string } {
  for (const [re, brand, min, max] of CHAINS) if (re.test(name)) return { min, max, basis: `Estimate from typical ${brand} pricing`, brand };
  if (googlePriceLevel && GOOGLE_PRICE[googlePriceLevel]) {
    const [min, max] = GOOGLE_PRICE[googlePriceLevel];
    return { min, max, basis: "Estimate from Google price level" };
  }
  const city = nearestCity(at);
  const tier = distanceKm(at, city) < 40 ? city.tier : 3;
  const [min, max] = TIER_RANGE[tier];
  return { min, max, basis: tier === 3 ? "Estimate for a local gym in a smaller town" : `Estimate for a local gym in ${city.name}` };
}

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
