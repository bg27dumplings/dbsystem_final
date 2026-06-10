import type { MarketplaceExchangeMode } from "@/lib/marketplace/types";

export function ExchangeSummary({
  exchangeMode,
  exchangeLabel,
  salePrice,
  originalPrice
}: {
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  salePrice?: number;
  originalPrice?: number;
}) {
  if (exchangeMode === "price" && typeof salePrice === "number") {
    return (
      <div className="flex items-center gap-2">
        <p className="text-lg font-black text-campus-ink">NT$ {salePrice}</p>
        {originalPrice !== undefined && originalPrice > salePrice && (
          <p className="text-sm font-bold text-slate-400 line-through">NT$ {originalPrice}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-bold text-campus-ink">{exchangeLabel}</p>
      {originalPrice !== undefined && originalPrice > 0 && (
        <p className="text-sm font-bold text-slate-400 line-through">NT$ {originalPrice}</p>
      )}
    </div>
  );
}
