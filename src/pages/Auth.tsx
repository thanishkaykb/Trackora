import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Activity, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(72);

export default function AuthPage() {
  const nav = useNavigate();
  const { session, loading: authLoading, signingOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading || !session || signingOut) return;
    setRedirecting(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role === "seller") nav("/seller", { replace: true });
      else if (data?.role === "receiver") nav("/receiver", { replace: true });
      else nav("/onboarding", { replace: true });
    })();
  }, [authLoading, session, signingOut, nav]);

  const handleEmail = async (mode: "signin" | "signup") => {
    const e = emailSchema.safeParse(email);
    const p = passSchema.safeParse(password);
    if (!e.success) return toast.error("Invalid email");
    if (!p.success) return toast.error("Password must be 6–72 characters");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to verify your account before signing in.", { duration: 8000 });
          setPassword("");
          return;
        }
        setRedirecting(true);
        toast.success("Account created — welcome!");
        nav("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please verify your email first. Check your inbox for the verification link.", { duration: 8000 });
            return;
          }
          throw error;
        }
        setRedirecting(true);
        toast.success("Signed in");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setRedirecting(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/onboarding` });
    if (r.error) {
      setRedirecting(false);
      toast.error("Google sign-in failed");
    }
  };

  if (authLoading || signingOut || redirecting || session) {
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-accent opacity-20 blur-3xl pointer-events-none" />

      <div className="glass rounded-3xl p-8 w-full max-w-md relative animate-scale-in">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center glow-primary">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-semibold">Trackora</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Welcome back</div>
          </div>
        </Link>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {(["signin", "signup"] as const).map(mode => (
            <TabsContent key={mode} value={mode} className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => handleEmail(mode)}
                disabled={loading}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
        </div>

        <Button variant="outline" className="w-full glass-strong" onClick={handleGoogle}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2c4.4-4 7.3-10 7.3-16.4 0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing you agree to Trackora's terms.
        </p>
        <div className="text-center mt-3">
          <Link to="/start" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
}
