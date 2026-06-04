import Link from "next/link";
import { CalendarDays, ChevronRight, Database, Flag, Info, ListFilter, MapPin, Rows3, Trophy, UserRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";
import { athletes } from "@/data/athletes";
import { meets, meetStatusLabels, MeetStatus } from "@/data/meets";
import { resultSummaries } from "@/data/results";
import { universities } from "@/data/universities";
import { cn, formatDate } from "@/lib/utils";

type SearchFilter = "all" | "meet" | "result" | "university" | "athlete";

type AthleteLatestResult = {
  eventName: string;
  detail: string;
};

type SearchItem =
  | { type: "meet"; href: string; meetName: string; date: string; venue: string; status: MeetStatus; raceCount: number | null; searchText: string }
  | { type: "result"; href: string; raceName: string; winnerName: string; winnerTime: string; pbCount: number; dnsCount: number; searchText: string }
  | { type: "university"; href: string; universityName: string; accent: string; events: string; athleteCount: number; latestResult: string; searchText: string }
  | { type: "athlete"; href: string; athleteName: string; universityName: string; year: string; accent: string; pb: string[]; latestResult: AthleteLatestResult | null; searchText: string };

const filters: Array<{ label: string; value: SearchFilter }> = [
  { label: "すべて", value: "all" },
  { label: "大会", value: "meet" },
  { label: "結果", value: "result" },
  { label: "大学", value: "university" },
  { label: "選手", value: "athlete" }
];

const categoryOrder: Exclude<SearchFilter, "all">[] = ["athlete", "university", "meet", "result"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { q, filter } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedFilter = filters.some((item) => item.value === filter) ? (filter as SearchFilter) : "all";
  const searchItems = buildSearchItems();
  const queryMatchedItems = searchItems.filter((item) => matchesQuery(item, query));
  const filteredItems = queryMatchedItems.filter((item) => selectedFilter === "all" || item.type === selectedFilter);
  const categorySections = buildCategorySections(filteredItems, selectedFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-8 sm:pt-10">
      <nav className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">検索</span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-3.5 shadow-sm sm:p-5">
        <div className="absolute bottom-0 right-7 hidden h-36 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">検索</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">非公式まとめ</span>
          </div>
          <h1 className="text-2xl font-black leading-tight text-ink sm:text-3xl">検索</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-700">
            大会名、大学名、選手名から掲載データを検索できます。
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <InfoCard icon={<Rows3 size={17} />} label="検索対象" value="大会 / 結果 / 大学 / 選手" />
            <InfoCard icon={<Database size={17} />} label="掲載データ" value="2026年シーズン中心" />
            <InfoCard icon={<Info size={17} />} label="注意" value="非公式まとめ" />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-3 shadow-sm sm:p-4">
        <SearchForm query={query} selectedFilter={selectedFilter} />
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <ListFilter size={20} className="text-sash-red" />
          <h2 className="text-xl font-black text-ink">フィルター</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            {filters.map((filterItem) => {
              const href = buildFilterHref(filterItem.value, query);
              const count = countSearchItems(queryMatchedItems, filterItem.value);

              return (
                <Link
                  key={filterItem.value}
                  href={href}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black",
                    filterItem.value === selectedFilter
                      ? "border-sash-red bg-red-50 text-sash-red"
                      : filterItem.value === "all"
                        ? "border-line bg-white text-ink"
                        : "border-line bg-field text-slate-700"
                  )}
                >
                  {filterItem.label} {count}件
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <SectionTitle title="検索結果" description="大会、結果、大学、選手をカードで表示しています。" />
        {filteredItems.length > 0 ? (
          <div className="grid gap-5">
            {categorySections.map((section) => (
              <div key={section.type}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-base font-black text-ink">{getTypeLabel(section.type)}</h3>
                  <span className="rounded-full bg-field px-2.5 py-1 text-xs font-black text-slate-600">{section.items.length}件</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {section.items.map((item) => (
                    <SearchResultCard key={`${item.type}-${item.href}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySearchState />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title="初心者向けメモ" description="検索と掲載データの見方です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard title="検索について" text="検索では、大会名・大学名・選手名をまとめて探せます。" />
          <GuideCard title="掲載データについて" text="掲載データは非公式に整理したものです。" />
          <GuideCard title="公式情報について" text="正式な大会情報・記録は各大会公式サイトをご確認ください。" />
        </div>
      </section>
    </div>
  );
}

function buildSearchItems(): SearchItem[] {
  const meetItems = meets.map((meet): Extract<SearchItem, { type: "meet" }> => ({
      type: "meet",
      href: `/meets/${meet.meet_id}`,
      meetName: meet.meet_name,
      date: meet.date,
      venue: meet.venue,
      status: meet.status,
      raceCount: meet.race_count,
      searchText: `${meet.meet_name} ${meet.venue} ${meet.category} ${meetStatusLabels[meet.status]} 大会 レース ${meet.meet_id} ${meet.slug}`
    }));

  const resultItems = resultSummaries.map((result): Extract<SearchItem, { type: "result" }> => ({
      type: "result",
      href: `/results/${result.result_id}`,
      raceName: `${result.meet_name} ${result.race_name}`,
      winnerName: result.winner_name,
      winnerTime: result.winner_time,
      pbCount: result.pb_count,
      dnsCount: result.dns_count,
      searchText: `${result.meet_name} ${result.race_name} ${result.winner_name} ${result.winner_university_name} ${result.winner_time} ${result.distance} 結果 PB DNS ${result.result_id}`
    }));

  const universityItems = universities.map((university): Extract<SearchItem, { type: "university" }> => ({
      type: "university",
      href: `/universities/${university.id}`,
      universityName: university.name,
      accent: university.accent,
      events: university.listing.events.join(" / "),
      athleteCount: university.athletes.length,
      latestResult: `${university.listing.latestResult.athlete} / ${university.listing.latestResult.event} / ${university.listing.latestResult.time}`,
      searchText: `${university.name} ${university.slug} ${university.listing.region} ${university.listing.events.join(" ")} ${university.listing.latestResult.athlete} ${university.listing.latestResult.event} ${university.listing.latestResult.time} 大学`
    }));

  const athleteItems = athletes.map((athlete): Extract<SearchItem, { type: "athlete" }> => {
    const athleteUniversity = universities.find((item) => item.id === athlete.universityId);
    const latestAthleteResult = athlete.recentResults[0];

    return {
      type: "athlete",
      href: `/athletes/${athlete.id}`,
      athleteName: athlete.name,
      universityName: athleteUniversity?.name ?? "大学未登録",
      year: athlete.year,
      accent: athleteUniversity?.accent ?? "#b3263a",
      pb: athlete.pb.map((record) => `${record.distance} ${record.time}`),
      latestResult: latestAthleteResult ? formatAthleteLatestResult(latestAthleteResult) : null,
      searchText: `${athlete.name} ${athlete.slug} ${athleteUniversity?.name ?? ""} ${athlete.year} ${athlete.pb.map((record) => `${record.distance} ${record.time}`).join(" ")} ${athlete.recentResults.map((result) => `${result.event} ${result.distance} ${result.rank} ${result.time}`).join(" ")} 選手`
    };
  });

  return [...athleteItems, ...universityItems, ...meetItems, ...resultItems];
}

function SearchResultCard({ item }: { item: SearchItem }) {
  return (
    <Link href={item.href} className="group rounded-lg border border-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 sm:p-3.5">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <TypeBadge type={item.type} />
        {item.type === "meet" ? <MeetStatusBadge status={item.status} /> : null}
      </div>
      {item.type === "meet" ? <MeetCardBody item={item} /> : null}
      {item.type === "result" ? <ResultCardBody item={item} /> : null}
      {item.type === "university" ? <UniversityCardBody item={item} /> : null}
      {item.type === "athlete" ? <AthleteCardBody item={item} /> : null}
    </Link>
  );
}

function MeetCardBody({ item }: { item: Extract<SearchItem, { type: "meet" }> }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-black text-ink transition-colors group-hover:text-sash-red sm:text-lg">{item.meetName}</h3>
        <ChevronRight size={20} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<CalendarDays size={16} />} label="日付" value={formatDate(item.date)} />
        <InfoLine icon={<MapPin size={16} />} label="会場" value={item.venue} />
        <InfoLine icon={<Rows3 size={16} />} label="掲載レース数" value={item.raceCount === null ? "未定" : `${item.raceCount}件`} />
      </div>
    </>
  );
}

function ResultCardBody({ item }: { item: Extract<SearchItem, { type: "result" }> }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-black text-ink transition-colors group-hover:text-sash-red sm:text-lg">{item.raceName}</h3>
        <ChevronRight size={20} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<UserRound size={16} />} label="1位選手" value={item.winnerName} />
        <InfoLine icon={<Trophy size={16} />} label="記録" value={item.winnerTime} />
        <InfoLine icon={<Rows3 size={16} />} label="備考" value={`PB ${item.pbCount}名 / DNS ${item.dnsCount}名`} />
      </div>
    </>
  );
}

function UniversityCardBody({ item }: { item: Extract<SearchItem, { type: "university" }> }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={item.accent} />
          <h3 className="line-clamp-2 text-base font-black text-ink transition-colors group-hover:text-sash-red sm:text-lg">{item.universityName}</h3>
        </div>
        <ChevronRight size={20} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <InfoLine icon={<Rows3 size={16} />} label="掲載種目" value={item.events} />
        <InfoLine icon={<UserRound size={16} />} label="掲載選手数" value={`${item.athleteCount}名`} />
        <InfoLine icon={<Flag size={16} />} label="直近結果" value={item.latestResult} />
      </div>
    </>
  );
}

function AthleteCardBody({ item }: { item: Extract<SearchItem, { type: "athlete" }> }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SashMark accent={item.accent} />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-black text-ink transition-colors group-hover:text-sash-red sm:text-lg">{item.athleteName}</h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {item.universityName} ・ {item.year}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
        <PbLine pb={item.pb} />
        <RecentResultLine result={item.latestResult} />
      </div>
    </>
  );
}

function TypeBadge({ type }: { type: SearchFilter }) {
  return <span className="rounded-full bg-field px-2.5 py-1 text-xs font-black text-slate-700">{getTypeLabel(type)}</span>;
}

function MeetStatusBadge({ status }: { status: MeetStatus }) {
  const className =
    status === "result_published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "startlist_published"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "result_waiting"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : status === "live"
            ? "border-red-200 bg-red-50 text-red-700"
            : status === "coming_soon"
              ? "border-yellow-200 bg-yellow-50 text-yellow-800"
              : "border-slate-200 bg-slate-50 text-slate-600";

  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", className)}>{meetStatusLabels[status]}</span>;
}

function buildFilterHref(filter: SearchFilter, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filter !== "all") params.set("filter", filter);
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

function matchesQuery(item: SearchItem, query: string) {
  return !query || item.searchText.toLowerCase().includes(query.toLowerCase());
}

function countSearchItems(items: SearchItem[], filter: SearchFilter) {
  if (filter === "all") return items.length;
  return items.filter((item) => item.type === filter).length;
}

function buildCategorySections(items: SearchItem[], selectedFilter: SearchFilter) {
  const order = selectedFilter === "all" ? categoryOrder : [selectedFilter as Exclude<SearchFilter, "all">];

  return order
    .map((type) => ({
      type,
      items: items.filter((item) => item.type === type)
    }))
    .filter((section) => section.items.length > 0);
}

function getTypeLabel(type: SearchFilter) {
  const labels: Record<SearchFilter, string> = {
    all: "すべて",
    meet: "大会",
    result: "結果",
    university: "大学",
    athlete: "選手"
  };

  return labels[type];
}

function formatResultEventName(eventName: string) {
  return eventName
    .replace(/\s+男子\d+m.*$/, "")
    .replace(/\s+女子\d+m.*$/, "")
    .replace(/\s+ハーフマラソン.*$/, "");
}

function formatAthleteLatestResult(result: (typeof athletes)[number]["recentResults"][number]): AthleteLatestResult {
  const eventName = formatResultEventName(result.event);

  if (result.rank === "DNS" || result.time === "DNS") {
    return {
      eventName,
      detail: `${result.distance} / DNS`
    };
  }

  return {
    eventName,
    detail: `${result.distance} / ${result.rank} / ${result.time}`
  };
}

function EmptySearchState() {
  return (
    <EmptyState
      title="検索結果がありません"
      description="別の大会名・大学名・選手名で検索してみてください。"
      helper="漢字表記、ひらがな、短いキーワードでも検索できます。"
      actions={[
        { href: "/search", label: "検索条件をクリア", primary: true },
        { href: "/meets", label: "大会一覧を見る" },
        { href: "/universities", label: "大学一覧を見る" },
        { href: "/athletes", label: "選手一覧を見る" }
      ]}
    />
  );
}

function PbLine({ pb }: { pb: string[] }) {
  return (
    <div className="rounded-md bg-field px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sash-red">
          <Trophy size={16} />
        </span>
        <span className="text-xs font-black text-slate-500">掲載PB</span>
      </div>
      <div className="mt-1.5 grid gap-0.5 pl-7 text-sm font-black leading-6 text-ink">
        {pb.map((record) => (
          <span key={record}>{record}</span>
        ))}
      </div>
    </div>
  );
}

function RecentResultLine({ result }: { result: AthleteLatestResult | null }) {
  return (
    <div className="rounded-md bg-field px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sash-red">
          <Flag size={16} />
        </span>
        <span className="text-xs font-black text-slate-500">直近結果</span>
      </div>
      <div className="mt-1.5 grid gap-0.5 pl-7 text-sm font-black leading-6 text-ink">
        {result ? (
          <>
            <span>{result.eventName}</span>
            <span>{result.detail}</span>
          </>
        ) : (
          <span>掲載なし</span>
        )}
      </div>
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

function InfoLine({ icon, label, value, multiline = false }: { icon: React.ReactNode; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[20px_82px_1fr] items-start gap-2 rounded-md bg-field px-2.5 py-1.5 sm:grid-cols-[20px_88px_1fr] sm:py-2">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className={cn("text-sm font-black text-ink", multiline && "whitespace-pre-line leading-6")}>{value}</span>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-field p-2 sm:p-3">
      <div className="mb-1 flex items-center gap-2 text-sash-red">{icon}</div>
      <p className="text-[10px] font-bold text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 text-[11px] font-black leading-4 text-ink sm:text-sm sm:leading-5">{value}</p>
    </div>
  );
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-3.5 shadow-sm">
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
