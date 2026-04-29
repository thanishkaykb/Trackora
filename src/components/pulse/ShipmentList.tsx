import { useSim } from "@/context/SimContext";
import { hubMap } from "@/lib/sim/network";
import { shipmentProgress } from "@/lib/sim/engine";
import { cn } from "@/lib/utils";

export function ShipmentList() {
  const { shipments, selectedId, select } = useSim();
  return (
    <div className="glass rounded-2xl p-3 max-h-[420px] overflow-y-auto">
      <div className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground">Active shipments</div>
      <div className="mt-2 space-y-1.5">
        {shipments.map(s => {
          const progress = shipmentProgress(s);
          const isSel = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              className={cn(
                "w-full text-left p-2.5 rounded-xl transition-all border",
                isSel
                  ? "border-primary/50 bg-primary/10 glow-primary"
                  : "border-transparent hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-primary">{s.trackingId}</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider",
                  s.status === "delayed" ? "text-warning" :
                  s.status === "rerouted" ? "text-accent" :
                  s.status === "delivered" ? "text-success" : "text-muted-foreground"
                )}>{s.status.replace("_", " ")}</span>
              </div>
              <div className="text-sm mt-0.5 truncate font-medium">{s.itemName}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {s.shop} · {hubMap.get(s.origin)?.city} → {hubMap.get(s.destination)?.city}
              </div>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${progress}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
