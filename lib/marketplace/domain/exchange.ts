import {
  MARKETPLACE_EXCHANGE_MODE_LABELS,
  MARKETPLACE_EXCHANGE_MODES
} from "@/lib/marketplace/domain/constants";
import type { MarketplaceExchangeMode } from "@/lib/marketplace/domain/models";

export type SupportedExchangeMode = MarketplaceExchangeMode;

export type ExchangeDescriptor = {
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  exchangeValue?: string;
};

function formatPriceLabel(amount: number) {
  return `${MARKETPLACE_EXCHANGE_MODE_LABELS.price}：NT$ ${amount}`;
}

export function normalizeExchangeMode(exchangeMode: string): SupportedExchangeMode | null {
  if (!MARKETPLACE_EXCHANGE_MODES.includes(exchangeMode as (typeof MARKETPLACE_EXCHANGE_MODES)[number])) {
    return null;
  }

  return exchangeMode as SupportedExchangeMode;
}

export function inferExchangeFromStoredValues(salePrice: number | null, exchangeNote: string): ExchangeDescriptor {
  const note = exchangeNote.trim();

  if (salePrice !== null) {
    return {
      exchangeMode: "price",
      exchangeLabel: formatPriceLabel(Number(salePrice)),
      exchangeValue: String(Number(salePrice))
    };
  }

  if (note === MARKETPLACE_EXCHANGE_MODE_LABELS.free) {
    return {
      exchangeMode: "free",
      exchangeLabel: MARKETPLACE_EXCHANGE_MODE_LABELS.free
    };
  }

  if (note.startsWith(`${MARKETPLACE_EXCHANGE_MODE_LABELS.treat_drink}：`)) {
    return {
      exchangeMode: "treat_drink",
      exchangeLabel: note,
      exchangeValue: note.slice(`${MARKETPLACE_EXCHANGE_MODE_LABELS.treat_drink}：`.length)
    };
  }

  if (note.startsWith(`${MARKETPLACE_EXCHANGE_MODE_LABELS.treat_food}：`)) {
    return {
      exchangeMode: "treat_food",
      exchangeLabel: note,
      exchangeValue: note.slice(`${MARKETPLACE_EXCHANGE_MODE_LABELS.treat_food}：`.length)
    };
  }

  return {
    exchangeMode: "custom",
    exchangeLabel: note,
    exchangeValue: note || undefined
  };
}

export function buildExchangeDescriptor(exchangeMode: SupportedExchangeMode, exchangeValue: string): ExchangeDescriptor | null {
  const trimmedValue = exchangeValue.trim();

  if (exchangeMode === "price") {
    const parsed = Number(trimmedValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return {
      exchangeMode,
      exchangeLabel: formatPriceLabel(parsed),
      exchangeValue: trimmedValue
    };
  }

  if (exchangeMode === "free") {
    return {
      exchangeMode,
      exchangeLabel: MARKETPLACE_EXCHANGE_MODE_LABELS.free
    };
  }

  if (exchangeMode === "custom") {
    if (!trimmedValue) {
      return null;
    }
    return {
      exchangeMode,
      exchangeLabel: trimmedValue,
      exchangeValue: trimmedValue
    };
  }

  if (!trimmedValue) {
    return null;
  }

  const label =
    exchangeMode === "treat_drink"
      ? MARKETPLACE_EXCHANGE_MODE_LABELS.treat_drink
      : MARKETPLACE_EXCHANGE_MODE_LABELS.treat_food;

  return {
    exchangeMode,
    exchangeLabel: `${label}：${trimmedValue}`,
    exchangeValue: trimmedValue
  };
}

export function resolveStoredExchange(
  exchangeMode: string | null,
  exchangeValue: string | null,
  salePrice: number | null,
  exchangeNote: string
): ExchangeDescriptor {
  const normalizedMode = exchangeMode ? normalizeExchangeMode(exchangeMode) : null;

  if (normalizedMode === "price") {
    const descriptor = buildExchangeDescriptor("price", exchangeValue?.trim() || (salePrice === null ? "" : String(Number(salePrice))));
    if (descriptor) {
      return descriptor;
    }
  }

  if (normalizedMode === "free") {
    return buildExchangeDescriptor("free", "")!;
  }

  if (normalizedMode === "treat_drink" || normalizedMode === "treat_food") {
    const descriptor = buildExchangeDescriptor(normalizedMode, exchangeValue ?? "");
    if (descriptor) {
      return descriptor;
    }
  }

  if (normalizedMode === "custom") {
    const descriptor = buildExchangeDescriptor("custom", exchangeValue ?? "");
    if (descriptor) {
      return descriptor;
    }
  }

  return inferExchangeFromStoredValues(salePrice, exchangeNote);
}
