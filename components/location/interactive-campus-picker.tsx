"use client";

import { MouseEvent } from "react";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";
import { MINSHENG_BUILDINGS, OTHER_CAMPUS_LOCATIONS } from "@/lib/marketplace/domain/campus-locations";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut } from "lucide-react";

function MapControls() {
  const { zoomIn, zoomOut } = useControls();
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 rounded-lg bg-white p-1 shadow-md ring-1 ring-campus-ink/10">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="flex h-8 w-8 items-center justify-center rounded bg-white text-campus-ink hover:bg-slate-100"
        aria-label="放大"
      >
        <ZoomIn size={18} />
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="flex h-8 w-8 items-center justify-center rounded bg-white text-campus-ink hover:bg-slate-100"
        aria-label="縮小"
      >
        <ZoomOut size={18} />
      </button>
    </div>
  );
}

type InteractiveCampusPickerProps = {
  campus: string;
  setCampus: (c: string) => void;
  detailLocation: string;
  setDetailLocation: (d: string) => void;
  customLocation: string;
  setCustomLocation: (c: string) => void;
  mapPoint?: MapCoordinate;
  setMapPoint: (p: MapCoordinate | undefined) => void;
  fieldError?: string;
};

export function InteractiveCampusPicker({
  campus,
  setCampus,
  detailLocation,
  setDetailLocation,
  customLocation,
  setCustomLocation,
  mapPoint,
  setMapPoint,
  fieldError
}: InteractiveCampusPickerProps) {
  
  // Group Minsheng buildings and deduplicate names (supports multiple coordinate points for large buildings)
  const minshengGroups = MINSHENG_BUILDINGS.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    if (!acc[curr.group].includes(curr.name)) {
      acc[curr.group].push(curr.name);
    }
    return acc;
  }, {} as Record<string, string[]>);

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (campus !== "民生校區") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
    
    // Find closest building
    let closestBuilding = MINSHENG_BUILDINGS[0].name;
    let minDistance = Infinity;
    
    MINSHENG_BUILDINGS.forEach(b => {
      const dist = Math.sqrt(Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestBuilding = b.name;
      }
    });

    setDetailLocation(closestBuilding);
    setCustomLocation("");
    setMapPoint({ x, y });
  }

  function handleDetailLocationChange(newDetail: string) {
    setDetailLocation(newDetail);
    setCustomLocation("");
    
    if (campus === "民生校區") {
      const b = MINSHENG_BUILDINGS.find(b => b.name === newDetail);
      if (b) {
        setMapPoint({ x: b.x, y: b.y });
      } else {
        setMapPoint(undefined);
      }
    } else {
      setMapPoint(undefined);
    }
  }

  function handleCampusChange(newCampus: string) {
    setCampus(newCampus);
    setCustomLocation("");
    if (newCampus === "民生校區") {
      const defaultBuilding = MINSHENG_BUILDINGS[0].name;
      setDetailLocation(defaultBuilding);
      const b = MINSHENG_BUILDINGS[0];
      setMapPoint({ x: b.x, y: b.y });
    } else {
      setMapPoint(undefined);
      const details = OTHER_CAMPUS_LOCATIONS[newCampus];
      setDetailLocation(details ? details[0] : "其他");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="campus-select" className="font-bold">
            面交校區
          </label>
          <select
            id="campus-select"
            value={campus}
            onChange={(e) => handleCampusChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          >
            <option value="英才校區">英才校區</option>
            <option value="民生校區">民生校區</option>
            <option value="其他">其他</option>
          </select>
        </div>
        
        {campus !== "其他" && (
          <div>
            <label htmlFor="detail-select" className="font-bold">
              面交大樓/特定地點
            </label>
            <select
              id="detail-select"
              value={detailLocation}
              onChange={(e) => handleDetailLocationChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            >
              {campus === "民生校區" ? (
                Object.entries(minshengGroups).map(([group, names]) => (
                  <optgroup key={group} label={group}>
                    {names.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </optgroup>
                ))
              ) : (
                OTHER_CAMPUS_LOCATIONS[campus]?.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))
              )}
            </select>
          </div>
        )}
        
        <div className={campus === "其他" ? "sm:col-span-2" : ""}>
          <label htmlFor="custom-location" className="font-bold">
            {campus === "其他" ? "具體位置描述 / 地址" : "詳細位置 (如：3樓電梯前)"}
          </label>
          <input
            id="custom-location"
            type="text"
            required={campus === "其他" || detailLocation === "其他"}
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder={campus === "其他" ? "請輸入完整地址或位置" : "例如：3樓電梯前"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldError ? "true" : "false"}
          />
        </div>
        {fieldError && <p className="sm:col-span-3 mt-2 text-sm font-semibold text-campus-red">{fieldError}</p>}
      </div>

      {campus === "民生校區" && (
        <div className="space-y-2 mt-4 rounded-lg bg-campus-paper p-4 border border-campus-ink/10">
          <p className="text-sm font-bold text-campus-ink flex items-center gap-2">
            💡 提示：點擊地圖也可快速選擇大樓
          </p>
          <div className="relative overflow-hidden rounded-lg border border-campus-ink/10 bg-white">
            <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit limitToBounds={true}>
              <TransformComponent wrapperClass="w-full h-full cursor-crosshair active:cursor-grabbing" contentClass="w-full relative">
                <div
                  className="relative w-full"
                  onClick={handleMapClick}
                  role="button"
                  tabIndex={0}
                  aria-label="校園平面圖選點"
                >
                  <img src="/images/campus-map.jpg" alt="民生校區平面圖" className="w-full object-contain pointer-events-none" />
                  {mapPoint && (
                    <span
                      className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-campus-red shadow-lg transition-all duration-300 ease-out pointer-events-none"
                      style={{ left: `${mapPoint.x}%`, top: `${mapPoint.y}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </TransformComponent>
              <MapControls />
            </TransformWrapper>
          </div>
        </div>
      )}
    </div>
  );
}
