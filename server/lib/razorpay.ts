import crypto from "node:crypto";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getConfig } from "./env";

let instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (instance) return instance;
  const config = getConfig();
  instance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
  return instance;
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const config = getConfig();
  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(payload: string, signature: string) {
  const config = getConfig();
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}
