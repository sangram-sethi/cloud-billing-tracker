type TopService = {
  service: string;
  amount: number;
  prevAmount: number;
  delta: number;
  deltaPct: number | null;
};

type ReportForEmail = {
  periodStart: string;
  periodEnd: string;
  currency: string;
  total: number;
  prevTotal: number;
  delta: number;
  deltaPct: number | null;

  topServices: TopService[];

  anomalies: {
    totalCount: number;
    criticalCount: number;
    warningCount: number;
    top: Array<{ date: string; service: string; severity: string; message: string }>;
  };
};

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtPct(p: number | null) {
  if (p === null || !Number.isFinite(p)) return "—";
  const v = p * 100;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(Math.abs(v) < 10 ? 1 : 0)}%`;
}

export function renderWeeklyReportEmail(params: { brand: string; report: ReportForEmail }) {
  const { brand, report } = params;

  const subject = `Your weekly founder report (${report.periodStart} → ${report.periodEnd})`;

  const textLines: string[] = [];
  textLines.push(`${brand} — Weekly Founder Report`);
  textLines.push(`${report.periodStart} → ${report.periodEnd}`);
  textLines.push("");
  textLines.push(`Total: ${fmtMoney(report.total, report.currency)} (${fmtPct(report.deltaPct)} vs prev)`);
  textLines.push(`Prev:  ${fmtMoney(report.prevTotal, report.currency)}`);
  textLines.push("");
  textLines.push("Top services:");
  for (const s of report.topServices.slice(0, 6)) {
    textLines.push(
      `- ${s.service}: ${fmtMoney(s.amount, report.currency)} (${fmtPct(s.deltaPct)} vs prev)`
    );
  }
  textLines.push("");
  textLines.push(`Anomalies: ${report.anomalies.totalCount} (critical ${report.anomalies.criticalCount}, warning ${report.anomalies.warningCount})`);
  for (const a of report.anomalies.top.slice(0, 3)) {
    textLines.push(`- [${a.severity}] ${a.service} on ${a.date}: ${a.message}`);
  }

  const text = textLines.join("\n");

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; background:#000; color:#fff; padding:24px;">
    <div style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:22px;background:rgba(255,255,255,0.04);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);display:grid;place-items:center;background:rgba(255,255,255,0.05);font-weight:800;">cb</div>
        <div style="font-weight:800;letter-spacing:-0.01em;">${brand}</div>
      </div>

      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px;">
        <div>
          <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:700;">Weekly founder report</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.82);margin-top:4px;">
            ${report.periodStart} → ${report.periodEnd}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:rgba(255,255,255,0.65);font-weight:700;">Total</div>
          <div style="font-size:22px;font-weight:900;letter-spacing:-0.02em;">
            ${fmtMoney(report.total, report.currency)}
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:700;">
            ${fmtPct(report.deltaPct)} vs prev
          </div>
        </div>
      </div>

      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px;background:rgba(255,255,255,0.03);">
        <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:800;margin-bottom:10px;">Top services</div>
        ${report.topServices
          .slice(0, 6)
          .map(
            (s) => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);">
                <div style="font-weight:800;">${s.service}</div>
                <div style="text-align:right;">
                  <div style="font-weight:900;">${fmtMoney(s.amount, report.currency)}</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:700;">${fmtPct(s.deltaPct)} vs prev</div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div style="margin-top:14px;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px;background:rgba(255,255,255,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:800;">Anomalies</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.70);font-weight:700;">
            total ${report.anomalies.totalCount} · critical ${report.anomalies.criticalCount} · warning ${report.anomalies.warningCount}
          </div>
        </div>

        ${report.anomalies.top
          .slice(0, 3)
          .map(
            (a) => `
              <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
                <div style="font-size:12px;color:rgba(255,255,255,0.72);font-weight:800;">
                  [${a.severity}] ${a.service} — ${a.date}
                </div>
                <div style="margin-top:4px;color:rgba(255,255,255,0.82);font-size:13px;">
                  ${a.message}
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div style="margin-top:14px;font-size:12px;color:rgba(255,255,255,0.62);">
        This report is generated from your AWS cost series + anomaly engine. If email sending is disabled/unavailable, you can still view it in-app.
      </div>
    </div>
  </div>
  `;

  return { subject, text, html };
}
