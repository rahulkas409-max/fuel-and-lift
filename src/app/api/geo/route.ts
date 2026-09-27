import { CITIES, inIndia, nearestCity } from "@/lib/gyms";

// Approximate location from Vercel's IP geolocation headers — no permission prompt needed.
// Only used to pick a starting city; the app offers "Use my exact location" for GPS.
export async function GET(req: Request) {
  const h = req.headers;
  const country = h.get("x-vercel-ip-country");
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lng = Number(h.get("x-vercel-ip-longitude"));
  const city = h.get("x-vercel-ip-city");

  if (country === "IN" && Number.isFinite(lat) && Number.isFinite(lng) && lat && lng && inIndia(lat, lng)) {
    const label = city ? decodeURIComponent(city) : nearestCity({ lat, lng }).name;
    return Response.json({ found: true, lat, lng, label }, { headers: { "Cache-Control": "private, no-store" } });
  }
  // Outside India or unknown (e.g. local development): let the user pick a city.
  return Response.json({ found: false, country, cities: CITIES.map((c) => c.name) }, { headers: { "Cache-Control": "private, no-store" } });
}
