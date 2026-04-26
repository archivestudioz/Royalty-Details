// Mapbox helpers — geocoding + driving time from a fixed home base.
// All requests are server-side so the token never reaches the browser.

const HOME_BASE_ADDRESS = process.env.HOMEBASE_ADDRESS ?? "275 Beech Street, Hackensack, NJ 07601";
const TOKEN = process.env.MAPBOX_TOKEN;

export type GeoLookup = {
  latitude: number;
  longitude: number;
  travelMinutes: number;
};

let homeBaseCoords: { lon: number; lat: number } | null = null;
const lookupCache = new Map<string, GeoLookup>();

async function geocode(address: string): Promise<{ lon: number; lat: number } | null> {
  if (!TOKEN) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?limit=1&country=us&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat?.center || feat.center.length < 2) return null;
  return { lon: feat.center[0], lat: feat.center[1] };
}

async function getHomeBase() {
  if (homeBaseCoords) return homeBaseCoords;
  const c = await geocode(HOME_BASE_ADDRESS);
  if (c) homeBaseCoords = c;
  return c;
}

async function drivingMinutes(from: { lon: number; lat: number }, to: { lon: number; lat: number }): Promise<number | null> {
  if (!TOKEN) return null;
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=false&geometries=geojson&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const seconds = data?.routes?.[0]?.duration;
  if (typeof seconds !== "number") return null;
  return Math.round(seconds / 60);
}

/** Geocode a customer address and compute driving minutes from the home base. */
export async function lookupAddress(address: string | null | undefined): Promise<GeoLookup | null> {
  if (!address) return null;
  const key = address.trim().toLowerCase();
  if (!key) return null;

  const cached = lookupCache.get(key);
  if (cached) return cached;

  if (!TOKEN) {
    console.warn("[maps] MAPBOX_TOKEN not set; skipping geocoding for:", address);
    return null;
  }

  try {
    const [base, dest] = await Promise.all([getHomeBase(), geocode(address)]);
    if (!base || !dest) return null;
    const minutes = await drivingMinutes(base, dest);
    if (minutes == null) return null;
    const result: GeoLookup = { latitude: dest.lat, longitude: dest.lon, travelMinutes: minutes };
    lookupCache.set(key, result);
    return result;
  } catch (err) {
    console.error("[maps] lookup failed for", address, err);
    return null;
  }
}

/** Total slot-block duration for a booking in minutes: job + round-trip travel + buffer. */
export function blockMinutes(durationMin: number | null | undefined, travelMinutes: number | null | undefined): number {
  const job = durationMin ?? 60;
  if (travelMinutes == null) return Math.max(job + 180, 240); // unknown travel: fall back to the old 4-hour rule
  return job + travelMinutes * 2 + 30;
}

export function blockHours(durationMin: number | null | undefined, travelMinutes: number | null | undefined): number {
  return Math.max(1, Math.ceil(blockMinutes(durationMin, travelMinutes) / 60));
}

