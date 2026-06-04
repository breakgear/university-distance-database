import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Flag,
  MapPin,
  PlayCircle,
  Trophy,
  UsersRound
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { events } from "@/data/events";
import { meets } from "@/data/meets";
import { universities } from "@/data/universities";
import { formatDate } from "@/lib/utils";

const raceProgram = [
  { name: "男子10000m 1組", start: "15:20", status: "スタートリスト公開", note: "1年生と初10000mの選手を確認" },
  { name: "男子10000m 2組", start: "16:05", status: "スタートリスト公開", note: "複数大学の10000m PBを確認" },
  { name: "男子10000m 3組", start: "16:50", status: "スタートリスト公開", note: "PB 28分台の選手を確認" },
  { name: "男子10000m 最終組", start: "17:35", status: "まもなく", note: "最終組のスタートリストを確認" }
];

const startListRaces = [
  {
    name: "男子10000m 1組",
    athletes: ["中村 遥斗", "水嶋 航", "河合 俊介"],
    universities: ["中央", "早稲田", "順天堂"]
  },
  {
    name: "男子10000m 2組",
    athletes: ["森野 健太", "栗原 亮", "平井 悠真"],
    universities: ["駒澤", "青山学院", "國學院"]
  },
  {
    name: "男子10000m 3組",
    athletes: ["佐伯 蒼", "吉岡 連", "小田 智也"],
    universities: ["早稲田", "青山学院", "駒澤"]
  }
];

export function generateStaticParams() {
  return events.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((item) => item.id === id);

  if (!event) {
    notFound();
  }

  const focusPoints = event.focus.split("、").slice(0, 3);
  const relatedUniversities = universities.slice(0, 6);
  const meetHref = meets.some((meet) => meet.meet_id === event.id) ? `/meets/${event.id}` : `/events/${event.id}`;

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
        <span className="truncate text-ink">{event.shortName}</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-8 hidden h-40 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-2 -skew-x-[22deg] bg-sash-red/30" />
          <span className="h-full w-2 -skew-x-[22deg] bg-sash-deepRed/25" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} />
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{event.category}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">非公式まとめ</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-ink sm:text-4xl">{event.name}</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">{event.summary}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={<CalendarDays size={18} />} label="開催日" value={formatDate(event.date)} />
            <Info icon={<MapPin size={18} />} label="会場" value={event.venue} />
            <Info icon={<Flag size={18} />} label="種目" value={event.distance} />
            <Info icon={<UsersRound size={18} />} label="関連大学" value={`${relatedUniversities.length}校`} />
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ActionLink icon={<ExternalLink size={17} />} label="大会ページ" sub="掲載情報を確認" href={meetHref} />
            <ActionLink icon={<ClipboardList size={17} />} label="スタートリスト" sub="公開中" href="#startlist" />
            <ActionLink icon={<Trophy size={17} />} label="結果" sub="未公開" href="#results" unavailable />
            <ActionLink icon={<PlayCircle size={17} />} label="検索" sub="関連データを検索" href={`/search?q=${encodeURIComponent(event.name)}`} muted />
          </div>

          <p className="mt-4 text-xs font-bold text-slate-500">最終確認: 2026/5/22 14:00</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={22} className="text-sash-red" />
            <h2 className="text-xl font-black text-ink">確認できること</h2>
          </div>
          <p className="mb-3 text-xs font-bold text-slate-500">この大会ページで確認できる情報です。</p>
          <p className="text-sm font-bold leading-7 text-slate-700">{event.focus}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {focusPoints.map((point) => (
              <span key={point} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-ink">初心者向けメモ</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">記録やスタートリストを見る前に知っておくと迷いにくい補足です。</p>
          <div className="mt-3 grid gap-2 text-sm font-bold leading-6 text-slate-700">
            <p className="rounded-md bg-field p-3">10000mはトラック種目のひとつで、PBは自己ベストを表します。</p>
            <p className="rounded-md bg-field p-3">スタートリストでは、組、選手名、大学、学年、PBを確認できます。</p>
            <p className="rounded-md bg-field p-3">結果公開後は、順位、記録、PBやDNSなどの備考を確認できます。</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="種目一覧" description="大会で実施されるレースと開始予定時刻を確認できます。" />
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          {raceProgram.map((race) => (
            <Link
              key={race.name}
              href={race.name === "男子10000m 3組" ? "/races/mens-10000m-3" : "#startlist"}
              className="grid gap-2 border-b border-line p-4 transition hover:bg-field/60 last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
            >
              <div>
                <p className="text-base font-black text-ink">{race.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{race.note}</p>
              </div>
              <span className="text-sm font-black text-ink">{race.start}開始</span>
              <span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{race.status}</span>
              <ChevronRight size={20} className="hidden text-slate-500 sm:block" />
            </Link>
          ))}
        </div>
      </section>

      <section id="startlist" className="mt-6">
        <SectionTitle title="スタートリスト公開中のレース" description="各レースに出場予定の選手を確認できます。種目一覧より詳しい出場者情報です。" />
        <div className="grid gap-3 lg:grid-cols-3">
          {startListRaces.map((race) => (
            <article key={race.name} className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-ink">{race.name}</h3>
              <div className="mt-3 grid gap-2">
                {race.athletes.map((athlete, index) => (
                  <div key={athlete} className="flex items-center justify-between gap-3 rounded-md bg-field px-3 py-2">
                    <span className="text-sm font-black text-ink">{athlete}</span>
                    <span className="text-xs font-bold text-slate-500">{race.universities[index]}</span>
                  </div>
                ))}
              </div>
              <Link href={race.name === "男子10000m 3組" ? "/races/mens-10000m-3" : "#startlist"} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-sash-red">
                全スタートリストを見る
                <ChevronRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="results" className="mt-6">
        <SectionTitle title="結果公開中のレース" description="この大会の結果は公開後にレース単位で表示します。" />
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-3 text-sm font-bold text-slate-600">
          結果は未公開です。公開後、レース単位で上位結果を表示します。
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="関連する大学" description="出場予定のある大学を表示しています。" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {relatedUniversities.map((university) => (
            <Link key={university.id} href={`/universities/${university.id}`} className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-sm">
              <span className="relative h-11 w-9 overflow-hidden rounded-md bg-field" aria-hidden="true">
                <span className="absolute -left-2 top-0 h-14 w-7 -skew-x-[24deg]" style={{ backgroundColor: university.accent }} />
                <span className="absolute left-5 top-0 h-14 w-1.5 -skew-x-[24deg] bg-white" />
              </span>
              <span className="text-sm font-black text-ink">{university.name}</span>
            </Link>
          ))}
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

function ActionLink({
  icon,
  label,
  sub,
  href,
  muted = false,
  unavailable = false
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
  muted?: boolean;
  unavailable?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-3 py-2 transition hover:bg-field ${
        unavailable
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : muted
            ? "border-line bg-white text-slate-500"
            : "border-red-100 bg-red-50/50 text-sash-red"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>
          <span className="block text-sm font-black">{label}</span>
          <span className="block text-[11px] font-bold text-slate-500">{sub}</span>
        </span>
      </span>
      <ArrowUpRight size={16} />
    </Link>
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
