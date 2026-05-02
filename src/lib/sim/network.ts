// Hub network for Trackora — global, node positions are normalized 0..1 for SVG rendering.
// X = longitude (0=180°W, 1=180°E), Y = latitude (0=85°N, 1=85°S) — equirectangular projection.
export type Hub = {
  id: string;
  name: string;
  city: string;
  country: string; // ISO-2
  x: number; // 0..1
  y: number; // 0..1
  loadFactor: number; // 0..1.5  (>1 = overloaded)
};

export type Edge = {
  from: string;
  to: string;
  baseMinutes: number;
  congestion: number; // 0..1
};

// Convert (lon, lat) in degrees to normalized x,y for an equirectangular world map.
function ll(lon: number, lat: number): { x: number; y: number } {
  return { x: (lon + 180) / 360, y: (90 - lat) / 180 };
}

function hub(id: string, name: string, city: string, country: string, lon: number, lat: number, load: number): Hub {
  const { x, y } = ll(lon, lat);
  return { id, name, city, country, x, y, loadFactor: load };
}

export const HUBS: Hub[] = [
  // North America
  hub("LAX", "Sun Hub",         "Los Angeles",   "US",  -118.24, 34.05, 0.9),
  hub("SFO", "Pacific Gateway", "San Francisco", "US",  -122.42, 37.77, 0.7),
  hub("ORD", "Lakeside",        "Chicago",       "US",   -87.65, 41.85, 1.2),
  hub("JFK", "Atlantic Tower",  "New York",      "US",   -74.00, 40.71, 1.0),
  hub("MIA", "Coral Port",      "Miami",         "US",   -80.19, 25.76, 0.8),
  hub("YYZ", "Maple Hub",       "Toronto",       "CA",   -79.38, 43.65, 0.7),
  hub("MEX", "Aztec Gateway",   "Mexico City",   "MX",   -99.13, 19.43, 0.85),
  // South America
  hub("GRU", "Samba Hub",       "São Paulo",     "BR",   -46.63,-23.55, 0.9),
  hub("EZE", "Tango Port",      "Buenos Aires",  "AR",   -58.38,-34.60, 0.6),
  hub("BOG", "Andes Relay",     "Bogotá",        "CO",   -74.07,  4.71, 0.7),
  // Europe
  hub("LHR", "Thames Tower",    "London",        "GB",    -0.13, 51.50, 1.1),
  hub("CDG", "Seine Hub",       "Paris",         "FR",     2.35, 48.86, 1.0),
  hub("FRA", "Rhein Switch",    "Frankfurt",     "DE",     8.68, 50.11, 1.0),
  hub("AMS", "Polder Port",     "Amsterdam",     "NL",     4.90, 52.37, 0.85),
  hub("MAD", "Iberia Gate",     "Madrid",        "ES",    -3.70, 40.42, 0.7),
  hub("IST", "Bosphorus Hub",   "Istanbul",      "TR",    28.98, 41.01, 0.95),
  hub("SVO", "Volga Relay",     "Moscow",        "RU",    37.62, 55.75, 0.8),
  // Africa
  hub("CAI", "Nile Gateway",    "Cairo",         "EG",    31.24, 30.04, 0.7),
  hub("LOS", "Atlantic Lagos",  "Lagos",         "NG",     3.38,  6.52, 0.6),
  hub("JNB", "Veld Hub",        "Johannesburg",  "ZA",    28.04,-26.20, 0.7),
  // Middle East
  hub("DXB", "Desert Tower",    "Dubai",         "AE",    55.27, 25.20, 1.2),
  // Asia
  hub("BOM", "Arabian Port",    "Mumbai",        "IN",    72.83, 19.07, 1.0),
  hub("DEL", "Yamuna Hub",      "Delhi",         "IN",    77.10, 28.70, 0.95),
  hub("SIN", "Equator Gate",    "Singapore",     "SG",   103.82,  1.35, 1.1),
  hub("HKG", "Pearl Tower",     "Hong Kong",     "HK",   114.17, 22.32, 1.0),
  hub("PEK", "Forbidden Hub",   "Beijing",       "CN",   116.41, 39.90, 0.95),
  hub("PVG", "Huangpu Port",    "Shanghai",      "CN",   121.47, 31.23, 1.1),
  hub("NRT", "Sakura Tower",    "Tokyo",         "JP",   139.69, 35.69, 1.0),
  hub("ICN", "Han River Hub",   "Seoul",         "KR",   126.97, 37.57, 0.85),
  // Oceania
  hub("SYD", "Harbour Hub",     "Sydney",        "AU",   151.21,-33.87, 0.85),
  hub("AKL", "Pacific Anchor",  "Auckland",      "NZ",   174.76,-36.85, 0.55),
];

