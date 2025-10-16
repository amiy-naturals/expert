import { useEffect } from "react";

export default function GoogleOneTapLogin() {
  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    window.google?.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      { theme: "outline", size: "large" }
    );
  }, []);

  async function handleCredentialResponse(response: any) {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/dashboard";
      } else {
        const error = await res.json();
        alert(`Authentication failed: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Authentication failed");
    }
  }

  return <div id="googleSignInDiv" />;
}
