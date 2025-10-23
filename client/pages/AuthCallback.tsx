import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const url = window.location.href;
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const token = params.get("token");
        const type = params.get("type");

        let session: any = null;

        if (code) {
          const verifier = localStorage.getItem("supabase-code-verifier");
          if (verifier) (supabase.auth as any).setCodeVerifier?.(verifier);
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
          session = data.session;
        } else if (token && type === "magiclink") {
          const email = params.get("email");
          if (!email) {
            throw new Error("Email is required for magic link verification");
          }
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "magiclink",
          });
          if (error) throw error;
          session = data.session;
        }

        if (session) {
          localStorage.setItem("sb-access-token", session.access_token);
          console.log("✅ Login successful:", session.user.email);
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          try {
            const { ExpertAPI } = await import("@/lib/api");
            const me = await ExpertAPI.me();
            navigate(me.onboarded ? "/dashboard" : "/expert", { replace: true });
          } catch {
            navigate("/expert", { replace: true });
          }
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login");
      }
    })();
  }, [navigate]);

  return <p className="p-6 text-sm">Verifying session...</p>;
}
