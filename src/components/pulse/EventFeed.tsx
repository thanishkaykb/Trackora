import { AnimatePresence, motion } from "framer-motion";
import { useSim } from "@/context/SimContext";
import { Activity, AlertTriangle, ArrowRightLeft, CheckCircle2, MapPin, Plus } from "lucide-react";

const ICONS = {
  created: Plus,
  arrive: MapPin,
  depart: Activity,
  delay: AlertTriangle,
  reroute: ArrowRightLeft,
  delivered: CheckCircle2,
  info: Activity,
} as const;

const COLORS = {
  created: "text-primary",
  arrive: "text-primary-glow",
  depart: "text-muted-foreground",
  delay: "text-warning",
  reroute: "text-accent",
  delivered: "text-success",
  info: "text-muted-foreground",
} as const;

export function EventFeed() {
  const { events } = useSim();
  return (
    <div className="glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg">Live Event Feed</h3>
          <p className="text-xs text-muted-foreground">Network activity in real time</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
        <AnimatePresence initial={false}>
          {events.slice(0, 30).map((e, i) => {
            const Icon = ICONS[e.type];
            return (
              <motion.div
                key={`${e.ts}-${i}-${e.message}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${COLORS[e.type]}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground/90 truncate">{e.message}</div>
                  {e.hub && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      {e.hub} · {new Date(e.ts).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
