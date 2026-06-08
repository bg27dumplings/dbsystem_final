"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { describedBy } from "@/lib/a11y";
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

type ExchangeMode = "price" | "treat_drink" | "treat_food" | "free";

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
  const [location, setLocation] = useState(initialLocation);
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
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          itemId,
          meetupAt,
          location,
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

      window.location.assign(result.redirectTo ?? "/appointments");
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
        <div>
          <label htmlFor="location" className="font-bold">
            面交地點
          </label>
          <input
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            placeholder="例如：圖書館一樓、宿舍大廳"
            aria-invalid={fieldErrors.location ? "true" : "false"}
            aria-describedby={fieldErrors.location ? describedBy("location", true) : undefined}
          />
          {fieldErrors.location ? (
            <p id="location-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.location}
            </p>
          ) : null}
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
