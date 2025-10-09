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

// Keep local UX user in sync with Supabase session
(async () => {
  try {
    (supabase.auth as any).onAuthStateChange((event: string, session: any) => {
      try {
        if (session?.access_token && session.user) {
          setUser({ id: session.user.id, email: session.user.email ?? undefined, name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.fullName ?? undefined } as any);
        } else if (event === 'SIGNED_OUT' || !session) {
          clearUser();
        }
      } catch {}
    });
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
