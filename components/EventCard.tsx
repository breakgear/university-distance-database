import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Event } from "@/data/events";
import { meets } from "@/data/meets";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

const meetIds = new Set(meets.map((meet) => meet.meet_id));

export function EventCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const href = meetIds.has(event.id) ? `/meets/${event.id}` : `/events/${event.id}`;

  return (
    <Link href={href} className="group block rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={event.status} />
        <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">{event.category}</span>
      </div>
      <h3 className="text-base font-black leading-6 text-ink group-hover:text-sash-red">{event.name}</h3>
      <div className="mt-3 grid gap-2 text-sm font-medium text-slate-600">
        <span className="flex items-center gap-2">
          <CalendarDays size={16} className="text-sash-red" />
          {formatDate(event.date)} ・ {event.distance}
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={16} className="text-sash-red" />
          {event.venue}
        </span>
      </div>
      {!compact ? <p className="mt-3 text-sm leading-6 text-slate-600">{event.summary}</p> : null}
    </Link>
  );
}
