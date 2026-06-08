import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Database, Flag, Info, Rows3, School, Trophy, UserRound } from "lucide-react";
import { athletes, Athlete } from "@/data/athletes";
import { meets } from "@/data/meets";
import { raceRecords } from "@/data/races";
import { resultCategoryLabels, resultRecords, resultSummaries, ResultRecord, ResultSummary } from "@/data/results";
import { universities, University } from "@/data/universities";
import { formatDate } from "@/lib/utils";

type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ" | "";

type RaceResultRow = {
  resultId: string;
  athleteId: string;
  universityId: string;
  rank: string;
  time: string;
  note: ResultNote;
};

type ResultDetail = {
  resultId: string;
  meetId: string;
  meetName: string;
  raceId: string;
  raceName: string;
  date: string;
  venue: string;
  category: ResultSummary["category"];
  distance: ResultSummary["distance"];
  status: "結果公開";
  athleteId: string;
  universityId: string;
  rank: string;
  time: string;
  note: ResultNote;
};

const legacyResultId = "kanto-10000m-mens-10000m-3-saeki";

const primaryResultDetail: ResultDetail = {
  resultId: "kanto-10000m-mens-10000m-3-saeki",
  meetId: "kanto-10000m",
  meetName: "関東学生10000m記録挑戦会",
  raceId: "mens-10000m-3",
  raceName: "男子10000m 3組",
  date: "2026-05-24",
  venue: "町田GIONスタジアム",
  category: "track" as const,
  distance: "10000m",
  status: "結果公開",
  athleteId: "saeki",
  universityId: "aoba",
  rank: "1位",
  time: "28:28.90",
  note: "PB" as ResultNote
};

const sameRaceResults: RaceResultRow[] = [
  { resultId: "kanto-10000m-mens-10000m-3-saeki", athleteId: "saeki", universityId: "aoba", rank: "1位", time: "28:28.90", note: "PB" },
  { resultId: "kanto-10000m-mens-10000m-3-hirai", athleteId: "hirai", universityId: "tohto", rank: "2位", time: "28:41.12", note: "SB" },
  { resultId: "kanto-10000m-mens-10000m-3-mizushima", athleteId: "mizushima", universityId: "aoba", rank: "DNS", time: "DNS", note: "DNS" }
];

export function generateStaticParams() {
  const params = [legacyResultId, ...resultSummaries.map((result) => result.result_id), ...resultRecords.map((result) => result.result_id)];
  return Array.from(new Set(params)).map((resultId) => ({ resultId }));
}

