import { EventStatus } from "@/data/events";
import { cn } from "@/lib/utils";

const statusMap: Record<EventStatus, { label: string; className: string; dot: string }> = {
  startlist: {
    label: "スタートリスト公開",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500"
  },
  result: {
    label: "結果公開",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500"
  },
  soon: {
    label: "まもなく",
    className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    dot: "bg-yellow-400"
  },
  waiting: {
    label: "結果待ち",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-400"
  },
  live: {
    label: "実施中",
    className: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500"
  },
  scheduled: {
    label: "予定",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400"
  }
};

export function StatusBadge({ status, compact = false }: { status: EventStatus; compact?: boolean }) {
  const item = statusMap[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border text-xs font-bold", compact ? "px-2 py-0.5" : "px-2.5 py-1", item.className)}>
      <span className={cn(compact ? "h-1.5 w-1.5 rounded-full" : "h-2 w-2 rounded-full", item.dot)} />
      {item.label}
    </span>
  );
}

export function StatusLegend() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {(Object.keys(statusMap) as EventStatus[]).map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}
