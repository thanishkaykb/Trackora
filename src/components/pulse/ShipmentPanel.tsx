import { useSim } from "@/context/SimContext";
import { hubMap } from "@/lib/sim/network";
import { shipmentProgress } from "@/lib/sim/engine";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, Leaf, Zap, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShipmentPanel() {
  const { shipments, selectedId, togglePriority, toggleEco, removeShipment } = useSim();
  const s = shipments.find(x => x.id === selectedId) ?? shipments[0];
  if (!s) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
        Select a shipment to inspect.
      </div>
    );
  }
  const progress = shipmentProgress(s);

  return (
    <motion.div
      key={s.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary">{s.trackingId}</span>
            <StatusBadge status={s.status} />
          </div>
          <div className="mt-1 text-lg font-display leading-tight">
            {s.itemName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Store className="w-3 h-3 text-accent" />from <span className="text-foreground/80">{s.shop}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {hubMap.get(s.origin)?.city} → {hubMap.get(s.destination)?.city}
          </div>
          <div className="text-xs text-muted-foreground">
            Currently at <span className="text-foreground/80">{hubMap.get(s.currentHub)?.city}</span>
            {s.nextHub && <> · heading to {hubMap.get(s.nextHub)?.city}</>}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => removeShipment(s.id)} aria-label="Remove">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* ETA */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="ETA" value={`${s.etaMinutes}m`} />
        <Stat label="Delay" value={`${s.delayMinutes}m`} accent={s.delayMinutes > 0 ? "warning" : undefined} />
        <Stat label="Hops" value={`${s.route.length}`} />
      </div>

      {/* Explanation */}
      {s.explanation && (
        <div className="glass-strong rounded-xl p-3 border-l-2 border-accent">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-1">
            <Brain className="w-3 h-3" /> Explainability
          </div>
          <p className="text-sm text-foreground/90">{s.explanation}</p>
        </div>
      )}

      {/* Modes */}
      <div className="flex items-center justify-between gap-3">
        <ModeToggle
          icon={<Zap className="w-4 h-4 text-primary" />}
          label="Priority"
          checked={s.priority}
          onChange={() => togglePriority(s.id)}
        />
        <ModeToggle
          icon={<Leaf className="w-4 h-4 text-success" />}
          label="Eco route"
          checked={s.eco}
          onChange={() => toggleEco(s.id)}
        />
      </div>

      {/* Timeline */}
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Timeline</div>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {[...s.events].reverse().slice(0, 12).map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="text-foreground/90">{e.message}</div>
                <div className="text-muted-foreground/70 font-mono text-[10px]">
                  {new Date(e.ts).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "warning" }) {
  return (
    <div className="glass-strong rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-display ${accent === "warning" ? "text-warning" : "text-foreground"}`}>{value}</div>
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

function ModeToggle({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex-1 glass-strong rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer">
      <span className="flex items-center gap-2 text-sm">{icon}{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
