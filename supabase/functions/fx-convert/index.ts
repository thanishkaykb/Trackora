import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Simple FX conversion proxy. Uses the free Frankfurter API (ECB rates, no key required)
// with an in-memory cache keyed by `${from}->${to}` for 6 hours.
// Body: { from: "USD", to: "EUR", amount: 100 }
// Response: { rate: 0.91, converted: 91, asOf: "2025-01-01" }

type CacheEntry = { rate: number; asOf: string; cachedAt: number };
const cache = new Map<string, CacheEntry>();
const TTL = 6 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const from = String(body.from ?? "").toUpperCase();
    const to = String(body.to ?? "").toUpperCase();
    const amount = Number(body.amount ?? 0);
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      return json({ error: "Invalid currency codes" }, 400);
    }
    if (from === to) {
      return json({ rate: 1, converted: amount, asOf: new Date().toISOString().slice(0, 10) });
    }
    const key = `${from}->${to}`;
    const now = Date.now();
    let entry = cache.get(key);
    if (!entry || now - entry.cachedAt > TTL) {
      const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`;
      const r = await fetch(url);
      if (!r.ok) {
        // try fallback symmetric (some currencies aren't supported as base)
        const r2 = await fetch(`https://api.frankfurter.dev/v1/latest?base=${to}&symbols=${from}`);
        if (!r2.ok) return json({ error: `FX provider error ${r.status}` }, 502);
        const j2 = await r2.json();
        const inv = j2.rates?.[from];
        if (!inv) return json({ error: "Currency not supported" }, 400);
        entry = { rate: 1 / inv, asOf: j2.date, cachedAt: now };
      } else {
        const j = await r.json();
        const rate = j.rates?.[to];
        if (!rate) return json({ error: "Currency not supported" }, 400);
        entry = { rate, asOf: j.date, cachedAt: now };
      }
      cache.set(key, entry);
    }
    return json({ rate: entry.rate, converted: amount * entry.rate, asOf: entry.asOf });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}