import { motion } from "framer-motion";
import { HUBS, EDGES, hubMap } from "@/lib/sim/network";
import { computeLive, type ShipmentRow } from "@/lib/sim/timeline";
import { useEffect, useState } from "react";

const W = 1000;
const H = 560;

/** Read-only map showing exactly one shipment's route and live position. */
export function SingleShipmentMap({ shipment }: { shipment: ShipmentRow }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const live = computeLive(shipment);
  const route: string[] = Array.isArray(shipment.route) ? shipment.route : [];
  const onRoute = new Set<string>();
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    onRoute.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }

  // Position: interpolate between currentHub and nextHub by segmentProgress
  const a = hubMap.get(live.currentHub);
  const b = live.nextHub ? hubMap.get(live.nextHub) : undefined;
  const pos = a && b
    ? { x: a.x + (b.x - a.x) * live.segmentProgress, y: a.y + (b.y - a.y) * live.segmentProgress }
    : a ? { x: a.x, y: a.y } : { x: 0.5, y: 0.5 };

  return (
    <div className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto relative">
        {EDGES.map((e, i) => {
          const fa = hubMap.get(e.from)!;
          const fb = hubMap.get(e.to)!;
          const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`;
          const active = onRoute.has(key);
          return (
            <line key={i}
              x1={fa.x * W} y1={fa.y * H} x2={fb.x * W} y2={fb.y * H}
              stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={active ? 2.4 : 1}
              strokeOpacity={active ? 0.8 : 0.3}
              strokeLinecap="round"
              filter={active ? "url(#glow)" : undefined}
            />
          );
        })}
        <defs>
          <radialGradient id="hubGrad">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {HUBS.map(h => {
          const onPath = route.includes(h.id);
          return (
            <g key={h.id} transform={`translate(${h.x * W}, ${h.y * H})`}>
              {onPath && <circle r={18} fill="url(#hubGrad)" opacity={0.4} />}
              <circle r={onPath ? 6 : 3.5}
                fill={onPath ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                opacity={onPath ? 1 : 0.4} />
              <text y={-12} textAnchor="middle" className="fill-foreground" fontSize="11" fontFamily="JetBrains Mono, monospace"
                opacity={onPath ? 1 : 0.4}>
                {h.id}
              </text>
            </g>
          );
        })}

        {/* live shipment dot */}
        <motion.g animate={{ x: pos.x * W, y: pos.y * H }} transition={{ duration: 1, ease: "linear" }}>
          <circle r={10}
            fill={live.status === "delayed" ? "hsl(var(--warning))" : "hsl(var(--primary-glow))"}
            stroke="white" strokeOpacity={0.5} strokeWidth={1.5}
            className="animate-pulse-glow"
          />
        </motion.g>
      </svg>
    </div>
  );
}