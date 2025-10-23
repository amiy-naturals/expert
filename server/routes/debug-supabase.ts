import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "../lib/supabase";

const router = Router();

// Publicly accessible only on server side; call from an admin-only UI or curl internally
router.get("/status", async (_req, res) => {
  try {
    const supabase = getServerSupabase();

    // Try simple selects to verify access
    let referralsOk = true;
    let usersOk = true;
    let ordersOk = true;
    try {
      await supabase.from("referrals").select("referrer_id").limit(1);
    } catch {
      referralsOk = false;
    }
    try {
      await supabase.from("users").select("id").limit(1);
    } catch {
      usersOk = false;
    }
    try {
      await supabase.from("order_attributions").select("shopify_order_id").limit(1);
    } catch {
      ordersOk = false;
    }

    res.json({ ok: true, checks: { referrals: referralsOk, users: usersOk, order_attributions: ordersOk } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("debug-supabase error", err);
    res.status(500).json({ error: String((err as any)?.message ?? err) });
  }
});

// Master diagnostic: runs a comprehensive read-only suite against all relevant tables and returns granular results
router.get("/master", async (_req, res) => {
  function pickError(err: any) {
    if (!err) return null;
    const anyErr = err as any;
    return {
      code: anyErr.code ?? null,
      message: anyErr.message ?? String(anyErr),
      details: anyErr.details ?? null,
      hint: anyErr.hint ?? null,
    };
  }

  async function runCheck<T>(label: string, exec: () => Promise<{ data: T | null; error: any }>) {
    try {
      const { data, error } = await exec();
      if (error) return { label, ok: false as const, error: pickError(error) };
      return { label, ok: true as const, rows: Array.isArray(data) ? data.length : data ? 1 : 0 };
    } catch (e: any) {
      return { label, ok: false as const, error: pickError(e) };
    }
  }

  try {
    const service = getServerSupabase();

    const anonUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const anon = anonUrl && anonKey ? createClient(anonUrl, anonKey) : null;

    // Define all read-only checks used in the app
    const serviceChecks = await Promise.all([
      runCheck("users", () => service.from("users").select("id").limit(1)),
      runCheck("referrals", () => service.from("referrals").select("referrer_id").limit(1)),
      runCheck("orders", () => service.from("orders").select("id").limit(1)),
      runCheck("order_attributions", () => service.from("order_attributions").select("shopify_order_id").limit(1)),
      runCheck("points_transactions", () => service.from("points_transactions").select("id").limit(1)),
      runCheck("expert_onboardings", () => service.from("expert_onboardings").select("id").limit(1)),
      runCheck("subscriptions", () => service.from("subscriptions").select("id").limit(1)),
      runCheck("reviews", () => service.from("reviews").select("id").limit(1)),
      runCheck("settings (maybeSingle)", () => service.from("settings").select("id").eq("id", "global").maybeSingle()),
      runCheck("external_customers", () => service.from("external_customers").select("id").limit(1)),
      runCheck("leaderboard_snapshots + users join", () =>
        service
          .from("leaderboard_snapshots")
          .select("user_id, users!leaderboard_snapshots_user_id_fkey(id)")
          .limit(1)
      ),
      runCheck("referrals -> users join", () =>
        service
          .from("referrals")
          .select("referred:users!referrals_referred_id_fkey(id)")
          .limit(1)
      ),
    ]);

    const anonChecks = anon
      ? await Promise.all([
          runCheck("users (anon)", () => anon.from("users").select("id").limit(1)),
          runCheck("referrals (anon)", () => anon.from("referrals").select("referrer_id").limit(1)),
          runCheck("orders (anon)", () => anon.from("orders").select("id").limit(1)),
          runCheck("order_attributions (anon)", () => anon.from("order_attributions").select("shopify_order_id").limit(1)),
          runCheck("points_transactions (anon)", () => anon.from("points_transactions").select("id").limit(1)),
          runCheck("reviews (anon)", () => anon.from("reviews").select("id").limit(1)),
        ])
      : [];

    const summarize = (list: any[]) => ({
      ok: list.every((c) => c.ok),
      passed: list.filter((c) => c.ok).map((c) => c.label),
      failed: list.filter((c) => !c.ok).map((c) => ({ label: c.label, error: c.error })),
    });

    const serviceSummary = summarize(serviceChecks);
    const anonSummary = summarize(anonChecks);

    const notes: string[] = [];
    if (anon && anonChecks.some((c) => !c.ok)) {
      notes.push(
        "Anon client failures usually indicate RLS policies blocking reads. Ensure row-level security policies are defined for the listed tables or query through server endpoints."
      );
    }

    const payload = {
      ok: serviceSummary.ok && (anon ? anonSummary.ok : true),
      timestamp: new Date().toISOString(),
      supabase_url: anonUrl ?? null,
      service_role: { summary: serviceSummary, checks: serviceChecks },
      anon_client: anon ? { summary: anonSummary, checks: anonChecks } : null,
      notes,
    };

    res.json(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("debug-supabase master error", err);
    res.status(500).json({ error: String((err as any)?.message ?? err) });
  }
});

export default router;
