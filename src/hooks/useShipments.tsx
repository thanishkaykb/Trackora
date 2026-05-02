import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeLive, deriveEvents, shortTrackingId, type ShipmentRow } from "@/lib/sim/timeline";
import { planRoute } from "@/lib/sim/engine";

type CreateInput = {
  origin: string;
  destination: string;
  itemName: string;
  shop: string;
  recipientName: string;
  recipientPhone?: string;
  recipientPhoneCountry?: string;
  recipientCountry?: string;
  recipientAddress?: string;
  amountDue?: number;
  currency?: string;
  paymentStatus?: "paid" | "unpaid";
  priority?: boolean;
  eco?: boolean;
};

type Ctx = {
  shipments: ShipmentRow[];
  loading: boolean;
  selectedId?: string;
  select: (id?: string) => void;
  refresh: () => Promise<void>;
  create: (input: CreateInput) => Promise<ShipmentRow | null>;
  remove: (id: string) => Promise<void>;
};

const C = createContext<Ctx | null>(null);

export function ShipmentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (!user) { setShipments([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("user_id", user.id)
      .order("dispatched_at", { ascending: false });
    if (!error && data) setShipments(data as ShipmentRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime updates for the seller's shipments
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`shipments-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  // Periodically re-render so live progress (computed from now()) updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30_000); // every 30s
    return () => clearInterval(t);
  }, []);

  const create = useCallback<Ctx["create"]>(async (input) => {
    if (!user) return null;
    const { route, eta } = planRoute(input.origin, input.destination, !!input.priority, !!input.eco);
    if (route.length < 2) return null;
    const tid = shortTrackingId();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("shipments").insert({
      user_id: user.id,
      tracking_id: tid,
      origin: input.origin,
      destination: input.destination,
      status: "in_transit",
      priority: !!input.priority,
      eco: !!input.eco,
      eta_minutes: eta,
      route,
      events: [],
      current_hub: input.origin,
      segment_progress: 0,
      progress: 0,
      delay_minutes: 0,
      item_name: input.itemName,
      shop: input.shop,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone ?? null,
      recipient_phone_country: input.recipientPhoneCountry ?? null,
      recipient_country: input.recipientCountry ?? null,
      recipient_address: input.recipientAddress ?? null,
      amount_due: input.amountDue ?? 0,
      currency: input.currency ?? "USD",
      payment_status: input.paymentStatus ?? "unpaid",
      dispatched_at: now,
    }).select().single();
    if (error || !data) { console.error(error); return null; }
    setShipments(prev => [data as ShipmentRow, ...prev]);
    setSelectedId((data as ShipmentRow).id);
    return data as ShipmentRow;
  }, [user]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("shipments").delete().eq("id", id);
    setShipments(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(undefined);
  }, [selectedId]);

  const value: Ctx = useMemo(() => ({
    shipments, loading, selectedId,
    select: setSelectedId,
    refresh, create, remove,
  }), [shipments, loading, selectedId, refresh, create, remove]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useShipments() {
  const c = useContext(C);
  if (!c) throw new Error("useShipments must be used within ShipmentsProvider");
  return c;
}

/** Helper: enrich a row with live-computed state. */
export function useLive(s?: ShipmentRow) {
  return useMemo(() => {
    if (!s) return null;
    const live = computeLive(s);
    const events = deriveEvents(s);
    return { ...s, live, derivedEvents: events };
  }, [s]);
}