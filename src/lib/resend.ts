import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("Missing RESEND_API_KEY. Add it to .env.local");
}

export const resend = new Resend(apiKey);

export function getResendFrom() {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("Missing RESEND_FROM. Add it to .env.local");
  }
  return from;
}

export async function sendOtpEmail(params: { to: string; code: string; expiresMinutes: number }) {
  const { to, code, expiresMinutes } = params;

  const subject = `Your CloudBudgetGuard code: ${code}`;
  const text = `Your CloudBudgetGuard verification code is ${code}. It expires in ${expiresMinutes} minutes.`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; background:#000; color:#fff; padding:24px;">
    <div style="max-width:520px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:22px;background:rgba(255,255,255,0.04);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);display:grid;place-items:center;background:rgba(255,255,255,0.05);font-weight:800;">cb</div>
        <div style="font-weight:700;letter-spacing:-0.01em;">CloudBudgetGuard</div>
      </div>

      <div style="font-size:14px;color:rgba(255,255,255,0.78);margin-bottom:10px;">
        Use the code below to continue signing in.
      </div>

      <div style="font-size:34px;letter-spacing:0.20em;font-weight:800;padding:14px 16px;border-radius:14px;
                  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);display:inline-block;">
        ${code}
      </div>

      <div style="margin-top:14px;font-size:12px;color:rgba(255,255,255,0.65);">
        This code expires in ${expiresMinutes} minutes. If you didn’t request this, ignore this email.
      </div>
    </div>
  </div>
  `;

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
}
