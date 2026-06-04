import Link from "next/link";
import { CalendarDays, ChevronRight, Database, Flag, ListFilter, MapPin, Rows3, Tags } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { meets, Meet, MeetCategory, meetCategoryLabels, MeetStatus, meetStatusLabels } from "@/data/meets";
import { cn, formatDate } from "@/lib/utils";

const filters: Array<{ label: string; value: "all" | MeetStatus | MeetCategory }> = [
  { label: "すべて", value: "all" },
  { label: "予定", value: "scheduled" },
  { label: "まもなく", value: "coming_soon" },
  { label: "スタートリスト公開", value: "startlist_published" },
  { label: "結果待ち", value: "result_waiting" },
  { label: "結果公開", value: "result_published" },
  { label: "トラック", value: "track" },
  { label: "ロード", value: "road" },
  { label: "駅伝", value: "ekiden" }
];

const monthlyMeets = [
  {
    month: "2026年5月",
    items: [
      { name: "学生ナイトゲームズ5000m", meetId: "night-5000m" },
      { name: "関東学生5000m決勝", meetId: "kanto-5000m-final" },
      { name: "関東学生10000m記録挑戦会", meetId: "kanto-10000m" },
      { name: "出雲駅伝選考会", meetId: "izumo-preview" }
    ]
  },
  {
    month: "2026年6月",
    items: [
      { name: "全日本大学駅伝対校選考会", meetId: "all-japan-prep" },
      { name: "箱根駅伝予選会プレ記録会", meetId: "hakone-qualifier-trial" }
    ]
  }
];

export default async function MeetsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const selectedFilter = filters.some((item) => item.value === filter) ? filter ?? "all" : "all";
  const filteredMeets =
    selectedFilter === "all" ? meets : meets.filter((meet) => meet.status === selectedFilter || meet.category === selectedFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">大会</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-7 hidden h-44 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-deepRed/15" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">大会一覧</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">非公式まとめ</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">大会一覧</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            男子大学長距離・男子大学駅伝の大会日程、会場、ステータスを確認できます。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={18} />} label="掲載内容" value="大会日程 / 会場 / ステータス" />
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
                href={filterItem.value === "all" ? "/meets" : `/meets?filter=${filterItem.value}`}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black",
                  filterItem.value === selectedFilter
                    ? "border-sash-red bg-red-50 text-sash-red"
                    : filterItem.value === "all"
                      ? "border-line bg-white text-ink"
                      : getFilterClass(filterItem.value)
                )}
              >
                {filterItem.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="掲載大会" description="大会名、日付、会場、カテゴリ、ステータスをカードで表示しています。" />
        {filteredMeets.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredMeets.map((meet) => (
              <MeetCard key={meet.meet_id} meet={meet} />
            ))}
          </div>
        ) : (
          <EmptyState title="掲載大会がありません" description="現在、表示できる大会データはありません。" actions={[{ href: "/", label: "トップページへ戻る", primary: true }]} />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="月別で見る" description="掲載大会を月別に確認できます。" />
        <div className="grid gap-3 md:grid-cols-2">
          {monthlyMeets.map((group) => (
            <article key={group.month} className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-ink">{group.month}</h3>
              <div className="mt-3 grid gap-2">
                {group.items.map((item) => (
                  <Link key={item.meetId} href={`/meets/${item.meetId}`} className="group flex items-center justify-between gap-3 rounded-md bg-field px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-sash-red">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sash-red" aria-hidden="true" />
                      {item.name}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-slate-400 transition group-hover:text-sash-red" />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" description="用語と表示内容の見方です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="ステータスの見方" text="大会カードの色で、予定・まもなく・結果待ち・スタートリスト公開・結果公開を確認できます。" />
          <GuideCard title="スタートリストとは" text="出場予定選手の一覧です。結果とは分けて確認します。" />
          <GuideCard title="正式情報について" text="掲載データは非公式に整理したものです。正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function MeetCard({ meet }: { meet: Meet }) {
  const countText = meet.race_count === null ? "未定" : `${meet.race_count}件`;
  const publishedText =
    meet.published_result_count > 0
      ? `結果公開レース数: ${meet.published_result_count}件`
      : meet.published_startlist_count > 0
        ? `スタートリスト公開レース数: ${meet.published_startlist_count}件`
        : "レース情報: 未定";
  const noteText = meet.status === "scheduled" ? "レース情報: 未定" : meet.note;

  return (
    <Link href={`/meets/${meet.meet_id}`} className="group flex min-h-56 flex-col justify-between rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <span>
        <span className="mb-3 flex flex-wrap items-center gap-2">
          <MeetStatusBadge status={meet.status} />
          <CategoryBadge category={meet.category} />
        </span>
        <span className="flex items-start justify-between gap-3">
          <span className="text-lg font-black leading-7 text-ink group-hover:text-sash-red">{meet.meet_name}</span>
          <ChevronRight size={20} className="mt-1 shrink-0 text-slate-500" />
        </span>
        <span className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
          <span className="flex items-center gap-2">
            <CalendarDays size={16} className="text-sash-red" />
            {formatDate(meet.date)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="text-sash-red" />
            {meet.venue}
          </span>
        </span>
      </span>
      <span className="mt-4 grid gap-2 border-t border-line pt-3 text-xs font-black text-slate-600">
        <span className="text-ink">掲載レース数: {countText}</span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-slate-600">{publishedText}</span>
          <span className="rounded-full bg-field px-2.5 py-1 text-slate-600">{noteText}</span>
        </span>
      </span>
    </Link>
  );
}

function MeetStatusBadge({ status }: { status: MeetStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", getStatusClass(status))}>
      <span className={cn("h-2 w-2 rounded-full", getStatusDot(status))} />
      {meetStatusLabels[status]}
    </span>
  );
}

function CategoryBadge({ category }: { category: MeetCategory }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{meetCategoryLabels[category]}</span>;
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

function getFilterClass(value: "all" | MeetStatus | MeetCategory) {
  if (value === "all") {
    return "border-line bg-white text-ink";
  }

  if (value === "track" || value === "road" || value === "ekiden") {
    return "border-line bg-field text-slate-700";
  }

  return getStatusClass(value);
}

function getStatusClass(status: MeetStatus) {
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

function getStatusDot(status: MeetStatus) {
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
