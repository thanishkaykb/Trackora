import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

export type UserRole = "seller" | "receiver";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  roleLoading: boolean;
  signingOut: boolean;
  refreshRole: () => Promise<void>;
  setRole: (role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let initialized = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (initialized) setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      initialized = true;
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshRole = async () => {
    if (!session?.user) { setRoleState(null); setRoleLoading(false); return; }
    setRoleLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    setRoleState((data?.role as UserRole) ?? null);
    setRoleLoading(false);
  };

  useEffect(() => { refreshRole(); /* eslint-disable-next-line */ }, [session?.user?.id]);

  const setRole = async (r: UserRole) => {
    if (!session?.user) return { error: new Error("Not signed in") };
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, role: r, email: session.user.email ?? null }, { onConflict: "id" });
    if (!error) setRoleState(r);
    return { error: error as Error | null };
  };

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    role,
    roleLoading,
    signingOut,
    refreshRole,
    setRole,
    signOut: async () => {
      setSigningOut(true);
      setRoleState(null);
      await supabase.auth.signOut();
      nav("/start", { replace: true });
      setSigningOut(false);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
