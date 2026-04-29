import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, suffix, icon: Icon, accent, delay = 0,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "success" | "warning";
  delay?: number;
}) {
  const accentColor = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
  }[accent ?? "primary"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-5 relative overflow-hidden group"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-primary opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-display font-semibold text-foreground tabular-nums">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
        </div>
        <div className={cn("p-2 rounded-xl glass-strong", accentColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
