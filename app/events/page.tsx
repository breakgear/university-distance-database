import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusLegend } from "@/components/StatusBadge";
import { events } from "@/data/events";

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeader eyebrow="Events" title="大会一覧" description="大会日程、カテゴリ、ステータスをまとめて確認できます。" />
      <SearchBar />
      <div className="mt-6">
        <StatusLegend />
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
