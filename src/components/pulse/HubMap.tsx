import { motion } from "framer-motion";
import { HUBS, EDGES, hubMap } from "@/lib/sim/network";
import { shipmentPosition } from "@/lib/sim/engine";
import { useSim } from "@/context/SimContext";
import { cn } from "@/lib/utils";

const W = 1000;
const H = 560;

export function HubMap() {
  const { shipments, selectedId, select } = useSim();

  const activeRoutes = new Set<string>();
  shipments.filter(s => s.status !== "delivered").forEach(s => {
    for (let i = 0; i < s.route.length - 1; i++) {
      const a = s.route[i], b = s.route[i + 1];
      activeRoutes.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    }
  });

  const selected = shipments.find(s => s.id === selectedId);

  return (
    <div className="glass rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto relative">
        {/* base edges */}
        {EDGES.map((e, i) => {
          const a = hubMap.get(e.from)!;
          const b = hubMap.get(e.to)!;
          const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`;
          const active = activeRoutes.has(key);
          return (
            <line
              key={i}
              x1={a.x * W} y1={a.y * H} x2={b.x * W} y2={b.y * H}
              stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={active ? 1.6 : 1}
              strokeOpacity={active ? 0.55 : 0.4}
              strokeDasharray={active ? "6 6" : undefined}
              className={active ? "animate-dash" : ""}
            />
          );
        })}

        {/* selected route highlighted */}
        {selected && selected.route.length > 1 && (
          <g>
            {selected.route.map((id, i) => {
              if (i === selected.route.length - 1) return null;
              const a = hubMap.get(id)!;
              const b = hubMap.get(selected.route[i + 1])!;
              return (
                <line
                  key={i}
                  x1={a.x * W} y1={a.y * H} x2={b.x * W} y2={b.y * H}
                  stroke="url(#routeGrad)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  filter="url(#glow)"
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

        {/* hubs */}
        {HUBS.map(h => {
          const overloaded = h.loadFactor > 1;
          return (
            <g key={h.id} transform={`translate(${h.x * W}, ${h.y * H})`}>
              <circle r={18} fill="url(#hubGrad)" opacity={0.25} />
              <circle r={6} fill={overloaded ? "hsl(var(--warning))" : "hsl(var(--primary))"} />
              <circle r={6} fill="none" stroke={overloaded ? "hsl(var(--warning))" : "hsl(var(--primary))"} strokeOpacity={0.5}>
                <animate attributeName="r" values="6;14;6" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <text y={-14} textAnchor="middle" className="fill-foreground" fontSize="11" fontFamily="JetBrains Mono, monospace">
                {h.id}
              </text>
              <text y={26} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
                {h.city}
              </text>
            </g>
          );
        })}

        {/* shipments */}
        {shipments.filter(s => s.status !== "delivered").map(s => {
          const p = shipmentPosition(s);
          const isSel = s.id === selectedId;
          return (
            <motion.g
              key={s.id}
              animate={{ x: p.x * W, y: p.y * H }}
              transition={{ duration: 1.4, ease: "linear" }}
              onClick={() => select(s.id)}
              style={{ cursor: "pointer" }}
            >
              <circle r={isSel ? 9 : 6}
                fill={s.status === "delayed" ? "hsl(var(--warning))" :
                      s.status === "rerouted" ? "hsl(var(--accent))" : "hsl(var(--primary-glow))"}
                stroke="white" strokeOpacity={0.4} strokeWidth={1}
                className="animate-pulse-glow"
              />
            </motion.g>
          );
        })}
      </svg>

      <div className="absolute top-4 right-4 flex gap-2 text-xs">
        <Legend color="primary-glow" label="In transit" />
        <Legend color="accent" label="Rerouted" />
        <Legend color="warning" label="Delayed" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full glass-strong">
      <span className={cn("w-2 h-2 rounded-full", `bg-${color === "primary-glow" ? "primary" : color}`)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
