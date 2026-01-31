export type DailyPoint = {
  /** YYYY-MM-DD (UTC) */
  date: string;
  amount: number;
  currency: string;
};

export type AnomalyOut = {
  date: string;
  service: string; // "__TOTAL__" or service name
  observed: number;
  baseline: number;
  pctChange: number; // ratio: 0.82 => +82%
  zScore: number | null;
  severity: "info" | "warning" | "critical";
  message: string;
};

const WINDOW = 7;

// TOTAL thresholds
const TOTAL_MIN_OBSERVED = 1; // $1
const TOTAL_MIN_ABS_DELTA = 1; // $1

// SERVICE thresholds (more strict to avoid noise)
const SERVICE_MIN_OBSERVED = 2; // $2
const SERVICE_MIN_ABS_DELTA = 2; // $2
const SERVICE_MIN_BASELINE = 1; // if baseline < $1, we only flag big “new spend”
const SERVICE_MIN_OBSERVED_IF_BASELINE_TINY = 8; // $8 spike even if baseline ~0

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

function fmtMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // fallback if currency code is invalid
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(safe);
  }
}

function severityFor(pct: number): "info" | "warning" | "critical" | null {
  // pct is ratio: 0.25 => +25%
  if (!Number.isFinite(pct)) return "critical";
  if (pct >= 1.0) return "critical";
  if (pct >= 0.5) return "warning";
  if (pct >= 0.25) return "info";
  return null;
}

function computeSeriesAnomalies(opts: {
  points: DailyPoint[];
  service: string;
  currency: string;
  thresholds: {
    minObserved: number;
    minAbsDelta: number;
    minBaseline: number;
    minObservedIfBaselineTiny: number;
  };
}): AnomalyOut[] {
  const { service, currency, thresholds } = opts;
  const sorted = [...opts.points].sort((a, b) => a.date.localeCompare(b.date));
  const out: AnomalyOut[] = [];

  for (let i = WINDOW; i < sorted.length; i++) {
    const prev = sorted.slice(i - WINDOW, i).map((p) => p.amount);
    const mu = mean(prev);
    const sd = stddev(prev, mu);

    const observed = sorted[i].amount;
    const baseline = mu;
    const delta = observed - baseline;

    if (observed < thresholds.minObserved) continue;
    if (delta < thresholds.minAbsDelta) continue;

    // If baseline is tiny (often happens for “new” services), only flag meaningful absolute spikes
    if (baseline < thresholds.minBaseline && observed < thresholds.minObservedIfBaselineTiny) continue;

    const pctChange = baseline <= 0 ? Number.POSITIVE_INFINITY : delta / baseline;
    if (!(pctChange > 0)) continue;

    const sev = severityFor(pctChange);
    if (!sev) continue;

    const zScore = sd > 0 ? delta / sd : null;
    const pctText = Number.isFinite(pctChange) ? `${Math.round(pctChange * 100)}%` : "∞";

    const label = service === "__TOTAL__" ? "Total spend" : service;

    out.push({
      date: sorted[i].date,
      service,
      observed,
      baseline,
      pctChange,
      zScore,
      severity: sev,
      message: `${label} jumped ${pctText} vs 7-day baseline (${fmtMoney(observed, currency)} vs ${fmtMoney(
        baseline,
        currency
      )}).`,
    });
  }

  return out;
}

export function computeTotalAnomalies(points: DailyPoint[]): AnomalyOut[] {
  return computeSeriesAnomalies({
    points,
    service: "__TOTAL__",
    currency: points[0]?.currency ?? "USD",
    thresholds: {
      minObserved: TOTAL_MIN_OBSERVED,
      minAbsDelta: TOTAL_MIN_ABS_DELTA,
      minBaseline: 0,
      minObservedIfBaselineTiny: 0,
    },
  });
}

export function computeServiceAnomalies(params: {
  seriesByService: Map<string, DailyPoint[]>;
  topServices: string[];
  currency: string;
}): AnomalyOut[] {
  const { seriesByService, topServices, currency } = params;
  const out: AnomalyOut[] = [];

  for (const service of topServices) {
    const pts = seriesByService.get(service);
    if (!pts || pts.length < WINDOW + 1) continue;

    out.push(
      ...computeSeriesAnomalies({
        points: pts,
        service,
        currency,
        thresholds: {
          minObserved: SERVICE_MIN_OBSERVED,
          minAbsDelta: SERVICE_MIN_ABS_DELTA,
          minBaseline: SERVICE_MIN_BASELINE,
          minObservedIfBaselineTiny: SERVICE_MIN_OBSERVED_IF_BASELINE_TINY,
        },
      })
    );
  }

  return out;
}
