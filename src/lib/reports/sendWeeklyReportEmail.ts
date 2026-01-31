import { renderWeeklyReportEmail } from "@/lib/reports/renderWeeklyReportEmail";

type SendResult =
  | { ok: true; status: "sent"; id?: string }
  | { ok: true; status: "unavailable" | "quota" | "error"; message?: string };

type RenderArgs = Parameters<typeof renderWeeklyReportEmail>[0];
type ReportForEmail = RenderArgs["report"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (isRecord(e) && typeof e.message === "string") return e.message;
  return "Email failed.";
}

export async function sendWeeklyReportEmail(params: { to: string; report: ReportForEmail }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return { ok: true, status: "unavailable", message: "Email provider not configured." };
  }

  const { subject, html, text } = renderWeeklyReportEmail({
    brand: "CloudBudgetGuard",
    report: params.report,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject,
        html,
        text,
      }),
    });

    if (res.status === 429) {
      return { ok: true, status: "quota", message: "Email quota reached." };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: true, status: "error", message: body || `Email failed (${res.status})` };
    }

    const json: unknown = await res.json().catch(() => null);

    const id =
      isRecord(json) && typeof json.id === "string"
        ? json.id
        : undefined;

    return { ok: true, status: "sent", id };
  } catch (e: unknown) {
    return { ok: true, status: "error", message: getErrorMessage(e) };
  }
}
