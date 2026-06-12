import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Info
} from "lucide-react";
import {
  getScheduleProgress,
  scheduleCategoryLabels,
  scheduleDateStatusLabels,
  scheduleMonthLabels,
  seasonSchedule,
  type ScheduleCategory,
  type ScheduleDateStatus,
  type SeasonScheduleItem
} from "@/data/seasonSchedule";
import { cn } from "@/lib/utils";

const upcoming = seasonSchedule.filter((item) => getScheduleProgress(item) === "upcoming").slice(0, 4);
const monthGroups = Object.entries(
  seasonSchedule.reduce<Record<string, SeasonScheduleItem[]>>((groups, item) => {
    (groups[item.monthKey] ??= []).push(item);
    return groups;
  }, {})
);

export function AdminScheduleReference() {
  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-sash-red">
          <CalendarClock size={21} />
        </span>
        <div>
          <h2 className="text-lg font-black text-ink">年間大会メモ</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            取込対象を忘れないための管理用一覧です。公開ページには表示されません。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {upcoming.map((item) => (
          <article key={item.id} className="rounded-md border border-line bg-field p-3">
            <div className="flex flex-wrap gap-1.5">
              <CategoryBadge category={item.category} />
              <DateStatusBadge status={item.dateStatus} />
            </div>
            <p className="mt-3 text-xs font-black text-sash-red">{item.dateLabel}</p>
            <h3 className="mt-1 text-sm font-black leading-5 text-ink">{item.name}</h3>
            {item.note ? <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{item.note}</p> : null}
          </article>
        ))}
      </div>

      <details className="group mt-4 overflow-hidden rounded-md border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-field px-4 py-3 text-sm font-black text-ink hover:bg-red-50">
          <span className="flex items-center gap-2">
            <CalendarDays size={18} className="text-sash-red" />
            2026年4月〜2027年3月の全日程を見る
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{seasonSchedule.length}件</span>
          </span>
          <ChevronDown size={18} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="grid gap-5 p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Legend icon={<CheckCircle2 size={14} />} label="終了" className="text-emerald-700" />
            <Legend icon={<CalendarClock size={14} />} label="今後" className="text-sash-red" />
            <Legend icon={<CircleDashed size={14} />} label="日程未発表" className="text-slate-500" />
          </div>

          {monthGroups.map(([monthKey, items]) => (
            <div key={monthKey}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-sash-red" aria-hidden="true" />
                <h3 className="text-base font-black text-ink">{scheduleMonthLabels[monthKey] ?? monthKey}</h3>
                <span className="text-xs font-bold text-slate-500">{items.length}件</span>
              </div>
              <div className="overflow-hidden rounded-md border border-line">
                {items.map((item) => (
                  <ScheduleRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
            <Info size={17} className="mt-0.5 shrink-0" />
            <p>
              日程未発表の大会は時期の目安です。CSVへ登録する前に、正式な開催日・会場・種目を各大会公式サイトで確認してください。
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}

function ScheduleRow({ item }: { item: SeasonScheduleItem }) {
  const progress = getScheduleProgress(item);
  return (
    <article className="grid gap-2 border-b border-line px-3 py-2.5 last:border-b-0 sm:grid-cols-[145px_1fr_auto] sm:items-center">
      <div>
        <p className="text-xs font-black text-ink sm:text-sm">{item.dateLabel}</p>
        <p className={cn("mt-0.5 text-[11px] font-bold", progress === "completed" ? "text-emerald-700" : "text-sash-red")}>
          {progress === "completed" ? "終了" : "今後"}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black leading-5 text-ink">{item.name}</p>
        {item.note ? <p className="mt-0.5 text-xs font-bold leading-5 text-slate-600">{item.note}</p> : null}
      </div>
      <div className="flex flex-wrap gap-1.5 sm:max-w-44 sm:justify-end">
        <CategoryBadge category={item.category} />
        <DateStatusBadge status={item.dateStatus} />
      </div>
    </article>
  );
}

function CategoryBadge({ category }: { category: ScheduleCategory }) {
  const classes: Record<ScheduleCategory, string> = {
    track: "bg-blue-50 text-blue-700",
    road: "bg-amber-50 text-amber-800",
    ekiden: "bg-emerald-50 text-emerald-700",
    international: "bg-violet-50 text-violet-700"
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", classes[category])}>
      {scheduleCategoryLabels[category]}
    </span>
  );
}

function DateStatusBadge({ status }: { status: ScheduleDateStatus }) {
  const classes: Record<ScheduleDateStatus, string> = {
    confirmed: "border-slate-200 bg-slate-50 text-slate-600",
    approximate: "border-amber-200 bg-amber-50 text-amber-800",
    unannounced: "border-dashed border-slate-300 bg-white text-slate-500"
  };

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", classes[status])}>
      {scheduleDateStatusLabels[status]}
    </span>
  );
}

function Legend({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-field px-2.5 py-1", className)}>
      {icon}
      {label}
    </span>
  );
}
