"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { describedBy } from "@/lib/a11y";
import {
  MARKETPLACE_CONDITION_OPTIONS,
  MARKETPLACE_EXCHANGE_MODE_LABELS
} from "@/lib/marketplace/domain/constants";
import type { EditableMarketplaceItem, MarketplaceCategory } from "@/lib/marketplace/domain/models";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";

type ItemFormResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: ItemFormFieldErrors;
};

type SupportedExchangeMode = "price" | "treat_drink" | "treat_food" | "free";
type ItemFormFieldErrors = CreateMarketplaceItemFieldErrors & {
  keptImageIds?: string;
  imageOrder?: string;
};

type ExistingImageEntry = {
  kind: "existing";
  token: `existing:${string}`;
  id: string;
  url: string;
  altText: string;
};

type NewImageEntry = {
  kind: "new";
  token: `new:${string}`;
  localId: string;
  file: File;
  url: string;
};

type ImageEntry = ExistingImageEntry | NewImageEntry;

function readPreviewUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("preview_failed"));
    reader.readAsDataURL(file);
  });
}

function normalizeSupportedExchangeMode(item?: EditableMarketplaceItem): SupportedExchangeMode {
  if (!item) {
    return "price";
  }

  if (item.exchangeMode === "price" || item.exchangeMode === "treat_drink" || item.exchangeMode === "treat_food" || item.exchangeMode === "free") {
    return item.exchangeMode;
  }

  return item.exchangeValue ? "treat_food" : "free";
}

function buildInitialExchangeValue(item?: EditableMarketplaceItem) {
  if (!item) {
    return "";
  }

  return item.exchangeValue ?? "";
}

function buildInitialImageEntries(item?: EditableMarketplaceItem): ImageEntry[] {
  if (!item) {
    return [];
  }

  return item.images.map((image) => ({
    kind: "existing",
    token: `existing:${image.id}`,
    id: image.id,
    url: image.publicUrl,
    altText: image.altText
  }));
}

function moveArrayItem<T>(items: T[], fromIndex: number, direction: -1 | 1) {
  const targetIndex = fromIndex + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(targetIndex, 0, moved);
  return nextItems;
}

