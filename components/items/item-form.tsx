"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CampusMapPicker } from "@/components/location/campus-map-picker";
import { describedBy } from "@/lib/a11y";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";
import {
  MARKETPLACE_CONDITION_OPTIONS,
  MARKETPLACE_EXCHANGE_MODE_LABELS
} from "@/lib/marketplace/domain/constants";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";
import type { MarketplaceCategory } from "@/lib/marketplace/types";

type CreateItemResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateMarketplaceItemFieldErrors;
};

type ImagePreview = {
  file?: File;
  url: string;
  isExisting?: boolean;
};

type ExchangeMode = "price" | "treat_drink" | "treat_food" | "free";

type ItemFormInitialValues = {
  itemId: string;
  title: string;
  categoryId: string;
  conditionLabel: string;
  location: string;
  quantity: string;
  mapPoint?: MapCoordinate;
  exchangeMode: ExchangeMode;
  exchangeValue: string;
  description: string;
  images: string[];
};

function readPreviewUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("preview_failed"));
    reader.readAsDataURL(file);
  });
}

export function ItemForm({
  categories,
  mode = "create",
  initialValues
}: {
  categories: MarketplaceCategory[];
  mode?: "create" | "edit";
  initialValues?: ItemFormInitialValues;
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && initialValues;
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? "");
  const [conditionLabel, setConditionLabel] = useState<string>(initialValues?.conditionLabel ?? MARKETPLACE_CONDITION_OPTIONS[0]);
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? "1");
  const [mapPoint, setMapPoint] = useState<MapCoordinate | undefined>(initialValues?.mapPoint);
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>(initialValues?.exchangeMode ?? "price");
  const [exchangeValue, setExchangeValue] = useState(initialValues?.exchangeValue ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>(
    initialValues?.images.map((url) => ({ url, isExisting: true })) ?? []
  );
  const [fieldErrors, setFieldErrors] = useState<CreateMarketplaceItemFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestPreviewJob = useRef(0);

  async function replaceImages(nextFiles: File[]) {
    const jobId = latestPreviewJob.current + 1;
    latestPreviewJob.current = jobId;

    try {
      const nextPreviews = await Promise.all(
        nextFiles.map(async (file) => ({
          file,
          url: await readPreviewUrl(file)
        }))
      );

      if (latestPreviewJob.current !== jobId) {
        return;
      }

      setImagePreviews(nextPreviews);
      setFieldErrors((current) => ({ ...current, images: undefined }));
    } catch {
      if (latestPreviewJob.current !== jobId) {
        return;
      }

      setImagePreviews([]);
      setFieldErrors((current) => ({ ...current, images: "圖片預覽失敗，請改選其他檔案。" }));
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const existingFiles = imagePreviews.filter((preview) => preview.file).map((preview) => preview.file!);
    const mergedFiles = [...existingFiles, ...selectedFiles].slice(0, 5);
    void replaceImages(mergedFiles);
    event.target.value = "";
  }

  function removeImage(index: number) {
    setImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("categoryId", categoryId);
      formData.set("conditionLabel", conditionLabel);
      formData.set("location", location);
      formData.set("quantity", quantity);
      if (mapPoint) {
        formData.set("locationX", String(mapPoint.x));
        formData.set("locationY", String(mapPoint.y));
      }
      formData.set("exchangeMode", exchangeMode);
      formData.set("exchangeValue", exchangeValue);
      formData.set("description", description);
      imagePreviews.forEach((preview) => {
        if (preview.file) {
          formData.append("images", preview.file);
        }
      });

      const endpoint = isEdit ? `/api/items/${initialValues.itemId}` : "/api/items";
      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        body: formData
      });

      const result = (await response.json()) as CreateItemResponse;
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? (isEdit ? "物品更新失敗，請稍後再試。" : "物品建立失敗，請稍後再試。"));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.push(result.redirectTo ?? "/me/items");
      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
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
      <fieldset className="rounded-lg bg-campus-paper p-4">
        <legend className="px-1 font-black">照片，最多五張</legend>
        <label
          htmlFor="photos"
          className="mt-2 block cursor-pointer rounded-md border-2 border-dashed border-campus-moss bg-white p-6 text-center font-bold text-campus-moss"
        >
          {isEdit ? "若要更換照片請重新選擇，未選擇則保留原本圖片" : "點擊選擇照片，第一張會作為主圖"}
        </label>
        <input
          id="photos"
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          aria-invalid={fieldErrors.images ? "true" : "false"}
          aria-describedby={`photos-help ${fieldErrors.images ? "photos-error" : ""}`.trim()}
        />
        <p id="photos-help" className="mt-2 text-sm text-slate-700">
          {isEdit
            ? "編輯時若不重新上傳圖片，會保留原本照片。若要更換，請重新選擇 1 到 5 張圖片。"
            : "請上傳 1 到 5 張圖片。系統會依照你挑選的順序儲存，第一張就是封面圖。"}
        </p>
        {fieldErrors.images ? (
          <p id="photos-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.images}
          </p>
        ) : null}
        {imagePreviews.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {imagePreviews.map((preview, index) => (
              <figure key={`${preview.url}-${index}`} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10">
                <img src={preview.url} alt={`${preview.file?.name ?? "物品"} 預覽`} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-2 p-3">
                  <p className="text-sm font-bold text-campus-ink">{index === 0 ? "主圖" : `圖片 ${index + 1}`}</p>
                  <p className="text-xs text-slate-600">{preview.file?.name ?? (preview.isExisting ? "目前照片" : "")}</p>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded-md border border-campus-red/20 px-3 py-2 text-sm font-bold text-campus-red"
                  >
                    移除
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="font-bold">
            物品名稱
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.title ? "true" : "false"}
            aria-describedby={fieldErrors.title ? describedBy("title", true) : undefined}
          />
          {fieldErrors.title ? <p id="title-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.title}</p> : null}
        </div>
        <div>
          <label htmlFor="category" className="font-bold">
            分類
          </label>
          <select
            id="category"
            name="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.categoryId ? "true" : "false"}
            aria-describedby={fieldErrors.categoryId ? describedBy("category", true) : undefined}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId ? <p id="category-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.categoryId}</p> : null}
        </div>
        <div>
          <label htmlFor="condition" className="font-bold">
            新舊程度
          </label>
          <select
            id="condition"
            name="conditionLabel"
            value={conditionLabel}
            onChange={(event) => setConditionLabel(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.conditionLabel ? "true" : "false"}
            aria-describedby={fieldErrors.conditionLabel ? describedBy("condition", true) : undefined}
          >
            {MARKETPLACE_CONDITION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.conditionLabel ? (
            <p id="condition-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.conditionLabel}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="exchange-mode" className="font-bold">
            交換條件
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
        <div className="sm:col-span-2">
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
                aria-describedby={`exchange-value-help ${fieldErrors.exchangeValue ? "exchange-value-error" : ""}`.trim()}
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
              此物品將以免費贈送顯示。
            </div>
          ) : null}
          {fieldErrors.exchangeValue ? (
            <p id="exchange-value-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.exchangeValue}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="quantity" className="font-bold">
            數量
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            max="99"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.quantity ? "true" : "false"}
          />
          {fieldErrors.quantity ? <p className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.quantity}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="location" className="font-bold">
            面交地點
          </label>
          <input
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="例如：圖書館一樓、宿舍大廳"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.location ? "true" : "false"}
            aria-describedby={fieldErrors.location ? describedBy("location", true) : undefined}
          />
          {fieldErrors.location ? <p id="location-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.location}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <CampusMapPicker value={mapPoint} onChange={setMapPoint} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="font-bold">
            詳細描述
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.description ? "true" : "false"}
            aria-describedby={fieldErrors.description ? describedBy("description", true) : undefined}
          />
          {fieldErrors.description ? (
            <p id="description-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? (isEdit ? "儲存中..." : "發布中...") : isEdit ? "儲存變更" : "發布上架"}
      </button>
    </form>
  );
}
