import { Router } from "express";
import { getServerSupabase } from "../lib/supabase";
import { normalizeEmail, normalizePhoneE164 } from "../lib/contacts";
import { resolveDoctorByReferralCode } from "../lib/attribution";
import { sendError } from '../lib/error';

const router = Router();

router.post("/", async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { referral_code, email, phone } = (body || {}) as any;
    if (!referral_code) return res.status(400).json({ error: "referral_code required" });
    if (!email && !phone) return res.status(400).json({ error: "email or phone required" });
    if (email && phone) return res.status(400).json({ error: "provide exactly one of email or phone" });

    const supabase = getServerSupabase();
    const email_norm = normalizeEmail(email);
    const phone_e164 = normalizePhoneE164(phone);

    const doctorId = await resolveDoctorByReferralCode(String(referral_code));
    if (!doctorId) return res.status(400).json({ error: "invalid referral_code" });

    // Upsert external customer by normalized contact
    let match: any = null;
    if (email_norm) {
      const { data } = await supabase.from("external_customers").select("*").eq("email_norm", email_norm).maybeSingle();
      match = data ?? null;
    } else if (phone_e164) {
      const { data } = await supabase.from("external_customers").select("*").eq("phone_e164", phone_e164).maybeSingle();
      match = data ?? null;
    }

    const payload: any = {
      email: email || null,
      phone: phone || null,
      phone_e164,
      referred_by_doctor_id: doctorId,
      source: "link",
      joined_at: new Date().toISOString(),
    };

    if (match && match.id) {
      await supabase.from("external_customers").update(payload).eq("id", match.id);
    } else {
      await supabase.from("external_customers").insert(payload);
    }

    res.json({ ok: true, redirect: "/" });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
