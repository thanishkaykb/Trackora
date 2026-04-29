import { useShipments } from "@/hooks/useShipments";
import { hubMap } from "@/lib/sim/network";
import { computeLive, deriveEvents } from "@/lib/sim/timeline";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Leaf, Zap, X, Store, Copy, User, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SellerShipmentPanel() {
  const { shipments, selectedId, remove } = useShipments();
  const s = shipments.find(x => x.id === selectedId) ?? shipments[0];
  if (!s) return null;
  const live = computeLive(s);
  const events = deriveEvents(s);

  return (
    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { navigator.clipboard.writeText(s.tracking_id); toast.success("Tracking ID copied"); }}
              className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1">
              {s.tracking_id} <Copy className="w-3 h-3" />
            </button>
            <StatusBadge status={live.status} />
            {s.priority && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1"><Zap className="w-3 h-3" />Priority</Badge>}
            {s.eco && <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1"><Leaf className="w-3 h-3" />Eco</Badge>}
          </div>
          <div className="mt-1 text-lg font-display leading-tight truncate">{s.item_name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Store className="w-3 h-3 text-accent" />{s.shop}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="w-3 h-3" />{s.recipient_name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" />{hubMap.get(s.origin)?.city} → {hubMap.get(s.destination)?.city}</div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Remove">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="font-mono">{live.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full bg-gradient-primary" animate={{ width: `${live.progress}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="ETA" value={live.status === "delivered" ? "Done" : `${live.etaMinutes}m`} />
        <MiniStat label="Delay" value={`${s.delay_minutes}m`} accent={s.delay_minutes > 0 ? "warning" : undefined} />
        <MiniStat label="Hops" value={String((s.route as string[]).length)} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="glass-strong rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment</div>
          <div className="mt-0.5">
            <span className={cn("font-medium", s.payment_status === "paid" ? "text-success" : "text-warning")}>
              {s.payment_status.toUpperCase()}
            </span>
            {s.amount_due > 0 && <span className="text-muted-foreground"> · ${s.amount_due}</span>}
          </div>
        </div>
        <div className="glass-strong rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Dispatched</div>
          <div className="mt-0.5 text-foreground/90">{new Date(s.dispatched_at).toLocaleString()}</div>
        </div>
      </div>

      {s.delay_minutes > 0 && s.explanation && (
        <div className="glass-strong rounded-xl p-3 border-l-2 border-warning">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-warning mb-1">
            <Brain className="w-3 h-3" /> Predicted delay
          </div>
          <p className="text-sm text-foreground/90">{s.explanation}</p>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Timeline</div>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {events.slice(0, 12).map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {e.type === "delivered" ? <CheckCircle2 className="w-3 h-3 text-success mt-0.5" /> :
               e.type === "delay" ? <AlertTriangle className="w-3 h-3 text-warning mt-0.5" /> :
               <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
              <div className="flex-1">
                <div className="text-foreground/90">{e.message}</div>
                <div className="text-muted-foreground/70 font-mono text-[10px]">{new Date(e.ts).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "warning" }) {
  return (
    <div className="glass-strong rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-display", accent === "warning" ? "text-warning" : "text-foreground")}>{value}</div>
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