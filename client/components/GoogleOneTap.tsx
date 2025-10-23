import { useEffect, useRef } from "react";

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
        });

        // Render the button into the ref'd div if present
        if (btnRef.current) {
          g.accounts.id.renderButton(btnRef.current, { theme: "outline", size: "large" });
        }

        // Automatically show One Tap prompt (non-modal) if allowed
        try {
          g.accounts.id.prompt();
        } catch (e) {
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
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        // server returns { user, token }
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token || "");
        window.location.href = "/dashboard";
      } else {
        const error = await res.json().catch(() => ({}));
        console.warn("Google sign-in failed", error);
        // fallback: show an error toast if available
        alert(`Authentication failed: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Authentication failed");
    }
  }

  return <div id="googleSignInDiv" ref={btnRef} />;
}
