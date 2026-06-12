import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Database, Flag, ListFilter, Palette, Rows3, Tags } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { athletes } from "@/data/athletes";
import { buildUniversityPbRankings, universities, University } from "@/data/universities";
import { getUpcomingEntriesByUniversityId } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

type UniversityFilter = "all" | "kanto" | "1500m" | "5000m" | "10000m" | "half" | "upcoming" | "result";

const filters: Array<{ label: string; value: UniversityFilter }> = [
  { label: "すべて", value: "all" },
  { label: "関東", value: "kanto" },
  { label: "1500m掲載あり", value: "1500m" },
  { label: "5000m掲載あり", value: "5000m" },
  { label: "10000m掲載あり", value: "10000m" },
  { label: "ハーフ掲載あり", value: "half" },
  { label: "出場予定あり", value: "upcoming" },
  { label: "結果あり", value: "result" }
];

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const selectedFilter = filters.some((item) => item.value === filter) ? (filter as UniversityFilter) : "all";
  const filteredUniversities = universities.filter((university) => matchesUniversityFilter(university, selectedFilter));
  const universityPbRankings = buildUniversityPbRankings(universities, athletes);
  const universityIdByName = new Map(universities.map((university) => [university.name, university.id]));
  const athleteIdByName = new Map(athletes.map((athlete) => [athlete.name, athlete.id]));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-8 sm:pt-10">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">大学</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-gold/25" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">大学一覧</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">大学一覧</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝の掲載大学を確認できます。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={18} />} label="掲載内容" value="大学名 / 襷カラー / PB / 結果" />
            <InfoCard icon={<Tags size={18} />} label="対象カテゴリ" value="男子大学長距離 / 男子大学駅伝" />
            <InfoCard icon={<Database size={18} />} label="掲載データ" value="2026年シーズン中心" />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ListFilter size={20} className="text-sash-red" />
          <h2 className="text-xl font-black text-ink">フィルター</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            {filters.map((filterItem) => (
              <Link
                key={filterItem.value}
                href={filterItem.value === "all" ? "/universities" : `/universities?filter=${encodeURIComponent(filterItem.value)}`}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black",
                  filterItem.value === selectedFilter
                    ? "border-sash-red bg-red-50 text-sash-red"
                    : filterItem.value === "all"
                      ? "border-line bg-white text-ink"
                      : "border-line bg-field text-slate-700"
                )}
              >
                {filterItem.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="掲載中の大学" description="大学名、襷カラー、掲載種目、出場予定、最近の結果をカードで表示しています。" />
        {filteredUniversities.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredUniversities.map((university) => (
              <UniversityListCard key={university.id} university={university} />
            ))}
          </div>
        ) : (
          <EmptyState title="掲載大学がありません" description="現在、表示できる大学データはありません。" actions={[{ href: "/", label: "トップページへ戻る", primary: true }]} />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="大学別PB上位" description="掲載データ内で、各大学の最上位PBを種目別に表示しています。" />
        <div className="grid gap-3 lg:grid-cols-2">
          {universityPbRankings.map((ranking) => (
            <article key={ranking.event} className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
              <div className="border-b border-line bg-field px-4 py-3">
                <h3 className="text-base font-black text-ink">{ranking.event} PB上位</h3>
              </div>
              <div className="grid min-w-[360px] grid-cols-[40px_1fr_1fr_92px] border-b border-line px-4 py-2 text-xs font-black text-slate-500">
                <span>順位</span>
                <span>大学</span>
                <span>選手名</span>
                <span>PB</span>
              </div>
              {ranking.entries.slice(0, 3).map((entry) => (
                <div key={`${ranking.event}-${entry.university}`} className="grid min-w-[360px] grid-cols-[40px_1fr_1fr_92px] items-center border-b border-line px-4 py-3 last:border-b-0">
                  <span className="text-sm font-black text-sash-red">{entry.rank}</span>
                  <span className="text-sm font-black text-ink">
                    <Link href={`/universities/${universityIdByName.get(entry.university) ?? ""}`} className="hover:text-sash-red hover:underline">
                      {entry.university}
                    </Link>
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    <Link href={`/athletes/${athleteIdByName.get(entry.athlete) ?? ""}`} className="hover:text-sash-red hover:underline">
                      {entry.athlete}
                    </Link>
                  </span>
                  <span className="text-sm font-black text-ink">{entry.time}</span>
                </div>
              ))}
              {ranking.entries.length === 0 ? (
                <p className="min-w-[360px] px-4 py-3 text-sm font-bold text-slate-500">掲載PBはまだありません。</p>
              ) : null}
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold leading-6 text-slate-500">※掲載データ内のPBです。正式な記録は各大会公式サイトをご確認ください。</p>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" description="表示内容の見方です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard icon={<BookOpen size={22} />} text="大学ページでは、出場予定、最近の結果、種目別PBをまとめて確認できます。" />
          <GuideCard icon={<Palette size={22} />} text="襷カラーは識別用に簡略表示しています。実際の校章やロゴは使用していません。" />
          <GuideCard icon={<Database size={22} />} text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function matchesUniversityFilter(university: University, filter: UniversityFilter) {
  if (filter === "all") return true;
  if (filter === "kanto") return university.listing.region === "関東";
  if (filter === "1500m" || filter === "5000m" || filter === "10000m") return university.listing.events.includes(filter);
  if (filter === "half") return university.listing.events.includes("ハーフ");
  if (filter === "upcoming") return getUpcomingEntriesByUniversityId(university.id).length > 0;
  return university.listing.hasResult;
}

function UniversityListCard({ university }: { university: University }) {
  const nextAppearance = getUpcomingEntriesByUniversityId(university.id)[0];

  return (
    <Link href={`/universities/${university.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark university={university} />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-ink transition-colors group-hover:text-sash-red">{university.name}</h3>
            <span className="mt-1 inline-flex rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">地域：{university.listing.region}</span>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>

      <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        <InfoLine icon={<Rows3 size={16} />} label="掲載種目" value={university.listing.events.join(" / ")} />
        <InfoLine icon={<CalendarDays size={16} />} label="次回出場予定" value={nextAppearance?.meet.meet_name ?? "未登録"} />
        <InfoLine
          icon={<Flag size={16} />}
          label="直近結果"
          value={`${university.listing.latestResult.athlete} / ${university.listing.latestResult.event} / ${university.listing.latestResult.time}`}
        />
      </div>
    </Link>
  );
}

function SashMark({ university }: { university: University }) {
  return (
    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-field" aria-hidden="true">
      <span className="absolute -left-3 top-0 h-16 w-7 -skew-x-[24deg]" style={{ backgroundColor: university.accent }} />
      <span className="absolute left-6 top-0 h-16 w-1.5 -skew-x-[24deg] bg-white" />
    </span>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[22px_104px_1fr] items-start gap-2 rounded-md bg-field px-3 py-2">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className="text-sm font-black text-ink">{value}</span>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-field p-3">
      <div className="mb-2 flex items-center gap-2 text-sash-red">{icon}</div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function GuideCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 text-sash-red">{icon}</div>
      <p className="text-sm font-bold leading-7 text-slate-700">{text}</p>
    </article>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-xl font-black text-ink sm:text-2xl">{title}</h2>
      {description ? <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
