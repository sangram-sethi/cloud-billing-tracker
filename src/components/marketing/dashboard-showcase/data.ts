import type { RangeData, RangeKey } from "./types";

export const RANGE_LABEL: Record<RangeKey, string> = {
  "24h": "Last 24h",
  "7d": "7d",
  "30d": "30d",
};

export const RANGE_DATA: Record<RangeKey, RangeData> = {
  "24h": {
    mtd: 4323,
    today: 996,
    forecast: 5369,
    score: 0.61,
    chart: [10, 11, 10, 12, 11, 12, 13, 14, 16, 20, 32, 72, 54, 41, 33, 27, 24],
    services: [
      { name: "EC2", pct: 46, amt: 184, region: "us-east-1" },
      { name: "NAT Gateway", pct: 22, amt: 88, region: "ap-south-1" },
      { name: "CloudWatch Logs", pct: 16, amt: 64, region: "eu-west-1" },
      { name: "S3", pct: 9, amt: 36, region: "us-east-1" },
    ],
    anomalies: [
      { t: "13:10", s: "EC2 scale-up detected", r: "us-east-1", d: "+$184", st: "Alerted", v: "warning" },
      { t: "11:42", s: "NAT egress jump", r: "ap-south-1", d: "+$66", st: "Watching", v: "neutral" },
      { t: "09:18", s: "Logs ingestion surge", r: "eu-west-1", d: "+$44", st: "Explained", v: "success" },
    ],
  },
  "7d": {
    mtd: 3988,
    today: 712,
    forecast: 5210,
    score: 0.52,
    chart: [8, 9, 9, 10, 10, 11, 12, 12, 13, 15, 18, 22, 24, 26, 28, 29, 30],
    services: [
      { name: "EC2", pct: 40, amt: 612, region: "us-east-1" },
      { name: "RDS", pct: 24, amt: 364, region: "eu-west-1" },
      { name: "NAT Gateway", pct: 14, amt: 214, region: "ap-south-1" },
      { name: "S3", pct: 10, amt: 152, region: "us-east-1" },
    ],
    anomalies: [
      { t: "Wed", s: "RDS burst credits dip", r: "eu-west-1", d: "+$92", st: "Explained", v: "success" },
      { t: "Tue", s: "NAT egress above baseline", r: "ap-south-1", d: "+$140", st: "Alerted", v: "warning" },
      { t: "Mon", s: "EC2 autoscaling burst", r: "us-east-1", d: "+$180", st: "Watching", v: "neutral" },
    ],
  },
  "30d": {
    mtd: 3842,
    today: 218,
    forecast: 5310,
    score: 0.87,
    chart: [6, 7, 7, 8, 8, 8, 9, 9, 10, 12, 14, 18, 22, 26, 30, 36, 42],
    services: [
      { name: "EC2", pct: 44, amt: 1840, region: "us-east-1" },
      { name: "RDS", pct: 20, amt: 836, region: "eu-west-1" },
      { name: "CloudWatch Logs", pct: 14, amt: 612, region: "eu-west-1" },
      { name: "S3", pct: 9, amt: 388, region: "us-east-1" },
    ],
    anomalies: [
      { t: "Jan 18", s: "Logs ingestion surge", r: "eu-west-1", d: "+$310", st: "Explained", v: "success" },
      { t: "Jan 21", s: "EC2 instance family shift", r: "us-east-1", d: "+$540", st: "Alerted", v: "warning" },
      { t: "Jan 24", s: "S3 request spike", r: "us-east-1", d: "+$120", st: "Watching", v: "neutral" },
    ],
  },
};
