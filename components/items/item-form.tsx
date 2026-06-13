"use client";

import { ChangeEvent, FormEvent, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { InteractiveCampusPicker } from "@/components/location/interactive-campus-picker";
import { describedBy } from "@/lib/a11y";
import type { MapCoordinate } from "@/lib/marketplace/domain/models";
import {
  MARKETPLACE_CONDITION_OPTIONS,
  MARKETPLACE_EXCHANGE_MODE_LABELS
} from "@/lib/marketplace/domain/constants";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";
import type { MarketplaceCategory, MarketplaceItem } from "@/lib/marketplace/types";

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

async function compressImageForAI(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
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
  const [conditionLabel, setConditionLabel] = useState<MarketplaceItem["condition"]>((initialValues?.conditionLabel as MarketplaceItem["condition"]) ?? "全新");

  // Parse location string for two-level select
  const parsedLoc = useMemo(() => {
    const locString = initialValues?.location ?? "";
    const parts = locString.split(" - ");
    if (parts[0] === "英才校區" || parts[0] === "民生校區") {
      const campus = parts[0];
      const detail = parts[1] || "其他";
      const custom = parts.slice(2).join(" - ");
      return { campus, detail, custom };
    } else if (parts[0] === "宿舍") {
      const detail = parts[1] || "其他";
      const custom = parts.slice(2).join(" - ");
      return { campus: "民生校區", detail, custom };
    }
    if (locString === "英才校區" || locString === "民生校區" || locString === "宿舍") {
      return { campus: locString === "宿舍" ? "民生校區" : locString, detail: "其他", custom: "" };
    }
    return { campus: "其他", detail: "其他", custom: locString };
  }, [initialValues?.location]);

  const [campus, setCampus] = useState(parsedLoc.campus);
  const [detailLocation, setDetailLocation] = useState(parsedLoc.detail);
  const [customLocation, setCustomLocation] = useState(parsedLoc.custom);
  const [mapPoint, setMapPoint] = useState<MapCoordinate | undefined>(initialValues?.mapPoint);

  const [quantity, setQuantity] = useState(initialValues?.quantity ?? "1");
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>(initialValues?.exchangeMode ?? "price");
  const [exchangeValue, setExchangeValue] = useState(initialValues?.exchangeValue ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>(
    initialValues?.images.map((url) => ({ url, isExisting: true })) ?? []
  );
  const [fieldErrors, setFieldErrors] = useState<CreateMarketplaceItemFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const latestPreviewJob = useRef(0);

  async function handleAiAssist() {
    setIsAiLoading(true);
    setFormError("");
    try {
      let aiImageBase64 = null;
      if (imagePreviews[0]?.url?.startsWith("data:image")) {
         aiImageBase64 = await compressImageForAI(imagePreviews[0].url);
      }

      const response = await fetch("/api/ai/suggest-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: aiImageBase64,
          hints: title || undefined 
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error || "AI 服務失敗");
      } else {
        if (result.title) setTitle(result.title);
        if (result.description) setDescription(result.description);
        if (result.category) {
          const match = categories.find(c => c.name.includes(result.category) || result.category.includes(c.name));
          if (match) setCategoryId(match.id);
        }
      }
    } catch {
      setFormError("無法連線到 AI 服務。");
    } finally {
      setIsAiLoading(false);
    }
  }

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
  
  const conditionIndex = Math.max(0, MARKETPLACE_CONDITION_OPTIONS.indexOf(conditionLabel as any));

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

      const formData = new FormData();
      formData.set("title", title);
      formData.set("categoryId", categoryId);
      formData.set("conditionLabel", conditionLabel);
      formData.set("location", combinedLocation);
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
        setFormError(result.formError ?? "儲存失敗，請檢查輸入內容。");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      window.location.assign(result.redirectTo ?? "/me/items");
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
          <label htmlFor="title" className="font-bold flex items-center justify-between">
            <span>物品名稱</span>
            {!isEdit && (
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isAiLoading || (imagePreviews.length === 0 && !title)}
                className="text-xs font-black text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded disabled:opacity-50"
              >
                {isAiLoading ? "思考中..." : "✨ AI 幫我寫"}
              </button>
            )}
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
          <label htmlFor="condition" className="font-bold flex items-center justify-between">
            <span>新舊程度</span>
            <span className="text-sm font-black text-campus-moss bg-campus-moss/10 px-2 py-0.5 rounded-full">{conditionLabel || MARKETPLACE_CONDITION_OPTIONS[0]}</span>
          </label>
          <div className="mt-4 px-2">
            <input
              id="condition"
              type="range"
              min="0"
              max={MARKETPLACE_CONDITION_OPTIONS.length - 1}
              step="1"
              value={conditionIndex}
              onChange={(e) => setConditionLabel(MARKETPLACE_CONDITION_OPTIONS[Number(e.target.value)] as MarketplaceItem["condition"])}
              className="w-full accent-campus-moss"
              aria-invalid={fieldErrors.conditionLabel ? "true" : "false"}
            />
            <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
              <span>{MARKETPLACE_CONDITION_OPTIONS[0]}</span>
              <span>{MARKETPLACE_CONDITION_OPTIONS[MARKETPLACE_CONDITION_OPTIONS.length - 1]}</span>
            </div>
          </div>
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
