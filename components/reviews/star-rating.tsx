"use client";

type StarRatingProps = {
  value: number;
  max?: number;
  readonly?: boolean;
  showScore?: boolean;
  onChange?: (value: number) => void;
  label?: string;
};

export function StarRating({ value, max = 5, readonly = false, showScore = true, onChange, label = "評價" }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" role={readonly ? "img" : "group"} aria-label={`${label} ${value} 星`}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;

        if (readonly) {
          return (
            <span key={starValue} className={filled ? "text-campus-gold" : "text-slate-300"} aria-hidden="true">
              ★
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange?.(starValue)}
            className={filled ? "text-campus-gold" : "text-slate-300"}
            aria-label={`${starValue} 星`}
          >
            ★
          </button>
        );
      })}
      {readonly && showScore ? <span className="ml-2 text-sm font-bold text-slate-700">{value.toFixed(1)}</span> : null}
    </div>
  );
}
