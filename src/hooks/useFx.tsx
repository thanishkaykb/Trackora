import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Convert `amount` from `from` currency to `to` currency via the fx-convert edge function.
 * Returns null while loading or on error. */
export function useFxConvert(amount: number, from: string, to: string) {
  const [data, setData] = useState<{ rate: number; converted: number; asOf: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;
    if (from === to) {
      setData({ rate: 1, converted: amount, asOf: new Date().toISOString().slice(0, 10) });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke("fx-convert", { body: { from, to, amount } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || (data as any).error) {
          setError((data as any)?.error ?? error?.message ?? "FX error");
          setData(null);
        } else {
          setData(data as any);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [amount, from, to]);

  return { data, loading, error };
}