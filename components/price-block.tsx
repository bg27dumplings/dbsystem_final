export function PriceBlock({ originalPrice, salePrice }: { originalPrice: number; salePrice?: number }) {
  if (!salePrice || salePrice >= originalPrice) {
    return <p className="text-lg font-black text-campus-ink">NT$ {originalPrice}</p>;
  }

  return (
    <div aria-label={`原價 ${originalPrice} 元，折後 ${salePrice} 元`}>
      <p className="text-sm font-semibold text-slate-600 line-through">NT$ {originalPrice}</p>
      <p className="text-xl font-black text-campus-gold">NT$ {salePrice}</p>
    </div>
  );
}
