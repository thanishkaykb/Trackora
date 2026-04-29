import { motion } from "framer-motion";
import { Activity, Box, Clock, Gauge, TrendingDown, Info } from "lucide-react";
import { SimProvider, useSim } from "@/context/SimContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Topbar } from "@/components/pulse/Topbar";
import { HubMap } from "@/components/pulse/HubMap";
import { StatCard } from "@/components/pulse/StatCard";
import { EventFeed } from "@/components/pulse/EventFeed";
import { AnalyticsCharts } from "@/components/pulse/AnalyticsCharts";
import { ShipmentPanel } from "@/components/pulse/ShipmentPanel";
import { ShipmentList } from "@/components/pulse/ShipmentList";
import { CreateShipment } from "@/components/pulse/CreateShipment";
import { TrackInput } from "@/components/pulse/TrackInput";

function DashboardInner() {
  const { analytics } = useSim();
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Network Command Center</h1>
            <p className="text-sm text-muted-foreground">Real-time intelligence across the PulseTrack delivery network.</p>
          </div>
          <div className="md:w-[500px]"><TrackInput /></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active" value={analytics.active} icon={Box} accent="primary" delay={0.0} />
          <StatCard label="Delivered" value={analytics.delivered} icon={Activity} accent="success" delay={0.05} />
          <StatCard label="Avg ETA" value={analytics.avgEta} suffix="min" icon={Clock} accent="accent" delay={0.1} />
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <StatCard
                    label="% delayed"
                    value={`${analytics.delayRate}%`}
                    icon={TrendingDown}
                    accent="warning"
                    delay={0.15}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                Share of all shipments in the network currently experiencing a delay (traffic, weather, hub overload, or customs).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <HubMap />
            <AnalyticsCharts />
          </div>
          <div className="space-y-4">
            <CreateShipment />
            <ShipmentPanel />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <ShipmentList />
          <EventFeed />
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <Gauge className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Network efficiency</div>
            <div className="text-2xl font-display">{analytics.efficiency}<span className="text-base text-muted-foreground">/100</span></div>
          </div>
          <div className="hidden md:block flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-primary" style={{ width: `${analytics.efficiency}%` }} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <SimProvider>
      <DashboardInner />
    </SimProvider>
  );
}
