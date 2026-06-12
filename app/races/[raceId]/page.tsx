import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Database, Flag, Info, Rows3, School, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { athletes, Athlete } from "@/data/athletes";
import { meetCategoryLabels, meets } from "@/data/meets";
import { races as raceDetails } from "@/data/races";
import { universities, University } from "@/data/universities";
import { cn, formatDate } from "@/lib/utils";

type EntryStatus = "出場" | "出場予定" | "DNS" | "要確認";
type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ" | "";

type RaceEntry = {
  no: number;
  athleteId: string;
  universityId: string;
  pb: string;
  status: EntryStatus;
};

type RaceResult = {
  athleteId: string;
  universityId: string;
  rank: string;
  time: string;
  note: ResultNote;
};

type UniversitySummary = {
  universityId: string;
  athleteCount: number;
  resultText: string;
};

export function generateStaticParams() {
  return raceDetails.map((race) => ({ raceId: race.id }));
}

export default async function RaceDetailPage({ params }: { params: Promise<{ raceId: string }> }) {
  const { raceId } = await params;
  const race = raceDetails.find((item) => item.id === raceId);

  if (!race) {
    notFound();
  }

  const meet = meets.find((item) => item.meet_id === race.eventId);
  if (!meet) {
    notFound();
  }

  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const universityById = new Map(universities.map((university) => [university.id, university]));
  const raceDetail = {
    raceId: race.id,
    meetId: race.eventId,
    raceName: race.name,
    startTime: race.startTime,
    distance: race.distance,
    status: race.status === "result" ? "結果公開" : race.status === "startlist" ? "スタートリスト公開" : race.status === "waiting" ? "結果待ち" : "予定",
    entryCount: race.startList.length,
    resultCount: race.results.filter((result) => result.note !== "DNS").length,
    dnsCount: race.results.filter((result) => result.note === "DNS").length
  };
  const raceEntries: RaceEntry[] = race.startList.map((entry) => {
    const result = race.results.find((item) => item.athleteId === entry.athleteId);

    return {
      no: entry.lane,
      athleteId: entry.athleteId,
      universityId: entry.universityId,
      pb: `${race.distance} ${entry.pb}`,
      status:
        result?.note === "DNS" || entry.entryStatus === "dns"
          ? "DNS"
          : result
            ? "出場"
            : entry.entryStatus === "unconfirmed"
              ? "要確認"
              : "出場予定"
    };
  });
  const raceResults: RaceResult[] = race.results.map((result) => ({
    athleteId: result.athleteId,
    universityId: result.universityId,
    rank: result.note === "DNS" ? "DNS" : `${result.rank}位`,
    time: result.note === "DNS" ? "DNS" : result.time,
    note: result.note ?? ""
  }));
  const universitySummaries: UniversitySummary[] = Array.from(new Set(raceEntries.map((entry) => entry.universityId))).map((universityId) => {
    const resultText = raceResults
      .filter((result) => result.universityId === universityId)
      .map((result) => result.rank)
      .join(" / ");

    return {
      universityId,
      athleteCount: raceEntries.filter((entry) => entry.universityId === universityId).length,
      resultText: resultText || "未確認"
    };
  });
  const pbResults = raceResults.filter((result) => result.note === "PB");

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
        <Link href={`/meets/${meet.meet_id}`} className="hover:text-sash-red">
          {meet.meet_name}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{raceDetail.raceName}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">レース詳細</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">{raceDetail.raceName}</h1>
          <p className="mt-2 text-sm font-black text-slate-500">{meet.meet_name}</p>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            このレースの出場予定、結果、記録、備考を確認できます。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label={raceDetail.status} type="result" />
            <CategoryBadge label={meetCategoryLabels[meet.category]} />
            <CategoryBadge label={raceDetail.distance} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<CalendarDays size={18} />} label="大会日程" value={formatDate(meet.date)} />
            <InfoCard icon={<Rows3 size={18} />} label="開始時刻" value={raceDetail.startTime || "開始時刻未定"} />
            <InfoCard icon={<Database size={18} />} label="掲載データ" value="出場予定 / 結果 / PB" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="レース概要" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
            <InfoLine icon={<Rows3 size={16} />} label="大会名" value={meet.meet_name} />
            <InfoLine icon={<Rows3 size={16} />} label="レース名" value={raceDetail.raceName} />
            <InfoLine icon={<Flag size={16} />} label="種目" value={raceDetail.distance} />
            <InfoLine icon={<CalendarDays size={16} />} label="開始時刻" value={raceDetail.startTime || "開始時刻未定"} />
            <InfoLine icon={<Info size={16} />} label="ステータス" value={raceDetail.status} />
            <InfoLine icon={<UserRound size={16} />} label="掲載選手数" value={`${raceDetail.entryCount}名`} />
            <InfoLine icon={<Trophy size={16} />} label="掲載結果数" value={`${raceDetail.resultCount}名`} />
            <InfoLine icon={<Info size={16} />} label="DNS人数" value={`${raceDetail.dnsCount}名`} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="掲載選手" description="スタートリストまたは結果に含まれる選手を表示しています。" />
        {raceEntries.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-[56px_1fr_96px_64px_140px_96px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500 md:grid">
              <span>No.</span>
              <span>選手</span>
              <span>大学</span>
              <span>学年</span>
              <span>掲載PB</span>
              <span>出場状況</span>
            </div>
            {raceEntries.map((entry) => (
              <EntryRow key={entry.athleteId} entry={entry} athlete={athleteById.get(entry.athleteId)} university={universityById.get(entry.universityId)} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="スタートリストはまだありません" description="出場予定選手が登録されると表示されます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="レース結果" description="結果公開済みの掲載データを表示しています。" />
        {raceResults.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-[72px_1fr_96px_64px_112px_72px] border-b border-line bg-field px-4 py-2 text-xs font-black text-slate-500 md:grid">
              <span>順位</span>
              <span>選手</span>
              <span>大学</span>
              <span>学年</span>
              <span>記録</span>
              <span>備考</span>
            </div>
            {raceResults.map((result) => (
              <ResultRow key={`${result.athleteId}-${result.rank}`} result={result} athlete={athleteById.get(result.athleteId)} university={universityById.get(result.universityId)} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="結果はまだ公開されていません" description="結果が登録されると、順位・記録・備考を確認できます。" />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="PB更新者" description="掲載結果の中で、PBが付いている選手を表示しています。" />
        {pbResults.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {pbResults.map((result) => (
              <PbCard key={result.athleteId} result={result} distance={raceDetail.distance} athlete={athleteById.get(result.athleteId)} university={universityById.get(result.universityId)} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">このレースの掲載データ内にPB更新者はありません。</div>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="出場大学" description="このレースに掲載している大学を表示しています。" />
        <div className="grid gap-3 md:grid-cols-3">
          {universitySummaries.map((summary) => {
            const university = universityById.get(summary.universityId);
            return university ? <UniversityCard key={summary.universityId} university={university} summary={summary} /> : null;
          })}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="関連ページ" />
        <div className="grid gap-3 md:grid-cols-3">
          <RelatedLink href={`/meets/${meet.meet_id}`} title="大会詳細を見る" text={meet.meet_name} icon={<CalendarDays size={20} />} />
          <RelatedLink href="/results" title="結果一覧で見る" text="このレースの結果を一覧で確認できます。" icon={<Trophy size={20} />} />
          <RelatedLink href="/universities" title="大学ページで見る" text="大学ごとの掲載種目、直近結果、PBを確認できます。" icon={<School size={20} />} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard text="レース詳細では、1つの組・種目ごとの出場予定と結果を確認できます。" />
          <GuideCard text="PBは自己ベストを表します。今回の記録が自己ベストの場合、備考にPBと表示します。" />
          <GuideCard text="DNSは欠場を表します。スタートリストに名前があっても、結果にDNSと表示される場合があります。" />
        </div>
      </section>
    </div>
  );
}

function EntryRow({ entry, athlete, university }: { entry: RaceEntry; athlete?: Athlete; university?: University }) {
  return (
    <div className="grid gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-field/70 last:border-b-0 md:grid-cols-[56px_1fr_96px_64px_140px_96px] md:items-center">
      <span className="text-slate-500">{entry.no}</span>
      {athlete ? (
        <Link href={`/athletes/${athlete.id}`} className="font-black text-ink hover:text-sash-red hover:underline">
          {athlete.name}
        </Link>
      ) : (
        <span className="font-black text-ink">未登録</span>
      )}
      {university ? (
        <Link href={`/universities/${university.id}`} className="hover:text-sash-red hover:underline">
          {university.name}
        </Link>
      ) : (
        <span>大学未登録</span>
      )}
      <span>{athlete?.year ?? "学年未登録"}</span>
      <span className="font-black text-ink">{entry.pb || "PB未登録"}</span>
      <span>
        <EntryStatusBadge status={entry.status} />
      </span>
    </div>
  );
}

function ResultRow({ result, athlete, university }: { result: RaceResult; athlete?: Athlete; university?: University }) {
  const href = result.athleteId === "saeki" ? "/results/kanto-10000m-mens-10000m-3-saeki" : athlete ? `/athletes/${athlete.id}` : "#";

  return (
    <div className="grid gap-1 border-b border-line px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-field/70 last:border-b-0 md:grid-cols-[72px_1fr_96px_64px_112px_72px] md:items-center">
      <span className="font-black text-ink">{result.rank}</span>
      {athlete ? (
        <Link href={href} className="hover:text-sash-red hover:underline">
          {athlete.name}
        </Link>
      ) : (
        <span>未登録</span>
      )}
      {university ? (
        <Link href={`/universities/${university.id}`} className="hover:text-sash-red hover:underline">
          {university.name}
        </Link>
      ) : (
        <span>大学未登録</span>
      )}
      <span>{athlete?.year ?? "学年未登録"}</span>
      <span className="font-black text-sash-red">{result.time || "未登録"}</span>
      <span>{result.note ? <ResultNoteBadge note={result.note} /> : null}</span>
    </div>
  );
}

function PbCard({ result, distance, athlete, university }: { result: RaceResult; distance: string; athlete?: Athlete; university?: University }) {
  return (
    <Link href={athlete ? `/athletes/${athlete.id}` : "#"} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {university ? <SashMark accent={university.accent} /> : <span className="h-12 w-10 rounded-md bg-field" aria-hidden="true" />}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{athlete?.name ?? "未登録"}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {university?.name ?? "大学未登録"}・{athlete?.year ?? "学年未登録"}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<Trophy size={16} />} label="記録" value={`${distance} ${result.time || "未登録"}`} />
        <InfoLine icon={<Info size={16} />} label="備考" value={result.note || "未登録"} />
      </div>
    </Link>
  );
}

function UniversityCard({ university, summary }: { university: University; summary: UniversitySummary }) {
  return (
    <Link href={`/universities/${university.id}`} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={university.accent} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-ink transition-colors group-hover:text-sash-red">{university.name}</h3>
            <span className="mt-1 inline-flex rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">掲載選手: {summary.athleteCount}名</span>
          </div>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3">
        <InfoLine icon={<Trophy size={16} />} label="掲載結果" value={summary.resultText} />
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

function EntryStatusBadge({ status }: { status: EntryStatus }) {
  const className =
    status === "出場" || status === "出場予定"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DNS"
        ? "bg-slate-100 text-slate-600"
        : "bg-yellow-50 text-yellow-800";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", className)}>{status}</span>;
}

function ResultNoteBadge({ note }: { note: Exclude<ResultNote, ""> }) {
  const className =
    note === "PB" ? "bg-red-50 text-sash-red" : note === "SB" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", className)}>{note}</span>;
}

function StatusBadge({ label, type }: { label: string; type: "result" }) {
  const className = type === "result" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-field text-slate-600";

  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", className)}>{label}</span>;
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
