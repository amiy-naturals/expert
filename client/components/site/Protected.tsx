import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function ProtectedOutlet() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const loc = useLocation();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);

      // Listen for later sign-in/out events
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
    };
    init();
  }, []);

  if (loading) return <div className="p-6">Checking authentication...</div>;

  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <Outlet />;
}
