export type TotalDailyPoint = {
  /** YYYY-MM-DD (UTC) */
  date: string;
  amount: number;
  currency: string;
};

export type AnomalyOut = {
  date: string;
  service: "__TOTAL__";
  observed: number;
  baseline: number;
  pctChange: number; // ratio: 0.82 => +82%
  zScore: number | null;
  severity: "info" | "warning" | "critical";
  message: string;
};

const WINDOW = 7;

// Noise guards (premium default): avoids tiny $0.10 → $0.20 “anomalies”
const MIN_OBSERVED = 1; // $1
const MIN_ABS_DELTA = 1; // $1

function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function stddev(xs: number[], mu: number) {
  if (xs.length <= 1) return 0;
  let s2 = 0;
  for (const x of xs) {
    const d = x - mu;
    s2 += d * d;
  }
  return Math.sqrt(s2 / (xs.length - 1));
}

function fmtUSD(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function severityFor(pct: number): "info" | "warning" | "critical" | null {
  // pct is ratio: 0.25 => +25%
  if (!Number.isFinite(pct)) return "critical";
  if (pct >= 1.0) return "critical";
  if (pct >= 0.5) return "warning";
  if (pct >= 0.25) return "info";
  return null;
}

/**
 * Compute anomalies from total daily costs.
 * - Uses 7-day rolling mean baseline.
 * - Uses % jump and optional z-score (if stddev>0).
 * - Only flags upward spikes (pctChange > 0).
 */
export function computeTotalAnomalies(points: TotalDailyPoint[]): AnomalyOut[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const out: AnomalyOut[] = [];

  for (let i = WINDOW; i < sorted.length; i++) {
    const prev = sorted.slice(i - WINDOW, i).map((p) => p.amount);
    const mu = mean(prev);
    const sd = stddev(prev, mu);

    const observed = sorted[i].amount;
    const baseline = mu;

    const delta = observed - baseline;
    if (observed < MIN_OBSERVED) continue;
    if (delta < MIN_ABS_DELTA) continue;

    // baseline=0 => treat as infinite % jump if observed>0
    const pctChange = baseline <= 0 ? Number.POSITIVE_INFINITY : delta / baseline;
    if (!(pctChange > 0)) continue;

    const sev = severityFor(pctChange);
    if (!sev) continue;

    const zScore = sd > 0 ? delta / sd : null;
    const pctText = Number.isFinite(pctChange) ? `${Math.round(pctChange * 100)}%` : "∞";

    out.push({
      date: sorted[i].date,
      service: "__TOTAL__",
      observed,
      baseline,
      pctChange,
      zScore,
      severity: sev,
      message: `Spend jumped ${pctText} vs 7-day baseline (${fmtUSD(observed)} vs ${fmtUSD(baseline)}).`,
    });
  }

  return out;
}
