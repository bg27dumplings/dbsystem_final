import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import {
  type CreateMarketplaceItemFieldErrors,
  type ValidatedMarketplaceItemInput
} from "@/lib/marketplace/domain/create-item";
import { MARKETPLACE_CONDITION_OPTIONS } from "@/lib/marketplace/domain/constants";
import { buildExchangeDescriptor, normalizeExchangeMode } from "@/lib/marketplace/domain/exchange";
import { findActiveMarketplaceCategories } from "@/lib/marketplace/infrastructure/category-repository";
import {
  findOwnedMarketplaceItemActionContext,
  findOwnedMarketplaceItemImages
} from "@/lib/marketplace/infrastructure/item-repository";
import { removeStoredMarketplaceImage, storeMarketplaceImage } from "@/lib/marketplace/infrastructure/item-storage";
import {
  deleteMarketplaceItemImagesByIds,
  insertMarketplaceItemImage,
  updateMarketplaceItem,
  updateMarketplaceItemImageOrdering,
  updateMarketplaceItemStatus
} from "@/lib/marketplace/infrastructure/item-write-repository";

export type UpdateMarketplaceItemFieldErrors = CreateMarketplaceItemFieldErrors & {
  keptImageIds?: string;
  imageOrder?: string;
};

export type UpdateMarketplaceItemResult =
  | { ok: true; itemId: string }
  | { ok: false; formError: string; fieldErrors: UpdateMarketplaceItemFieldErrors };

export type ChangeMarketplaceItemStatusResult =
  | { ok: true; itemId: string; nextStatus: "active" | "removed" | "deleted" }
  | { ok: false; formError: string };

type ImageOrderToken =
  | { kind: "existing"; imageId: number }
  | { kind: "new"; localId: string };

function canEditItemStatus(status: string) {
  return status === "active" || status === "removed";
}

function buildExchangeDetails(exchangeMode: string, exchangeValue: string) {
  const normalizedExchangeMode = normalizeExchangeMode(exchangeMode);
  if (!normalizedExchangeMode) {
    return {
      ok: false as const,
      field: "exchangeMode" as const,
      message: "請選擇有效的交換條件。"
    };
  }

  const descriptor = buildExchangeDescriptor(normalizedExchangeMode, exchangeValue);
  if (!descriptor) {
    return {
      ok: false as const,
      field: "exchangeValue" as const,
      message: normalizedExchangeMode === "price" ? "請輸入大於或等於 0 的價格。" : "請補充交換內容。"
    };
  }

  return {
    ok: true as const,
    exchangeMode: normalizedExchangeMode,
    exchangeLabel: descriptor.exchangeLabel,
    exchangeValue: descriptor.exchangeValue ?? null,
    originalPrice: 0,
    salePrice: normalizedExchangeMode === "price" ? Number(descriptor.exchangeValue) : null,
    exchangeNote: descriptor.exchangeLabel
  };
}

function parseImageOrderTokens(imageOrder: string[]) {
  const tokens: ImageOrderToken[] = [];

  for (const token of imageOrder) {
    if (token.startsWith("existing:")) {
      const parsed = Number(token.slice("existing:".length));
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
      }

      tokens.push({ kind: "existing", imageId: parsed });
      continue;
    }

    if (token.startsWith("new:")) {
      const localId = token.slice("new:".length).trim();
      if (!localId) {
        return null;
      }

      tokens.push({ kind: "new", localId });
      continue;
    }

    return null;
  }

  return tokens;
}

async function validateUpdateMarketplaceItemInput(input: {
  itemId: string;
  studentId: number;
  title: string;
  categoryId: string;
  conditionLabel: string;
  location: string;
  exchangeMode: string;
  exchangeValue: string;
  description: string;
  keptImageIds: string[];
  imageOrder: string[];
  newImageFiles: File[];
  newImageKeys: string[];
}): Promise<
  | {
      ok: true;
      value: ValidatedMarketplaceItemInput & {
        itemId: number;
        existingImageIdsInOrder: number[];
        imageOrderTokens: ImageOrderToken[];
        newImageMap: Map<string, File>;
      };
    }
  | {
      ok: false;
      fieldErrors: UpdateMarketplaceItemFieldErrors;
      formError: string;
    }
