import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSim } from "@/context/SimContext";
import { useMemo } from "react";

export function AnalyticsCharts() {
  const { shipments, analytics } = useSim();

  const etaData = useMemo(() => {
    return shipments.slice(0, 10).map(s => ({
      name: s.trackingId.slice(-4),
      eta: s.etaMinutes,
      delay: s.delayMinutes,
    }));
  }, [shipments]);

  const efficiencyData = useMemo(() => {
    // Synthetic timeseries seeded by efficiency value
    const base = analytics.efficiency;
    return Array.from({ length: 16 }, (_, i) => ({
      t: i,
      v: Math.max(40, Math.min(100, base + Math.sin(i / 2) * 6 + (i - 8))),
    }));
  }, [analytics.efficiency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg mb-1">Network Efficiency</h3>
        <p className="text-xs text-muted-foreground mb-3">Score over recent ticks</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={efficiencyData}>
            <defs>
              <linearGradient id="eff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#eff)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg mb-1">ETA vs Delay</h3>
        <p className="text-xs text-muted-foreground mb-3">Per active shipment (minutes)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={etaData}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
            />
            <Bar dataKey="eta" stackId="a" fill="hsl(var(--primary))" radius={[0,0,0,0]} />
            <Bar dataKey="delay" stackId="a" fill="hsl(var(--warning))" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
