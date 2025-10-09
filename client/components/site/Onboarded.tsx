import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { ExpertAPI } from "@/lib/api";

export default function OnboardedOutlet() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const loc = useLocation();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session ?? null;
      setSession(s);
      if (s) {
        try {
          const me = await ExpertAPI.me();
          setOnboarded(!!me.onboarded);
        } catch {
          setOnboarded(false);
        }
      }
      setLoading(false);

      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
    };
    init();
  }, []);

  if (loading) return <div className="p-6">Checking access...</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!onboarded) return <Navigate to="/expert" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
