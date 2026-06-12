import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Database, Flag, Info, Rows3, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { athletes, Athlete } from "@/data/athletes";
import { meets } from "@/data/meets";
import { raceRecords } from "@/data/races";
import { getResultsByUniversityId } from "@/data/results";
import { universities, University } from "@/data/universities";
import { getUpcomingEntriesByUniversityId } from "@/lib/upcoming";
import { formatDate } from "@/lib/utils";

type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ" | "";

type UniversityResult = {
  date: string;
  raceName: string;
  athleteId: string;
  distance: string;
  rank: string;
  time: string;
  note: ResultNote;
  href: string;
};

type UniversityAppearance = {
  raceName: string;
  meetName: string;
  date: string;
  athletes: string[];
  href: string;
};

const pbEvents = ["1500m", "5000m", "10000m", "ハーフ"] as const;

export function generateStaticParams() {
  return universities.map((university) => ({ id: university.id }));
}

export default async function UniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = universities.find((item) => item.id === id);

  if (!university) {
    notFound();
  }

  const listedAthletes = university.athletes
    .map((athleteId) => athletes.find((athlete) => athlete.id === athleteId))
    .filter((athlete): athlete is Athlete => Boolean(athlete));
  const results = buildUniversityResults(university, listedAthletes);
  const appearances = buildUniversityAppearances(university);
  const latestResult = formatLatestResult(results[0], listedAthletes);
  const pbRankings = buildPbRankings(listedAthletes);
  const hasPbRows = pbRankings.some((ranking) => ranking.rows.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <Link href="/universities" className="hover:text-sash-red">
          大学
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{university.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg]" style={{ backgroundColor: `${university.accent}38` }} />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-red/18" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">大学詳細</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>

          <div className="flex items-start gap-4">
            <SashMark university={university} large />
            <div>
              <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">{university.name}</h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
                この大学に所属する掲載選手、PB、出場予定、直近結果を確認できます。
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FactBadge text={`地域：${university.area}`} />
            <FactBadge text="掲載選手あり" />
            <FactBadge text="PB掲載あり" />
            <FactBadge text="結果あり" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={18} />} label="掲載種目" value={university.listing.events.join(" / ")} />
            <InfoCard icon={<UserRound size={18} />} label="掲載選手数" value={`${listedAthletes.length}名`} />
            <InfoCard icon={<Trophy size={18} />} label="直近結果" value={latestResult} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="大学概要" description="掲載データ内の大学情報を表示しています。" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
            <InfoLine icon={<Rows3 size={16} />} label="大学名" value={university.name} />
            <InfoLine icon={<Flag size={16} />} label="地域" value={university.area} />
            <InfoLine icon={<UserRound size={16} />} label="掲載選手数" value={`${listedAthletes.length}名`} />
            <InfoLine icon={<Rows3 size={16} />} label="掲載種目" value={university.listing.events.join(" / ")} />
            <InfoLine icon={<CalendarDays size={16} />} label="出場予定" value={appearances.length > 0 ? "あり" : "掲載なし"} />
            <InfoLine icon={<Trophy size={16} />} label="結果" value={results.length > 0 ? "あり" : "掲載なし"} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="掲載選手" description="この大学に所属する掲載選手を表示しています。" />
        {listedAthletes.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {listedAthletes.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} university={university} result={getLatestAthleteResult(athlete, results)} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="掲載選手はまだありません" description="この大学に紐づく選手情報はまだ登録されていません。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="種目別PB" description="この大学のPBを種目別に表示しています。" />
        {hasPbRows ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {pbRankings.map((ranking) => (
                <PbTableCard key={ranking.event} title={`${ranking.event} PB`} rows={ranking.rows} />
              ))}
            </div>
            <p className="mt-3 text-xs font-bold leading-6 text-slate-500">※掲載データ内のPBです。正式な記録は各大会公式サイトをご確認ください。</p>
          </>
        ) : (
          <EmptyState compact title="掲載PBはまだありません" description="PBデータが登録されると、このセクションに表示されます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="直近結果" description="この大学の掲載結果を新しい順に表示しています。" />
        {results.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-white shadow-sm md:block">
              <div className="hidden grid-cols-[92px_1.5fr_1fr_84px_72px_104px_72px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500 md:grid">
                <span>日付</span>
                <span>レース</span>
                <span>選手</span>
                <span>種目</span>
                <span>順位</span>
                <span>記録</span>
                <span>備考</span>
              </div>
              {results.map((result) => (
                <ResultRow key={`${result.date}-${result.athleteId}-${result.distance}`} result={result} athlete={listedAthletes.find((athlete) => athlete.id === result.athleteId)} />
              ))}
            </div>
            <div className="grid gap-3 md:hidden">
              {results.map((result) => (
                <ResultCard key={`${result.date}-${result.athleteId}-${result.distance}`} result={result} athlete={listedAthletes.find((athlete) => athlete.id === result.athleteId)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState compact title="最近の結果はありません" description="結果が登録されると、この大学の直近結果を確認できます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="出場予定" description="この大学の掲載中の出場予定を表示しています。" />
        {appearances.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {appearances.map((appearance) => (
              <AppearanceCard key={`${appearance.meetName}-${appearance.raceName}`} appearance={appearance} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="出場予定はありません" description="今後の掲載レースが登録されると表示されます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="関連ページ" />
        <div className="grid gap-3 md:grid-cols-3">
          <RelatedLink href="/athletes" title={`${university.name}の選手一覧を見る`} text={`${university.name}の掲載選手を一覧で確認できます。`} icon={<UserRound size={20} />} />
          <RelatedLink href="/results" title={`${university.name}の結果一覧を見る`} text={`${university.name}の掲載結果を一覧で確認できます。`} icon={<Trophy size={20} />} />
          <RelatedLink href="/meets" title="関連大会を見る" text={`${university.name}の出場予定・結果に関係する大会を確認できます。`} icon={<CalendarDays size={20} />} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="大学ページで確認できること" text="掲載選手、PB、出場予定、直近結果を大学ごとに確認できます。" />
          <GuideCard title="襷カラーについて" text="襷カラーは識別用に簡略表示しています。実際の校章や公式ロゴは使用していません。" />
          <GuideCard title="公式情報について" text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function AthleteCard({ athlete, university, result }: { athlete: Athlete; university: University; result?: UniversityResult }) {
  const recentResultText = result ? formatResultSummary(result) : athlete.recentResults[0] ? formatAthleteRecentResult(athlete.recentResults[0]) : "未登録";

  return (
    <Link href={`/athletes/${athlete.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark university={university} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{athlete.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {university.name} ・ {athlete.year}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-4 grid gap-3">
        <InfoBlock label="PB">
          {athlete.pb.length > 0
            ? athlete.pb.map((record) => (
                <span key={`${athlete.id}-${record.distance}`} className="block">
                  {record.distance} {record.time}
                </span>
              ))
            : "PB未登録"}
        </InfoBlock>
        <InfoBlock label="直近結果">{recentResultText}</InfoBlock>
      </div>
    </Link>
  );
}

function PbTableCard({ title, rows }: { title: string; rows: Array<{ rank: number; athleteId: string; athlete: string; time: string }> }) {
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line bg-field px-4 py-3">
        <h3 className="text-base font-black text-ink">{title}</h3>
      </div>
      <div className="grid grid-cols-[56px_1fr_96px] border-b border-line px-4 py-2 text-xs font-black text-slate-500">
        <span>順位</span>
        <span>選手</span>
        <span>PB</span>
      </div>
      {rows.length > 0 ? (
        rows.map((row) => (
          <div key={`${title}-${row.athlete}`} className="grid grid-cols-[56px_1fr_96px] items-center border-b border-line px-4 py-3 last:border-b-0">
            <span className="text-sm font-black text-sash-red">{row.rank}</span>
            <Link href={`/athletes/${row.athleteId}`} className="text-sm font-black text-ink hover:text-sash-red hover:underline">
              {row.athlete}
            </Link>
            <span className="text-sm font-black text-ink">{row.time}</span>
          </div>
        ))
      ) : (
        <div className="px-4 py-4 text-sm font-bold text-slate-500">PB未登録</div>
      )}
    </article>
  );
}

function ResultRow({ result, athlete }: { result: UniversityResult; athlete?: Athlete }) {
  return (
    <Link href={result.href} className="grid gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-field/70 last:border-b-0 md:grid-cols-[92px_1.5fr_1fr_84px_72px_104px_72px] md:items-center">
      <span className="text-slate-500">{formatDate(result.date)}</span>
      <span className="font-black text-ink">{result.raceName}</span>
      <span>{athlete?.name ?? "未登録"}</span>
      <span>{result.distance}</span>
      <span>{result.rank}</span>
      <span className="font-black text-sash-red">{result.time}</span>
      <span>{result.note ? <NoteBadge note={result.note} /> : null}</span>
    </Link>
  );
}

function ResultCard({ result, athlete }: { result: UniversityResult; athlete?: Athlete }) {
  return (
    <Link href={result.href} className="rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-slate-400">{formatDate(result.date)}</p>
          <h3 className="mt-1 text-base font-black leading-6 text-ink">{result.raceName}</h3>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
        <InfoLine icon={<UserRound size={16} />} label="選手" value={athlete?.name ?? "未登録"} />
        <InfoLine icon={<Rows3 size={16} />} label="種目" value={result.distance} />
        <InfoLine icon={<Trophy size={16} />} label="順位" value={result.rank} />
        <InfoLine icon={<Database size={16} />} label="記録" value={result.time} />
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

function AppearanceCard({ appearance }: { appearance: UniversityAppearance }) {
  return (
    <Link href={appearance.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-ink transition-colors group-hover:text-sash-red">{appearance.raceName}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{appearance.meetName}</p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<CalendarDays size={16} />} label="日付" value={formatDate(appearance.date)} />
        <InfoLine icon={<UserRound size={16} />} label="掲載選手" value={appearance.athletes.join(" / ")} />
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

function NoteBadge({ note }: { note: ResultNote }) {
  const className = note === "PB" ? "bg-red-50 text-sash-red" : note === "SB" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{note}</span>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-field p-3">
      <div className="mb-2 flex items-center gap-2 text-sash-red">{icon}</div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-ink">{value}</p>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[20px_92px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-2">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className="text-sm font-black text-ink">{value}</span>
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-field px-3 py-2 text-sm font-bold text-slate-700">
      <p className="mb-1 text-xs font-black text-slate-500">{label}</p>
      <div className="font-black leading-6 text-ink">{children}</div>
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

function buildPbRankings(listedAthletes: Athlete[]) {
  return pbEvents.map((event) => {
    const sortedRows = listedAthletes
      .map((athlete) => {
        const record = athlete.pb.find((pb) => pb.distance === event);
        return record ? { athleteId: athlete.id, athlete: athlete.name, time: record.time, seconds: toSeconds(record.time) } : null;
      })
      .filter((row): row is { athleteId: string; athlete: string; time: string; seconds: number } => Boolean(row))
      .sort((a, b) => a.seconds - b.seconds)
      .slice(0, 3);

    return {
      event,
      rows: sortedRows.map((row) => {
        const sameTimeIndex = sortedRows.findIndex((item) => item.seconds === row.seconds);

        return {
          rank: sameTimeIndex + 1,
          athleteId: row.athleteId,
          athlete: row.athlete,
          time: row.time
        };
      })
    };
  });
}

function getLatestAthleteResult(athlete: Athlete, results: UniversityResult[]) {
  return results.find((result) => result.athleteId === athlete.id);
}

function formatResultSummary(result: UniversityResult) {
  if (result.rank === "DNS" || result.time === "DNS") {
    return `${result.distance} / DNS`;
  }

  return `${result.distance} / ${result.rank} / ${result.time}`;
}

function formatAthleteRecentResult(result: Athlete["recentResults"][number]) {
  if (result.rank === "DNS" || result.time === "DNS") {
    return `${result.distance} / DNS`;
  }

  return `${result.distance} / ${result.rank} / ${result.time}`;
}

function formatLatestResult(result: UniversityResult | undefined, listedAthletes: Athlete[]) {
  if (!result) return "未登録";
  const athlete = listedAthletes.find((item) => item.id === result.athleteId);
  return `${athlete?.name ?? "未登録"} / ${result.distance} / ${result.time || "未登録"}`;
}

function buildFallbackResults(listedAthletes: Athlete[]): UniversityResult[] {
  return listedAthletes.flatMap((athlete) =>
    athlete.recentResults.slice(0, 1).map((result) => ({
      date: result.date,
      raceName: result.event,
      athleteId: athlete.id,
      distance: result.distance,
      rank: result.rank,
      time: result.time,
      note: "" as ResultNote,
      href: `/athletes/${athlete.id}`
    }))
  );
}

function buildUniversityResults(university: University, listedAthletes: Athlete[]): UniversityResult[] {
  const fallback = buildFallbackResults(listedAthletes);
  const results = getResultsByUniversityId(university.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((result) => {
      const race = raceRecords.find((item) => item.race_id === result.race_id);
      const meet = meets.find((item) => item.meet_id === result.meet_id);

      return {
        date: result.date,
        raceName: `${meet?.meet_name ?? "大会未登録"} ${race?.race_name ?? result.race_id}`,
        athleteId: result.athlete_id,
        distance: result.distance,
        rank: result.rank,
        time: result.time,
        note: result.note ?? "",
        href: result.result_id === "kanto-10000m-mens-10000m-3-saeki" ? "/results/kanto-10000m-mens-10000m-3-saeki" : `/results/${race?.result_summary_id ?? result.result_id}`
      } satisfies UniversityResult;
    });

  return results.length > 0 ? results : fallback;
}

function buildUniversityAppearances(university: University): UniversityAppearance[] {
  const seen = new Set<string>();
  const upcomingEntries = getUpcomingEntriesByUniversityId(university.id);

  return upcomingEntries.flatMap(({ entry, race, meet }): UniversityAppearance[] => {
    if (seen.has(entry.race_id)) return [];
    seen.add(entry.race_id);

    const raceEntries = upcomingEntries.filter((item) => item.entry.race_id === entry.race_id);

    return [
      {
        raceName: race.race_name,
        meetName: meet.meet_name,
        date: meet.date,
        athletes: raceEntries.map((item) => athletes.find((athlete) => athlete.id === item.entry.athlete_id)?.name ?? "未登録"),
        href: race.status === "startlist_published" ? `/races/${entry.race_id}` : `/meets/${entry.meet_id}`
      }
    ];
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
