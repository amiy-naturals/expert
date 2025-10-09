import { useState } from "react";
import { setUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const cv = (supabase.auth as any).getCodeVerifier?.();
        if (cv) localStorage.setItem("supabase-code-verifier", cv);
      } catch {}
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { data: { full_name: name }, emailRedirectTo: "https://amiy.netlify.app/auth/callback" },
      });
      if (error) {
        alert(error.message);
        return;
      }
      setSent(true);
      return;
    }
    setUser({ id: `D${Date.now()}`, name, email } as any);
  }

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Register as an Amiy Expert.</p>
        {sent ? (
          <div className="mt-6 text-sm">Magic link sent. Check your email to finish sign-in.</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
