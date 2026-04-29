import { HUBS, hubMap, edgeBetween, shortestPath, pathMinutes, type Edge, type Hub } from "./network";
import type { SimShipment, ShipmentEvent } from "./types";

const TICK_MINUTES = 8; // simulated minutes per real tick

const SHOPS = [
  { name: "Lumen & Co.",        items: ["Smart Desk Lamp", "Ambient Light Bar", "Wireless Charger"] },
  { name: "NorthPeak Outdoors", items: ["Trail Backpack 30L", "Insulated Bottle", "Hiking Boots"] },
  { name: "Aether Audio",       items: ["Studio Headphones", "Portable Speaker", "USB-C Earbuds"] },
  { name: "Maison Verte",       items: ["Linen Throw", "Ceramic Vase", "Scented Candle Set"] },
  { name: "PixelForge",         items: ["Mechanical Keyboard", "Ultrawide Monitor", "Gaming Mouse"] },
  { name: "Brewhouse Roasters", items: ["Single-Origin Beans", "Pour-Over Kit", "Espresso Tamper"] },
  { name: "Atlas Apparel",      items: ["Merino Hoodie", "Tech Joggers", "Wool Beanie"] },
  { name: "Kinetic Sportswear", items: ["Running Shoes", "Compression Tee", "Yoga Mat"] },
];

const FIRST_NAMES = ["Alex","Maya","Jordan","Priya","Liam","Noor","Diego","Yuki","Ethan","Zara","Omar","Sofia"];
const LAST_NAMES  = ["Chen","Patel","Garcia","Kim","Singh","Nakamura","Brown","Müller","Silva","Khan","Davis","Rossi"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function randomShop() {
  const s = pick(SHOPS);
  return { shop: s.name, itemName: pick(s.items) };
}

export function randomRecipient() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function rand(seed?: number) {
  // simple LCG-ish, but we mostly use Math.random
  return Math.random();
}

export function makeTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "PT-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function weightFor(priority: boolean, eco: boolean) {
  return (e: Edge, hub: Hub): number => {
    let w = e.baseMinutes;
    w *= 1 + e.congestion * (priority ? 0.3 : 0.6);
    w *= 1 + Math.max(0, hub.loadFactor - 1) * (priority ? 0.3 : 0.7);
    if (eco) w *= 1 + Math.max(0, hub.loadFactor - 0.8) * 0.4; // prefer lighter hubs
    return w;
  };
}

export function planRoute(origin: string, destination: string, priority: boolean, eco: boolean) {
  const route = shortestPath(origin, destination, weightFor(priority, eco));
  const eta = pathMinutes(route);
  return { route, eta };
}

export function createShipment(opts: {
  origin: string;
  destination: string;
  priority?: boolean;
  eco?: boolean;
  trackingId?: string;
  shop?: string;
  itemName?: string;
  recipient?: string;
}): SimShipment {
  const { route, eta } = planRoute(opts.origin, opts.destination, !!opts.priority, !!opts.eco);
  const now = Date.now();
  const tid = opts.trackingId ?? makeTrackingId();
  const shopInfo = (opts.shop && opts.itemName)
    ? { shop: opts.shop, itemName: opts.itemName }
    : randomShop();
  const recipient = opts.recipient ?? randomRecipient();
  const ev: ShipmentEvent = {
    ts: now, type: "created",
    hub: opts.origin,
    message: `Order from ${shopInfo.shop} created at ${hubMap.get(opts.origin)?.city}. Routing through ${route.length} hubs.`,
  };
  return {
    id: crypto.randomUUID(),
    trackingId: tid,
    origin: opts.origin,
    destination: opts.destination,
    currentHub: opts.origin,
    nextHub: route[1],
    segmentProgress: 0,
    route,
    status: "in_transit",
    etaMinutes: eta,
    delayMinutes: 0,
    priority: !!opts.priority,
    eco: !!opts.eco,
    events: [ev],
    createdAt: now,
    shop: shopInfo.shop,
    itemName: shopInfo.itemName,
    recipient,
  };
}

function explanation(cause: string, hub?: Hub) {
  switch (cause) {
    case "traffic":
      return `Heavy traffic detected on the inbound corridor. Predicted slowdown of ~25% based on current congestion patterns.`;
    case "weather":
      return `Adverse weather (storm cells) reported near the route. Carriers are reducing speed for safety.`;
    case "hub_overload":
      return hub
        ? `Hub ${hub.city} is overloaded by ${Math.round((hub.loadFactor - 1) * 100)}% above normal capacity, adding handling time.`
        : `Destination hub is overloaded, adding handling time.`;
    case "customs":
      return `Customs inspection randomly triggered for this lane.`;
    default:
      return `Network turbulence detected.`;
  }
}

