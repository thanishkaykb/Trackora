import { motion } from "framer-motion";
import { HUBS, EDGES, hubMap } from "@/lib/sim/network";
import { useShipments } from "@/hooks/useShipments";
import { computeLive } from "@/lib/sim/timeline";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { WorldBackdrop } from "./WorldBackdrop";

const W = 1000;
const H = 560;

export function SellerMap() {
  const { shipments, selectedId, select } = useShipments();
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const activeRoutes = new Set<string>();
  shipments.forEach(s => {
    const route = (s.route as string[]) ?? [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i + 1];
      activeRoutes.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    }
  });

  const selected = shipments.find(s => s.id === selectedId);

  return (
    <div className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto relative">
        <WorldBackdrop />
        {EDGES.map((e, i) => {
          const a = hubMap.get(e.from)!;
          const b = hubMap.get(e.to)!;
          const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`;
          const active = activeRoutes.has(key);
          return (
            <line key={i}
              x1={a.x * W} y1={a.y * H} x2={b.x * W} y2={b.y * H}
              stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={active ? 1.6 : 1}
              strokeOpacity={active ? 0.55 : 0.4}
              strokeDasharray={active ? "6 6" : undefined}
              className={active ? "animate-dash" : ""}
            />
          );
        })}

        {selected && (selected.route as string[]).length > 1 && (
          <g>
            {(selected.route as string[]).map((id, i, arr) => {
              if (i === arr.length - 1) return null;
              const a = hubMap.get(id)!;
              const b = hubMap.get(arr[i + 1])!;
              return (
                <line key={i}
                  x1={a.x * W} y1={a.y * H} x2={b.x * W} y2={b.y * H}
                  stroke="url(#routeGrad)" strokeWidth={3.5} strokeLinecap="round" filter="url(#glow)"
                />
              );
            })}
          </g>
        )}

        <defs>
          <linearGradient id="routeGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <radialGradient id="hubGrad">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {HUBS.map(h => (
          <g key={h.id} transform={`translate(${h.x * W}, ${h.y * H})`}>
            <circle r={12} fill="url(#hubGrad)" opacity={0.25} />
            <circle r={4} fill="hsl(var(--primary))" />
            <text y={-8} textAnchor="middle" className="fill-foreground" fontSize="9" fontFamily="JetBrains Mono, monospace">{h.id}</text>
          </g>
        ))}

        {shipments.map(s => {
          const live = computeLive(s);
          if (live.status === "delivered") return null;
          const a = hubMap.get(live.currentHub)!;
          const b = live.nextHub ? hubMap.get(live.nextHub) : undefined;
          const x = b ? a.x + (b.x - a.x) * live.segmentProgress : a.x;
          const y = b ? a.y + (b.y - a.y) * live.segmentProgress : a.y;
          const isSel = s.id === selectedId;
          return (
            <motion.g key={s.id} animate={{ x: x * W, y: y * H }} transition={{ duration: 1.4, ease: "linear" }}
              onClick={() => select(s.id)} style={{ cursor: "pointer" }}>
              <circle r={isSel ? 9 : 6}
                fill={live.status === "delayed" ? "hsl(var(--warning))" : "hsl(var(--primary-glow))"}
                stroke="white" strokeOpacity={0.4} strokeWidth={1}
                className="animate-pulse-glow"
              />
            </motion.g>
          );
        })}
      </svg>

      <div className="absolute top-4 right-4 flex gap-2 text-xs">
        <Legend color="primary" label="In transit" />
        <Legend color="warning" label="Delayed" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full glass-strong")}>
      <span className={cn("w-2 h-2 rounded-full", `bg-${color}`)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}