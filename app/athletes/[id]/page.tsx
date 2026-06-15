import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Database, Flag, Info, Rows3, School, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Athlete, athletes } from "@/data/athletes";
import { EventStatus } from "@/data/events";
import { meets } from "@/data/meets";
import { raceRecords } from "@/data/races";
import { getResultsByAthleteId } from "@/data/results";
import { universities, University } from "@/data/universities";
import { getUpcomingEntriesByAthleteId } from "@/lib/upcoming";
import { formatDate } from "@/lib/utils";

type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ" | "";

type AthleteAppearance = {
  raceName: string;
  meetName: string;
  date: string;
  venue: string;
  status: EventStatus | "waiting";
  href: string;
};

type AthleteResult = {
  date: string;
  meetName: string;
  raceName: string;
  distance: string;
  rank: string;
  time: string;
  note: ResultNote;
  href: string;
};

const pbDistances = ["1500m", "3000mSC", "5000m", "10000m", "ハーフ"];

export function generateStaticParams() {
  return athletes.map((athlete) => ({ id: athlete.id }));
}

export default async function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = athletes.find((item) => item.id === id);

  if (!athlete) {
    notFound();
  }

  const university = universities.find((item) => item.id === athlete.universityId);

  if (!university) {
    notFound();
  }

  const appearances = buildAppearancesFromData(athlete);
  const sortedAppearances = [...appearances].sort((a, b) => getAppearancePriority(a.status) - getAppearancePriority(b.status));
  const results = buildResultsFromData(athlete);
  const latestResult = results[0];
  const listedEvents = athlete.pb.map((pb) => pb.distance).join(" / ");
  const eventRecords = buildEventRecords(results).filter((group) => group.results.length > 0);
  const primaryEvent = latestResult?.distance ?? athlete.pb[0]?.distance ?? athlete.specialty;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <Link href="/athletes" className="hover:text-sash-red">
          選手
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{athlete.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg]" style={{ backgroundColor: `${university.accent}38` }} />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-red/18" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">選手詳細</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>

          <div className="flex items-start gap-4">
            <SashMark university={university} large />
            <div>
              <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">{athlete.name}</h1>
              <p className="mt-2 text-sm font-bold text-slate-600">
                <Link href={`/universities/${university.id}`} className="font-black text-sash-red hover:underline">
                  {university.name}
                </Link>
                ・{athlete.year}
              </p>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
                この選手の所属、学年、PB、出場予定、直近結果を確認できます。
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {athlete.pb.length > 0 ? <FactBadge text="PBあり" /> : null}
            {appearances.length > 0 ? <FactBadge text="出場予定あり" /> : null}
            {results.length > 0 ? <FactBadge text="結果あり" /> : null}
            {primaryEvent ? <FactBadge text={primaryEvent} /> : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<School size={18} />} label="大学" value={university.name} />
            <InfoCard icon={<UserRound size={18} />} label="学年" value={athlete.year} />
            <LatestResultCard result={latestResult} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="選手概要" description="掲載データ内の選手情報を表示しています。" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
            <div className="grid gap-2">
              <InfoLine icon={<UserRound size={16} />} label="選手名" value={athlete.name} />
              <InfoLine icon={<Info size={16} />} label="学年" value={athlete.year} />
              <InfoLine icon={<Database size={16} />} label="PB" value={athlete.pb.length > 0 ? "あり" : "未登録"} />
              <InfoLine icon={<Trophy size={16} />} label="結果" value={results.length > 0 ? "あり" : "未登録"} />
            </div>
            <div className="grid gap-2">
              <InfoLine icon={<School size={16} />} label="大学" value={university.name} />
              <InfoLine icon={<Rows3 size={16} />} label="掲載種目" value={listedEvents || "未登録"} />
              <InfoLine icon={<CalendarDays size={16} />} label="出場予定" value={appearances.length > 0 ? "あり" : "未登録"} />
              <InfoLine icon={<Trophy size={16} />} label="直近結果" value={formatResultSummary(latestResult)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="掲載PB" description="掲載データ内のPBを種目別に表示しています。" />
        {athlete.pb.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {pbDistances.map((distance) => {
                const pb = athlete.pb.find((record) => record.distance === distance);

                return (
                  <article key={distance} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-black text-ink">{distance}</h3>
                    <div className="mt-3 grid gap-2">
                      <InfoLine icon={<Trophy size={16} />} label="PB" value={pb?.time ?? "PB未登録"} />
                      <InfoLine icon={<CalendarDays size={16} />} label="記録日" value={pb ? formatDate(pb.date) : "日付未定"} />
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-bold leading-6 text-slate-500">※掲載データ内のPBです。正式な記録は各大会公式サイトをご確認ください。</p>
          </>
        ) : (
          <EmptyState compact title="掲載PBはまだありません" description="PBデータが登録されると、このセクションに表示されます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="出場予定" description="この選手が掲載されている出場予定・関連レースです。" />
        {sortedAppearances.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedAppearances.map((appearance) => (
              <AppearanceCard key={`${appearance.meetName}-${appearance.raceName}`} appearance={appearance} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="出場予定はありません" description="今後の掲載レースが登録されると表示されます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="直近結果" description="この選手の掲載結果を新しい順に表示しています。" />
        {results.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-white shadow-sm md:block">
              <div className="grid grid-cols-[92px_1.25fr_1fr_84px_72px_104px_72px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500">
                <span>日付</span>
                <span>大会</span>
                <span>レース</span>
                <span>種目</span>
                <span>順位</span>
                <span>記録</span>
                <span>備考</span>
              </div>
              {results.slice(0, 3).map((result) => (
                <ResultRow key={`${result.date}-${result.distance}-${result.time}`} result={result} />
              ))}
            </div>
            <div className="grid gap-3 md:hidden">
              {results.slice(0, 3).map((result) => (
                <ResultCard key={`${result.date}-${result.distance}-${result.time}`} result={result} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState compact title="最近の結果はありません" description="結果が登録されると、順位・記録・備考を確認できます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="種目別の結果" description="この選手の掲載結果を種目ごとに確認できます。" />
        {eventRecords.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {eventRecords.map((group) => (
              <article key={group.event} className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
                <div className="border-b border-line bg-field px-4 py-3">
                  <h3 className="text-base font-black text-ink">{group.event}</h3>
                </div>
                <div className="grid gap-2 p-4">
                  {group.results.map((result) => (
                    <Link key={`${group.event}-${result.date}-${result.raceName}`} href={result.href} className="rounded-md bg-field px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-red-50">
                      <span className="block text-xs font-black text-slate-400">{formatDate(result.date)}</span>
                      <span className="mt-1 line-clamp-2 block font-black text-ink">{result.meetName} {result.raceName}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-black text-sash-red">{result.time || "未登録"}</span>
                        {result.note ? <NoteBadge note={result.note} compact /> : null}
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState compact title="最近の結果はありません" description="結果が登録されると、順位・記録・備考を確認できます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="関連ページ" />
        <div className="grid gap-3 md:grid-cols-3">
          <RelatedLink href={`/universities/${university.id}`} title={`${university.name}の大学ページを見る`} text={`${university.name}の掲載選手、PB、出場予定、結果を確認できます。`} icon={<School size={20} />} />
          <RelatedLink href="/results" title="この選手の結果一覧を見る" text={`${athlete.name}の掲載結果を一覧で確認できます。`} icon={<Trophy size={20} />} />
          <RelatedLink href="/meets" title="関連大会を見る" text={`${athlete.name}の出場予定・結果に関係する大会を確認できます。`} icon={<CalendarDays size={20} />} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="PBとは" text="PBは自己ベストを表します。掲載データ内のPBを表示しています。" />
          <GuideCard title="出場予定とは" text="今後の掲載レースに出場予定がある場合に表示しています。" />
          <GuideCard title="公式記録について" text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function AppearanceCard({ appearance }: { appearance: AthleteAppearance }) {
  return (
    <Link href={appearance.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-3 flex flex-wrap gap-2">
        <AppearanceStatusBadge status={appearance.status} />
        <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{formatDate(appearance.date)}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-ink transition-colors group-hover:text-sash-red">{appearance.raceName}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{appearance.meetName}</p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3">
        <InfoLine icon={<Flag size={16} />} label="会場" value={appearance.venue || "会場未定"} />
      </div>
    </Link>
  );
}

function ResultRow({ result }: { result: AthleteResult }) {
  return (
    <Link href={result.href} className="grid grid-cols-[92px_1.25fr_1fr_84px_72px_104px_72px] items-center gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-field/70 last:border-b-0">
      <span className="text-slate-500">{formatDate(result.date)}</span>
      <span className="font-black text-ink">{result.meetName}</span>
      <span>{result.raceName}</span>
      <span>{result.distance}</span>
      <span>{result.rank}</span>
      <span className={result.time === "DNS" ? "font-black text-slate-500" : "font-black text-sash-red"}>{result.time || "未登録"}</span>
      <span>{result.note ? <NoteBadge note={result.note} /> : null}</span>
    </Link>
  );
}

function ResultCard({ result }: { result: AthleteResult }) {
  return (
    <Link href={result.href} className="rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-slate-400">{formatDate(result.date)}</p>
          <h3 className="mt-1 text-base font-black leading-6 text-ink">{result.meetName}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{result.raceName}</p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-2">
        <InfoLine icon={<Rows3 size={16} />} label="種目" value={result.distance} />
        <InfoLine icon={<Trophy size={16} />} label="順位" value={result.rank} />
        <InfoLine icon={<Database size={16} />} label="記録" value={result.time || "未登録"} tone={result.time === "DNS" ? "muted" : "accent"} />
        <div className="grid grid-cols-[20px_92px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-2">
          <span className="mt-0.5 text-sash-red">
            <Info size={16} />
          </span>
          <span className="text-xs font-black text-slate-500">備考</span>
          <span>{result.note ? <NoteBadge note={result.note} /> : <span className="text-sm font-black text-slate-400">—</span>}</span>
        </div>
      </div>
    </Link>
  );
}

function RelatedLink({ href, title, text, icon }: { href: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-red-50 text-sash-red">{icon}</span>
          <h3 className="text-base font-black text-ink transition-colors group-hover:text-sash-red">{title}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text}</p>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
    </Link>
  );
}

function FactBadge({ text }: { text: string }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{text}</span>;
}

function AppearanceStatusBadge({ status }: { status: AthleteAppearance["status"] }) {
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        結果待ち
      </span>
    );
  }

  return <StatusBadge status={status} />;
}

function NoteBadge({ note, compact = false }: { note: ResultNote; compact?: boolean }) {
  const className = note === "PB" ? "bg-red-50 text-sash-red" : note === "SB" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex w-fit rounded-full px-2.5 ${compact ? "py-0.5" : "py-1"} text-xs font-black ${className}`}>{note}</span>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-field p-3">
      <div className="mb-2 flex items-center gap-2 text-sash-red">{icon}</div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-black leading-5 text-ink">{value}</p>
    </div>
  );
}

function LatestResultCard({ result }: { result: AthleteResult | undefined }) {
  if (!result) {
    return <InfoCard icon={<Trophy size={18} />} label="直近結果" value="未登録" />;
  }

  const statusLine = result.rank === "DNS" || result.time === "DNS" ? `${result.distance} / DNS` : `${result.distance} / ${result.rank}`;
  const record = result.rank === "DNS" || result.time === "DNS" ? null : result.time;

  return (
    <div className="rounded-md bg-field p-3">
      <div className="mb-2 flex items-center gap-2 text-sash-red">
        <Trophy size={18} />
      </div>
      <p className="text-xs font-bold text-slate-500">直近結果</p>
      <p className="mt-1 text-sm font-black leading-5 text-ink">{result.meetName}</p>
      <p className="mt-1 text-sm font-black leading-5 text-slate-700">{statusLine}</p>
      {record ? <p className="mt-1 text-base font-black leading-5 text-sash-red">{record}</p> : null}
    </div>
  );
}

function InfoLine({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "accent" | "muted" }) {
  return (
    <div className="grid grid-cols-[20px_92px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-2">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className={`text-sm font-black ${tone === "accent" ? "text-sash-red" : tone === "muted" ? "text-slate-500" : "text-ink"}`}>{value}</span>
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

function SashMark({ university, large = false }: { university: University; large?: boolean }) {
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-md bg-field ${large ? "h-16 w-14" : "h-12 w-10"}`} aria-hidden="true">
      <span className={`absolute -left-3 top-0 -skew-x-[24deg] ${large ? "h-20 w-9" : "h-16 w-7"}`} style={{ backgroundColor: university.accent }} />
      <span className={`absolute top-0 -skew-x-[24deg] bg-white ${large ? "left-8 h-20 w-2" : "left-6 h-16 w-1.5"}`} />
    </span>
  );
}

function buildEventRecords(results: AthleteResult[]) {
  return pbDistances.map((event) => ({
    event,
    results: results.filter((result) => result.distance === event)
  }));
}

function getAppearancePriority(status: AthleteAppearance["status"]) {
  const order: Record<AthleteAppearance["status"], number> = {
    scheduled: 1,
    soon: 2,
    startlist: 3,
    live: 4,
    waiting: 5,
    result: 6
  };

  return order[status];
}

function formatResultSummary(result: AthleteResult | undefined) {
  if (!result) return "未登録";
  if (result.rank === "DNS" || result.time === "DNS") {
    return `${result.distance} / DNS`;
  }

  return `${result.distance} / ${result.rank} / ${result.time}`;
}

function buildFallbackResults(athlete: Athlete): AthleteResult[] {
  return athlete.recentResults.map((result) => ({
    date: result.date,
    meetName: result.event,
    raceName: result.distance,
    distance: result.distance,
    rank: result.rank,
    time: result.time,
    note: "" as ResultNote,
    href: `/athletes/${athlete.id}`
  }));
}

function buildAppearancesFromData(athlete: Athlete): AthleteAppearance[] {
  return getUpcomingEntriesByAthleteId(athlete.id).map(({ race, meet }) => ({
    raceName: race.race_name,
    meetName: meet.meet_name,
    date: meet.date,
    venue: meet.venue,
    status: race.status === "startlist_published" ? "startlist" : "scheduled",
    href: race.status === "startlist_published" ? `/races/${race.race_id}` : `/meets/${meet.meet_id}`
  }));
}

function buildResultsFromData(athlete: Athlete): AthleteResult[] {
  const results = getResultsByAthleteId(athlete.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((result) => {
      const race = raceRecords.find((item) => item.race_id === result.race_id);
      const meet = meets.find((item) => item.meet_id === result.meet_id);

      return {
        date: result.date,
        meetName: meet?.meet_name ?? "大会未登録",
        raceName: race?.race_name ?? result.race_id,
        distance: result.distance,
        rank: result.rank,
        time: result.time,
        note: result.note ?? "",
        href: result.result_id === "kanto-10000m-mens-10000m-3-saeki" ? "/results/kanto-10000m-mens-10000m-3-saeki" : `/results/${race?.result_summary_id ?? result.result_id}`
      } satisfies AthleteResult;
    });

  return results.length > 0 ? results : buildFallbackResults(athlete);
}
