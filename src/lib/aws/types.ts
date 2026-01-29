import type { ObjectId } from "mongodb";

export const COLLECTIONS = {
  awsConnections: "aws_connections",
  costDaily: "cost_daily",
  anomalies: "anomalies",
} as const;

export type AwsConnectionStatus = "connected" | "failed";

export type AwsConnectionDoc = {
  _id: ObjectId;
  userId: ObjectId;

  accessKeyId: string;
  secretAccessKeyEnc: string; // encrypted via src/lib/aws/crypto.ts
  region: string | null;

  status: AwsConnectionStatus;
  lastValidatedAt: Date | null;
  lastSyncAt: Date | null;
  lastError: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type CostSource = "aws_ce";

export type CostDailyDoc = {
  _id: ObjectId;
  userId: ObjectId;

  /** YYYY-MM-DD (UTC) */
  date: string;
  /** Service name or "__TOTAL__" */
  service: string;
  amount: number;
  currency: string;
  source: CostSource;

  createdAt: Date;
  updatedAt: Date;
};

export type AnomalySeverity = "info" | "warning" | "critical";
export type AnomalyStatus = "open" | "acknowledged" | "resolved";

export type AIInsight = {
  provider: "gemini" | "openai" | "local";
  model: string;
  summary: string;
  likelyCauses: string[];
  actionSteps: string[];
  createdAt: Date;
};

export type AnomalyDoc = {
  _id: ObjectId;
  userId: ObjectId;

  /** YYYY-MM-DD (UTC) */
  date: string;
  /** Start with "__TOTAL__"; later we can add per-service anomalies */
  service: string;

  observed: number;
  baseline: number;
  pctChange: number;
  zScore: number | null;

  severity: AnomalySeverity;
  message: string;
  status: AnomalyStatus;

  /** Cached AI enrichment. App must work even when this is null/unavailable. */
  aiInsight: AIInsight | null;
  aiStatus: "ready" | "unavailable" | "error" | null;

  createdAt: Date;
  updatedAt: Date;
};
