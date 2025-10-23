import type { NextFunction, Request, Response } from "express";
import { createClient, type User } from "@supabase/supabase-js";
import { sendError } from '../lib/error';
import { getConfig } from "../lib/env";
import { getServerSupabase } from "../lib/supabase";

let authClient: ReturnType<typeof createClient> | null = null;
function getAuthClient() {
  if (authClient) return authClient;
  const config = getConfig();
  authClient = createClient(config.supabaseUrl, config.supabaseServiceKey);
  return authClient;
}

type UserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  referred_by?: string | null;
  points_balance?: number | null;
};

export interface AuthenticatedRequest extends Request {
  authUser: User;
  userRow: UserRow;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Try Authorization header, then cookies, then query param
    let token: string | null = null;
    const header = req.headers.authorization ?? "";
    if (header && header.startsWith("Bearer ")) token = header.substring("Bearer ".length);

    if (!token && typeof req.headers.cookie === 'string') {
      const match = req.headers.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('sb-access-token=') || s.startsWith('access_token='));
      if (match) token = decodeURIComponent(match.split('=')[1] || '');
    }

    if (!token && (req as any).query && (req as any).query.access_token) {
      token = String((req as any).query.access_token);
    }

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    const { data, error } = await getAuthClient().auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabase = getServerSupabase();
    let { data: userRow, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (userError) throw userError;

    if (!userRow) {
      // Ensure required columns (like username) are provided by falling back to sane defaults
      const fallbackUsername =
        data.user.user_metadata?.username ??
        (data.user.email ? String(data.user.email).split("@")[0] : `user_${String(data.user.id).slice(0, 8)}`);
      const insert = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name ?? null,
          username: fallbackUsername,
          role: "user",
        })
        .select()
        .maybeSingle();
      if (insert.error) throw insert.error;
      userRow = insert.data ?? undefined;
    }

    (req as AuthenticatedRequest).authUser = data.user;
    (req as AuthenticatedRequest).userRow = (userRow ?? {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name ?? null,
      role: "user",
    }) as UserRow;
    next();
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === 'object') {
      try {
        message = JSON.stringify(err);
      } catch {
        message = String(err);
      }
    } else {
      message = String(err);
    }
    return sendError(res, err, 500);
  }
}
