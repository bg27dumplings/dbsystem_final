import type { MarketplaceExchangeMode } from "@/lib/marketplace/types";

export function ExchangeSummary({
  exchangeMode,
  exchangeLabel,
  salePrice
}: {
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  salePrice?: number;
}) {
  if (exchangeMode === "price" && typeof salePrice === "number") {
    return <p className="text-lg font-black text-campus-ink">NT$ {salePrice}</p>;
  }

  return <p className="text-sm font-bold text-campus-ink">{exchangeLabel}</p>;
}
