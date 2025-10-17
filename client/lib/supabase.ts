import { createClient } from "@supabase/supabase-js";
import { setUser, clearUser } from "@/lib/auth";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      storage: window.localStorage,
    },
    global: {
      headers: { "x-client-info": "amiy-frontend" },
    },
  }
);

// Keep local UX user in sync with Supabase session (including server role/details)
(async () => {
  try {
    const applySession = async (session: any) => {
      try {
        const base = {
          id: session.user?.id,
          email: session.user?.email ?? undefined,
          name: session.user?.user_metadata?.full_name ?? session.user?.user_metadata?.fullName ?? undefined,
        } as any;
        // Set basic user immediately for responsive UI
        setUser(base);
        const access = session.access_token;
        if (access) {
          try {
            const res = await fetch("/api/users/me", {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access}`,
              },
              credentials: "same-origin",
            });
            if (res.ok) {
              const me = await res.json();
              if (me) {
                setUser({
                  id: base.id,
                  email: me.email ?? base.email,
                  name: me.name ?? base.name,
                  role: me.role ?? (base as any).role,
                  avatar: me.avatar ?? me.photo_url ?? (base as any).avatar,
                  avatar_approved: me.avatar_approved ?? (base as any).avatar_approved,
                  clinic: me.clinic ?? (base as any).clinic,
                  bio: me.bio ?? (base as any).bio,
                } as any);
              }
            }
          } catch {}
        }
      } catch {}
    };

    (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      try {
        if (session?.access_token && session.user) {
          await applySession(session);
        } else if (event === "SIGNED_OUT" || !session) {
          clearUser();
        }
      } catch {}
    });

    // On initial load, apply existing session (if any)
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        await applySession(data.session);
      }
    } catch {}
  } catch {}
})();

export const getSupabase = () => supabase;
export default supabase;

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {}
}
