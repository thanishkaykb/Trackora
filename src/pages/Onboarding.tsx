import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { user, loading, role, roleLoading, setRole } = useAuth();
  const nav = useNavigate();
  const [choice, setChoice] = useState<"seller" | "receiver" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth", { replace: true });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!roleLoading && role) {
      nav(role === "seller" ? "/seller" : "/receiver", { replace: true });
    }
  }, [role, roleLoading, nav]);

  const submit = async () => {
    if (!choice) return;
    setSaving(true);
    const { error } = await setRole(choice);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Welcome, ${choice}!`);
    nav(choice === "seller" ? "/seller" : "/receiver", { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-accent opacity-20 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 w-full max-w-2xl relative">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 1</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2">How will you use Trackora?</h1>
          <p className="text-sm text-muted-foreground mt-2">You can't change this later from the UI, so pick the role that matches you best.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <RoleCard
            icon={Package}
            title="I'm a seller"
            desc="Dispatch shipments, manage hubs, see analytics, ETAs and delays for every order I send."
            selected={choice === "seller"}
            onClick={() => setChoice("seller")}
          />
          <RoleCard
            icon={Truck}
            title="I'm a receiver"
            desc="Track packages I'm expecting using a tracking ID, see live map and status updates."
            selected={choice === "receiver"}
            onClick={() => setChoice("receiver")}
          />
        </div>

        <Button
          className="w-full mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
          disabled={!choice || saving}
          onClick={submit}
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

function RoleCard({
  icon: Icon, title, desc, selected, onClick,
}: { icon: any; title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left glass-strong rounded-2xl p-5 border-2 transition-all",
        selected ? "border-primary glow-primary" : "border-transparent hover:border-primary/30"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center mb-3">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="font-display text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}