> {
  const fieldErrors: UpdateMarketplaceItemFieldErrors = {};
  const itemId = input.itemId.trim();
  const title = input.title.trim();
  const categoryId = input.categoryId.trim();
  const conditionLabel = input.conditionLabel.trim();
  const location = input.location.trim();
  const description = input.description.trim();

  if (!itemId) {
    fieldErrors.title = "找不到要更新的物品。";
  }

  const actionContext = itemId ? await findOwnedMarketplaceItemActionContext(input.studentId, itemId) : null;
  if (!actionContext) {
    return {
      ok: false,
      formError: "找不到這筆物品，或你目前沒有權限操作。",
      fieldErrors: {}
    };
  }

  if (!canEditItemStatus(actionContext.status)) {
    return {
      ok: false,
      formError: "這筆物品目前無法編輯。",
      fieldErrors: {}
    };
  }

  if (!title) {
    fieldErrors.title = "請輸入物品名稱。";
  }

  const categories = await findActiveMarketplaceCategories();
  const matchedCategory = categories.find((category) => category.id === categoryId);
  if (!matchedCategory) {
    fieldErrors.categoryId = "請選擇有效的分類。";
  }

  if (!conditionLabel) {
    fieldErrors.conditionLabel = "請選擇新舊程度。";
  } else if (!MARKETPLACE_CONDITION_OPTIONS.includes(conditionLabel as (typeof MARKETPLACE_CONDITION_OPTIONS)[number])) {
    fieldErrors.conditionLabel = "請選擇有效的新舊程度。";
  }

  if (!location) {
    fieldErrors.location = "請輸入面交地點。";
  }

  const exchangeDetails = buildExchangeDetails(input.exchangeMode.trim(), input.exchangeValue);
  if (!exchangeDetails.ok) {
    fieldErrors[exchangeDetails.field] = exchangeDetails.message;
  }

  if (!description) {
    fieldErrors.description = "請輸入詳細描述。";
  }

  const existingImages = await findOwnedMarketplaceItemImages(input.studentId, itemId);
  const existingImageIdSet = new Set(existingImages.map((image) => image.id));
  const keptImageIds = input.keptImageIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
  const keptImageIdSet = new Set(keptImageIds);

  if (keptImageIds.length !== input.keptImageIds.length || keptImageIds.some((value) => !existingImageIdSet.has(value))) {
    fieldErrors.keptImageIds = "圖片保留清單無效，請重新整理後再試。";
  }

  if (keptImageIds.length !== keptImageIdSet.size) {
    fieldErrors.keptImageIds = "圖片保留清單重複，請重新整理後再試。";
  }

  const imageOrderTokens = parseImageOrderTokens(input.imageOrder);
  if (!imageOrderTokens) {
    fieldErrors.imageOrder = "圖片排序資料無效，請重新整理後再試。";
  }

  const newImageMap = new Map<string, File>();
  for (const [index, key] of input.newImageKeys.entries()) {
    const trimmedKey = key.trim();
    const file = input.newImageFiles[index];
    if (!trimmedKey || !file) {
      fieldErrors.imageOrder = "新圖片排序資料無效，請重新整理後再試。";
      continue;
    }

    if (newImageMap.has(trimmedKey)) {
      fieldErrors.imageOrder = "新圖片排序資料重複，請重新整理後再試。";
      continue;
    }

    newImageMap.set(trimmedKey, file);
  }

  if (input.newImageFiles.some((file) => !file.type.startsWith("image/"))) {
    fieldErrors.images = "只接受圖片檔案格式。";
  }

  const finalImageCount = keptImageIds.length + input.newImageFiles.length;
  if (finalImageCount === 0) {
    fieldErrors.images = "請至少保留或上傳 1 張圖片。";
  } else if (finalImageCount > 5) {
    fieldErrors.images = "最多只能保留或上傳 5 張圖片。";
  }

  if (imageOrderTokens) {
    if (imageOrderTokens.length !== finalImageCount) {
      fieldErrors.imageOrder = "圖片排序數量不正確，請重新整理後再試。";
    }

    const orderedExistingIds = imageOrderTokens.filter((token): token is Extract<ImageOrderToken, { kind: "existing" }> => token.kind === "existing").map((token) => token.imageId);
    const orderedNewIds = imageOrderTokens.filter((token): token is Extract<ImageOrderToken, { kind: "new" }> => token.kind === "new").map((token) => token.localId);

    if (orderedExistingIds.length !== keptImageIds.length || orderedExistingIds.some((id) => !keptImageIdSet.has(id))) {
      fieldErrors.imageOrder = "既有圖片排序與保留清單不一致。";
    }

    if (orderedNewIds.length !== input.newImageFiles.length || orderedNewIds.some((id) => !newImageMap.has(id))) {
      fieldErrors.imageOrder = "新圖片排序與上傳檔案不一致。";
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !matchedCategory || !exchangeDetails.ok || !imageOrderTokens) {
    return {
      ok: false,
      fieldErrors,
      formError: "請先修正欄位內容。"
    };
  }

  return {
    ok: true,
    value: {
      itemId: Number(itemId),
      studentId: input.studentId,
      title,
      categoryId: Number(matchedCategory.id),
      conditionLabel,
      location,
      exchangeMode: exchangeDetails.exchangeMode,
      exchangeLabel: exchangeDetails.exchangeLabel,
      exchangeValue: exchangeDetails.exchangeValue,
      originalPrice: exchangeDetails.originalPrice,
      salePrice: exchangeDetails.salePrice,
      exchangeNote: exchangeDetails.exchangeNote,
      description,
      images: input.newImageFiles,
      existingImageIdsInOrder: imageOrderTokens
        .filter((token): token is Extract<ImageOrderToken, { kind: "existing" }> => token.kind === "existing")
        .map((token) => token.imageId),
      imageOrderTokens,
      newImageMap
    }
  };
}

export async function updateMarketplaceItemDetails(input: {
  itemId: string;
  studentId: number;
  title: string;
  categoryId: string;
  conditionLabel: string;
  location: string;
  exchangeMode: string;
  exchangeValue: string;
  description: string;
  keptImageIds: string[];
  imageOrder: string[];
  newImageFiles: File[];
  newImageKeys: string[];
}): Promise<UpdateMarketplaceItemResult> {
  const validation = await validateUpdateMarketplaceItemInput(input);
  if (!validation.ok) {
    return validation;
  }

  const existingImages = await findOwnedMarketplaceItemImages(validation.value.studentId, String(validation.value.itemId));
  const keptImageIdSet = new Set(validation.value.existingImageIdsInOrder);
  const removedImages = existingImages.filter((image) => !keptImageIdSet.has(image.id));
  const pool = getDbPool();
  const connection = await pool.getConnection();
  const storedPaths: string[] = [];

  try {
    await connection.beginTransaction();

    await updateMarketplaceItem(connection, {
      itemId: validation.value.itemId,
      studentId: validation.value.studentId,
      categoryId: validation.value.categoryId,
      title: validation.value.title,
      description: validation.value.description,
      exchangeNote: validation.value.exchangeNote,
      conditionLabel: validation.value.conditionLabel,
      location: validation.value.location,
      originalPrice: validation.value.originalPrice,
      salePrice: validation.value.salePrice
    });

    await deleteMarketplaceItemImagesByIds(connection, {
      itemId: validation.value.itemId,
      imageIds: removedImages.map((image) => image.id)
    });

    const newStoredImageIdMap = new Map<string, number>();
    for (const token of validation.value.imageOrderTokens) {
      if (token.kind !== "new") {
        continue;
      }

      const file = validation.value.newImageMap.get(token.localId);
      if (!file) {
        throw new Error("新圖片資料遺失，請重新上傳。");
      }

      const storedImage = await storeMarketplaceImage(file);
      storedPaths.push(storedImage.storagePath);
      const imageId = await insertMarketplaceItemImage(connection, {
        itemId: validation.value.itemId,
        storagePath: storedImage.storagePath,
        publicUrl: storedImage.publicUrl,
        altText: `${validation.value.title} 照片 ${newStoredImageIdMap.size + 1}`,
        mimeType: storedImage.mimeType,
        fileSize: storedImage.fileSize,
        sortOrder: 0,
        isPrimary: false
      });
      newStoredImageIdMap.set(token.localId, imageId);
    }

    for (const [index, token] of validation.value.imageOrderTokens.entries()) {
      const imageId = token.kind === "existing" ? token.imageId : newStoredImageIdMap.get(token.localId);
      if (!imageId) {
        throw new Error("圖片排序失敗，請重新整理後再試。");
      }

      await updateMarketplaceItemImageOrdering(connection, {
        imageId,
        itemId: validation.value.itemId,
        sortOrder: index,
        isPrimary: index === 0
      });
    }

    await connection.commit();

    await Promise.all(removedImages.map((image) => removeStoredMarketplaceImage(image.storagePath)));
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/items/${validation.value.itemId}`);
    revalidatePath("/me/items");
    revalidatePath(`/me/items/${validation.value.itemId}/edit`);

    return {
      ok: true,
      itemId: String(validation.value.itemId)
    };
  } catch (error) {
    await connection.rollback();
    await Promise.all(storedPaths.map(removeStoredMarketplaceImage));

    return {
      ok: false,
      formError: error instanceof Error ? error.message : "物品更新失敗，請稍後再試。",
      fieldErrors: {}
    };
  } finally {
    connection.release();
  }
}

export async function changeMarketplaceItemStatus(input: {
  itemId: string;
  studentId: number;
  action: "deactivate" | "reactivate" | "delete";
}): Promise<ChangeMarketplaceItemStatusResult> {
  const item = await findOwnedMarketplaceItemActionContext(input.studentId, input.itemId);
  if (!item) {
    return {
      ok: false,
      formError: "找不到這筆物品，或你目前沒有權限操作。"
    };
  }

  const actionRules = {
    deactivate: { allowedStatus: "active", nextStatus: "removed" as const, error: "只有上架中的物品可以下架。" },
    reactivate: { allowedStatus: "removed", nextStatus: "active" as const, error: "只有已下架的物品可以重新上架。" },
    delete: {
      allowedStatus: item.status === "active" || item.status === "removed" ? item.status : null,
      nextStatus: "deleted" as const,
      error: "只有上架中或已下架的物品可以刪除。"
    }
  } as const;

  const rule = actionRules[input.action];
  if (item.status !== rule.allowedStatus) {
    return {
      ok: false,
      formError: rule.error
    };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await updateMarketplaceItemStatus(connection, {
      itemId: Number(input.itemId),
      studentId: input.studentId,
      nextStatus: rule.nextStatus
    });
    await connection.commit();

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/items/${input.itemId}`);
    revalidatePath("/me/items");
    revalidatePath(`/me/items/${input.itemId}/edit`);

    return {
      ok: true,
      itemId: input.itemId,
      nextStatus: rule.nextStatus
    };
  } catch {
    await connection.rollback();
    return {
      ok: false,
      formError: "物品狀態更新失敗，請稍後再試。"
    };
  } finally {
    connection.release();
  }
}
