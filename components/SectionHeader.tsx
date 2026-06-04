import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sash-red">{eyebrow}</p> : null}
        <h2 className="text-xl font-black text-ink sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {href ? (
        <Link className="shrink-0 text-sm font-bold text-ink hover:text-sash-red" href={href}>
          すべて見る
        </Link>
      ) : null}
    </div>
  );
}
