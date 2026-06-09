import { entries, Entry } from "@/data/entries";
import { meets } from "@/data/meets";
import { raceRecords } from "@/data/races";

const upcomingMeetStatuses = new Set(["scheduled", "coming_soon", "startlist_published", "live"]);
const upcomingRaceStatuses = new Set(["scheduled", "startlist_published"]);

export type UpcomingEntry = {
  entry: Entry;
  meet: (typeof meets)[number];
  race: (typeof raceRecords)[number];
};

export function getUpcomingEntriesByUniversityId(universityId: string) {
  return getUpcomingEntries(entries.filter((entry) => entry.university_id === universityId));
}

export function getUpcomingEntriesByAthleteId(athleteId: string) {
  return getUpcomingEntries(entries.filter((entry) => entry.athlete_id === athleteId));
}

function getUpcomingEntries(candidateEntries: Entry[]): UpcomingEntry[] {
  const today = getJapanDateKey();

  return candidateEntries
    .flatMap((entry): UpcomingEntry[] => {
      const meet = meets.find((item) => item.meet_id === entry.meet_id);
      const race = raceRecords.find((item) => item.race_id === entry.race_id);

      if (!meet || !race) return [];
      if (meet.date < today) return [];
      if (!upcomingMeetStatuses.has(meet.status) || !upcomingRaceStatuses.has(race.status)) return [];

      return [{ entry, meet, race }];
    })
    .sort((a, b) => a.meet.date.localeCompare(b.meet.date) || a.race.start_time.localeCompare(b.race.start_time));
}

function getJapanDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}
