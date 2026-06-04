import Link from "next/link";
import { Database } from "lucide-react";

type EmptyAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export function EmptyState({
  title,
  description,
  helper,
  actions = [],
  compact = false
}: {
  title: string;
  description: string;
  helper?: string;
  actions?: EmptyAction[];
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-line bg-white shadow-sm ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-sash-red">
          <Database size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-ink sm:text-lg">{title}</h3>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p>
          {helper ? <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{helper}</p> : null}
          {actions.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.primary
                      ? "inline-flex min-h-10 items-center justify-center rounded-lg bg-sash-red px-4 text-sm font-black text-white shadow-sm transition hover:bg-sash-deepRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2"
                      : "inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-field px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-sash-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
