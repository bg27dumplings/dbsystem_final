"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";
import { MINSHENG_BUILDINGS, OTHER_CAMPUS_LOCATIONS } from "@/lib/marketplace/domain/campus-locations";
import { MapPin } from "lucide-react";

function getGoogleMapsSearchQuery(location: string) {
  const isMinsheng = MINSHENG_BUILDINGS.some(b => b.name === location);
  if (isMinsheng) {
    return `國立臺中教育大學民生校區 ${location}`;
  }
  const isYingcai = OTHER_CAMPUS_LOCATIONS["英才校區"].includes(location);
  if (isYingcai && location !== "其他") {
    return `國立臺中教育大學英才校區 ${location}`;
  }
  return location;
}

export function CampusMapDisplay({
  location,
  mapPoint
}: {
  location: string;
  mapPoint?: MapCoordinate;
}) {
  const searchQuery = getGoogleMapsSearchQuery(location);

  return (
    <div className="space-y-3">
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
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
      >
        <MapPin size={18} />
        在 Google Maps 中開啟
      </a>
    </div>
  );
}
