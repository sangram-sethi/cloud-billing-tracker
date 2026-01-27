import * as React from "react";

export function Sparkline({
  values,
  accent = "violet",
}: {
  values: number[];
  accent?: "violet" | "blue";
}) {
  const w = 520;
  const h = 160;
  const pad = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const pts = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const t = (v - min) / (max - min || 1);
      const y = pad + (1 - t) * (h - pad * 2);
      return [x, y] as const;
    })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  const stroke = accent === "violet" ? "url(#ds_stroke_v)" : "url(#ds_stroke_b)";
  const fill = accent === "violet" ? "url(#ds_fill_v)" : "url(#ds_fill_b)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full">
      <defs>
        <linearGradient id="ds_fill_v" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(124,58,237,0.33)" />
          <stop offset="100%" stopColor="rgba(124,58,237,0.02)" />
        </linearGradient>
        <linearGradient id="ds_stroke_v" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="55%" stopColor="rgba(124,58,237,0.90)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.55)" />
        </linearGradient>

        <linearGradient id="ds_fill_b" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.26)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
        </linearGradient>
        <linearGradient id="ds_stroke_b" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="60%" stopColor="rgba(59,130,246,0.88)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0.42)" />
        </linearGradient>
      </defs>

      <polyline points={area} fill={fill} stroke="none" opacity={0.95} />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="ds-draw"
      />
    </svg>
  );
}
