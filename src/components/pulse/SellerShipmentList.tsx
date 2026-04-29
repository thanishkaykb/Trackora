import { useShipments } from "@/hooks/useShipments";
import { hubMap } from "@/lib/sim/network";
import { computeLive } from "@/lib/sim/timeline";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function SellerShipmentList() {
  const { shipments, selectedId, select, loading } = useShipments();

  if (loading) {
    return <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">Loading shipments…</div>;
  }
  if (shipments.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <div className="text-sm font-medium">No shipments yet</div>
        <div className="text-xs text-muted-foreground mt-1">Use the dispatch form on the right to create your first one.</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-3 max-h-[520px] overflow-y-auto">
      <div className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground">My shipments ({shipments.length})</div>
      <div className="mt-2 space-y-1.5">
        {shipments.map(s => {
          const live = computeLive(s);
          const isSel = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all border",
                isSel ? "border-primary/50 bg-primary/10 glow-primary" : "border-transparent hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-primary">{s.tracking_id}</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider",
                  live.status === "delayed" ? "text-warning" :
                  live.status === "delivered" ? "text-success" : "text-muted-foreground"
                )}>{live.status.replace("_", " ")}</span>
              </div>
              <div className="text-sm mt-0.5 truncate font-medium">{s.item_name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {s.shop} · {hubMap.get(s.origin)?.city} → {hubMap.get(s.destination)?.city}
              </div>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${live.progress}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}