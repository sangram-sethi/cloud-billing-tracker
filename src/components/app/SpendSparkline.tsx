import * as React from "react";

type Point = { date: string; amount: number };

export function SpendSparkline({ points, height = 64 }: { points: Point[]; height?: number }) {
  const width = 320;
  const padX = 8;
  const padY = 8;

  const amounts = points.map((p) => p.amount);
  const min = Math.min(...amounts, 0);
  const max = Math.max(...amounts, 1);

  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const xs = points.length > 1 ? innerW / (points.length - 1) : 0;

  function yFor(v: number) {
    if (max === min) return padY + innerH / 2;
    const t = (v - min) / (max - min);
    return padY + innerH * (1 - t);
  }

  const coords = points.map((p, i) => ({ x: padX + xs * i, y: yFor(p.amount) }));

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${(padX + innerW).toFixed(2)},${(padY + innerH).toFixed(2)} L${padX.toFixed(2)},${(padY + innerH).toFixed(2)} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block"
    >
      <path d={area} className="fill-foreground/10" />
      <path
        d={line}
        className="fill-none stroke-foreground/80"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
