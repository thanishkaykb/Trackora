import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Search, Package, MapPin, Clock, AlertTriangle, CheckCircle2, Store, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { computeLive, deriveEvents, type ShipmentRow } from "@/lib/sim/timeline";
import { hubMap } from "@/lib/sim/network";
import { SingleShipmentMap } from "@/components/pulse/SingleShipmentMap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENCIES, formatMoney, countryByCode } from "@/lib/sim/countries";
import { useFxConvert } from "@/hooks/useFx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Track() {
  const { id: idParam } = useParams();
  const nav = useNavigate();
  const [tid, setTid] = useState(idParam ?? "");
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [, setNow] = useState(Date.now());
  const [viewCurrency, setViewCurrency] = useState<string>(() => {
    try {
      const lang = navigator.language || "en-US";
      const region = lang.split("-")[1] ?? "US";
      return countryByCode.get(region.toUpperCase())?.currency ?? "USD";
    } catch { return "USD"; }
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const search = async (raw: string) => {
    const v = raw.trim().toUpperCase();
    if (!v) { toast.error("Enter a tracking ID"); return; }
    setLoading(true);
    const { data, error } = await supabase.from("shipments").select("*").eq("tracking_id", v).maybeSingle();
    setLoading(false);
    if (error) { toast.error("Lookup failed"); return; }
    if (!data) { toast.error(`No shipment found for ${v}`); setShipment(null); return; }
    setShipment(data as ShipmentRow);
    nav(`/track/${v}`, { replace: true });
  };

  useEffect(() => { if (idParam) search(idParam); /* eslint-disable-next-line */ }, [idParam]);

  const live = shipment ? computeLive(shipment) : null;
  const events = shipment ? deriveEvents(shipment) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center glow-primary">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-semibold leading-none">Trackora</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Public tracking</div>
            </div>
          </Link>
          <Link to="/start">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Go back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Track your shipment</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the tracking ID your seller gave you (looks like <span className="font-mono">PT-XXXXXX</span>).</p>
        </motion.div>

        <div className="glass rounded-2xl p-3 flex gap-2 items-center">
          <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <Input placeholder="PT-AB12CD" value={tid}
            onChange={e => setTid(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === "Enter") search(tid); }}
            className="bg-transparent border-0 focus-visible:ring-0 font-mono" />
          <Button onClick={() => search(tid)} disabled={loading} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? "Searching…" : "Track"}
          </Button>
        </div>

        {shipment && live && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6">
              <SingleShipmentMap shipment={shipment} />
              <div className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tracking history</div>
                <ol className="relative border-l border-border/60 ml-2 space-y-3">
                  {events.map((e, i) => (
                    <li key={i} className="ml-4">
                      <span className={cn("absolute -left-[5px] w-2.5 h-2.5 rounded-full mt-1.5",
                        e.type === "delivered" ? "bg-success" : e.type === "delay" ? "bg-warning" :
                        e.type === "arrive" ? "bg-primary" : e.type === "depart" ? "bg-primary/60" : "bg-muted-foreground")} />
                      <div className="text-sm text-foreground/90 flex items-start gap-2">
                        {e.type === "delivered" && <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />}
                        {e.type === "delay" && <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />}
                        <span>{e.message}</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {new Date(e.ts).toLocaleString()}
                        {e.hub && <> · <span className="text-foreground/60">{hubMap.get(e.hub)?.city ?? e.hub}</span></>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary">{shipment.tracking_id}</span>
                  <StatusBadge status={live.status} />
                </div>
                <div className="text-xl font-display">{shipment.item_name}</div>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-accent" />from <span className="text-foreground">{shipment.shop}</span></span>
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />for <span className="text-foreground">{shipment.recipient_name}</span></span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{hubMap.get(shipment.origin)?.city} → {hubMap.get(shipment.destination)?.city}</span>
                </div>
                {Number(shipment.amount_due) > 0 && (
                  <PriceBlock shipment={shipment} viewCurrency={viewCurrency} setViewCurrency={setViewCurrency} />
                )}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">At <span className="text-foreground">{hubMap.get(live.currentHub)?.city}</span>{live.nextHub && <> → {hubMap.get(live.nextHub)?.city}</>}</span>
                    <span className="font-mono text-primary">{live.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-gradient-primary" animate={{ width: `${live.progress}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat icon={Clock} label="ETA" value={live.status === "delivered" ? "Done" : `${live.etaMinutes}m`} />
                  <Stat icon={AlertTriangle} label="Delay" value={`${shipment.delay_minutes}m`} accent={shipment.delay_minutes > 0 ? "warning" : undefined} />
                </div>
                {shipment.delay_minutes > 0 && (
                  <div className="rounded-xl p-3 border border-warning/30 bg-warning/5 text-sm">
                    <div className="text-xs uppercase tracking-wider text-warning mb-1">Why it's delayed</div>
                    {shipment.explanation ?? `Cause: ${shipment.delay_cause ?? "unknown"}`}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground pt-1">
                  Estimated delivery: <span className="text-foreground">{new Date(live.finalEndMs).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: "warning" }) {
  return (
    <div className="glass-strong rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className={cn("text-xl font-display mt-0.5", accent === "warning" ? "text-warning" : "text-foreground")}>{value}</div>
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