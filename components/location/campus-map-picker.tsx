"use client";

import { MouseEvent, useState } from "react";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";

export function CampusMapPicker({
  value,
  onChange
}: {
  value?: MapCoordinate;
  onChange: (point: MapCoordinate | undefined) => void;
}) {
  const [point, setPoint] = useState<MapCoordinate | undefined>(value);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
    const next = { x, y };
    setPoint(next);
    onChange(next);
  }

  function clearPoint() {
    setPoint(undefined);
    onChange(undefined);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">點選校園平面圖上的面交位置，讓對方更容易找到你。</p>
      <div
        className="relative cursor-crosshair overflow-hidden rounded-lg border border-campus-ink/10 bg-white"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="校園平面圖選點"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            clearPoint();
          }
        }}
      >
        <img src="/images/campus-map.png" alt="國立臺中教育大學民生校區平面圖" className="w-full object-contain" />
        {point ? (
          <span
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-campus-red shadow"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      {point ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span>已選位置：X {point.x}% / Y {point.y}%</span>
          <button type="button" onClick={clearPoint} className="font-bold text-campus-red">
            清除選點
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">尚未選擇地圖位置。</p>
      )}
    </div>
  );
}