export default async function ResultDetailPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const resultDetail = resolveResultDetail(resultId);

  if (!resultDetail) {
    notFound();
  }

  const athlete = athletes.find((item) => item.id === resultDetail.athleteId);
  const university = universities.find((item) => item.id === resultDetail.universityId);
  const athleteById = new Map(athletes.map((item) => [item.id, item]));
  const universityById = new Map(universities.map((item) => [item.id, item]));

  if (!athlete || !university) {
    notFound();
  }

  const recentResult = athlete.recentResults.find((result) => result.time === resultDetail.time && result.distance === resultDetail.distance);
  const recordRows = resultRecords
    .filter((result) => result.race_id === resultDetail.raceId)
    .map((result) => ({
      resultId: result.result_id,
      athleteId: result.athlete_id,
      universityId: result.university_id,
      rank: result.rank,
      time: result.time,
      note: result.note ?? ("" as ResultNote)
    }));
  const displayedRaceResults = resultDetail.raceId === "mens-10000m-3" ? sameRaceResults : recordRows;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <Link href="/results" className="hover:text-sash-red">
          結果
        </Link>
        <ChevronRight size={14} />
        <Link href={`/races/${resultDetail.raceId}`} className="truncate hover:text-sash-red">
          {resultDetail.meetName} {resultDetail.raceName}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{athlete.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">結果詳細</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
            {athlete.name} {resultDetail.time}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            {resultDetail.meetName} {resultDetail.raceName}の掲載結果です。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label={resultDetail.status} />
            {resultDetail.note ? <NoteBadge note={resultDetail.note} /> : null}
            <CategoryBadge label={resultDetail.distance} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<UserRound size={18} />} label="選手" value={athlete.name} />
            <InfoCard icon={<School size={18} />} label="大学" value={university.name} />
            <InfoCard icon={<Trophy size={18} />} label="記録" value={resultDetail.time} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="結果概要" description="この掲載結果の基本情報を表示しています。" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
            <InfoLine icon={<Rows3 size={16} />} label="大会名" value={resultDetail.meetName} />
            <InfoLine icon={<Rows3 size={16} />} label="レース名" value={resultDetail.raceName} />
            <InfoLine icon={<CalendarDays size={16} />} label="日付" value={formatDate(resultDetail.date)} />
            <InfoLine icon={<Flag size={16} />} label="種目" value={resultDetail.distance} />
            <InfoLine icon={<Trophy size={16} />} label="順位" value={resultDetail.rank} />
            <InfoLine icon={<UserRound size={16} />} label="選手" value={athlete.name} />
            <InfoLine icon={<School size={16} />} label="大学" value={university.name} />
            <InfoLine icon={<Info size={16} />} label="学年" value={athlete.year} />
            <InfoLine icon={<Trophy size={16} />} label="記録" value={resultDetail.time} />
            <InfoLine icon={<Info size={16} />} label="備考" value={resultDetail.note || "—"} />
            <InfoLine icon={<Database size={16} />} label="ステータス" value={resultDetail.status} />
            <InfoLine icon={<Flag size={16} />} label="カテゴリ" value={resultCategoryLabels[resultDetail.category]} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="選手情報" description="この結果に紐づく選手情報です。" />
        <AthleteInfoCard athlete={athlete} university={university} recentResult={recentResult} meetName={resultDetail.meetName} />
      </section>

      <section className="mt-8">
        <SectionTitle title="大学情報" description="この結果に紐づく大学情報です。" />
        <UniversityInfoCard university={university} meetName={resultDetail.meetName} />
      </section>

      <section className="mt-8">
        <SectionTitle title="同じレースの結果" description="このレースに含まれる他の掲載結果を表示しています。" />
        <div className="hidden overflow-hidden rounded-lg border border-line bg-white shadow-sm md:block">
          <div className="hidden grid-cols-[72px_1fr_96px_64px_112px_72px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500 md:grid">
            <span>順位</span>
            <span>選手</span>
            <span>大学</span>
            <span>学年</span>
            <span>記録</span>
            <span>備考</span>
          </div>
          {displayedRaceResults.map((result) => (
            <SameRaceResultRow
              key={result.resultId}
              result={result}
              athlete={athleteById.get(result.athleteId)}
              university={universityById.get(result.universityId)}
              current={isCurrentResultRow(result, resultDetail)}
            />
          ))}
        </div>
        <div className="grid gap-3 md:hidden">
          {displayedRaceResults.map((result) => (
            <SameRaceResultCard
              key={`mobile-${result.resultId}`}
              result={result}
              athlete={athleteById.get(result.athleteId)}
              university={universityById.get(result.universityId)}
              current={isCurrentResultRow(result, resultDetail)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="関連ページ" />
        <div className="grid gap-3 md:grid-cols-3">
          <RelatedLink href={`/races/${resultDetail.raceId}`} title="レースページで見る" text={`${resultDetail.raceName}の出場予定・結果を確認できます。`} icon={<Rows3 size={20} />} />
          <RelatedLink href={`/meets/${resultDetail.meetId}`} title="大会ページで見る" text={`${resultDetail.meetName}の掲載レースを確認できます。`} icon={<CalendarDays size={20} />} />
          <RelatedLink href={`/athletes/${athlete.id}`} title="選手ページで見る" text={`${athlete.name}のPB、出場予定、直近結果を確認できます。`} icon={<UserRound size={20} />} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="PBとは" text="PBは自己ベストを表します。今回の記録が自己ベストの場合、備考にPBと表示します。" />
          <GuideCard title="DNSとは" text="DNSは欠場を表します。スタートリストに名前があっても、結果にDNSと表示される場合があります。" />
          <GuideCard title="公式情報について" text="掲載データは非公式に整理したものです。正式な大会情報・記録は、各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function resolveResultDetail(resultId: string): ResultDetail | null {
  if (resultId === legacyResultId) {
    return primaryResultDetail;
  }

  const summary = resultSummaries.find((result) => result.result_id === resultId);
  if (summary) {
    return buildResultDetailFromSummary(summary);
  }

  const record = resultRecords.find((result) => result.result_id === resultId);
  if (!record) {
    return null;
  }

  return buildResultDetailFromRecord(record);
}

function buildResultDetailFromSummary(summary: ResultSummary): ResultDetail {
  return {
    resultId: summary.result_id,
    meetId: summary.meet_id,
    meetName: summary.meet_name,
    raceId: summary.race_id,
    raceName: summary.race_name,
    date: summary.date,
    venue: summary.venue,
    category: summary.category,
    distance: summary.distance,
    status: "結果公開",
    athleteId: summary.winner_athlete_id,
    universityId: summary.winner_university_id,
    rank: "1位",
    time: summary.winner_time,
    note: summary.notes.includes("PB") ? "PB" : ""
  };
}

function buildResultDetailFromRecord(record: ResultRecord): ResultDetail {
  const meet = meets.find((item) => item.meet_id === record.meet_id);
  const race = raceRecords.find((item) => item.race_id === record.race_id);

  return {
    resultId: record.result_id,
    meetId: record.meet_id,
    meetName: meet?.meet_name ?? record.meet_id,
    raceId: record.race_id,
    raceName: race?.race_name ?? record.race_id,
    date: record.date,
    venue: meet?.venue ?? "会場未定",
    category: meet?.category ?? "track",
    distance: record.distance,
    status: "結果公開",
    athleteId: record.athlete_id,
    universityId: record.university_id,
    rank: record.rank,
    time: record.time,
    note: record.note ?? ""
  };
}

function isCurrentResultRow(result: RaceResultRow, resultDetail: ResultDetail) {
  return result.resultId === resultDetail.resultId || (result.athleteId === resultDetail.athleteId && result.time === resultDetail.time);
}

function AthleteInfoCard({ athlete, university, recentResult, meetName }: { athlete: Athlete; university: University; recentResult?: Athlete["recentResults"][number]; meetName: string }) {
  return (
    <Link href={`/athletes/${athlete.id}`} className="group block rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={university.accent} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{athlete.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {university.name}・{athlete.year}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoBlock label="掲載PB">
          {athlete.pb.map((record) => (
            <span key={`${athlete.id}-${record.distance}`} className="block">
              {record.distance} {record.time}
            </span>
          ))}
        </InfoBlock>
        <InfoBlock label="直近結果">
          {recentResult ? (
            <>
              <span className="block">{meetName}</span>
              <span className="block">
                {recentResult.distance} / {recentResult.rank} / {recentResult.time}
              </span>
            </>
          ) : (
            "未登録"
          )}
        </InfoBlock>
      </div>
    </Link>
  );
}

function UniversityInfoCard({ university, meetName }: { university: University; meetName: string }) {
  return (
    <Link href={`/universities/${university.id}`} className="group block rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={university.accent} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{university.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">地域：{university.listing.region}</p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoBlock label="掲載種目">{university.listing.events.join(" / ")}</InfoBlock>
        <InfoBlock label="直近結果">
          <span className="block">{meetName}</span>
          <span className="block">
            {university.listing.latestResult.athlete} / {university.listing.latestResult.event} / {university.listing.latestResult.time}
          </span>
        </InfoBlock>
      </div>
    </Link>
  );
}

function SameRaceResultRow({ result, athlete, university, current }: { result: RaceResultRow; athlete?: Athlete; university?: University; current: boolean }) {
  const row = (
    <div className="grid gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition last:border-b-0 md:grid-cols-[72px_1fr_96px_64px_112px_72px] md:items-center">
      <span className="font-black text-ink">{result.rank}</span>
      <span>{athlete?.name ?? "未登録"}</span>
      <span>{university?.name ?? "大学未登録"}</span>
      <span>{athlete?.year ?? "学年未登録"}</span>
      <span className="font-black text-sash-red">{result.time || "未登録"}</span>
      <span>{result.note ? <NoteBadge note={result.note} /> : null}</span>
    </div>
  );

  if (current) {
    return <div className="bg-red-50/70">{row}</div>;
  }

  return (
    <Link href={athlete ? `/athletes/${athlete.id}` : "#"} className="block hover:bg-field/70">
      {row}
    </Link>
  );
}

function SameRaceResultCard({ result, athlete, university, current }: { result: RaceResultRow; athlete?: Athlete; university?: University; current: boolean }) {
  const body = (
    <article className={`rounded-lg border border-line bg-white p-4 shadow-sm ${current ? "bg-red-50/70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-ink">{athlete?.name ?? "未登録"}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">
            {university?.name ?? "大学未登録"}・{athlete?.year ?? "学年未登録"}
          </p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-2">
        <InfoLine icon={<Trophy size={16} />} label="順位" value={result.rank} />
        <InfoLine icon={<Database size={16} />} label="記録" value={result.time || "未登録"} />
        <div className="grid grid-cols-[20px_92px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-2">
          <span className="mt-0.5 text-sash-red">
            <Info size={16} />
          </span>
          <span className="text-xs font-black text-slate-500">備考</span>
          <span>{result.note ? <NoteBadge note={result.note} /> : <span className="text-sm font-black text-slate-400">—</span>}</span>
        </div>
      </div>
    </article>
  );

  if (current) {
    return body;
  }

  return <Link href={athlete ? `/athletes/${athlete.id}` : "#"}>{body}</Link>;
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

function NoteBadge({ note }: { note: ResultNote }) {
  const className = note === "PB" ? "bg-red-50 text-sash-red" : note === "SB" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{note}</span>;
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

function SashMark({ accent }: { accent: string }) {
  return (
    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-field" aria-hidden="true">
      <span className="absolute -left-3 top-0 h-16 w-7 -skew-x-[24deg]" style={{ backgroundColor: accent }} />
      <span className="absolute left-6 top-0 h-16 w-1.5 -skew-x-[24deg] bg-white" />
    </span>
  );
}
