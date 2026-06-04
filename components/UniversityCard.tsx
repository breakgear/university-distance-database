import Link from "next/link";
import { University } from "@/data/universities";

export function UniversityCard({ university }: { university: University }) {
  return (
    <Link href={`/universities/${university.id}`} className="group block overflow-hidden rounded-lg border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative h-5 overflow-hidden bg-field" aria-hidden="true">
        <span className="absolute -left-2 top-0 h-8 w-16 -skew-x-[28deg]" style={{ backgroundColor: university.accent }} />
        <span className="absolute left-16 top-0 h-8 w-2 -skew-x-[28deg] bg-white" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-ink group-hover:text-sash-red">{university.name}</h3>
          <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{university.sashColor}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{university.profile}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-field p-3">
            <dt className="font-bold text-slate-500">エリア</dt>
            <dd className="mt-1 font-black text-ink">{university.area}</dd>
          </div>
          <div className="rounded-md bg-field p-3">
            <dt className="font-bold text-slate-500">走り方</dt>
            <dd className="mt-1 font-black text-ink">{university.style}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
