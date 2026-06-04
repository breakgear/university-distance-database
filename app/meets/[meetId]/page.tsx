import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Database, Flag, Info, MapPin, Rows3, School, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { athletes, Athlete } from "@/data/athletes";
import { getEntriesByMeetId } from "@/data/entries";
import { meets, meetCategoryLabels, MeetStatus, meetStatusLabels } from "@/data/meets";
import { getRacesByMeetId } from "@/data/races";
import { getResultsByMeetId } from "@/data/results";
import { universities, University } from "@/data/universities";
import { cn, formatDate } from "@/lib/utils";

type RaceStatus = "scheduled" | "startlist_published" | "result_published";

type ListedRace = {
  raceId: string;
  raceName: string;
  distance: string;
  resultSummaryId?: string;
  startTime: string;
  status: RaceStatus;
  entryCount: number | null;
  resultCount: number | null;
  dnsCount: number | null;
  href: string;
};

type MeetResultRow = {
  raceName: string;
  athleteId: string;
  athleteName: string;
  universityId: string;
  universityName: string;
  distance: string;
  rank: string;
  time: string;
  note: "PB" | "SB" | "DNS" | "DNF" | "DQ" | "";
  href: string;
};

export function generateStaticParams() {
  return meets.map((meet) => ({ meetId: meet.meet_id }));
}

