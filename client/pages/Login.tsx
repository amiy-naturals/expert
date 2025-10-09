import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth not configured");
      return;
    }
    try {
      const cv = (supabase.auth as any).getCodeVerifier?.();
      if (cv) localStorage.setItem("supabase-code-verifier", cv);
    } catch {}
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://amiy.netlify.app/auth/callback" },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with a magic link sent to your email.</p>
        {sent ? (
          <div className="mt-6 text-sm">Magic link sent. Check your email to finish sign-in.</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
            >
              Send magic link
            </button>
          </form>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          No account? <Link to="/join" className="underline">Start onboarding</Link>
        </p>
      </div>
    </div>
  );
}
