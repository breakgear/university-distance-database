import Link from "next/link";
import { CalendarDays, ChevronRight, Database, Flag, Info, Medal, School, Tags, Trophy, UserRound } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { resultSummaries, ResultSummary } from "@/data/results";
import { universities, University } from "@/data/universities";
import { formatDate } from "@/lib/utils";

const menuCards = [
  {
    title: "大会一覧",
    text: "大会日程、会場、ステータスを確認できます。",
    href: "/meets",
    icon: CalendarDays,
    items: ["大会", "日程", "会場", "ステータス"]
  },
  {
    title: "結果一覧",
    text: "公開済みレースの結果、順位、記録を確認できます。",
    href: "/results",
    icon: Medal,
    items: ["結果", "順位", "記録", "備考"]
  },
  {
    title: "大学一覧",
    text: "掲載中の大学、種目別PB、出場予定、直近結果を確認できます。",
    href: "/universities",
    icon: School,
    items: ["大学", "PB", "出場予定", "結果"]
  },
  {
    title: "選手一覧",
    text: "掲載選手、学年、PB、出場予定、直近結果を確認できます。",
    href: "/athletes",
    icon: UserRound,
    items: ["選手", "大学", "学年", "PB"]
  }
];

const nextListings = [
  {
    status: "結果待ち",
    meetName: "学生ナイトゲームズ5000m",
    raceName: "男子5000m A組",
    date: "2026-05-22",
    venue: "大井ふ頭中央海浜公園",
    href: "/meets/night-5000m"
  },
  {
    status: "結果待ち",
    meetName: "関東学生10000m記録挑戦会",
    raceName: "男子10000m 1組",
    date: "2026-05-24",
    venue: "町田GIONスタジアム",
    href: "/meets/kanto-10000m#listed-races"
  },
  {
    status: "まもなく",
    meetName: "出雲駅伝選考会",
    raceName: "掲載レース確認中",
    date: "2026-05-26",
    venue: "夢の島陸上競技場",
    href: "/meets/izumo-preview#listed-races"
  }
];

const guideCards = [
  {
    title: "掲載データについて",
    text: "このサイトは男子大学長距離・男子大学駅伝の情報を非公式に整理したものです。",
    icon: Database
  },
  {
    title: "PBとは",
    text: "PBは自己ベストを表します。掲載データ内の記録をもとに表示しています。",
    icon: Trophy
  },
  {
    title: "ステータスの見方",
    text: "予定、まもなく、結果待ち、結果公開などで大会・レースの状態を確認できます。",
    icon: Tags
  },
  {
    title: "公式情報について",
    text: "正式な大会情報・記録は各大会公式サイトをご確認ください。",
    icon: Info
  }
];

