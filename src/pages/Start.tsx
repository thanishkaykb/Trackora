import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck, ArrowRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Start() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-accent opacity-20 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-2xl relative"
      >
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center glow-primary">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-center">
            <div className="font-display font-semibold">Trackora</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Get started</div>
          </div>
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold">How will you use Trackora?</h1>
          <p className="text-sm text-muted-foreground mt-2">Pick what describes you best.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <RoleCard
            icon={Package}
            title="I'm a seller"
            desc="Dispatch shipments, manage hubs, see analytics, ETAs and delays for every order."
            cta="Sign in / Sign up"
            onClick={() => nav("/auth")}
          />
          <RoleCard
            icon={Truck}
            title="I'm a receiver"
            desc="Track a package using the tracking ID your seller shared. No account needed."
            cta="Track a package"
            onClick={() => nav("/track")}
          />
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </div>
      </motion.div>
    </div>
  );
}

function RoleCard({
  icon: Icon, title, desc, cta, onClick,
}: { icon: any; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left glass-strong rounded-2xl p-5 border-2 border-transparent",
        "hover:border-primary/50 hover:glow-primary transition-all"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center mb-3">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="font-display text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-medium">
        {cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
