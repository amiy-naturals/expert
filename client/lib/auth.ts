export type User = {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'admin' | 'super_admin';
  avatar?: string; // base64 or URL
  avatar_approved?: boolean;
  clinic?: string;
  bio?: string;
  password?: string; // temp only
};

const KEY = "amiy_user";
const EVT = "amiy_auth_changed";

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function clearUser() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVT));
}

export async function isAuthedAsync() {
  try {
    const supabase = require("./supabase") as typeof import("./supabase");
    const token = await supabase.getAccessToken();
    if (token) return true;
  } catch {}
  return !!getUser();
}

export function isAuthed() {
  try {
    const supabase = require("./supabase") as typeof import("./supabase");
    // best-effort sync check: session may be in localStorage
    const raw = localStorage.getItem("amiy_supabase_session");
    if (raw) return true;
  } catch {}
  return !!getUser();
}

export function validateLogin(
  idOrEmail: string,
  password: string,
): User | null {
  const stored = getUser();
  // allow login against stored user
  if (
    stored &&
    (stored.email === idOrEmail || stored.id === idOrEmail) &&
    stored.password === password
  ) {
    return stored;
  }
  // Only allow login against stored user for now; integrate Supabase Auth for production
  return null;
}

export function useAuthUser(): User | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react") as typeof import("react");
    const [user, setUserState] = React.useState<User | null>(getUser());
    React.useEffect(() => {
      const onChange = () => setUserState(getUser());
      window.addEventListener(EVT, onChange as any);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(EVT, onChange as any);
        window.removeEventListener("storage", onChange);
      };
    }, []);
    return user;
  } catch {
    return getUser();
  }
}

export function updateUser(patch: Partial<User>) {
  const curr = getUser();
  if (!curr) return;
  setUser({ ...curr, ...patch });
}

export function referralCodeFor(user: User) {
  const base = user.email?.split("@")[0] || user.id;
  return `AM-${base.toUpperCase()}`;
}
