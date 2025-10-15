export function normalizeEmail(email?: string | null) {
  const e = (email || "").trim();
  return e ? e.toLowerCase() : null;
}

export function normalizePhoneE164(input?: string | null) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  // Heuristics (India-first): 10 digits => +91, 11 starting with 0 => drop 0 then +91
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}
