import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Database, Flag, ListFilter, Rows3, Tags, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Athlete, athletes } from "@/data/athletes";
import { universities, University } from "@/data/universities";
import { getUpcomingEntriesByAthleteId } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

type AthleteFilter = "all" | "1年" | "2年" | "3年" | "4年" | "5000m" | "10000m" | "half" | "upcoming" | "result";
type PbEvent = "5000m" | "10000m" | "ハーフ";

const filters: Array<{ label: string; value: AthleteFilter }> = [
  { label: "すべて", value: "all" },
  { label: "1年", value: "1年" },
  { label: "2年", value: "2年" },
  { label: "3年", value: "3年" },
  { label: "4年", value: "4年" },
  { label: "5000m掲載あり", value: "5000m" },
  { label: "10000m掲載あり", value: "10000m" },
  { label: "ハーフ掲載あり", value: "half" },
  { label: "出場予定あり", value: "upcoming" },
  { label: "結果あり", value: "result" }
];

const pbEvents: PbEvent[] = ["5000m", "10000m", "ハーフ"];

export default async function AthletesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const selectedFilter = filters.some((item) => item.value === filter) ? (filter as AthleteFilter) : "all";
  const universityById = new Map(universities.map((university) => [university.id, university]));
  const filteredAthletes = athletes.filter((athlete) => matchesAthleteFilter(athlete, selectedFilter));
  const pbRankings = buildAthletePbRankings(athletes, universityById);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-8 sm:pt-10">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">選手</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">選手一覧</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">選手一覧</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝の掲載選手を確認できます。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={18} />} label="掲載内容" value="選手名 / 大学 / 学年 / PB" />
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
                href={filterItem.value === "all" ? "/athletes" : `/athletes?filter=${encodeURIComponent(filterItem.value)}`}
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
        <SectionTitle title="掲載選手" description="選手名、大学、学年、掲載PB、出場予定、最近の結果を確認できます。" />
        {filteredAthletes.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredAthletes.map((athlete) => (
              <AthleteListCard key={athlete.id} athlete={athlete} university={universityById.get(athlete.universityId)} />
            ))}
          </div>
        ) : (
          <EmptyState title="掲載選手がありません" description="現在、表示できる選手データはありません。" actions={[{ href: "/universities", label: "大学一覧を見る", primary: true }]} />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="種目別PB上位" description="掲載データ内で、5000m・10000m・ハーフのPB上位選手を確認できます。" />
        <div className="grid gap-3 lg:grid-cols-3">
          {pbRankings.map((ranking) => (
            <article key={ranking.event} className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
              <div className="border-b border-line bg-field px-4 py-3">
                <h3 className="text-base font-black text-ink">{ranking.event} PB上位</h3>
              </div>
              <div className="grid min-w-[360px] grid-cols-[40px_1fr_1fr_92px] border-b border-line px-4 py-2 text-xs font-black text-slate-500">
                <span>順位</span>
                <span>選手名</span>
                <span>大学</span>
                <span>PB</span>
              </div>
              {ranking.entries.map((entry) => (
                <div
                  key={`${ranking.event}-${entry.athleteId}`}
                  className="grid min-w-[360px] grid-cols-[40px_1fr_1fr_92px] items-center border-b border-line px-4 py-3 transition hover:bg-field/60 last:border-b-0"
                >
                  <span className="text-sm font-black text-sash-red">{entry.rank}</span>
                  <Link href={`/athletes/${entry.athleteId}`} className="text-sm font-black text-ink hover:text-sash-red hover:underline">
                    {entry.athleteName}
                  </Link>
                  <Link href={`/universities/${entry.universityId}`} className="text-sm font-bold text-slate-700 hover:text-sash-red hover:underline">
                    {entry.universityName}
                  </Link>
                  <span className="text-sm font-black text-ink">{entry.time}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold leading-6 text-slate-500">※掲載データ内のPBです。正式な記録は各大会公式サイトをご確認ください。</p>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" description="用語と表示内容の見方です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="PBとは" text="PBは自己ベストを表します。掲載PBは、このサイトに登録されているデータ内の自己記録です。" />
          <GuideCard title="出場予定とは" text="今後の掲載レースに出場予定がある選手を表示しています。" />
          <GuideCard title="掲載データについて" text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function matchesAthleteFilter(athlete: Athlete, filter: AthleteFilter) {
  if (filter === "all") return true;
  if (filter === "1年" || filter === "2年" || filter === "3年" || filter === "4年") return athlete.year === filter;
  if (filter === "5000m" || filter === "10000m") return athlete.pb.some((record) => record.distance === filter);
  if (filter === "half") return athlete.pb.some((record) => record.distance === "ハーフ");
  if (filter === "upcoming") return getUpcomingEntriesByAthleteId(athlete.id).length > 0;
  return athlete.recentResults.length > 0;
}

function AthleteListCard({ athlete, university }: { athlete: Athlete; university?: University }) {
  const latestResult = athlete.recentResults[0];
  const nextAppearance = getUpcomingEntriesByAthleteId(athlete.id)[0];

  return (
    <Link href={`/athletes/${athlete.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {university ? <SashMark university={university} /> : <span className="h-12 w-10 rounded-md bg-field" aria-hidden="true" />}
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-ink transition-colors group-hover:text-sash-red">{athlete.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {university?.name ?? "大学未登録"} ・ {athlete.year ?? "学年未登録"}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {nextAppearance ? <FactBadge text="出場予定あり" /> : null}
        <FactBadge text="結果あり" />
      </div>

      <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        <InfoLine icon={<Trophy size={16} />} label="掲載PB" value={formatPbList(athlete)} />
        <InfoLine icon={<CalendarDays size={16} />} label="次回出場予定" value={nextAppearance?.race.race_name ?? "未登録"} />
        <InfoLine icon={<Flag size={16} />} label="直近結果" value={latestResult ? formatLatestResult(latestResult) : "未登録"} multiline />
      </div>
    </Link>
  );
}

function buildAthletePbRankings(athleteList: Athlete[], universityById: Map<string, University>) {
  return pbEvents.map((event) => {
    const entries = athleteList
      .map((athlete) => {
        const pb = athlete.pb.find((record) => record.distance === event);
        if (!pb) return null;

        return {
          athleteId: athlete.id,
          athleteName: athlete.name,
          universityId: athlete.universityId,
          universityName: universityById.get(athlete.universityId)?.name ?? "大学未登録",
          time: pb.time,
          seconds: toSeconds(pb.time)
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => a.seconds - b.seconds)
      .slice(0, 3)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { event, entries };
  });
}

function toSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  const [minutes, seconds] = parts;
  return minutes * 60 + seconds;
}

function formatPbList(athlete: Athlete) {
  return athlete.pb.map((record) => `${record.distance} ${record.time}`).join(" / ");
}

function formatLatestResult(result: Athlete["recentResults"][number]) {
  const eventName = formatResultEventName(result.event);

  if (result.rank === "DNS" || result.time === "DNS") {
    return `${eventName}\n${result.distance} / DNS`;
  }

  return `${eventName}\n${result.distance} / ${result.rank} / ${result.time}`;
}

function formatResultEventName(eventName: string) {
  return eventName
    .replace(/\s+男子\d+m.*$/, "")
    .replace(/\s+女子\d+m.*$/, "")
    .replace(/\s+ハーフマラソン.*$/, "");
}

function FactBadge({ text }: { text: string }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-black text-slate-700">{text}</span>;
}

function SashMark({ university }: { university: University }) {
  return (
    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-field" aria-hidden="true">
      <span className="absolute -left-3 top-0 h-16 w-7 -skew-x-[24deg]" style={{ backgroundColor: university.accent }} />
      <span className="absolute left-6 top-0 h-16 w-1.5 -skew-x-[24deg] bg-white" />
    </span>
  );
}

function InfoLine({ icon, label, value, multiline = false }: { icon: React.ReactNode; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[22px_104px_1fr] items-start gap-2 rounded-md bg-field px-3 py-2">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className={cn("text-sm font-black text-ink", multiline && "whitespace-pre-line leading-6")}>{value}</span>
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
