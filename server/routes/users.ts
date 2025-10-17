import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { getServerSupabase } from "../lib/supabase";
import { sendError } from "../lib/error";

const router = Router();

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, photo_url, avatar_approved, clinic, bio, role, license_number, license_url")
      .eq("id", req.authUser.id)
      .maybeSingle();
    if (error) throw error;
    res.json(data ?? null);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

router.put("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Support raw buffer or string bodies
    let body: any = req.body;
    try {
      if (Buffer.isBuffer(body)) body = JSON.parse(body.toString("utf8"));
      else if (typeof body === "string") body = JSON.parse(body);
    } catch {}

    const patch: Record<string, any> = {};
    const allowed = ["name", "email", "clinic", "bio", "photo_url"]; // whitelist
    for (const k of allowed) if (body?.[k] !== undefined) patch[k] = body[k];
    if (Object.keys(patch).length === 0) return res.json({ updated: 0 });

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", req.authUser.id)
      .select("id, email, name, photo_url, avatar_approved, clinic, bio, role")
      .maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
