"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";

export function CampusMapDisplay({
  location,
  mapPoint
}: {
  location: string;
  mapPoint?: MapCoordinate;
}) {
  return (
    <div className="space-y-2">
      <p className="font-bold text-campus-ink">{location}</p>
      {mapPoint ? (
        <div className="relative overflow-hidden rounded-lg border border-campus-ink/10 bg-white cursor-grab active:cursor-grabbing">
          <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full relative">
              <img src="/images/campus-map.jpg" alt="國立臺中教育大學民生校區平面圖" className="w-full object-contain pointer-events-none" />
              <span
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-campus-red shadow pointer-events-none"
                style={{ left: `${mapPoint.x}%`, top: `${mapPoint.y}%` }}
                aria-hidden="true"
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      ) : null}
    </div>
  );
}
