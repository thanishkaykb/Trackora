import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Box, Clock, Gauge, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ShipmentsProvider, useShipments } from "@/hooks/useShipments";
import { computeLive } from "@/lib/sim/timeline";
import { Topbar } from "@/components/pulse/Topbar";
import { StatCard } from "@/components/pulse/StatCard";
import { SellerMap } from "@/components/pulse/SellerMap";
import { SellerCharts } from "@/components/pulse/SellerCharts";
import { SellerCreateShipment } from "@/components/pulse/SellerCreateShipment";
import { SellerShipmentList } from "@/components/pulse/SellerShipmentList";
import { SellerShipmentPanel } from "@/components/pulse/SellerShipmentPanel";
import { SellerEventFeed } from "@/components/pulse/SellerEventFeed";

function SellerInner() {
  const { shipments } = useShipments();
  const stats = useMemo(() => {
    const live = shipments.map(s => ({ s, l: computeLive(s) }));
    const active = live.filter(x => x.l.status !== "delivered").length;
    const delivered = live.filter(x => x.l.status === "delivered").length;
    const activeList = live.filter(x => x.l.status !== "delivered");
    const avgEta = activeList.length === 0 ? 0 : Math.round(activeList.reduce((a, x) => a + x.l.etaMinutes, 0) / activeList.length);
    const total = shipments.length || 1;
    const onTime = shipments.filter(s => s.delay_minutes === 0).length;
    const onTimePct = Math.round((onTime / total) * 100);
    return { active, delivered, avgEta, onTimePct };
  }, [shipments]);

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Seller dashboard</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Network command center</h1>
          <p className="text-sm text-muted-foreground">Dispatch, monitor and analyze your shipments in real time.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active" value={stats.active} icon={Box} accent="primary" />
          <StatCard label="Delivered" value={stats.delivered} icon={Activity} accent="success" delay={0.05} />
          <StatCard label="Avg ETA" value={stats.avgEta} suffix="min" icon={Clock} accent="accent" delay={0.1} />
          <StatCard label="On-time" value={`${stats.onTimePct}%`} icon={TrendingUp} accent="success" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <SellerMap />
            <SellerCharts />
          </div>
          <div className="space-y-6">
            <SellerCreateShipment />
            <SellerShipmentPanel />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <SellerShipmentList />
          <SellerEventFeed />
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <Gauge className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">On-time rate</div>
            <div className="text-2xl font-display">{stats.onTimePct}<span className="text-base text-muted-foreground">%</span></div>
          </div>
          <div className="hidden md:block flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-primary" style={{ width: `${stats.onTimePct}%` }} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Seller() {
  const { user, loading, role, roleLoading, signingOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading || roleLoading || signingOut) return;
    if (!user) { nav("/auth", { replace: true }); return; }
    if (!role) { nav("/onboarding", { replace: true }); return; }
    if (role !== "seller") { nav("/receiver", { replace: true }); return; }
  }, [user, loading, role, roleLoading, nav]);

  if (loading || roleLoading || signingOut || !user || role !== "seller") {
    return null;
  }
  return <ShipmentsProvider><SellerInner /></ShipmentsProvider>;
}