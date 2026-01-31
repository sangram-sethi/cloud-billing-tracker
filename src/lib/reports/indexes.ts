import { getDb } from "@/lib/mongodb";

type ReportIndexesGlobal = typeof globalThis & {
  _cbgReportIndexesEnsured?: boolean;
};

export async function ensureReportIndexes() {
  const g = globalThis as ReportIndexesGlobal;
  if (g._cbgReportIndexesEnsured) return;

  const db = await getDb();

  // One report per user per periodStart
  await db.collection("weekly_reports").createIndex({ userId: 1, periodStart: -1 });
  await db.collection("weekly_reports").createIndex({ userId: 1, periodStart: 1 }, { unique: true });

  g._cbgReportIndexesEnsured = true;
}