// Edges connect regional neighbors and major intercontinental lanes. baseMinutes ~ flight time.
export const EDGES: Edge[] = [
  // North America intra
  { from: "LAX", to: "SFO", baseMinutes:  80, congestion: 0.3 },
  { from: "SFO", to: "ORD", baseMinutes: 250, congestion: 0.3 },
  { from: "LAX", to: "ORD", baseMinutes: 260, congestion: 0.3 },
  { from: "ORD", to: "JFK", baseMinutes: 130, congestion: 0.4 },
  { from: "JFK", to: "MIA", baseMinutes: 180, congestion: 0.3 },
  { from: "ORD", to: "YYZ", baseMinutes:  90, congestion: 0.25 },
  { from: "YYZ", to: "JFK", baseMinutes:  85, congestion: 0.3 },
  { from: "LAX", to: "MEX", baseMinutes: 200, congestion: 0.3 },
  { from: "MIA", to: "MEX", baseMinutes: 160, congestion: 0.3 },
  // North → South America
  { from: "MIA", to: "BOG", baseMinutes: 220, congestion: 0.3 },
  { from: "BOG", to: "GRU", baseMinutes: 360, congestion: 0.3 },
  { from: "GRU", to: "EZE", baseMinutes: 160, congestion: 0.25 },
  { from: "MIA", to: "GRU", baseMinutes: 510, congestion: 0.3 },
  // Transatlantic
  { from: "JFK", to: "LHR", baseMinutes: 420, congestion: 0.4 },
  { from: "JFK", to: "CDG", baseMinutes: 440, congestion: 0.4 },
  { from: "MIA", to: "MAD", baseMinutes: 510, congestion: 0.3 },
  { from: "GRU", to: "LHR", baseMinutes: 660, congestion: 0.3 },
  // Europe intra
  { from: "LHR", to: "CDG", baseMinutes:  75, congestion: 0.4 },
  { from: "CDG", to: "FRA", baseMinutes:  80, congestion: 0.4 },
  { from: "FRA", to: "AMS", baseMinutes:  70, congestion: 0.35 },
  { from: "LHR", to: "AMS", baseMinutes:  80, congestion: 0.35 },
  { from: "CDG", to: "MAD", baseMinutes: 130, congestion: 0.3 },
  { from: "FRA", to: "IST", baseMinutes: 180, congestion: 0.35 },
  { from: "FRA", to: "SVO", baseMinutes: 200, congestion: 0.3 },
  // Europe → Middle East / Africa
  { from: "IST", to: "DXB", baseMinutes: 240, congestion: 0.3 },
  { from: "FRA", to: "DXB", baseMinutes: 360, congestion: 0.3 },
  { from: "CDG", to: "CAI", baseMinutes: 240, congestion: 0.3 },
  { from: "MAD", to: "LOS", baseMinutes: 360, congestion: 0.3 },
  { from: "CAI", to: "DXB", baseMinutes: 180, congestion: 0.3 },
  { from: "CAI", to: "JNB", baseMinutes: 480, congestion: 0.3 },
  { from: "LOS", to: "JNB", baseMinutes: 360, congestion: 0.3 },
  { from: "DXB", to: "JNB", baseMinutes: 480, congestion: 0.3 },
  // Middle East → Asia
  { from: "DXB", to: "BOM", baseMinutes: 180, congestion: 0.3 },
  { from: "DXB", to: "DEL", baseMinutes: 200, congestion: 0.3 },
  { from: "BOM", to: "DEL", baseMinutes:  90, congestion: 0.3 },
  { from: "BOM", to: "SIN", baseMinutes: 320, congestion: 0.3 },
  { from: "DEL", to: "PEK", baseMinutes: 360, congestion: 0.3 },
  // Asia intra
  { from: "SIN", to: "HKG", baseMinutes: 220, congestion: 0.35 },
  { from: "HKG", to: "PEK", baseMinutes: 180, congestion: 0.35 },
  { from: "PEK", to: "PVG", baseMinutes:  90, congestion: 0.4 },
  { from: "PVG", to: "NRT", baseMinutes: 180, congestion: 0.35 },
  { from: "ICN", to: "NRT", baseMinutes: 130, congestion: 0.3 },
  { from: "ICN", to: "PEK", baseMinutes: 130, congestion: 0.3 },
  { from: "HKG", to: "NRT", baseMinutes: 240, congestion: 0.35 },
  // Asia → Oceania
  { from: "SIN", to: "SYD", baseMinutes: 480, congestion: 0.3 },
  { from: "HKG", to: "SYD", baseMinutes: 540, congestion: 0.3 },
  { from: "SYD", to: "AKL", baseMinutes: 180, congestion: 0.25 },
  // Transpacific
  { from: "NRT", to: "LAX", baseMinutes: 660, congestion: 0.35 },
  { from: "ICN", to: "SFO", baseMinutes: 660, congestion: 0.35 },
  { from: "PVG", to: "LAX", baseMinutes: 720, congestion: 0.35 },
  { from: "SYD", to: "LAX", baseMinutes: 780, congestion: 0.3 },
];

