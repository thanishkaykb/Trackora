import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createShipment, randomHubPair, tickShipment, shipmentProgress } from "@/lib/sim/engine";
import type { SimShipment, ShipmentEvent, Analytics } from "@/lib/sim/types";
import { supabase } from "@/integrations/supabase/client";

type SimCtx = {
  shipments: SimShipment[];
  events: ShipmentEvent[];
  analytics: Analytics;
  selectedId?: string;
  select: (id?: string) => void;
  addShipment: (origin: string, destination: string, opts?: { priority?: boolean; eco?: boolean }) => SimShipment;
  togglePriority: (id: string) => void;
  toggleEco: (id: string) => void;
  removeShipment: (id: string) => void;
  findByTracking: (tid: string) => SimShipment | undefined;
  trackOrCreate: (tid: string) => SimShipment;
};

const Ctx = createContext<SimCtx | null>(null);
const TICK_MS = 1500;
const MAX_EVENTS = 80;

export function SimProvider({ children }: { children: ReactNode }) {
  const [shipments, setShipments] = useState<SimShipment[]>([]);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const seededRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Seed with realistic shipments on mount
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const seeds: SimShipment[] = [];
    for (let i = 0; i < 6; i++) {
      const { origin, destination } = randomHubPair();
      seeds.push(createShipment({
        origin, destination,
        priority: Math.random() < 0.25,
        eco: Math.random() < 0.2,
      }));
    }
    setShipments(seeds);
    setSelectedId(seeds[0]?.id);
    setEvents(seeds.flatMap(s => s.events).slice(-MAX_EVENTS));
  }, []);

  // Capture current user (for persistence on create)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      userIdRef.current = data.session?.user.id ?? null;
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      userIdRef.current = sess?.user.id ?? null;
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Tick loop
  useEffect(() => {
    const t = setInterval(() => {
      setShipments(prev => {
        const newGlobal: ShipmentEvent[] = [];
        const next = prev.map(s => {
          const { shipment, newEvents } = tickShipment(s);
          if (newEvents.length) newGlobal.push(...newEvents);
          return shipment;
        });
        if (newGlobal.length) {
          setEvents(ev => [...newGlobal, ...ev].slice(0, MAX_EVENTS));
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  const analytics = useMemo<Analytics>(() => {
    const active = shipments.filter(s => s.status !== "delivered").length;
    const delivered = shipments.filter(s => s.status === "delivered").length;
    const avgEta = active === 0 ? 0 :
      Math.round(shipments.filter(s => s.status !== "delivered")
        .reduce((a, s) => a + s.etaMinutes, 0) / active);
    const delayed = shipments.filter(s => s.delayMinutes > 0).length;
    const delayRate = shipments.length === 0 ? 0 : Math.round((delayed / shipments.length) * 100);
    const efficiency = Math.max(0, Math.min(100, 100 - delayRate * 0.6));
    const recent = shipments.filter(s => s.status === "delivered").map(s => s.etaMinutes + s.delayMinutes);
    return { active, delivered, avgEta, delayRate, efficiency: Math.round(efficiency), recentDeliveryMinutes: recent };
  }, [shipments]);

  const ctx: SimCtx = {
    shipments, events, analytics, selectedId,
    select: setSelectedId,
    addShipment: (origin, destination, opts) => {
      const s = createShipment({ origin, destination, priority: opts?.priority, eco: opts?.eco });
      setShipments(prev => [s, ...prev]);
      setEvents(ev => [...s.events, ...ev].slice(0, MAX_EVENTS));
      setSelectedId(s.id);
      // Persist to Cloud if logged in (best-effort)
      const uid = userIdRef.current;
      if (uid) {
        supabase.from("shipments").insert({
          user_id: uid,
          tracking_id: s.trackingId,
          origin: s.origin,
          destination: s.destination,
          status: s.status,
          priority: s.priority,
          eco: s.eco,
          eta_minutes: s.etaMinutes,
          progress: shipmentProgress(s),
          route: s.route,
          events: s.events as any,
          current_hub: s.currentHub,
          delay_minutes: s.delayMinutes,
        }).then(() => void 0);
      }
      return s;
    },
    togglePriority: (id) => setShipments(prev => prev.map(s => s.id === id ? { ...s, priority: !s.priority } : s)),
    toggleEco: (id) => setShipments(prev => prev.map(s => s.id === id ? { ...s, eco: !s.eco } : s)),
    removeShipment: (id) => setShipments(prev => prev.filter(s => s.id !== id)),
    findByTracking: (tid) => shipments.find(s => s.trackingId.toLowerCase() === tid.toLowerCase()),
    trackOrCreate: (rawTid) => {
      const tid = rawTid.trim().toUpperCase();
      const existing = shipments.find(s => s.trackingId.toLowerCase() === tid.toLowerCase());
      if (existing) { setSelectedId(existing.id); return existing; }
      const { origin, destination } = randomHubPair();
      const s = createShipment({
        origin, destination,
        trackingId: tid.startsWith("PT-") ? tid : `PT-${tid.replace(/[^A-Z0-9]/g, "").slice(0, 6) || "DEMO01"}`,
      });
      // simulate some progress so it looks like an in-flight order
      const advance = Math.floor(Math.random() * Math.max(1, s.route.length - 1));
      s.currentHub = s.route[advance];
      s.nextHub = s.route[advance + 1];
      s.segmentProgress = Math.random() * 0.7;
      setShipments(prev => [s, ...prev]);
      setEvents(ev => [...s.events, ...ev].slice(0, MAX_EVENTS));
      setSelectedId(s.id);
      return s;
    },
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useSim() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSim must be used within SimProvider");
  return c;
}
