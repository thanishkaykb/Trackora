import { AnimatePresence, motion } from "framer-motion";
import { useShipments } from "@/hooks/useShipments";
import { deriveEvents } from "@/lib/sim/timeline";
import { Activity, AlertTriangle, CheckCircle2, MapPin, Plus } from "lucide-react";
import { useMemo } from "react";
import { hubMap } from "@/lib/sim/network";

const ICONS: Record<string, any> = { created: Plus, arrive: MapPin, depart: Activity, delay: AlertTriangle, delivered: CheckCircle2 };
const COLORS: Record<string, string> = { created: "text-primary", arrive: "text-primary-glow", depart: "text-muted-foreground", delay: "text-warning", delivered: "text-success" };

export function SellerEventFeed() {
  const { shipments } = useShipments();
  const events = useMemo(() => shipments
    .flatMap(s => deriveEvents(s).map(e => ({ ...e, tid: s.tracking_id })))
    .sort((a, b) => b.ts - a.ts).slice(0, 30), [shipments]);

  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg">Live event feed</h3>
          <p className="text-xs text-muted-foreground">All activity across your shipments</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE
        </span>
      </div>
      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">No events yet — dispatch a shipment to begin.</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
          <AnimatePresence initial={false}>
            {events.map((e, i) => {
              const Icon = ICONS[e.type] ?? Activity;
              const color = COLORS[e.type] ?? "text-muted-foreground";
              return (
                <motion.div key={`${e.ts}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-muted/40">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground/90">{e.message}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      <span className="text-primary">{e.tid}</span>
                      {e.hub && <> · {hubMap.get(e.hub)?.city ?? e.hub}</>} · {new Date(e.ts).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}