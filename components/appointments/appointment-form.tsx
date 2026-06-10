"use client";

import { FormEvent, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { InteractiveCampusPicker } from "@/components/location/interactive-campus-picker";
import { describedBy } from "@/lib/a11y";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";
import { MARKETPLACE_EXCHANGE_MODE_LABELS } from "@/lib/marketplace/domain/constants";

type CreateAppointmentFieldErrors = {
  itemId?: string;
  meetupAt?: string;
  location?: string;
  exchangeMode?: string;
  exchangeValue?: string;
  note?: string;
};

type AppointmentFormResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateAppointmentFieldErrors;
};

type ExchangeMode = "price" | "treat_drink" | "treat_food" | "free" | "custom";

export function AppointmentForm({
  itemId,
  initialLocation,
  initialExchangeMode,
  initialExchangeValue
}: {
  itemId: string;
  initialLocation: string;
  initialExchangeMode: ExchangeMode;
  initialExchangeValue: string;
}) {
  const router = useRouter();
  const [meetupAt, setMeetupAt] = useState("");

  // Parse initialLocation for two-level select
  const parsedLoc = useMemo(() => {
    const locString = initialLocation || "";
    const parts = locString.split(" - ");
    if (parts[0] === "英才校區" || parts[0] === "民生校區" || parts[0] === "宿舍") {
      const campus = parts[0];
      const detail = parts[1] || "其他";
      // Loose validation for initial load
      const custom = parts.slice(2).join(" - ") || (detail === "其他" ? parts.slice(1).join(" - ") : "");
      return { campus, detail, custom };
    }
    if (locString === "英才校區" || locString === "民生校區" || locString === "宿舍") {
      return { campus: locString, detail: "其他", custom: "" };
    }
    return { campus: "其他", detail: "其他", custom: locString };
  }, [initialLocation]);

  const [campus, setCampus] = useState(parsedLoc.campus);
  const [detailLocation, setDetailLocation] = useState(parsedLoc.detail);
  const [customLocation, setCustomLocation] = useState(parsedLoc.custom);
  const [mapPoint, setMapPoint] = useState<MapCoordinate | undefined>(undefined);
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>(initialExchangeMode);
  const [exchangeValue, setExchangeValue] = useState(initialExchangeValue);
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreateAppointmentFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      let combinedLocation = "";
      if (campus === "其他") {
        combinedLocation = customLocation.trim();
      } else if (detailLocation === "其他") {
        combinedLocation = `${campus} - ${customLocation.trim()}`;
      } else {
        const trimmedCustom = customLocation.trim();
        combinedLocation = trimmedCustom ? `${campus} - ${detailLocation} - ${trimmedCustom}` : `${campus} - ${detailLocation}`;
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          itemId,
          meetupAt,
          location: combinedLocation,
          locationX: mapPoint ? String(mapPoint.x) : "",
          locationY: mapPoint ? String(mapPoint.y) : "",
          exchangeMode,
          exchangeValue,
          note
        })
      });

      const result = (await response.json()) as AppointmentFormResponse;
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "建立面交失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      window.location.assign(result.redirectTo ?? "/me/appointments");
      router.refresh();
    } catch {
      setFormError("建立面交失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </div>
      ) : null}
      {fieldErrors.itemId ? (
        <div className="rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {fieldErrors.itemId}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="meetup-at" className="font-bold">
            面交時間
          </label>
          <input
            id="meetup-at"
            name="meetupAt"
            type="datetime-local"
            value={meetupAt}
            onChange={(event) => setMeetupAt(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.meetupAt ? "true" : "false"}
            aria-describedby={fieldErrors.meetupAt ? describedBy("meetup-at", true) : undefined}
          />
          {fieldErrors.meetupAt ? (
            <p id="meetup-at-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.meetupAt}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <InteractiveCampusPicker
            campus={campus}
            setCampus={setCampus}
            detailLocation={detailLocation}
            setDetailLocation={setDetailLocation}
            customLocation={customLocation}
            setCustomLocation={setCustomLocation}
            mapPoint={mapPoint}
            setMapPoint={setMapPoint}
            fieldError={fieldErrors.location}
          />
        </div>
        <div>
          <label htmlFor="exchange-mode" className="font-bold">
            交換方式
          </label>
          <select
            id="exchange-mode"
            name="exchangeMode"
            value={exchangeMode}
            onChange={(event) => {
              setExchangeMode(event.target.value as ExchangeMode);
              setExchangeValue("");
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.exchangeMode ? "true" : "false"}
            aria-describedby={fieldErrors.exchangeMode ? describedBy("exchange-mode", true) : undefined}
          >
            <option value="price">{MARKETPLACE_EXCHANGE_MODE_LABELS.price}</option>
            <option value="treat_drink">{MARKETPLACE_EXCHANGE_MODE_LABELS.treat_drink}</option>
            <option value="treat_food">{MARKETPLACE_EXCHANGE_MODE_LABELS.treat_food}</option>
            <option value="free">free</option>
            <option value="custom">{MARKETPLACE_EXCHANGE_MODE_LABELS.custom}</option>
          </select>
          {fieldErrors.exchangeMode ? (
            <p id="exchange-mode-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.exchangeMode}
            </p>
          ) : null}
        </div>
        <div>
          {exchangeMode === "price" ? (
            <>
              <label htmlFor="exchange-value" className="font-bold">
                價格(台幣)
              </label>
              <input
                id="exchange-value"
                name="exchangeValue"
                type="number"
                min="0"
                step="0.01"
                value={exchangeValue}
                onChange={(event) => setExchangeValue(event.target.value)}
                placeholder="例如：50"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
                aria-invalid={fieldErrors.exchangeValue ? "true" : "false"}
                aria-describedby={fieldErrors.exchangeValue ? describedBy("exchange-value", true) : undefined}
              />
            </>
          ) : null}
          {exchangeMode === "treat_drink" ? (
            <>
              <label htmlFor="exchange-value" className="font-bold">
                請喝內容
              </label>
              <input
                id="exchange-value"
                name="exchangeValue"
                value={exchangeValue}
                onChange={(event) => setExchangeValue(event.target.value)}
                placeholder="例如：大杯無糖綠"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
                aria-invalid={fieldErrors.exchangeValue ? "true" : "false"}
                aria-describedby={fieldErrors.exchangeValue ? describedBy("exchange-value", true) : undefined}
              />
            </>
          ) : null}
          {exchangeMode === "treat_food" ? (
            <>
              <label htmlFor="exchange-value" className="font-bold">
                請吃內容
              </label>
              <input
                id="exchange-value"
                name="exchangeValue"
                value={exchangeValue}
                onChange={(event) => setExchangeValue(event.target.value)}
                placeholder="例如：雞腿便當"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
                aria-invalid={fieldErrors.exchangeValue ? "true" : "false"}
                aria-describedby={fieldErrors.exchangeValue ? describedBy("exchange-value", true) : undefined}
              />
            </>
          ) : null}
          {exchangeMode === "free" ? (
            <div className="rounded-lg bg-campus-paper px-4 py-3 text-sm font-semibold text-campus-ink">
              此次面交將以免費贈送顯示。
            </div>
          ) : null}
          {exchangeMode === "custom" ? (
            <>
              <label htmlFor="exchange-value" className="font-bold">
                交換內容描述
              </label>
              <input
                id="exchange-value"
                name="exchangeValue"
                value={exchangeValue}
                onChange={(event) => setExchangeValue(event.target.value)}
                placeholder="例如：交換大二英文課本、一個便當等"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
                aria-invalid={fieldErrors.exchangeValue ? "true" : "false"}
                aria-describedby={fieldErrors.exchangeValue ? describedBy("exchange-value", true) : undefined}
              />
            </>
          ) : null}
          {fieldErrors.exchangeValue ? (
            <p id="exchange-value-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.exchangeValue}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className="font-bold">
            備註
          </label>
          <textarea
            id="note"
            name="note"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            placeholder="例如：請提前十分鐘私訊我"
            aria-invalid={fieldErrors.note ? "true" : "false"}
            aria-describedby={fieldErrors.note ? describedBy("note", true) : undefined}
          />
          {fieldErrors.note ? (
            <p id="note-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.note}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "建立中..." : "送出面交預約"}
      </button>
    </form>
  );
}
