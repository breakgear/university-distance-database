export type EntryStatus = "entered" | "listed" | "started" | "dns" | "unconfirmed";

export type Entry = {
  entry_id: string;
  meet_id: string;
  race_id: string;
  athlete_id: string;
  university_id: string;
  bib_no: number | null;
  status: EntryStatus;
};

export const entries: Entry[] = [
  { entry_id: "entry-kanto-1500m-final-saeki", meet_id: "kanto-1500m", race_id: "mens-1500m-final", athlete_id: "saeki", university_id: "aoba", bib_no: 1, status: "entered" },
  { entry_id: "entry-night-5000m-a-saeki", meet_id: "night-5000m", race_id: "mens-5000m-a", athlete_id: "saeki", university_id: "aoba", bib_no: 1, status: "listed" },
  { entry_id: "entry-night-5000m-a-mizushima", meet_id: "night-5000m", race_id: "mens-5000m-a", athlete_id: "mizushima", university_id: "aoba", bib_no: 2, status: "listed" },
  { entry_id: "entry-night-5000m-a-takahashi", meet_id: "night-5000m", race_id: "mens-5000m-a", athlete_id: "takahashi", university_id: "aoba", bib_no: 3, status: "listed" },
  { entry_id: "entry-kanto-10000m-3-saeki", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "saeki", university_id: "aoba", bib_no: 1, status: "started" },
  { entry_id: "entry-kanto-10000m-3-mizushima", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "mizushima", university_id: "aoba", bib_no: 2, status: "dns" },
  { entry_id: "entry-kanto-10000m-3-hirai", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "hirai", university_id: "tohto", bib_no: 3, status: "started" },
  { entry_id: "entry-kanto-10000m-3-yoshioka", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "yoshioka", university_id: "surugadai", bib_no: 4, status: "unconfirmed" },
  { entry_id: "entry-kanto-10000m-3-kurihara", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "kurihara", university_id: "surugadai", bib_no: 5, status: "started" },
  { entry_id: "entry-kanto-10000m-3-oda", meet_id: "kanto-10000m", race_id: "mens-10000m-3", athlete_id: "oda", university_id: "josai", bib_no: 6, status: "started" },
  { entry_id: "entry-kanto-10000m-1-placeholder", meet_id: "kanto-10000m", race_id: "mens-10000m-1", athlete_id: "kawai", university_id: "fujisawa", bib_no: null, status: "listed" },
  { entry_id: "entry-hakone-half-morino", meet_id: "hakone-qualifier-trial", race_id: "half-final", athlete_id: "morino", university_id: "josai", bib_no: 1, status: "started" }
];

export function getEntriesByRaceId(raceId: string) {
  return entries.filter((entry) => entry.race_id === raceId);
}

export function getEntriesByMeetId(meetId: string) {
  return entries.filter((entry) => entry.meet_id === meetId);
}

export function getEntriesByAthleteId(athleteId: string) {
  return entries.filter((entry) => entry.athlete_id === athleteId);
}

export function getEntriesByUniversityId(universityId: string) {
  return entries.filter((entry) => entry.university_id === universityId);
}
