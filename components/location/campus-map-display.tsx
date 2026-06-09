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
        <div className="relative overflow-hidden rounded-lg border border-campus-ink/10 bg-white">
          <img src="/images/campus-map.png" alt="國立臺中教育大學民生校區平面圖" className="w-full object-contain" />
          <span
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-campus-red shadow"
            style={{ left: `${mapPoint.x}%`, top: `${mapPoint.y}%` }}
            aria-hidden="true"
          />
        </div>
      ) : null}
    </div>
  );
}
