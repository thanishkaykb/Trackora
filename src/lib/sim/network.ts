// Hub network for Trackora — node positions are normalized 0..1 for SVG rendering.
export type Hub = {
  id: string;
  name: string;
  city: string;
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

export const HUBS: Hub[] = [
  { id: "SFO", name: "Pacific Gateway", city: "San Francisco",   x: 0.08, y: 0.45, loadFactor: 0.7 },
  { id: "LAX", name: "Sun Hub",          city: "Los Angeles",    x: 0.14, y: 0.62, loadFactor: 0.9 },
  { id: "DEN", name: "Mountain Relay",   city: "Denver",         x: 0.32, y: 0.42, loadFactor: 0.6 },
  { id: "DFW", name: "Lone Star",        city: "Dallas",         x: 0.42, y: 0.66, loadFactor: 1.1 },
  { id: "ORD", name: "Lakeside",         city: "Chicago",        x: 0.52, y: 0.32, loadFactor: 1.2 },
  { id: "ATL", name: "Peach Switch",     city: "Atlanta",        x: 0.62, y: 0.62, loadFactor: 0.85 },
  { id: "JFK", name: "Atlantic Tower",   city: "New York",       x: 0.78, y: 0.30, loadFactor: 1.0 },
  { id: "MIA", name: "Coral Port",       city: "Miami",          x: 0.74, y: 0.78, loadFactor: 0.75 },
  { id: "SEA", name: "Northern Beacon",  city: "Seattle",        x: 0.14, y: 0.18, loadFactor: 0.55 },
  { id: "BOS", name: "Harbor Node",      city: "Boston",         x: 0.86, y: 0.22, loadFactor: 0.7 },
];

export const EDGES: Edge[] = [
  { from: "SEA", to: "SFO", baseMinutes: 90,  congestion: 0.2 },
  { from: "SFO", to: "LAX", baseMinutes: 60,  congestion: 0.3 },
  { from: "SFO", to: "DEN", baseMinutes: 110, congestion: 0.25 },
  { from: "LAX", to: "DEN", baseMinutes: 95,  congestion: 0.3 },
  { from: "LAX", to: "DFW", baseMinutes: 130, congestion: 0.4 },
  { from: "DEN", to: "ORD", baseMinutes: 100, congestion: 0.35 },
  { from: "DEN", to: "DFW", baseMinutes: 80,  congestion: 0.2 },
  { from: "DFW", to: "ATL", baseMinutes: 80,  congestion: 0.35 },
  { from: "ORD", to: "ATL", baseMinutes: 90,  congestion: 0.4 },
  { from: "ORD", to: "JFK", baseMinutes: 100, congestion: 0.5 },
  { from: "ATL", to: "MIA", baseMinutes: 70,  congestion: 0.25 },
  { from: "ATL", to: "JFK", baseMinutes: 110, congestion: 0.45 },
  { from: "JFK", to: "BOS", baseMinutes: 35,  congestion: 0.3 },
  { from: "MIA", to: "JFK", baseMinutes: 130, congestion: 0.3 },
  { from: "SEA", to: "DEN", baseMinutes: 130, congestion: 0.2 },
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
