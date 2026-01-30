type WhatsAppSendOk = { ok: true; status: "ok"; sid?: string };
type WhatsAppSendSoftFail = { ok: true; status: "disabled" | "quota" | "unavailable"; message: string };
type WhatsAppSendHardFail = { ok: false; status: "error"; message: string };

export type WhatsAppSendResult = WhatsAppSendOk | WhatsAppSendSoftFail | WhatsAppSendHardFail;

function normalizePhoneE164(phone: string) {
  const p = phone.trim().replace(/\s+/g, "");
  return p;
}

function ensureWhatsAppTo(phoneE164: string) {
  // Twilio requires "whatsapp:+E164"
  return phoneE164.startsWith("whatsapp:") ? phoneE164 : `whatsapp:${phoneE164}`;
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
  const body = new URLSearchParams({
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
      body,
    });

    // Quota / throttling
    if (res.status === 429) {
      return { ok: true, status: "quota", message: "WhatsApp provider rate limit reached." };
    }

    const json: any = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (json && (json.message || json.error_message)) ||
        `Twilio error (${res.status})`;

      // Common “can’t send / not opted-in / trial restrictions” → treat as unavailable (soft-fail)
      return { ok: true, status: "unavailable", message: msg };
    }

    return { ok: true, status: "ok", sid: typeof json?.sid === "string" ? json.sid : undefined };
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "WhatsApp send failed.";
    return { ok: false, status: "error", message: msg };
  }
}
