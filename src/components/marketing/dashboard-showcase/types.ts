export type View = "overview" | "alerts" | "budgets" | "reports" | "settings";
export type RangeKey = "24h" | "7d" | "30d";
export type RegionKey = "all" | "us-east-1" | "ap-south-1" | "eu-west-1";
export type PopoverKey = null | "alerts" | "security" | "filters";

export type Tone = "neutral" | "success" | "warning" | "danger";

export type Severity = "warning" | "neutral" | "success";

export type Service = {
  name: string;
  pct: number;
  amt: number;
  region: Exclude<RegionKey, "all">;
};

export type AnomalyRow = {
  t: string;
  s: string;
  r: Exclude<RegionKey, "all">;
  d: string;
  st: string;
  v: Severity;
};

export type RangeData = {
  mtd: number;
  today: number;
  forecast: number;
  score: number;
  chart: number[];
  services: Service[];
  anomalies: AnomalyRow[];
};
