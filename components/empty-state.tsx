import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-campus-moss/30 bg-white px-6 py-10 text-center shadow-sm ring-1 ring-campus-ink/10">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-campus-moss">Empty State</p>
      <h2 className="mt-3 text-2xl font-black text-campus-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-700">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-5 py-3 font-black text-white hover:bg-campus-ink"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
