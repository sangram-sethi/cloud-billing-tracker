type WhatsAppSendOk = { ok: true; status: "ok"; sid?: string };
type WhatsAppSendSoftFail = { ok: true; status: "disabled" | "quota" | "unavailable"; message: string };
type WhatsAppSendHardFail = { ok: false; status: "error"; message: string };

export type WhatsAppSendResult = WhatsAppSendOk | WhatsAppSendSoftFail | WhatsAppSendHardFail;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizePhoneE164(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function ensureWhatsAppTo(phoneE164: string): string {
  // Twilio requires "whatsapp:+E164"
  return phoneE164.startsWith("whatsapp:") ? phoneE164 : `whatsapp:${phoneE164}`;
}

function getTwilioErrorMessage(json: unknown, status: number): string {
  if (isRecord(json)) {
    const message = json.message;
    const errorMessage = json.error_message;
    if (typeof message === "string" && message.trim()) return message;
    if (typeof errorMessage === "string" && errorMessage.trim()) return errorMessage;
  }
  return `Twilio error (${status})`;
}

function getSid(json: unknown): string | undefined {
  if (!isRecord(json)) return undefined;
  const sid = json.sid;
  return typeof sid === "string" ? sid : undefined;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (isRecord(e) && typeof e.message === "string") return e.message;
  return "WhatsApp send failed.";
}

export async function sendWhatsAppMessage(params: { toE164: string; body: string }): Promise<WhatsAppSendResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || "disabled").toLowerCase();

  if (provider !== "twilio") {
    return { ok: true, status: "disabled", message: "WhatsApp provider not configured." };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !from) {
    return { ok: true, status: "disabled", message: "Twilio WhatsApp env vars missing." };
  }

  const to = ensureWhatsAppTo(normalizePhoneE164(params.toE164));

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const form = new URLSearchParams({
    From: from,
    To: to,
    Body: params.body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form,
    });

    // Quota / throttling
    if (res.status === 429) {
      return { ok: true, status: "quota", message: "WhatsApp provider rate limit reached." };
    }

    const json: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = getTwilioErrorMessage(json, res.status);
      // Common “can’t send / not opted-in / trial restrictions” → treat as unavailable (soft-fail)
      return { ok: true, status: "unavailable", message: msg };
    }

    return { ok: true, status: "ok", sid: getSid(json) };
  } catch (e: unknown) {
    return { ok: false, status: "error", message: getErrorMessage(e) };
  }
}
