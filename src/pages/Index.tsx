import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Brain, Leaf, Route, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/pulse/Topbar";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Brain, title: "Predictive delay engine", desc: "Anticipates traffic, weather, and hub overload before it impacts ETA." },
  { icon: Route, title: "Auto-rerouting", desc: "Reroutes shipments through faster corridors the moment risk is detected." },
  { icon: Sparkles, title: "Explainability", desc: "Every decision comes with a human-readable cause and impact." },
  { icon: Zap, title: "Priority mode", desc: "Lower delay probability and faster handling for critical packages." },
  { icon: Leaf, title: "Eco mode", desc: "Greener routes that prefer lighter hubs at minimal time cost." },
  { icon: Shield, title: "Resilient by design", desc: "Simulation-tested logistics intelligence — before real-world deployment." },
];

export default function Index() {
  const { user, role } = useAuth();
  const dashHref = !user ? "/start" : (role === "seller" ? "/seller" : role === "receiver" ? "/receiver" : "/onboarding");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-accent opacity-20 blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live simulation engine · v1.0
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
              No guesswork.<br />
              Just <span className="text-gradient">movement</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with live tracking, streamline dispatch, and ensure every order
              reaches exactly where it should.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={dashHref}>
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary group">
                  Get started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="ghost">Track a package</Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 glass rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Active shipments", value: "247", trend: "+12" },
                { label: "Avg ETA", value: "184m", trend: "-8m" },
                { label: "Network efficiency", value: "94%", trend: "+3%" },
              ].map((s, i) => (
                <div key={i} className="glass-strong rounded-2xl p-5">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-display font-semibold">{s.value}</span>
                    <span className="text-success text-sm">{s.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-semibold">A full intelligence stack</h2>
          <p className="mt-3 text-muted-foreground">Six capabilities working together — out of the box.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 group hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center mb-4 glow-primary">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1000px] mx-auto px-6 pb-24">
        <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-10" />
          <div className="relative">
            <Activity className="w-10 h-10 mx-auto text-primary mb-4 animate-pulse-glow" />
            <h3 className="font-display text-3xl md:text-4xl font-semibold">See it think in real time</h3>
            <p className="mt-3 text-muted-foreground">Open the live dashboard and watch the simulation predict, reroute, and explain.</p>
            <Link to={dashHref} className="inline-block mt-6">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
                Launch dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="max-w-[1200px] mx-auto px-6 pb-10 text-center text-xs text-muted-foreground">
        © Trackora · Predictive logistics intelligence
      </footer>
    </div>
  );
}
