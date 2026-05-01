import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Search, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Topbar } from "@/components/pulse/Topbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeLive, type ShipmentRow } from "@/lib/sim/timeline";
import { hubMap } from "@/lib/sim/network";
import { SingleShipmentMap } from "@/components/pulse/SingleShipmentMap";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "trackora:receiver:tracked-ids";

export default function Receiver() {
  const { user, loading, role, roleLoading } = useAuth();
  const nav = useNavigate();
  const [ids, setIds] = useState<string[]>([]);
  const [shipments, setShipments] = useState<Record<string, ShipmentRow>>({});
  const [tid, setTid] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) { nav("/auth", { replace: true }); return; }
    if (!role) { nav("/onboarding", { replace: true }); return; }
    if (role !== "receiver") { nav("/seller", { replace: true }); return; }
  }, [user, loading, role, roleLoading, nav]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setIds(saved);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (ids.length === 0) { setShipments({}); return; }
    (async () => {
      const { data } = await supabase.from("shipments").select("*").in("tracking_id", ids);
      const map: Record<string, ShipmentRow> = {};
      (data ?? []).forEach(r => { map[(r as any).tracking_id] = r as ShipmentRow; });
      setShipments(map);
      if (!activeId && data && data.length) setActiveId((data[0] as any).tracking_id);
    })();
  }, [ids, activeId]);

  const add = async () => {
    const v = tid.trim().toUpperCase();
    if (!v) return toast.error("Enter a tracking ID");
    if (ids.includes(v)) { setActiveId(v); setTid(""); return; }
    const { data, error } = await supabase.from("shipments").select("*").eq("tracking_id", v).maybeSingle();
    if (error || !data) return toast.error(`No shipment found for ${v}`);
    const next = [v, ...ids];
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShipments(prev => ({ ...prev, [v]: data as ShipmentRow }));
    setActiveId(v);
    setTid("");
    toast.success(`Now tracking ${v}`);
  };

  const remove = (v: string) => {
    const next = ids.filter(x => x !== v);
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (activeId === v) setActiveId(next[0] ?? null);
  };

  if (loading || roleLoading || !user || role !== "receiver") {
    return null;
  }

  const active = activeId ? shipments[activeId] : undefined;
  const live = active ? computeLive(active) : null;

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Receiver dashboard</div>
          <h1 className="font-display text-3xl font-semibold mt-1">My incoming packages</h1>
          <p className="text-sm text-muted-foreground">Add the tracking IDs your sellers shared. They're saved on this device.</p>
        </div>

        <div className="glass rounded-2xl p-3 flex gap-2 items-center">
          <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <Input placeholder="PT-AB12CD" value={tid}
            onChange={e => setTid(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === "Enter") add(); }}
            className="bg-transparent border-0 focus-visible:ring-0 font-mono" />
          <Button onClick={add} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-2">
            {ids.length === 0 && (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No packages tracked yet.</div>
            )}
            {ids.map(v => {
              const s = shipments[v];
              if (!s) return null;
              const l = computeLive(s);
              return (
                <button key={v} onClick={() => setActiveId(v)}
                  className={cn("w-full text-left glass rounded-2xl p-3 transition-all border",
                    activeId === v ? "border-primary/50 glow-primary" : "border-transparent hover:bg-muted/40")}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">{v}</span>
                    <span onClick={(e) => { e.stopPropagation(); remove(v); }} className="opacity-60 hover:opacity-100 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate mt-0.5">{s.item_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{s.shop}</div>
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${l.progress}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {active && live ? (
              <>
                <SingleShipmentMap shipment={active} />
                <div className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-primary">{active.tracking_id}</span>
                    <StatusBadge status={live.status} />
                  </div>
                  <div className="text-xl font-display">{active.item_name}</div>
                  <div className="text-sm text-muted-foreground">
                    From <span className="text-foreground">{active.shop}</span> · {hubMap.get(active.origin)?.city} → {hubMap.get(active.destination)?.city}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">At {hubMap.get(live.currentHub)?.city}{live.nextHub && <> → {hubMap.get(live.nextHub)?.city}</>}</span>
                      <span className="font-mono text-primary">{live.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${live.progress}%` }} />
                    </div>
                  </div>
                  {active.delay_minutes > 0 && (
                    <div className="rounded-xl p-3 border border-warning/30 bg-warning/5 text-sm">
                      <div className="text-xs uppercase tracking-wider text-warning mb-1">Heads up</div>
                      Delivery is delayed by {active.delay_minutes} min. {active.explanation ?? ""}
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    Estimated arrival: <span className="text-foreground">{new Date(live.finalEndMs).toLocaleString()}</span>
                  </div>
                  <a href={`/track/${active.tracking_id}`} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Open public tracking page <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Add a tracking ID above to see its map and status.</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_transit: { label: "In transit", cls: "bg-primary/15 text-primary border-primary/30" },
    delayed: { label: "Delayed", cls: "bg-warning/15 text-warning border-warning/30" },
    delivered: { label: "Delivered", cls: "bg-success/15 text-success border-success/30" },
    scheduled: { label: "Scheduled", cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[status] ?? map.in_transit;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}