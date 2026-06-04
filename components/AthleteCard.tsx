import Link from "next/link";
import { Athlete } from "@/data/athletes";
import { universities } from "@/data/universities";

export function AthleteCard({ athlete }: { athlete: Athlete }) {
  const university = universities.find((item) => item.id === athlete.universityId);

  return (
    <Link href={`/athletes/${athlete.id}`} className="block rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-12 w-2 rounded-full" style={{ backgroundColor: university?.accent ?? "#1f6feb" }} />
        <div>
          <h3 className="text-lg font-black text-ink">{athlete.name}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">
            {university?.name} ・ {athlete.year}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{athlete.specialty}</p>
        </div>
      </div>
    </Link>
  );
}
