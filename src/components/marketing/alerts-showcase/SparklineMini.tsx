import * as React from "react";
import { cn } from "@/lib/cn";
import { clamp } from "./utils";

export function SparklineMini({
  values,
  spikeIndex,
  hot,
}: {
  values: number[];
  spikeIndex?: number;
  hot?: boolean;
}) {
  const w = 260;
  const h = 78;
  const pad = 6;
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

  const spike =
    typeof spikeIndex === "number"
      ? (() => {
          const i = clamp(spikeIndex, 0, values.length - 1);
          const x = pad + (i * (w - pad * 2)) / (values.length - 1);
          const t = (values[i] - min) / (max - min || 1);
          const y = pad + (1 - t) * (h - pad * 2);
          return { x, y };
        })()
      : null;

  // Unique IDs avoid any SVG gradient collisions.
  const uid = React.useId().replace(/:/g, "");
  const fillId = `as_fill_${uid}`;
  const strokeId = `as_stroke_${uid}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-19.5 w-full">
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={hot ? "rgba(244,63,94,0.20)" : "rgba(59,130,246,0.22)"} />
          <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
          <stop offset="60%" stopColor={hot ? "rgba(244,63,94,0.80)" : "rgba(59,130,246,0.80)"} />
          <stop offset="100%" stopColor={hot ? "rgba(245,158,11,0.60)" : "rgba(124,58,237,0.55)"} />
        </linearGradient>
      </defs>

      <polyline points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`} fill={`url(#${fillId})`} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke={`url(#${strokeId})`}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {spike ? (
        <g>
          <circle cx={spike.x} cy={spike.y} r={4} fill="rgba(255,255,255,0.85)" />
          <circle
            className={cn("as-pulse", hot ? "as-pulse-hot" : "")}
            cx={spike.x}
            cy={spike.y}
            r={10}
            fill="none"
            stroke={hot ? "rgba(244,63,94,0.55)" : "rgba(59,130,246,0.55)"}
            strokeWidth={2}
          />
        </g>
      ) : null}
    </svg>
  );
}
