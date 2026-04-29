import { Link } from "react-router-dom";
import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const { user, signOut } = useAuth();
  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center glow-primary">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-semibold leading-none">PulseTrack <span className="text-gradient">AI</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Predictive Logistics</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth"><Button variant="secondary" size="sm">Sign in</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
