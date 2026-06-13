import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import {
  CreateMarketplaceItemFieldErrors,
  CreateMarketplaceItemInput,
  CreateMarketplaceItemResult,
  ValidatedMarketplaceItemInput
} from "@/lib/marketplace/domain/create-item";
import { MARKETPLACE_CONDITION_OPTIONS } from "@/lib/marketplace/domain/constants";
import { buildExchangeDescriptor, normalizeExchangeMode } from "@/lib/marketplace/domain/exchange";
import { findActiveMarketplaceCategories } from "@/lib/marketplace/infrastructure/category-repository";
import { removeStoredMarketplaceImage, storeMarketplaceImage } from "@/lib/marketplace/infrastructure/item-storage";
import { insertMarketplaceItem, insertMarketplaceItemImage } from "@/lib/marketplace/infrastructure/item-write-repository";
import { checkContentSafety } from "@/lib/ai/ollama-service";

function parseNonNegativeNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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

async function validateCreateMarketplaceItemInput(
  input: CreateMarketplaceItemInput
): Promise<
  | {
      ok: true;
      value: ValidatedMarketplaceItemInput;
    }
  | {
      ok: false;
      fieldErrors: CreateMarketplaceItemFieldErrors;
      formError: string;
    }
> {
  const title = input.title.trim();
  const categoryId = input.categoryId.trim();
  const conditionLabel = input.conditionLabel.trim();
  const location = input.location.trim();
  const description = input.description.trim();
  const fieldErrors: CreateMarketplaceItemFieldErrors = {};

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

  const quantity = Number(input.quantity.trim() || "1");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    fieldErrors.quantity = "請輸入 1 到 99 的數量。";
  }

  const exchangeDetails = buildExchangeDetails(input.exchangeMode.trim(), input.exchangeValue);
  if (!exchangeDetails.ok) {
    fieldErrors[exchangeDetails.field] = exchangeDetails.message;
  }

  if (!description) {
    fieldErrors.description = "請輸入詳細描述。";
  }

  if (input.images.length === 0) {
    fieldErrors.images = "請至少上傳 1 張圖片。";
  } else if (input.images.length > 5) {
    fieldErrors.images = "最多只能上傳 5 張圖片。";
  } else if (input.images.some((file) => !file.type.startsWith("image/"))) {
    fieldErrors.images = "只接受圖片檔案格式。";
  }

  if (Object.keys(fieldErrors).length > 0 || !matchedCategory || !exchangeDetails.ok) {
    return {
      ok: false,
      fieldErrors,
      formError: "請先修正欄位內容。"
    };
  }

  return {
    ok: true,
    value: {
      studentId: input.studentId,
      title,
      categoryId: Number(matchedCategory.id),
      conditionLabel,
      location,
      quantity,
      locationX: input.locationX.trim() ? Number(input.locationX) : null,
      locationY: input.locationY.trim() ? Number(input.locationY) : null,
      exchangeMode: exchangeDetails.exchangeMode,
      exchangeLabel: exchangeDetails.exchangeLabel,
      exchangeValue: exchangeDetails.exchangeValue,
      originalPrice: exchangeDetails.originalPrice,
      salePrice: exchangeDetails.salePrice,
      exchangeNote: exchangeDetails.exchangeNote,
      description,
      images: input.images
    }
  };
}

export async function createMarketplaceItem(input: CreateMarketplaceItemInput): Promise<CreateMarketplaceItemResult> {
  const validation = await validateCreateMarketplaceItemInput(input);
  if (!validation.ok) {
    return validation;
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();
  const storedPaths: string[] = [];

  try {
    const imageBase64s = await Promise.all(
      validation.value.images.slice(0, 3).map(async (f) => {
        const buffer = await f.arrayBuffer();
        return `data:${f.type};base64,${Buffer.from(buffer).toString("base64")}`;
      })
    );
    const safetyCheck = await checkContentSafety(validation.value.title, validation.value.description, imageBase64s);
    const initialStatus = safetyCheck.safe ? "active" : "ai_blocked";

    await connection.beginTransaction();

    const itemId = await insertMarketplaceItem(connection, { 
      ...validation.value, 
      status: initialStatus,
      isAiBlocked: !safetyCheck.safe,
      removedReason: !safetyCheck.safe ? safetyCheck.reason : undefined
    });

    for (const [index, image] of validation.value.images.entries()) {
      const storedImage = await storeMarketplaceImage(image);
      storedPaths.push(storedImage.storagePath);

      await insertMarketplaceItemImage(connection, {
        itemId,
        storagePath: storedImage.storagePath,
        publicUrl: storedImage.publicUrl,
        altText: `${validation.value.title} 照片 ${index + 1}`,
        mimeType: storedImage.mimeType,
        fileSize: storedImage.fileSize,
        sortOrder: index,
        isPrimary: index === 0
      });
    }

    await connection.commit();
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/me/items");

    return {
      ok: true,
      itemId: String(itemId)
    };
  } catch (error) {
    await connection.rollback();
    await Promise.all(storedPaths.map(removeStoredMarketplaceImage));

    const formError = error instanceof Error ? error.message : "物品建立失敗，請稍後再試。";

    return {
      ok: false,
      fieldErrors: {},
      formError
    };
  } finally {
    connection.release();
  }
}