export default function HomePage() {
  const recentResults = resultSummaries.slice(0, 3);
  const universityShortcuts = universities.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-10">
      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-4 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">2026年シーズン中心</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">男子大学長距離・駅伝</span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">大学長距離データベース</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝の大会、結果、大学、選手を確認できる非公式まとめです。
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-3 shadow-sm sm:p-4">
        <SearchForm query="" selectedFilter="all" />
      </section>

      <section className="mt-8">
        <SectionTitle title="目的別に探す" description="目的別に掲載データを確認できます。" />
        <div className="grid gap-3 md:grid-cols-2">
          {menuCards.map((card) => (
            <MenuCard key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle title="最近公開された結果" description="公開・更新された直近の結果を表示しています。" href="/results" />
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          {recentResults.map((result) => (
            <RecentResultRow key={result.result_id} result={result} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle title="結果待ち・掲載予定" description="結果待ち、または今後掲載予定の大会・レースを表示しています。" href="/meets" />
        <div className="grid gap-3 lg:grid-cols-3">
          {nextListings.map((listing) => (
            <NextListingCard key={`${listing.meetName}-${listing.raceName}`} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle title="大学から探す" description="掲載中の大学ページを確認できます。" href="/universities" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {universityShortcuts.map((university) => (
            <UniversityShortcut key={university.id} university={university} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle title="初心者向けメモ" description="掲載データの見方です。" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {guideCards.map((card) => (
            <GuideCard key={card.title} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MenuCard({ card }: { card: (typeof menuCards)[number] }) {
  const Icon = card.icon;

  return (
    <Link href={card.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-red-50 text-sash-red">
            <Icon size={22} />
          </span>
          <h3 className="text-lg font-black text-ink transition-colors group-hover:text-sash-red">{card.title}</h3>
        </div>
        <ChevronRight size={20} className="mt-2 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{card.text}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.items.map((item) => (
          <span key={item} className="rounded-full bg-field px-2.5 py-1 text-xs font-black text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </Link>
  );
}

function RecentResultRow({ result }: { result: ResultSummary }) {
  return (
    <Link href={getResultHref(result)} className="group relative grid gap-2 border-b border-line px-4 py-3 text-sm font-bold transition hover:z-10 hover:border-red-200 hover:bg-red-50/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sash-red/35 last:border-b-0 sm:grid-cols-[1fr_104px_112px_82px_auto] sm:items-center">
      <span className="min-w-0">
        <span className="block break-words font-black text-ink">{result.meet_name} {result.race_name}</span>
        <span className="mt-1 block text-sm font-bold text-slate-600 sm:hidden">{result.winner_name}</span>
      </span>
      <span className="hidden text-slate-700 sm:block">{result.winner_name}</span>
      <span className="text-lg font-black text-sash-red sm:text-base">{result.winner_time}</span>
      <span className="text-xs font-black text-slate-600 sm:text-sm">{formatDate(result.date)}</span>
      <span className="hidden items-center justify-end sm:inline-flex">
        <ChevronRight size={18} className="text-slate-500 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function NextListingCard({ listing }: { listing: (typeof nextListings)[number] }) {
  return (
    <Link href={listing.href} className="group rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ListingStatusBadge status={listing.status} />
        <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{formatDate(listing.date)}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black text-ink transition-colors group-hover:text-sash-red">{listing.meetName}</h3>
          <p className="mt-1 text-sm font-bold text-slate-600">{listing.raceName}</p>
        </div>
        <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <InfoLine icon={<Flag size={16} />} label="会場" value={listing.venue} className="mt-3" />
    </Link>
  );
}

function UniversityShortcut({ university }: { university: University }) {
  return (
    <Link href={`/universities/${university.id}`} className="group rounded-lg border border-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35">
      <div className="flex items-center justify-between gap-2">
        <SashMark accent={university.accent} />
        <ChevronRight size={18} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <h3 className="mt-3 truncate text-base font-black text-ink transition-colors group-hover:text-sash-red">{university.name}</h3>
      <p className="mt-1 text-xs font-bold text-slate-500">{university.listing.region}</p>
      <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
        {university.listing.events.map((event) => (
          <span key={`${university.id}-${event}`} className="rounded-full bg-field px-2 py-0.5 text-[11px] font-black leading-4 text-slate-600 transition group-hover:bg-white">
            {event}
          </span>
        ))}
      </div>
    </Link>
  );
}

function GuideCard({ card }: { card: (typeof guideCards)[number] }) {
  const Icon = card.icon;

  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <Icon size={22} className="text-sash-red" />
      <h3 className="mt-3 text-base font-black text-ink">{card.title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{card.text}</p>
    </article>
  );
}

function ListingStatusBadge({ status }: { status: string }) {
  const isWaiting = status === "結果待ち";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isWaiting ? "border-amber-200 bg-amber-50 text-amber-800" : "border-yellow-200 bg-yellow-50 text-yellow-800"}`}>
      <span className={`h-2 w-2 rounded-full ${isWaiting ? "bg-amber-400" : "bg-yellow-400"}`} />
      {status}
    </span>
  );
}

function InfoLine({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`grid grid-cols-[20px_72px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-2 ${className}`}>
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className="text-sm font-black text-ink">{value}</span>
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

function SectionTitle({ title, description, href }: { title: string; description?: string; href?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-ink sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-black text-slate-700 hover:text-sash-red">
          すべて見る
          <ChevronRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}

function getResultHref(result: ResultSummary) {
  return `/results/${result.result_id}`;
}
