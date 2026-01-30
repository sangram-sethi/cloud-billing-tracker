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

function getBaseUrl() {
  const base = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL;
  if (base) return base.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function fmtPct(p: number | null) {
  if (p == null) return "—";
  if (!Number.isFinite(p)) return "∞";
  const sign = p > 0 ? "+" : "";
  return `${sign}${Math.round(p * 100)}%`;
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

export async function sendAnomalyAlertEmail(params: {
  to: string;
  date: string;
  service: string; // "__TOTAL__" or service name
  severity: "info" | "warning" | "critical";
  observed: number;
  baseline: number;
  pctChange: number;
  zScore: number | null;
  message: string;
  currency: string;
}) {
  const baseUrl = getBaseUrl();
  const link = `${baseUrl}/app/anomalies`;

  const svcLabel = params.service === "__TOTAL__" ? "Total spend" : params.service;
  const sevLabel = params.severity === "critical" ? "CRITICAL" : params.severity === "warning" ? "WARNING" : "INFO";

  const subject = `[CloudBudgetGuard] ${sevLabel}: Cost spike on ${params.date} — ${svcLabel}`;

  const text = [
    `CloudBudgetGuard anomaly detected`,
    `Date: ${params.date}`,
    `Scope: ${svcLabel}`,
    `Severity: ${sevLabel}`,
    `Observed: ${fmtMoney(params.observed, params.currency)}`,
    `Baseline (7d): ${fmtMoney(params.baseline, params.currency)}`,
    `Jump: ${fmtPct(params.pctChange)}`,
    params.zScore != null ? `z-score: ${params.zScore.toFixed(2)}` : null,
    ``,
    params.message,
    ``,
    `Open dashboard: ${link}`,
  ]
    .filter(Boolean)
    .join("\n");

  const pillBg =
    params.severity === "critical"
      ? "rgba(255, 77, 109, 0.16)"
      : params.severity === "warning"
        ? "rgba(255, 200, 87, 0.14)"
        : "rgba(255, 255, 255, 0.10)";

  const pillBorder =
    params.severity === "critical"
      ? "rgba(255, 77, 109, 0.30)"
      : params.severity === "warning"
        ? "rgba(255, 200, 87, 0.28)"
        : "rgba(255, 255, 255, 0.18)";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; background:#000; color:#fff; padding:24px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;background:rgba(255,255,255,0.04);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);display:grid;place-items:center;background:rgba(255,255,255,0.05);font-weight:800;">cb</div>
        <div style="font-weight:700;letter-spacing:-0.01em;">CloudBudgetGuard</div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:13px;color:rgba(255,255,255,0.65);">Anomaly detected</div>
          <div style="font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-top:4px;">${svcLabel}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:6px;">${params.date}</div>
        </div>

        <div style="padding:8px 12px;border-radius:999px;border:1px solid ${pillBorder};background:${pillBg};font-weight:800;font-size:12px;letter-spacing:0.08em;">
          ${sevLabel}
        </div>
      </div>

      <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:12px;background:rgba(0,0,0,0.25);">
          <div style="font-size:12px;color:rgba(255,255,255,0.65);">Observed</div>
          <div style="margin-top:4px;font-size:18px;font-weight:800;">${fmtMoney(params.observed, params.currency)}</div>
        </div>
        <div style="border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:12px;background:rgba(0,0,0,0.25);">
          <div style="font-size:12px;color:rgba(255,255,255,0.65);">7-day baseline</div>
          <div style="margin-top:4px;font-size:18px;font-weight:800;">${fmtMoney(params.baseline, params.currency)}</div>
        </div>
      </div>

      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <div style="padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.05);font-size:12px;">
          Jump: <strong>${fmtPct(params.pctChange)}</strong>
        </div>
        ${
          params.zScore != null
            ? `<div style="padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.05);font-size:12px;">
                z: <strong>${params.zScore.toFixed(2)}</strong>
               </div>`
            : ""
        }
      </div>

      <div style="margin-top:14px;border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:12px;background:rgba(0,0,0,0.25);">
        <div style="font-size:12px;color:rgba(255,255,255,0.65);">What we saw</div>
        <div style="margin-top:6px;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.82);">${params.message}</div>
      </div>

      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${link}" style="display:inline-block;text-decoration:none;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.16);color:#fff;padding:10px 14px;border-radius:14px;font-weight:800;">
          View in dashboard
        </a>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);padding:10px 0;">
          Tip: generate AI insight inside the anomaly details for next actions.
        </div>
      </div>
    </div>
  </div>
  `;

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: params.to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
}

export async function sendWeeklyFounderReportEmail(params: {
  to: string;
  range: { start: string; end: string };
  currency: string;
  total: { last7: number; prev7: number; delta: number; deltaPct: number | null; daily: Array<{ date: string; amount: number }> };
  topServices: Array<{ service: string; amount: number }>;
  anomalies: Array<{ date: string; service: string; severity: string; message: string; pctChange: number }>;
}) {
  const baseUrl = getBaseUrl();
  const linkUsage = `${baseUrl}/app/usage`;
  const linkAnoms = `${baseUrl}/app/anomalies`;

  const subject = `[CloudBudgetGuard] Weekly founder report — ${params.range.start} → ${params.range.end}`;

  const kpiLine = `Last 7d: ${fmtMoney(params.total.last7, params.currency)} · Prev 7d: ${fmtMoney(
    params.total.prev7,
    params.currency
  )} · Δ ${fmtMoney(params.total.delta, params.currency)} (${fmtPct(params.total.deltaPct)})`;

  const topServicesHtml =
    params.topServices.length === 0
      ? `<div style="color:rgba(255,255,255,0.65);font-size:13px;">No service breakdown yet.</div>`
      : `<div style="margin-top:8px;">
          ${params.topServices
            .map(
              (s) => `
            <div style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);margin-bottom:8px;">
              <div style="font-weight:700;color:#fff;">${s.service}</div>
              <div style="font-weight:800;color:#fff;">${fmtMoney(s.amount, params.currency)}</div>
            </div>`
            )
            .join("")}
        </div>`;

  const anomsHtml =
    params.anomalies.length === 0
      ? `<div style="color:rgba(255,255,255,0.65);font-size:13px;">No warning/critical anomalies this week. ✅</div>`
      : `<div style="margin-top:8px;">
          ${params.anomalies
            .slice(0, 6)
            .map((a) => {
              const sev =
                String(a.severity).toLowerCase() === "critical"
                  ? "CRITICAL"
                  : String(a.severity).toLowerCase() === "warning"
                    ? "WARNING"
                    : "INFO";
              const pillBg =
                sev === "CRITICAL" ? "rgba(255,77,109,0.16)" : sev === "WARNING" ? "rgba(255,200,87,0.14)" : "rgba(255,255,255,0.10)";
              const pillBorder =
                sev === "CRITICAL" ? "rgba(255,77,109,0.30)" : sev === "WARNING" ? "rgba(255,200,87,0.28)" : "rgba(255,255,255,0.18)";

              const svc = a.service === "__TOTAL__" ? "Total" : a.service;

              return `
                <div style="padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
                    <div>
                      <div style="font-weight:800;color:#fff;">${a.date} · ${svc}</div>
                      <div style="margin-top:4px;color:rgba(255,255,255,0.72);font-size:13px;line-height:1.45;">${a.message}</div>
                    </div>
                    <div style="padding:6px 10px;border-radius:999px;border:1px solid ${pillBorder};background:${pillBg};font-weight:800;font-size:11px;letter-spacing:0.08em;">
                      ${sev}
                    </div>
                  </div>
                  <div style="margin-top:8px;color:rgba(255,255,255,0.65);font-size:12px;">
                    Jump: <strong style="color:#fff;">${fmtPct(a.pctChange)}</strong>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; background:#000; color:#fff; padding:24px;">
    <div style="max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:22px;background:rgba(255,255,255,0.04);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);display:grid;place-items:center;background:rgba(255,255,255,0.05);font-weight:800;">cb</div>
        <div style="font-weight:700;letter-spacing:-0.01em;">CloudBudgetGuard</div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:13px;color:rgba(255,255,255,0.65);">Weekly founder report</div>
          <div style="font-size:18px;font-weight:900;letter-spacing:-0.02em;margin-top:4px;">${params.range.start} → ${params.range.end}</div>
          <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.65);">${kpiLine}</div>
        </div>
      </div>

      <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:12px;background:rgba(0,0,0,0.25);">
          <div style="font-size:12px;color:rgba(255,255,255,0.65);">Last 7 days</div>
          <div style="margin-top:4px;font-size:18px;font-weight:900;">${fmtMoney(params.total.last7, params.currency)}</div>
        </div>
        <div style="border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:12px;background:rgba(0,0,0,0.25);">
          <div style="font-size:12px;color:rgba(255,255,255,0.65);">Δ vs prev 7</div>
          <div style="margin-top:4px;font-size:18px;font-weight:900;">${fmtMoney(params.total.delta, params.currency)} <span style="font-size:12px;color:rgba(255,255,255,0.65);">(${fmtPct(params.total.deltaPct)})</span></div>
        </div>
      </div>

      <div style="margin-top:18px;">
        <div style="font-size:12px;color:rgba(255,255,255,0.65);font-weight:800;letter-spacing:0.08em;">TOP SERVICES</div>
        ${topServicesHtml}
      </div>

      <div style="margin-top:18px;">
        <div style="font-size:12px;color:rgba(255,255,255,0.65);font-weight:800;letter-spacing:0.08em;">ANOMALIES</div>
        ${anomsHtml}
      </div>

      <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${linkUsage}" style="display:inline-block;text-decoration:none;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.16);color:#fff;padding:10px 14px;border-radius:14px;font-weight:900;">
          Open usage
        </a>
        <a href="${linkAnoms}" style="display:inline-block;text-decoration:none;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#fff;padding:10px 14px;border-radius:14px;font-weight:800;">
          Open anomalies
        </a>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);padding:10px 0;">
          Tip: AI insight is available inside anomaly details.
        </div>
      </div>
    </div>
  </div>
  `;

  const text = [
    `CloudBudgetGuard — Weekly founder report (${params.range.start} → ${params.range.end})`,
    kpiLine,
    "",
    "Top services:",
    ...params.topServices.map((s) => `- ${s.service}: ${fmtMoney(s.amount, params.currency)}`),
    "",
    "Anomalies:",
    ...(params.anomalies.length
      ? params.anomalies.slice(0, 6).map((a) => `- ${a.date} · ${a.service === "__TOTAL__" ? "Total" : a.service} · ${a.severity.toUpperCase()} · Jump ${fmtPct(a.pctChange)} · ${a.message}`)
      : ["- None (warning/critical)"]),
    "",
    `Usage: ${linkUsage}`,
    `Anomalies: ${linkAnoms}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: params.to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
}