export function ItemForm({
  categories,
  mode,
  item
}: {
  categories: MarketplaceCategory[];
  mode: "create" | "edit";
  item?: EditableMarketplaceItem;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [conditionLabel, setConditionLabel] = useState<string>(item?.conditionLabel ?? MARKETPLACE_CONDITION_OPTIONS[0]);
  const [location, setLocation] = useState(item?.location ?? "");
  const [exchangeMode, setExchangeMode] = useState<SupportedExchangeMode>(normalizeSupportedExchangeMode(item));
  const [exchangeValue, setExchangeValue] = useState(buildInitialExchangeValue(item));
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>(buildInitialImageEntries(item));
  const [fieldErrors, setFieldErrors] = useState<ItemFormFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestPreviewJob = useRef(0);
  const isEditMode = mode === "edit" && item;
  const remainingImageSlots = Math.max(0, 5 - imageEntries.length);

  const newImageEntries = useMemo(
    () => imageEntries.filter((entry): entry is NewImageEntry => entry.kind === "new"),
    [imageEntries]
  );

  async function appendImages(nextFiles: File[]) {
    const availableSlots = Math.max(0, 5 - imageEntries.length);
    const filesToAppend = nextFiles.slice(0, availableSlots);
    if (filesToAppend.length === 0) {
      return;
    }

    const jobId = latestPreviewJob.current + 1;
    latestPreviewJob.current = jobId;

    try {
      const nextEntries = await Promise.all(
        filesToAppend.map(async (file) => {
          const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

          return {
            kind: "new" as const,
            token: `new:${localId}` as const,
            localId,
            file,
            url: await readPreviewUrl(file)
          };
        })
      );

      if (latestPreviewJob.current !== jobId) {
        return;
      }

      setImageEntries((current) => [...current, ...nextEntries]);
      setFieldErrors((current) => ({ ...current, images: undefined, keptImageIds: undefined, imageOrder: undefined }));
    } catch {
      if (latestPreviewJob.current !== jobId) {
        return;
      }

      setFieldErrors((current) => ({ ...current, images: "圖片預覽失敗，請改選其他檔案。" }));
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    void appendImages(selectedFiles);
    event.target.value = "";
  }

  function removeImage(token: string) {
    setImageEntries((current) => current.filter((entry) => entry.token !== token));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImageEntries((current) => moveArrayItem(current, index, direction));
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
      formData.set("exchangeMode", exchangeMode);
      formData.set("exchangeValue", exchangeValue);
      formData.set("description", description);

      if (isEditMode) {
        imageEntries.forEach((entry) => {
          formData.append("imageOrder", entry.token);
          if (entry.kind === "existing") {
            formData.append("keptImageIds", entry.id);
          } else {
            formData.append("newImageKeys", entry.localId);
          }
        });

        newImageEntries.forEach((entry) => formData.append("newImages", entry.file));
      } else {
        newImageEntries.forEach((entry) => formData.append("images", entry.file));
      }

      const response = await fetch(isEditMode ? `/api/items/${item.id}` : "/api/items", {
        method: isEditMode ? "PATCH" : "POST",
        body: formData
      });

      const result = (await response.json()) as ItemFormResponse;
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? (isEditMode ? "物品更新失敗，請稍後再試。" : "物品建立失敗，請稍後再試。"));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      window.location.assign(result.redirectTo ?? "/me/items");
      router.refresh();
    } catch {
      setFormError(isEditMode ? "系統忙碌中，更新失敗，請稍後再試。" : "系統忙碌中，請稍後再試。");
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
          點擊選擇照片，第一張會作為主圖
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          disabled={remainingImageSlots === 0}
          aria-invalid={fieldErrors.images || fieldErrors.imageOrder || fieldErrors.keptImageIds ? "true" : "false"}
          aria-describedby={`photos-help ${fieldErrors.images ? "photos-error" : ""}`.trim()}
        />
        <p id="photos-help" className="mt-2 text-sm text-slate-700">
          請上傳 1 到 5 張圖片。你可以調整順序，第一張就是封面圖。
        </p>
        {fieldErrors.images ? (
          <p id="photos-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.images}
          </p>
        ) : null}
        {fieldErrors.imageOrder ? <p className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.imageOrder}</p> : null}
        {fieldErrors.keptImageIds ? <p className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.keptImageIds}</p> : null}
        {imageEntries.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {imageEntries.map((entry, index) => (
              <figure key={entry.token} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10">
                <img
                  src={entry.url}
                  alt={entry.kind === "existing" ? entry.altText : `${entry.file.name} 預覽`}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="space-y-2 p-3">
                  <p className="text-sm font-bold text-campus-ink">{index === 0 ? "主圖" : `圖片 ${index + 1}`}</p>
                  <p className="text-xs text-slate-600">
                    {entry.kind === "existing" ? "既有圖片" : entry.file.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-campus-ink disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      往前
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === imageEntries.length - 1}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-campus-ink disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      往後
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(entry.token)}
                      className="rounded-md border border-campus-red/20 px-3 py-2 text-sm font-bold text-campus-red"
                    >
                      移除
                    </button>
                  </div>
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
              setExchangeMode(event.target.value as SupportedExchangeMode);
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
              此物品將以免費贈送顯示。
            </div>
          ) : null}
          {fieldErrors.exchangeValue ? (
            <p id="exchange-value-error" className="mt-2 text-sm font-semibold text-campus-red">
              {fieldErrors.exchangeValue}
            </p>
          ) : null}
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
        {isSubmitting ? (isEditMode ? "更新中..." : "發布中...") : (isEditMode ? "儲存變更" : "發布上架")}
      </button>
    </form>
  );
}
