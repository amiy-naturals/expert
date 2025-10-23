import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

export default function GoogleOneTapLogin() {
  const btnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return reject(new Error("no window"));
        if ((window as any).google?.accounts) return resolve();
        const existing = document.querySelector('script[data-google-client]');
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("google script failed")));
          return;
        }
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.setAttribute("data-google-client", clientId);
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Google Identity script"));
        document.head.appendChild(s);
      });
    }

    async function setup() {
      try {
        await loadScript();
        if (!mounted) return;
        const g = (window as any).google;
        if (!g?.accounts?.id) {
          console.warn("google.accounts.id not available after script load");
          return;
        }

        g.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          // Avoid auto-select to prevent Google replacing the button with a personalized account chip
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
        });

        if (btnRef.current) {
          // Use Google's render options to get a fuller, more consistent look with the site
          g.accounts.id.renderButton(btnRef.current, {
            theme: "filled_blue",
            size: "large",
            shape: "rectangular",
            text: "signin_with",
            logo_alignment: "left",
            width: "100%",
          });
        }

        try {
          // Do not call prompt() so Google doesn't show the One Tap/auto-select UI that creates the
          // personalized account chip — we only want the rendered button appearance here.
          // g.accounts.id.prompt();
        } catch {
          // ignore prompt errors
        }
      } catch (err) {
        console.error("Google One Tap setup failed:", err);
      }
    }

    setup();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleCredentialResponse(response: any) {
    try {
      const idToken = response?.credential;
      if (!idToken) {
        alert("Authentication failed: Missing credential");
        return;
      }
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
      if (error) throw error;
      // lib/supabase.ts will fetch /api/users/me and upsert user row if needed
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Google login error:", err);
      const msg = err?.message || "Authentication failed";
      alert(msg);
    }
  }

  return <div id="googleSignInDiv" ref={btnRef} />;
}
