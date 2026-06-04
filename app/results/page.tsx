import Link from "next/link";
import { CalendarDays, ChevronRight, Database, ListFilter, MapPin, Rows3, Tags } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { resultCategoryLabels, ResultCategory, resultSummaries, ResultSummary, universityResultGroups } from "@/data/results";
import { cn, formatDate } from "@/lib/utils";

type ResultFilter = "all" | ResultCategory | "5000m" | "10000m" | "ハーフ" | "PB" | "DNS";

const filters: Array<{ label: string; value: ResultFilter }> = [
  { label: "すべて", value: "all" },
  { label: "トラック", value: "track" },
  { label: "ロード", value: "road" },
  { label: "駅伝", value: "ekiden" },
  { label: "5000m", value: "5000m" },
  { label: "10000m", value: "10000m" },
  { label: "ハーフ", value: "ハーフ" },
  { label: "PBあり", value: "PB" },
  { label: "DNSあり", value: "DNS" }
];

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const selectedFilter = filters.some((item) => item.value === filter) ? (filter as ResultFilter) : "all";
  const filteredResults = resultSummaries.filter((result) => matchesResultFilter(result, selectedFilter));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-8 sm:pt-10">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">結果</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-deepRed/15" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">結果一覧</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">結果公開</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">結果一覧</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝の結果公開済みレースを確認できます。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={18} />} label="掲載内容" value="結果 / 順位 / 記録 / 備考" />
            <InfoCard icon={<Tags size={18} />} label="対象カテゴリ" value="トラック / ロード / 駅伝" />
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
                href={filterItem.value === "all" ? "/results" : `/results?filter=${encodeURIComponent(filterItem.value)}`}
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
        <SectionTitle title="公開済み結果" description="公開済みのレース結果をカードで表示しています。" />
        {filteredResults.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredResults.map((result) => (
              <ResultCard key={result.result_id} result={result} />
            ))}
          </div>
        ) : (
          <EmptyState title="公開済みの結果がありません" description="現在、表示できる結果データはありません。" actions={[{ href: "/meets", label: "大会一覧を見る", primary: true }]} />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="最近公開された結果" description="直近で公開された結果を表示しています。" />
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          {resultSummaries.map((result) => (
            <Link key={`recent-${result.result_id}`} href={getResultHref(result)} className="grid gap-2 border-b border-line p-4 transition hover:bg-field/60 last:border-b-0 sm:grid-cols-[104px_1fr_auto_auto] sm:items-center">
              <span className="text-xs font-black text-slate-400">{formatDate(result.date)}</span>
              <span className="min-w-0">
                <span className="block break-words text-sm font-black text-ink">{result.meet_name} {result.race_name}</span>
                <span className="block text-xs font-bold text-slate-500">{result.winner_name}</span>
              </span>
              <span className="text-sm font-black text-sash-red">{result.winner_time}</span>
              <ChevronRight size={18} className="hidden text-slate-500 sm:block" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="大学別の最近の結果" description="掲載データ内で、大学ごとの直近結果を表示しています。" />
        <div className="grid gap-3 lg:grid-cols-3">
          {universityResultGroups.map((group) => (
            <Link key={group.university_id} href={`/universities/${group.university_id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                <SashMark accent={group.accent} />
                  <span className="text-lg font-black text-ink transition-colors group-hover:text-sash-red">{group.university_name}</span>
                </span>
                <ChevronRight size={20} className="shrink-0 text-slate-500" />
              </div>
              <div className="mt-4 grid gap-2">
                {group.results.slice(0, 3).map((result) => (
                  <div key={`${group.university_id}-${result.athlete_name}-${result.distance}`} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-field px-3 py-2 text-sm font-bold text-slate-700">
                    <span className="text-xs font-black text-slate-400">{formatDate(result.date)}</span>
                    <span className="font-black text-ink">{result.athlete_name}</span>
                    <span>{result.distance}</span>
                    <span className="font-black text-sash-red">{result.time}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" description="用語と表示内容の見方です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="PBとは" text="PBは自己ベストを表します。今回の記録が自己ベストの場合、備考にPBと表示します。" />
          <GuideCard title="DNSとは" text="DNSは欠場を表します。スタートリストに名前があっても、結果にDNSと表示される場合があります。" />
          <GuideCard title="公式記録について" text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function matchesResultFilter(result: ResultSummary, filter: ResultFilter) {
  if (filter === "all") return true;
  if (filter === "track" || filter === "road" || filter === "ekiden") return result.category === filter;
  if (filter === "5000m" || filter === "10000m" || filter === "ハーフ") return result.distance === filter;
  return result.notes.includes(filter);
}

function ResultCard({ result }: { result: ResultSummary }) {
  return (
    <Link href={getResultHref(result)} className="group rounded-lg border border-line bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <ResultStatusBadge />
        <CategoryBadge category={result.category} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-lg font-black leading-7 text-ink transition-colors group-hover:text-sash-red">{result.meet_name}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">{result.race_name}</p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-600">
        <span className="flex items-center gap-2">
          <CalendarDays size={16} className="text-sash-red" />
          {formatDate(result.date)}
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={16} className="text-sash-red" />
          {result.venue}
        </span>
      </div>
      <div className="mt-3 grid min-w-0 gap-1.5 border-t border-line pt-3 text-sm font-bold text-slate-700 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
        <span className="block min-w-0">
          <span className="text-slate-500">{getWinnerLabel(result)}：</span>
          <span className="font-black text-ink">{result.winner_name}</span>
          <span className="text-slate-500">（{result.winner_university_name}）</span>
        </span>
        <span className="flex min-w-0 flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-slate-500">記録：</span>
            <span className="font-black text-sash-red">{result.winner_time}</span>
          </span>
          <span>
            <span className="text-slate-500">PB：</span>
            <span className="font-black text-ink">{result.pb_count}名</span>
          </span>
          <span>
            <span className="text-slate-500">DNS：</span>
            <span className="font-black text-ink">{result.dns_count}名</span>
          </span>
        </span>
      </div>
    </Link>
  );
}

function getWinnerLabel(result: ResultSummary) {
  return result.winner_type === "team" ? "1位チーム" : "1位選手";
}

function getResultHref(result: ResultSummary) {
  return `/results/${result.result_id}`;
}

function ResultStatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      結果公開
    </span>
  );
}

function CategoryBadge({ category }: { category: ResultCategory }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{resultCategoryLabels[category]}</span>;
}

function SashMark({ accent }: { accent: string }) {
  return (
    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-field" aria-hidden="true">
      <span className="absolute -left-3 top-0 h-16 w-7 -skew-x-[24deg]" style={{ backgroundColor: accent }} />
      <span className="absolute left-6 top-0 h-16 w-1.5 -skew-x-[24deg] bg-white" />
    </span>
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

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h3 className="text-base font-black text-ink">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-7 text-slate-700">{text}</p>
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
