import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { DoctorsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatPhone(p: string) {
  const digits = String(p).replace(/\D+/g, "");
  if (digits.startsWith("91")) return `+${digits}`;
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export default function JoinExpress() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [loading, setLoading] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [bonus, setBonus] = useState<number | null>(null);

  useEffect(() => {
    if (!token) toast.error("Missing invite token");
  }, [token]);

  const supabase = useMemo(() => getSupabase(), []);

  async function sendOtp() {
    try {
      setLoading(true);
      const f = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: f });
      if (error) throw error;
      toast.success("OTP sent to your phone");
      setStep("otp");
    } catch (err: any) {
      toast.error(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndAccept() {
    try {
      setLoading(true);
      const f = formatPhone(phone);
      const ver = await supabase.auth.verifyOtp({ type: "sms", phone: f, token: otp });
      if (ver.error) throw ver.error;
      const res = await DoctorsAPI.acceptInvite({ token });
      setReferralLink(res.referralLink);
      setBonus(res.bonus);
      setStep("success");
    } catch (err: any) {
      toast.error(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function share() {
    if ((navigator as any).share && referralLink) {
      (navigator as any).share({ title: "My Amiy referral", text: "Join via my link", url: referralLink }).catch(() => {});
    } else if (referralLink) {
      window.open(`https://wa.me/?text=${encodeURIComponent(referralLink)}`);
    }
  }

  return (
    <div className="container mx-auto py-12">
      {!token && (
        <div className="rounded-xl border bg-amber-50 p-4 text-amber-900">Invalid or missing invite token.</div>
      )}
      {token && step !== "success" && (
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-bold">Join Express</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your phone number to receive a one-time password (OTP).</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold">Phone</label>
              <input
                type="tel"
                className="mt-1 w-full rounded border bg-white p-2"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={step !== "phone"}
              />
            </div>
            {step === "phone" && (
              <Button className="w-full" onClick={sendOtp} disabled={loading || !phone}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            )}
            {step === "otp" && (
              <>
                <div>
                  <label className="text-xs font-semibold">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full rounded border bg-white p-2 tracking-widest"
                    placeholder="Enter the 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={verifyAndAccept} disabled={loading || otp.length < 4}>
                  {loading ? "Verifying..." : "Verify & Join"}
                </Button>
                <button className="mt-2 text-xs text-muted-foreground underline" onClick={sendOtp} disabled={loading}>Resend OTP</button>
              </>
            )}
          </div>
        </div>
      )}

      {token && step === "success" && (
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">You're in!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Share your link now. Earnings accrue as pending until KYC.</p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-muted-foreground">Your referral link</div>
              <div className="mt-2 break-all text-sm">{referralLink}</div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => copy(referralLink)}>Copy</Button>
                <Button variant="secondary" onClick={share}>Share</Button>
              </div>
            </div>
            <div className="rounded-xl border p-4 flex items-center justify-center">
              {referralLink && (
                <img
                  alt="Referral QR"
                  width={180}
                  height={180}
                  className="rounded bg-white p-2"
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(referralLink)}&size=180x180`}
                />
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-muted p-4">
            <div className="text-sm font-semibold">Starter bonus</div>
            <div className="text-sm text-muted-foreground">₹{Math.round(((bonus ?? 0) / 5)) * 5} locked — finish KYC to unlock.</div>
          </div>

          <div className="mt-6 rounded-xl border p-4">
            <div className="font-semibold">Complete your setup</div>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Upload license</span><span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-900">+250 pts (locked)</span></li>
              <li className="flex items-center justify-between"><span>Upload avatar</span><span className="rounded bg-gray-100 px-2 py-0.5 text-gray-900">+100 pts</span></li>
              <li className="flex items-center justify-between"><span>Add UPI for payouts</span><span className="rounded bg-gray-100 px-2 py-0.5 text-gray-900">Required</span></li>
              <li className="flex items-center justify-between"><span>Clinic details</span><span className="rounded bg-gray-100 px-2 py-0.5 text-gray-900">Boost profile</span></li>
            </ol>
            <div className="mt-3 text-right">
              <a href="/dashboard/profile" className="text-sm font-semibold underline">Go to Profile</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
