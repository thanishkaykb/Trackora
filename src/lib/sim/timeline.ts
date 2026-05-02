import { hubMap, edgeBetween } from "./network";

// Real-time pacing: 1 simulated minute = 1 real minute.
// A typical 8-hour route therefore takes 8 real hours.
export const REAL_MS_PER_SIM_MIN = 60_000;

export type Leg = {
  fromHub: string;
  toHub: string;
  startMs: number; // absolute timestamp
  endMs: number;
  durationMin: number;
};

export type ShipmentRow = {
  id: string;
  user_id: string;
  tracking_id: string;
  origin: string;
  destination: string;
  status: string;
  priority: boolean;
  eco: boolean;
  eta_minutes: number;
  delay_minutes: number;
  delay_cause: string | null;
  explanation: string | null;
  current_hub: string | null;
  segment_progress: number;
  progress: number;
  route: any;        // string[]
  events: any;       // ShipmentEvent[]
  item_name: string;
  shop: string;
  recipient_name: string;
  recipient_address: string | null;
  recipient_country?: string | null;
  recipient_phone?: string | null;
  recipient_phone_country?: string | null;
  amount_due: number;
  currency?: string;
  payment_status: string;
  dispatched_at: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DerivedEvent = {
  ts: number;
  type: "created" | "depart" | "arrive" | "delay" | "delivered";
  hub?: string;
  message: string;
};

/** Build the per-leg schedule for a shipment (deterministic from dispatched_at + route). */
export function buildSchedule(s: ShipmentRow): Leg[] {
  const route: string[] = Array.isArray(s.route) ? s.route : [];
  const legs: Leg[] = [];
  let t = new Date(s.dispatched_at).getTime();
  for (let i = 0; i < route.length - 1; i++) {
    const e = edgeBetween(route[i], route[i + 1]);
    if (!e) continue;
    const baseMin = e.baseMinutes * (1 + e.congestion * 0.5);
    const dur = baseMin;
    legs.push({
      fromHub: route[i],
      toHub: route[i + 1],
      startMs: t,
      endMs: t + dur * REAL_MS_PER_SIM_MIN,
      durationMin: dur,
    });
    t = t + dur * REAL_MS_PER_SIM_MIN;
    // small dwell time at intermediate hub
    if (i < route.length - 2) t += 15 * REAL_MS_PER_SIM_MIN;
  }
  // Apply delay shift: push final ETA later by delay_minutes
  return legs;
}

/** Compute live state from real-world time. */
export function computeLive(s: ShipmentRow, now = Date.now()) {
  const legs = buildSchedule(s);
  const route: string[] = Array.isArray(s.route) ? s.route : [];
  const delayMs = (s.delay_minutes || 0) * REAL_MS_PER_SIM_MIN;
  const finalEnd = (legs[legs.length - 1]?.endMs ?? now) + delayMs;

  // Before dispatch
  if (legs.length === 0 || now < legs[0].startMs) {
    return {
      currentHub: route[0] ?? s.origin,
      nextHub: route[1],
      segmentProgress: 0,
      progress: 0,
      status: "scheduled" as const,
      etaMinutes: Math.max(0, Math.round((finalEnd - now) / REAL_MS_PER_SIM_MIN)),
      arrivedHubs: [route[0]].filter(Boolean),
      finalEndMs: finalEnd,
    };
  }

  // After all legs
  if (now >= finalEnd) {
    return {
      currentHub: s.destination,
      nextHub: undefined,
      segmentProgress: 1,
      progress: 100,
      status: "delivered" as const,
      etaMinutes: 0,
      arrivedHubs: route,
      finalEndMs: finalEnd,
    };
  }

  // Find active leg / dwell — apply delayMs as a uniform shift on the second half if any
  // For simplicity, push everything after the first delayed leg later by delayMs / legs.length.
  // Easier: if delay exists, treat the final delay as added to the last leg.
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const start = leg.startMs;
    const end = leg.endMs + (i === legs.length - 1 ? delayMs : 0);
    if (now < start) {
      // dwelling at previous hub
      return {
        currentHub: leg.fromHub,
        nextHub: leg.toHub,
        segmentProgress: 0,
        progress: Math.round((i / Math.max(1, legs.length)) * 100),
        status: (s.delay_minutes > 0 ? "delayed" : "in_transit") as "in_transit" | "delayed",
        etaMinutes: Math.max(0, Math.round((finalEnd - now) / REAL_MS_PER_SIM_MIN)),
        arrivedHubs: route.slice(0, i + 1),
        finalEndMs: finalEnd,
      };
    }
    if (now < end) {
      const segProgress = (now - start) / Math.max(1, end - start);
      const totalSegs = legs.length;
      const overall = ((i + segProgress) / totalSegs) * 100;
      return {
        currentHub: leg.fromHub,
        nextHub: leg.toHub,
        segmentProgress: segProgress,
        progress: Math.round(overall),
        status: (s.delay_minutes > 0 ? "delayed" : "in_transit") as "in_transit" | "delayed",
        etaMinutes: Math.max(0, Math.round((finalEnd - now) / REAL_MS_PER_SIM_MIN)),
        arrivedHubs: route.slice(0, i + 1),
        finalEndMs: finalEnd,
      };
    }
  }

  // Fallback
  return {
    currentHub: s.destination,
    nextHub: undefined,
    segmentProgress: 1,
    progress: 100,
    status: "delivered" as const,
    etaMinutes: 0,
    arrivedHubs: route,
    finalEndMs: finalEnd,
  };
}

/** Derive the visible event timeline from the schedule + stored delay events. */
export function deriveEvents(s: ShipmentRow, now = Date.now()): DerivedEvent[] {
  const out: DerivedEvent[] = [];
  const legs = buildSchedule(s);
  const dispatched = new Date(s.dispatched_at).getTime();
  out.push({
    ts: dispatched,
    type: "created",
    hub: s.origin,
    message: `Order from ${s.shop} dispatched from ${hubMap.get(s.origin)?.city ?? s.origin}.`,
  });
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (now >= leg.startMs) {
      out.push({
        ts: leg.startMs,
        type: "depart",
        hub: leg.fromHub,
        message: `Departed ${hubMap.get(leg.fromHub)?.city ?? leg.fromHub} → ${hubMap.get(leg.toHub)?.city ?? leg.toHub}.`,
      });
    }
    if (now >= leg.endMs) {
      out.push({
        ts: leg.endMs,
        type: i === legs.length - 1 ? "delivered" : "arrive",
        hub: leg.toHub,
        message: i === legs.length - 1
          ? `Delivered to ${hubMap.get(leg.toHub)?.city ?? leg.toHub}. 🎉`
          : `Arrived at ${hubMap.get(leg.toHub)?.city ?? leg.toHub}.`,
      });
    }
  }
  // Append stored explicit events (delays)
  const stored: any[] = Array.isArray(s.events) ? s.events : [];
  for (const e of stored) {
    if (e?.type === "delay" && typeof e.ts === "number") {
      out.push({
        ts: e.ts,
        type: "delay",
        hub: e.hub,
        message: e.message ?? "Delay reported",
      });
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}

export function shortTrackingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "PT-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}