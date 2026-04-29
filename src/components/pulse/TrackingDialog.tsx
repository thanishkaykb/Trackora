import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { hubMap } from "@/lib/sim/network";
import { shipmentProgress } from "@/lib/sim/engine";
import type { SimShipment } from "@/lib/sim/types";
import {
  Store, MapPin, Package, User, Clock, AlertTriangle,
  CheckCircle2, Navigation, Brain, Zap, Leaf, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TrackingDialog({
  shipment, open, onOpenChange,
}: {
  shipment: SimShipment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!shipment) return null;
  const s = shipment;
  const progress = shipmentProgress(s);
  const origin = hubMap.get(s.origin);
  const dest = hubMap.get(s.destination);
  const current = hubMap.get(s.currentHub);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-strong border-primary/20 p-0 overflow-hidden">
        {/* Header banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent border-b border-border/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 blur-3xl rounded-full" />
          <DialogHeader className="space-y-3 relative">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs tracking-wider text-primary">{s.trackingId}</span>
              <StatusBadge status={s.status} />
              {s.priority && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1"><Zap className="w-3 h-3" />Priority</Badge>}
              {s.eco && <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1"><Leaf className="w-3 h-3" />Eco</Badge>}
            </div>
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              {s.itemName}
            </DialogTitle>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-accent" />from <span className="text-foreground font-medium">{s.shop}</span></span>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />for <span className="text-foreground/90">{s.recipient}</span></span>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Route summary */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <RouteEnd label="From" city={origin?.city ?? s.origin} code={s.origin} />
            <Truck className="w-5 h-5 text-primary animate-pulse" />
            <RouteEnd label="To" city={dest?.city ?? s.destination} code={s.destination} align="right" />
          </div>

          {/* Progress bar with hubs */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Currently at <span className="text-foreground font-medium">{current?.city}</span>{s.nextHub && <> · heading to {hubMap.get(s.nextHub)?.city}</>}</span>
              <span className="font-mono text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground">
              {s.route.map((id, i) => (
                <span key={i} className={cn(
                  "flex flex-col items-center gap-0.5",
                  s.route.indexOf(s.currentHub) >= i ? "text-primary" : ""
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full",
                    s.route.indexOf(s.currentHub) >= i ? "bg-primary" : "bg-muted-foreground/40")} />
                  {id}
                </span>
              ))}
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-3">
            <InfoStat icon={Clock} label="ETA" value={s.status === "delivered" ? "Delivered" : `${s.etaMinutes}m`} tone="primary" />
            <InfoStat icon={AlertTriangle} label="Delay" value={`${s.delayMinutes}m`} tone={s.delayMinutes > 0 ? "warning" : "muted"} />
            <InfoStat icon={Navigation} label="Hops" value={`${s.route.length}`} tone="accent" />
          </div>

          {/* AI explanation */}
          {s.explanation && (
            <div className="rounded-xl p-4 border border-accent/30 bg-accent/5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Insight
              </div>
              <p className="text-sm text-foreground/90">{s.explanation}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tracking history</div>
            <ol className="relative border-l border-border/60 ml-2 space-y-3">
              {[...s.events].reverse().slice(0, 14).map((e, i) => (
                <li key={i} className="ml-4">
                  <span className={cn(
                    "absolute -left-[5px] w-2.5 h-2.5 rounded-full mt-1.5",
                    e.type === "delivered" ? "bg-success" :
                    e.type === "delay" ? "bg-warning" :
                    e.type === "reroute" ? "bg-accent" :
                    e.type === "arrive" ? "bg-primary" : "bg-muted-foreground"
                  )} />
                  <div className="text-sm text-foreground/90 flex items-start gap-2">
                    {e.type === "delivered" && <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />}
                    <span>{e.message}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {new Date(e.ts).toLocaleString()}
                    {e.hub && <> · <span className="text-foreground/60">{hubMap.get(e.hub)?.city ?? e.hub}</span></>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RouteEnd({ label, city, code, align }: { label: string; city: string; code: string; align?: "right" }) {
  return (
    <div className={cn("glass-strong rounded-xl p-3", align === "right" && "text-right")}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1" style={{ justifyContent: align === "right" ? "flex-end" : undefined }}>
        <MapPin className="w-3 h-3" />{label}
      </div>
      <div className="font-display text-base mt-0.5 truncate">{city}</div>
      <div className="text-[10px] font-mono text-primary/70">{code}</div>
    </div>
  );
}

function InfoStat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary"|"warning"|"accent"|"muted" }) {
  const toneCls = {
    primary: "text-primary",
    warning: "text-warning",
    accent: "text-accent",
    muted: "text-foreground",
  }[tone];
  return (
    <div className="glass-strong rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className={cn("text-xl font-display mt-0.5", toneCls)}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_transit: { label: "In transit", cls: "bg-primary/15 text-primary border-primary/30" },
    delayed: { label: "Delayed", cls: "bg-warning/15 text-warning border-warning/30" },
    rerouted: { label: "Rerouted", cls: "bg-accent/15 text-accent border-accent/30" },
    delivered: { label: "Delivered", cls: "bg-success/15 text-success border-success/30" },
  };
  const s = map[status] ?? map.in_transit;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}