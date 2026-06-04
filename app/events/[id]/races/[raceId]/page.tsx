import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarClock, ChevronRight, Flag, MapPin, Trophy, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { events } from "@/data/events";
import { races } from "@/data/races";
import { universities } from "@/data/universities";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return races.map((race) => ({ id: race.eventId, raceId: race.id }));
}

export default async function RaceDetailPage({ params }: { params: Promise<{ id: string; raceId: string }> }) {
  const { id, raceId } = await params;
  const event = events.find((item) => item.id === id);
  const race = races.find((item) => item.eventId === id && item.id === raceId);

  if (!event || !race) {
    notFound();
  }

  const featuredAthletes = race.startList.filter((athlete) => athlete.featured);
  const relatedUniversities = universities.filter((university) => race.relatedUniversityIds.includes(university.id));
  const universityAccentById = new Map(universities.map((university) => [university.id, university.accent]));
  const topResults = race.results.slice(0, 3);
  const winner = race.results.find((result) => result.rank === 1);
  const pbCount = race.results.filter((result) => result.note === "PB").length;
  const hasResults = race.status === "result" && race.results.length > 0;

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
        <Link href={`/meets/${event.id}`} className="hover:text-sash-red">
          {event.shortName}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink">{race.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-8 hidden h-40 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-2 -skew-x-[22deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[22deg] bg-sash-deepRed/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={race.status} />
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{race.distance}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">レース詳細</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">{race.name}</h1>
          <p className="mt-2 text-sm font-black text-sash-red">{race.eventName}</p>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">{race.summary}</p>
          <div className="mt-4 max-w-3xl rounded-md bg-field p-3">
            <p className="text-xs font-black text-slate-500">この組で確認できること</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {race.focus.map((item) => (
                <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={<CalendarClock size={18} />} label={hasResults ? "実施日時" : "開始予定"} value={`${formatDate(event.date)} ${race.startTime}`} />
            <Info icon={<MapPin size={18} />} label="会場" value={event.venue} />
            <Info icon={<Flag size={18} />} label="種目" value={race.distance} />
            <Info icon={<UsersRound size={18} />} label={hasResults ? "出場人数" : "出場予定"} value={`${race.startList.length}名`} />
          </div>

          {hasResults ? (
            <div className="mt-5 grid gap-3 rounded-lg border border-line bg-white/80 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <ResultSummary label="1位選手" value={winner?.athlete ?? "-"} sub={winner?.university} />
              <ResultSummary label="記録" value={winner?.time ?? "-"} sub="1位記録" />
              <ResultSummary label="PB更新者数" value={`${pbCount}名`} sub="自己ベスト更新" />
              <ResultSummary label="出場人数" value={`${race.startList.length}名`} sub="DNS含む" />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            {["概要", "スタートリスト", "結果"].map((tab, index) => (
              <a
                key={tab}
                href={index === 0 ? "#overview" : index === 1 ? "#startlist" : "#results"}
                className={`rounded-full px-4 py-2 text-sm font-black ${hasResults ? index === 2 ? "bg-sash-red text-white" : "bg-field text-slate-700" : index === 0 ? "bg-sash-red text-white" : "bg-field text-slate-700"}`}
              >
                {tab}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="overview" className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={22} className="text-sash-red" />
            <h2 className="text-xl font-black text-ink">{hasResults ? "上位3名" : "PB上位選手"}</h2>
          </div>
          <p className="mb-3 text-xs font-bold text-slate-500">{hasResults ? "結果公開後は順位と記録をカードで確認できます。" : "スタートリスト内でPBが上位の選手を表示します。"}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(hasResults ? topResults : featuredAthletes).map((item, index) => (
              <article key={item.athlete} className="rounded-md bg-field p-3">
                {hasResults ? <span className="mb-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-black text-sash-red">{index + 1}位</span> : null}
                <p className="text-base font-black text-ink">{item.athlete}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {item.university} ・ {item.year}
                </p>
                <p className="mt-2 text-sm font-black text-sash-red">
                  {hasResults && "time" in item ? item.time : `PB ${"pb" in item ? item.pb : ""}`}
                </p>
                {"note" in item && item.note ? <NoteBadge note={item.note} /> : null}
                {"tag" in item && item.tag ? <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{item.tag}</span> : null}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={22} className="text-sash-red" />
            <h2 className="text-xl font-black text-ink">初心者向けメモ</h2>
          </div>
          <p className="mb-3 text-xs font-bold text-slate-500">結果を見るときによく出る用語です。</p>
          <div className="grid gap-2 text-sm font-bold leading-6 text-slate-700">
            <p className="rounded-md bg-field p-3">PBは自己ベスト。今回の記録が自己ベストならPBと表示します。</p>
            <p className="rounded-md bg-field p-3">SBはシーズンベスト。その年度内で一番良い記録です。</p>
            <p className="rounded-md bg-field p-3">DNSは欠場、DNFは途中棄権、DQは失格を表します。</p>
          </div>
        </div>
      </section>

      <section id="startlist" className="mt-6">
        <SectionTitle title="スタートリスト一覧" description="No.、選手名、大学、学年、PBを確認できます。" />
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="hidden grid-cols-[64px_1fr_1fr_80px_120px] border-b border-line bg-field px-4 py-3 text-xs font-black text-slate-500 md:grid">
            <span>No.</span>
            <span>選手名</span>
            <span>大学</span>
            <span>学年</span>
            <span>PB</span>
          </div>
          {race.startList.map((athlete) => (
            <div key={athlete.athlete} className="grid gap-2 border-b border-line p-4 last:border-b-0 md:grid-cols-[64px_1fr_1fr_80px_120px] md:items-center">
              <span className="text-xs font-black text-slate-400">No.{athlete.lane}</span>
              <span className="text-base font-black text-ink">{athlete.athlete}</span>
              <Link href={`/universities/${athlete.universityId}`} className="inline-flex items-center gap-2 text-sm font-black text-sash-red">
                <span className="h-5 w-1.5 -skew-x-[22deg] rounded-full" style={{ backgroundColor: universityAccentById.get(athlete.universityId) ?? "#b3263a" }} />
                {athlete.university}
              </Link>
              <span className="text-sm font-bold text-slate-600">{athlete.year}</span>
              <span className="text-sm font-black text-ink">{athlete.pb}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="results" className="mt-6 pb-8 md:pb-0">
        <SectionTitle title="結果" description="結果公開後に順位、記録、PB更新などを表示します。" />
        {hasResults ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-[72px_1fr_1fr_80px_120px_96px] border-b border-line bg-field px-4 py-3 text-xs font-black text-slate-500 md:grid">
              <span>順位</span>
              <span>選手名</span>
              <span>大学</span>
              <span>学年</span>
              <span>記録</span>
              <span>備考</span>
            </div>
            {race.results.map((result) => (
              <div key={`${result.rank}-${result.athlete}`} className="grid gap-2 border-b border-line p-4 last:border-b-0 md:grid-cols-[72px_1fr_1fr_80px_120px_96px] md:items-center">
                <span className="text-lg font-black text-sash-red">{result.rank}</span>
                <span className="text-base font-black text-ink">{result.athlete}</span>
                <Link href={`/universities/${result.universityId}`} className="inline-flex items-center gap-2 text-sm font-black text-sash-red">
                  <span className="h-5 w-1.5 -skew-x-[22deg] rounded-full" style={{ backgroundColor: universityAccentById.get(result.universityId) ?? "#b3263a" }} />
                  {result.university}
                </Link>
                <span className="text-sm font-bold text-slate-600">{result.year}</span>
                <span className="text-sm font-black text-ink">{result.time}</span>
                <span>{result.note ? <NoteBadge note={result.note} /> : <span className="text-xs font-bold text-slate-300">—</span>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-white px-4 py-4 text-sm font-bold text-slate-600 shadow-sm">
            結果はまだ公開されていません。公開後、順位・記録・大学別の上位選手をここに表示します。
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <SectionTitle title="関連レース" />
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            {race.relatedRaces.map((relatedRace) => (
              <Link key={relatedRace.id} href={`/meets/${event.id}#listed-races`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <span>
                  <span className="block text-sm font-black text-ink">{relatedRace.name}</span>
                  <span className="block text-xs font-bold text-slate-500">{relatedRace.startTime}開始</span>
                </span>
                <StatusBadge status={relatedRace.status} compact />
                <ChevronRight size={18} className="text-slate-500" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="関連大学" description="このレースに出場予定のある大学です。" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relatedUniversities.map((university) => (
              <Link key={university.id} href={`/universities/${university.id}`} className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-sm">
                <span className="relative h-11 w-9 overflow-hidden rounded-md bg-field" aria-hidden="true">
                  <span className="absolute -left-2 top-0 h-14 w-7 -skew-x-[24deg]" style={{ backgroundColor: university.accent }} />
                  <span className="absolute left-5 top-0 h-14 w-1.5 -skew-x-[24deg] bg-white" />
                </span>
                <span className="whitespace-nowrap text-sm font-black text-ink">{university.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-field p-3">
      <div className="mb-2 flex items-center gap-2 text-sash-red">{icon}</div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function ResultSummary({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md bg-field p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{value}</p>
      {sub ? <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p> : null}
    </div>
  );
}

function NoteBadge({ note }: { note: "PB" | "SB" | "DNS" | "DNF" | "DQ" }) {
  const className =
    note === "PB"
      ? "bg-red-50 text-sash-red"
      : note === "SB"
        ? "bg-blue-50 text-blue-700"
        : "bg-slate-100 text-slate-600";

  return <span className={`mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{note}</span>;
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-xl font-black text-ink sm:text-2xl">{title}</h2>
      {description ? <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