export const hubMap = new Map(HUBS.map(h => [h.id, h]));

// Symmetric edge lookup
export function edgeBetween(a: string, b: string): Edge | undefined {
  return EDGES.find(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
}

// Build adjacency
export function neighbors(id: string): { id: string; edge: Edge }[] {
  return EDGES
    .filter(e => e.from === id || e.to === id)
    .map(e => ({ id: e.from === id ? e.to : e.from, edge: e }));
}

// Dijkstra with custom weight (for eco / priority modes)
export function shortestPath(
  from: string,
  to: string,
  weight: (e: Edge, hub: Hub) => number,
): string[] {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const queue = new Set<string>(HUBS.map(h => h.id));
  for (const h of HUBS) { dist.set(h.id, Infinity); prev.set(h.id, null); }
  dist.set(from, 0);

  while (queue.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) { best = d; u = id; }
    }
    if (u === null || best === Infinity) break;
    if (u === to) break;
    queue.delete(u);

    for (const { id: v, edge } of neighbors(u)) {
      if (!queue.has(v)) continue;
      const hub = hubMap.get(v)!;
      const alt = (dist.get(u) ?? Infinity) + weight(edge, hub);
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
      }
    }
  }
  // Reconstruct
  const path: string[] = [];
  let cur: string | null = to;
  while (cur) { path.unshift(cur); cur = prev.get(cur) ?? null; }
  if (path[0] !== from) return [];
  return path;
}

export function pathMinutes(path: string[]): number {
  let m = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = edgeBetween(path[i], path[i + 1]);
    if (!e) return Infinity;
    const hub = hubMap.get(path[i + 1])!;
    m += e.baseMinutes * (1 + e.congestion * 0.6) * (1 + Math.max(0, hub.loadFactor - 1) * 0.5);
  }
  return Math.round(m);
}