export default async function MeetDetailPage({ params }: { params: Promise<{ meetId: string }> }) {
  const { meetId } = await params;
  const meet = meets.find((item) => item.meet_id === meetId);

  if (!meet) {
    notFound();
  }

  const universityById = new Map(universities.map((university) => [university.id, university]));
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const entriesForMeet = getEntriesByMeetId(meet.meet_id);
  const racesForMeet = getRacesByMeetId(meet.meet_id).map((race) => {
    const raceResults = getResultsByMeetId(meet.meet_id).filter((result) => result.race_id === race.race_id);
    const raceEntries = entriesForMeet.filter((entry) => entry.race_id === race.race_id);

    return {
      raceId: race.race_id,
      raceName: race.race_name,
      distance: race.distance,
      resultSummaryId: race.result_summary_id,
      startTime: race.start_time,
      status: race.status === "result_waiting" ? "scheduled" : race.status,
      entryCount: raceEntries.length || null,
      resultCount: raceResults.filter((result) => result.status !== "dns").length || null,
      dnsCount: raceResults.filter((result) => result.status === "dns").length || null,
      href: `/races/${race.race_id}`
    } satisfies ListedRace;
  });
  const resultsForMeet = getResultsByMeetId(meet.meet_id).map((result) => {
    const athlete = athleteById.get(result.athlete_id);
    const university = universityById.get(result.university_id);
    const race = racesForMeet.find((item) => item.raceId === result.race_id);

    return {
      raceName: race?.raceName ?? result.race_id,
      athleteId: result.athlete_id,
      athleteName: athlete?.name ?? "未登録",
      universityId: result.university_id,
      universityName: university?.name ?? "大学未登録",
      distance: result.distance,
      rank: result.rank,
      time: result.time,
      note: result.note ?? "",
      href: `/results/${race?.resultSummaryId ?? result.result_id}`
    } satisfies MeetResultRow;
  });
  const relatedUniversities = Array.from(new Set(entriesForMeet.map((entry) => entry.university_id))).map((universityId) => {
    const resultText = resultsForMeet
      .filter((result) => result.universityId === universityId)
      .map((result) => result.rank)
      .join(" / ");

    return {
      universityId,
      athleteCount: entriesForMeet.filter((entry) => entry.university_id === universityId).length,
      resultText: resultText || "未確認"
    };
  });
  const publishedResultCount = resultsForMeet.filter((result) => result.rank !== "DNS").length;
  const dnsCount = resultsForMeet.filter((result) => result.rank === "DNS" || result.note === "DNS").length;
  const distanceLabel = Array.from(new Set(racesForMeet.map((race) => race.distance))).join(" / ") || "種目未登録";
  const relatedAthletes = Array.from(new Set(entriesForMeet.map((entry) => entry.athlete_id)))
    .map((id) => athleteById.get(id))
    .filter((athlete): athlete is Athlete => Boolean(athlete))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <Link href="/meets" className="hover:text-sash-red">
          大会
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{meet.meet_name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">大会詳細</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">{meet.meet_name}</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝に関連する大会情報、掲載レース、出場予定、結果を確認できます。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MeetStatusBadge status={meet.status} />
            <CategoryBadge label={meetCategoryLabels[meet.category]} />
            <CategoryBadge label={distanceLabel} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<CalendarDays size={18} />} label="大会日程" value={formatDate(meet.date)} />
            <InfoCard icon={<MapPin size={18} />} label="会場" value={meet.venue} />
            <InfoCard icon={<Database size={18} />} label="掲載データ" value="レース / 出場予定 / 結果" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="大会概要" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
            <InfoLine icon={<Rows3 size={16} />} label="大会名" value={meet.meet_name} />
            <InfoLine icon={<CalendarDays size={16} />} label="日付" value={formatDate(meet.date)} />
            <InfoLine icon={<MapPin size={16} />} label="会場" value={meet.venue} />
            <InfoLine icon={<Flag size={16} />} label="カテゴリ" value={meetCategoryLabels[meet.category]} />
            <InfoLine icon={<Info size={16} />} label="ステータス" value={meetStatusLabels[meet.status]} />
            <InfoLine icon={<Database size={16} />} label="掲載レース数" value={meet.race_count === null ? "未定" : `${meet.race_count}件`} />
            <InfoLine icon={<Trophy size={16} />} label="掲載結果数" value={`${publishedResultCount}名`} />
            <InfoLine icon={<Info size={16} />} label="DNS人数" value={`${dnsCount}名`} />
          </div>
        </div>
      </section>

      <section id="listed-races" className="mt-8">
        <SectionTitle title="掲載レース" description="この大会に含まれる掲載レースを表示しています。" />
        {racesForMeet.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {racesForMeet.map((race) => (
              <RaceCard key={race.raceId} race={race} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="掲載レースはまだありません" description="この大会に紐づくレース情報はまだ登録されていません。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="この大会の結果" description="結果公開済みの掲載データを表示しています。" />
        {resultsForMeet.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-[92px_1.2fr_64px_1fr_92px_92px_64px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500 md:grid">
              <span>日付</span>
              <span>レース</span>
              <span>順位</span>
              <span>選手</span>
              <span>大学</span>
              <span>記録</span>
              <span>備考</span>
            </div>
            {resultsForMeet.map((result) => (
              <ResultRow key={`${result.raceName}-${result.athleteId}`} result={result} date={meet.date} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="結果はまだ公開されていません" description="結果が登録されると、順位・記録・備考を確認できます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="出場大学" description="この大会に掲載している大学を表示しています。" />
        <div className="grid gap-3 md:grid-cols-3">
          {relatedUniversities.map((row) => {
            const university = universityById.get(row.universityId);
            return university ? <UniversityCard key={row.universityId} university={university} athleteCount={row.athleteCount} resultText={row.resultText} /> : null;
          })}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="関連選手" description="この大会に出場予定、または結果に含まれる選手を表示しています。" />
        {relatedAthletes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {relatedAthletes.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} university={universityById.get(athlete.universityId)} result={resultsForMeet.find((row) => row.athleteId === athlete.id)} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="関連選手はまだありません" description="この大会に紐づく選手情報はまだ登録されていません。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="関連ページ" />
        <div className="grid gap-3 md:grid-cols-3">
          <RelatedLink href={`/meets/${meet.meet_id}#listed-races`} title="レース一覧で見る" text="この大会に含まれるレースを確認できます。" icon={<Rows3 size={20} />} />
          <RelatedLink href="/results" title="結果一覧で見る" text="この大会の結果を結果一覧で確認できます。" icon={<Trophy size={20} />} />
          <RelatedLink href="/universities" title="大学ページで見る" text="出場大学ごとの掲載種目、直近結果、PBを確認できます。" icon={<School size={20} />} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard text="大会詳細では、1つの大会に含まれるレースをまとめて確認できます。" />
          <GuideCard text="スタートリスト公開は、出場予定選手の一覧が確認できる状態です。" />
          <GuideCard text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function RaceCard({ race }: { race: ListedRace }) {
  const resultText =
    race.status === "result_published"
      ? `結果人数 ${race.resultCount ?? 0}名 / DNS ${race.dnsCount ?? 0}名`
      : "結果: 未公開";

  return (
    <Link href={race.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <RaceStatusBadge status={race.status} />
          </div>
          <h3 className="text-lg font-black text-ink transition-colors group-hover:text-sash-red">{race.raceName}</h3>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<CalendarDays size={16} />} label="開始時刻" value={race.startTime} />
        <InfoLine icon={<UserRound size={16} />} label="掲載選手数" value={race.entryCount === null ? "未定" : `${race.entryCount}名`} />
        <InfoLine icon={<Trophy size={16} />} label="結果" value={resultText} />
      </div>
    </Link>
  );
}

function ResultRow({ result, date }: { result: MeetResultRow; date: string }) {
  return (
    <Link href={result.href} className="grid gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-field/70 last:border-b-0 md:grid-cols-[92px_1.2fr_64px_1fr_92px_92px_64px] md:items-center">
      <span className="text-slate-500">{formatDate(date)}</span>
      <span className="font-black text-ink">{result.raceName}</span>
      <span>{result.rank}</span>
      <span>{result.athleteName}</span>
      <span>{result.universityName}</span>
      <span className="font-black text-ink">{result.time}</span>
      <span className={cn("text-xs font-black", result.note ? "text-sash-red" : "text-slate-400")}>{result.note}</span>
    </Link>
  );
}

function UniversityCard({ university, athleteCount, resultText }: { university: University; athleteCount: number; resultText: string }) {
  return (
    <Link href={`/universities/${university.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={university.accent} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{university.name}</h3>
            <span className="mt-1 inline-flex rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">掲載選手: {athleteCount}名</span>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3">
        <InfoLine icon={<Trophy size={16} />} label="掲載結果" value={resultText} />
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

function AthleteCard({ athlete, university, result }: { athlete: Athlete; university?: University; result?: MeetResultRow }) {
  const pb = athlete.pb.find((record) => record.distance === result?.distance) ?? athlete.pb.find((record) => record.distance === "10000m");

  return (
    <Link href={`/athletes/${athlete.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {university ? <SashMark accent={university.accent} /> : <span className="h-12 w-10 rounded-md bg-field" aria-hidden="true" />}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{athlete.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {university?.name ?? "大学未登録"}・{athlete.year ?? "学年未登録"}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<Trophy size={16} />} label="掲載PB" value={pb ? `${pb.distance} ${pb.time}` : "PB未登録"} />
        <InfoLine icon={<Flag size={16} />} label="結果" value={result ? `${result.raceName} / ${result.rank} / ${result.time || "未登録"}` : "結果待ち"} />
      </div>
    </Link>
  );
}

function MeetStatusBadge({ status }: { status: MeetStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", getMeetStatusClass(status))}>
      <span className={cn("h-2 w-2 rounded-full", getMeetStatusDot(status))} />
      {meetStatusLabels[status]}
    </span>
  );
}

function RaceStatusBadge({ status }: { status: RaceStatus }) {
  const labels: Record<RaceStatus, string> = {
    scheduled: "予定",
    startlist_published: "スタートリスト公開",
    result_published: "結果公開"
  };

  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", getRaceStatusClass(status))}>{labels[status]}</span>;
}

function CategoryBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{label}</span>;
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

function GuideCard({ text }: { text: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
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

function SashMark({ accent }: { accent: string }) {
  return (
    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-field" aria-hidden="true">
      <span className="absolute -left-3 top-0 h-16 w-7 -skew-x-[24deg]" style={{ backgroundColor: accent }} />
      <span className="absolute left-6 top-0 h-16 w-1.5 -skew-x-[24deg] bg-white" />
    </span>
  );
}

function getMeetStatusClass(status: MeetStatus) {
  const classMap: Record<MeetStatus, string> = {
    scheduled: "border-slate-200 bg-slate-50 text-slate-600",
    coming_soon: "border-yellow-200 bg-yellow-50 text-yellow-800",
    startlist_published: "border-blue-200 bg-blue-50 text-blue-700",
    result_waiting: "border-amber-200 bg-amber-50 text-amber-800",
    live: "border-red-200 bg-red-50 text-red-700",
    result_published: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return classMap[status];
}

function getMeetStatusDot(status: MeetStatus) {
  const classMap: Record<MeetStatus, string> = {
    scheduled: "bg-slate-400",
    coming_soon: "bg-yellow-400",
    startlist_published: "bg-blue-500",
    result_waiting: "bg-amber-400",
    live: "bg-red-500",
    result_published: "bg-emerald-500"
  };

  return classMap[status];
}

function getRaceStatusClass(status: RaceStatus) {
  const classMap: Record<RaceStatus, string> = {
    scheduled: "border-slate-200 bg-slate-50 text-slate-600",
    startlist_published: "border-blue-200 bg-blue-50 text-blue-700",
    result_published: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return classMap[status];
}
