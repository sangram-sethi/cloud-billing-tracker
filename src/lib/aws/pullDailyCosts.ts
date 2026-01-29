import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { createCostExplorerClient, type AwsCreds } from "@/lib/aws/costExplorer";

function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export type DailyCostRow = {
  /** YYYY-MM-DD (UTC) */
  date: string;
  /** "__TOTAL__" or AWS SERVICE dimension value */
  service: string;
  amount: number;
  currency: string;
};

export type PullCostsResult =
  | {
      ok: true;
      start: string;
      endExclusive: string;
      rows: DailyCostRow[];
    }
  | {
      ok: false;
      code: "NO_CONNECTION" | "INVALID_CREDENTIALS" | "ACCESS_DENIED" | "THROTTLED" | "AWS_ERROR";
      message: string;
      httpStatus?: number;
      rawName?: string;
    };

function normalizeAwsError(err: unknown) {
  const e = err as any;
  const name: string = e?.name || e?.Code || "AwsError";
  const message: string = e?.message || "AWS error";
  const httpStatus: number | undefined = e?.$metadata?.httpStatusCode;
  return { name, message, httpStatus };
}

export async function pullDailyCostsLastNDays(params: {
  creds: AwsCreds;
  days: number;
  metric?: "UnblendedCost";
}): Promise<PullCostsResult> {
  const { creds, days, metric = "UnblendedCost" } = params;

  const endExclusive = ymdUTC(new Date()); // excludes "today" -> gives complete daily values up to yesterday
  const start = ymdUTC(daysAgo(days));

  try {
    const ce = createCostExplorerClient(creds);

    const cmd = new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: endExclusive },
      Granularity: "DAILY",
      Metrics: [metric],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    });

    const out = await ce.send(cmd);

    const rows: DailyCostRow[] = [];
    const results = out.ResultsByTime ?? [];

    for (const r of results) {
      const date = r?.TimePeriod?.Start;
      if (!date) continue;

      // Total
      const totalMetric = r.Total?.[metric];
      const totalAmtStr = totalMetric?.Amount ?? "0";
      const totalCurrency = totalMetric?.Unit ?? "USD";
      const totalAmt = Number.parseFloat(totalAmtStr);

      rows.push({
        date,
        service: "__TOTAL__",
        amount: Number.isFinite(totalAmt) ? totalAmt : 0,
        currency: totalCurrency,
      });

      // Per service
      const groups = r.Groups ?? [];
      for (const g of groups) {
        const service = g.Keys?.[0];
        if (!service) continue;

        const m = g.Metrics?.[metric];
        const amtStr = m?.Amount ?? "0";
        const unit = m?.Unit ?? totalCurrency;

        const amt = Number.parseFloat(amtStr);
        const safeAmt = Number.isFinite(amt) ? amt : 0;

        // Keep DB lean: don’t store near-zero lines
        if (safeAmt <= 0) continue;

        rows.push({
          date,
          service,
          amount: safeAmt,
          currency: unit,
        });
      }
    }

    return { ok: true, start, endExclusive, rows };
  } catch (err) {
    const { name, message, httpStatus } = normalizeAwsError(err);
    const n = String(name);
    const m = String(message || "");

    if (
      n.includes("UnrecognizedClient") ||
      n.includes("InvalidClientTokenId") ||
      n.includes("SignatureDoesNotMatch") ||
      m.toLowerCase().includes("security token") ||
      m.toLowerCase().includes("invalid signature")
    ) {
      return {
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid AWS credentials. Please reconnect AWS.",
        httpStatus,
        rawName: n,
      };
    }

    if (n.includes("AccessDenied") || n.includes("Unauthorized") || m.toLowerCase().includes("access denied")) {
      return {
        ok: false,
        code: "ACCESS_DENIED",
        message: "AWS denied access to Cost Explorer. Please ensure ce:GetCostAndUsage + billing access.",
        httpStatus,
        rawName: n,
      };
    }

    if (n.includes("Thrott") || m.toLowerCase().includes("rate") || m.toLowerCase().includes("thrott")) {
      return {
        ok: false,
        code: "THROTTLED",
        message: "AWS is throttling requests. Please try again in a minute.",
        httpStatus,
        rawName: n,
      };
    }

    return {
      ok: false,
      code: "AWS_ERROR",
      message: "Failed to pull AWS costs. Please try again.",
      httpStatus,
      rawName: n,
    };
  }
}