// One simulation tick. Returns possibly mutated shipment + log of new events.
export function tickShipment(s: SimShipment): { shipment: SimShipment; newEvents: ShipmentEvent[] } {
  if (s.status === "delivered") return { shipment: s, newEvents: [] };

  const newEvents: ShipmentEvent[] = [];
  const next = { ...s, events: [...s.events] };
  const now = Date.now();

  // Random event: 30% chance per tick of a delay trigger (lower if priority)
  const delayChance = next.priority ? 0.15 : 0.3;
  if (Math.random() < delayChance) {
    const causes = ["traffic", "weather", "hub_overload", "customs"];
    const cause = causes[Math.floor(Math.random() * causes.length)];
    const hub = hubMap.get(next.nextHub ?? next.currentHub);
    const added = 10 + Math.floor(Math.random() * 35);
    next.delayMinutes += added;
    next.etaMinutes += added;
    next.delayCause = cause;
    next.explanation = explanation(cause, hub);
    next.status = "delayed";
    const ev: ShipmentEvent = {
      ts: now, type: "delay", hub: next.currentHub,
      message: `Delay predicted (+${added}m) — cause: ${cause.replace("_", " ")}`,
    };
    newEvents.push(ev); next.events.push(ev);

    // Auto reroute if delay big enough and there is an alternative
    if (added >= 20) {
      const remainingFrom = next.currentHub;
      const altWeight = (e: Edge, hub: Hub) => {
        let w = e.baseMinutes * (1 + e.congestion * 0.4);
        w *= 1 + Math.max(0, hub.loadFactor - 1) * 0.3;
        if (next.eco) w *= 1 + Math.max(0, hub.loadFactor - 0.8) * 0.5;
        // Penalize the original next hop to actively try alternatives
        if ((e.from === remainingFrom && e.to === next.nextHub) ||
            (e.to === remainingFrom && e.from === next.nextHub)) {
          w *= 1.6;
        }
        return w;
      };
      const altPath = shortestPath(remainingFrom, next.destination, altWeight);
      const altEta = pathMinutes(altPath);
      // current remaining baseline
      const currentRemain = next.etaMinutes;
      if (altPath.length > 1 && altEta < currentRemain - 5) {
        const saved = currentRemain - altEta;
        next.route = [
          ...next.route.slice(0, next.route.indexOf(remainingFrom) + 1),
          ...altPath.slice(1),
        ];
        next.nextHub = altPath[1];
        next.segmentProgress = 0;
        next.etaMinutes = altEta;
        next.status = "rerouted";
        const e2: ShipmentEvent = {
          ts: now, type: "reroute", hub: remainingFrom,
          message: `Auto-reroute applied through ${hubMap.get(altPath[1])?.city}. ETA improved by ${saved}m.`,
        };
        newEvents.push(e2); next.events.push(e2);
      }
    }
  }

  // Movement along current edge
  if (next.nextHub) {
    const edge = edgeBetween(next.currentHub, next.nextHub);
    if (edge) {
      const segMinutes = edge.baseMinutes * (1 + edge.congestion * 0.5);
      next.segmentProgress += TICK_MINUTES / segMinutes;
      next.etaMinutes = Math.max(0, next.etaMinutes - TICK_MINUTES);
      if (next.segmentProgress >= 1) {
        // Arrive at next hub
        next.currentHub = next.nextHub;
        next.segmentProgress = 0;
        const arriveEv: ShipmentEvent = {
          ts: now, type: "arrive", hub: next.currentHub,
          message: `Reached ${hubMap.get(next.currentHub)?.city} (${next.currentHub}).`,
        };
        newEvents.push(arriveEv); next.events.push(arriveEv);
        const idx = next.route.indexOf(next.currentHub);
        if (idx >= 0 && idx < next.route.length - 1) {
          next.nextHub = next.route[idx + 1];
          const departEv: ShipmentEvent = {
            ts: now + 1, type: "depart", hub: next.currentHub,
            message: `Departing toward ${hubMap.get(next.nextHub)?.city}.`,
          };
          newEvents.push(departEv); next.events.push(departEv);
          if (next.status === "delayed" || next.status === "rerouted") {
            // settle back to in_transit
            next.status = "in_transit";
          }
        } else {
          // Delivered
          next.nextHub = undefined;
          next.status = "delivered";
          next.etaMinutes = 0;
          const deliveredEv: ShipmentEvent = {
            ts: now + 2, type: "delivered", hub: next.currentHub,
            message: `Delivered to ${hubMap.get(next.currentHub)?.city}. 🎉`,
          };
          newEvents.push(deliveredEv); next.events.push(deliveredEv);
        }
      }
    }
  }

  // Compute % progress
  return { shipment: next, newEvents };
}

export function shipmentProgress(s: SimShipment): number {
  if (s.status === "delivered") return 100;
  const idx = s.route.indexOf(s.currentHub);
  if (idx < 0) return 0;
  const totalSegs = Math.max(1, s.route.length - 1);
  return Math.min(100, ((idx + s.segmentProgress) / totalSegs) * 100);
}

export function shipmentPosition(s: SimShipment): { x: number; y: number } {
  const a = hubMap.get(s.currentHub)!;
  if (!s.nextHub) return { x: a.x, y: a.y };
  const b = hubMap.get(s.nextHub)!;
  return {
    x: a.x + (b.x - a.x) * s.segmentProgress,
    y: a.y + (b.y - a.y) * s.segmentProgress,
  };
}

export function randomHubPair() {
  const a = HUBS[Math.floor(Math.random() * HUBS.length)];
  let b = HUBS[Math.floor(Math.random() * HUBS.length)];
  while (b.id === a.id) b = HUBS[Math.floor(Math.random() * HUBS.length)];
  return { origin: a.id, destination: b.id };
}
