import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Cost Explorer is effectively a global service, but the AWS SDK requires a region.
 * us-east-1 is the most compatible default.
 */
export const COST_EXPLORER_REGION = "us-east-1" as const;

export type AwsCreds = {
  accessKeyId: string;
  secretAccessKey: string;
};

export type CostExplorerPingResult =
  | { ok: true }
  | {
      ok: false;
      code: "INVALID_CREDENTIALS" | "ACCESS_DENIED" | "THROTTLED" | "AWS_ERROR";
      message: string;
      httpStatus?: number;
      rawName?: string;
    };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringProp(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function getNestedHttpStatus(obj: Record<string, unknown>): number | undefined {
  const meta = obj.$metadata;
  if (!isRecord(meta)) return undefined;
  const code = meta.httpStatusCode;
  return typeof code === "number" ? code : undefined;
}

function normalizeAwsError(err: unknown): { name: string; message: string; httpStatus?: number } {
  if (!isRecord(err)) {
    return { name: "AwsError", message: "AWS error" };
  }

  const name = getStringProp(err, "name") ?? getStringProp(err, "Code") ?? "AwsError";
  const message = getStringProp(err, "message") ?? "AWS error";
  const httpStatus = getNestedHttpStatus(err);

  return { name, message, httpStatus };
}

export function createCostExplorerClient(creds: AwsCreds) {
  return new CostExplorerClient({
    region: COST_EXPLORER_REGION,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
  });
}

/**
 * A quick deterministic call to validate credentials + permissions.
 * We fetch ~1 day of UnblendedCost; success means creds are valid and CE is accessible.
 */
export async function pingCostExplorer(creds: AwsCreds): Promise<CostExplorerPingResult> {
  try {
    const ce = createCostExplorerClient(creds);

    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const cmd = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: ymdUTC(yesterday),
        End: ymdUTC(today), // End is exclusive in CE
      },
      Granularity: "DAILY",
      Metrics: ["UnblendedCost"],
    });

    await ce.send(cmd);
    return { ok: true };
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
        message: "Invalid AWS credentials. Double-check the Access Key and Secret Key.",
        httpStatus,
        rawName: n,
      };
    }

    if (n.includes("AccessDenied") || n.includes("Unauthorized") || m.toLowerCase().includes("access denied")) {
      return {
        ok: false,
        code: "ACCESS_DENIED",
        message: "AWS denied access to Cost Explorer. Ensure the IAM user has ce:GetCostAndUsage and billing access.",
        httpStatus,
        rawName: n,
      };
    }

    if (n.includes("Thrott") || m.toLowerCase().includes("thrott") || m.toLowerCase().includes("rate")) {
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
      message: "Unable to validate AWS credentials right now. Please try again.",
      httpStatus,
      rawName: n,
    };
  }
}
