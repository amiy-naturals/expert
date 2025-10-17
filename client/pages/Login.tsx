import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import GoogleOneTapLogin from "@/components/GoogleOneTap";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth not configured");
      return;
    }
    setLoading(true);
    try {
      const cv = (supabase.auth as any).getCodeVerifier?.();
      if (cv) localStorage.setItem("supabase-code-verifier", cv);
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) setError(error.message);
      else setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose your preferred sign-in method.</p>

        {sent ? (
          <div className="mt-6 text-sm">Magic link sent. Check your email to finish sign-in.</div>
        ) : (
          <div className="mt-6 space-y-6">
            <div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">SIGN IN WITH GOOGLE</p>
                <p className="text-xs text-muted-foreground mb-4">Recommended for verified doctors. No passwords, no forms — instant secure verification.</p>
                <GoogleOneTapLogin />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                Send magic link
              </Button>
            </form>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground text-center space-x-2">
          <Link to="/privacy-policy" className="underline">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms-and-conditions" className="underline">Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
}
