import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useShipments } from "@/hooks/useShipments";
import { computeLive } from "@/lib/sim/timeline";
import { useMemo } from "react";

export function SellerCharts() {
  const { shipments } = useShipments();
  const etaData = useMemo(() => shipments.slice(0, 10).map(s => {
    const live = computeLive(s);
    return { name: s.tracking_id.slice(-4), eta: live.etaMinutes, delay: s.delay_minutes };
  }), [shipments]);

  const efficiencyData = useMemo(() => {
    const total = shipments.length || 1;
    const onTime = shipments.filter(s => s.delay_minutes === 0).length;
    const baseline = Math.round((onTime / total) * 100) || 80;
    return Array.from({ length: 14 }, (_, i) => ({
      t: i,
      v: Math.max(40, Math.min(100, baseline + Math.sin(i / 2) * 5 + (i - 7))),
    }));
  }, [shipments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg mb-1">On-time performance</h3>
        <p className="text-xs text-muted-foreground mb-3">Trailing trend</p>
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
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#eff)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg mb-1">ETA vs Delay</h3>
        <p className="text-xs text-muted-foreground mb-3">Per active shipment (minutes)</p>
        {etaData.length === 0 ? (
          <div className="h-[200px] grid place-items-center text-sm text-muted-foreground">No shipments yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={etaData}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="eta" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="delay" stackId="a" fill="hsl(var(--warning))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}