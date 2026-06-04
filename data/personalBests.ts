export type PbDistance = "1500m" | "5000m" | "10000m" | "ハーフ";

export type PersonalBest = {
  pb_id: string;
  athlete_id: string;
  university_id: string;
  distance: PbDistance;
  time: string;
  date: string;
  source_type?: "result" | "manual";
  source_result_id?: string;
};

export const personalBests: PersonalBest[] = [
  { pb_id: "pb-saeki-1500m", athlete_id: "saeki", university_id: "aoba", distance: "1500m", time: "3:48.20", date: "2026-06-02", source_type: "result", source_result_id: "kanto-1500m-mens-1500m-final-saeki" },
  { pb_id: "pb-saeki-5000m", athlete_id: "saeki", university_id: "aoba", distance: "5000m", time: "13:42.18", date: "2026-04-20", source_result_id: "spring-open-5000m-2-saeki" },
  { pb_id: "pb-saeki-10000m", athlete_id: "saeki", university_id: "aoba", distance: "10000m", time: "28:28.90", date: "2026-05-24", source_result_id: "kanto-10000m-mens-10000m-3-saeki" },
  { pb_id: "pb-saeki-half", athlete_id: "saeki", university_id: "aoba", distance: "ハーフ", time: "1:03:55", date: "2026-02-08", source_result_id: "winter-half-saeki" },
  { pb_id: "pb-mizushima-5000m", athlete_id: "mizushima", university_id: "aoba", distance: "5000m", time: "14:05.30", date: "2026-04-20" },
  { pb_id: "pb-mizushima-10000m", athlete_id: "mizushima", university_id: "aoba", distance: "10000m", time: "29:18.62", date: "2026-05-24" },
  { pb_id: "pb-takahashi-half", athlete_id: "takahashi", university_id: "aoba", distance: "ハーフ", time: "1:03:55", date: "2026-02-08" },
  { pb_id: "pb-yoshioka-5000m", athlete_id: "yoshioka", university_id: "surugadai", distance: "5000m", time: "13:58.44", date: "2026-04-20" },
  { pb_id: "pb-yoshioka-10000m", athlete_id: "yoshioka", university_id: "surugadai", distance: "10000m", time: "28:52.08", date: "2026-05-24", source_result_id: "kanto-10000m-mens-10000m-3-yoshioka" },
  { pb_id: "pb-morino-10000m", athlete_id: "morino", university_id: "josai", distance: "10000m", time: "28:54.10", date: "2025-12-01" },
  { pb_id: "pb-morino-half", athlete_id: "morino", university_id: "josai", distance: "ハーフ", time: "1:02:48", date: "2026-05-18", source_result_id: "hakone-qualifier-trial-half-final-morino" },
  { pb_id: "pb-kimani-5000m", athlete_id: "kimani", university_id: "tohto", distance: "5000m", time: "13:28.76", date: "2026-04-12" },
  { pb_id: "pb-kimani-10000m", athlete_id: "kimani", university_id: "tohto", distance: "10000m", time: "27:59.90", date: "2025-11-16" },
  { pb_id: "pb-nakamura-5000m", athlete_id: "nakamura", university_id: "musashino", distance: "5000m", time: "13:55.02", date: "2026-04-27" },
  { pb_id: "pb-nakamura-10000m", athlete_id: "nakamura", university_id: "musashino", distance: "10000m", time: "29:18.40", date: "2026-05-05" },
  { pb_id: "pb-hirai-10000m", athlete_id: "hirai", university_id: "tohto", distance: "10000m", time: "28:41.12", date: "2026-05-24", source_result_id: "kanto-10000m-mens-10000m-3-hirai" },
  { pb_id: "pb-hirai-half", athlete_id: "hirai", university_id: "tohto", distance: "ハーフ", time: "1:04:20", date: "2026-02-08" },
  { pb_id: "pb-kawai-5000m", athlete_id: "kawai", university_id: "fujisawa", distance: "5000m", time: "14:02.80", date: "2026-04-27" },
  { pb_id: "pb-kawai-10000m", athlete_id: "kawai", university_id: "fujisawa", distance: "10000m", time: "29:10.30", date: "2026-05-18" },
  { pb_id: "pb-kurihara-10000m", athlete_id: "kurihara", university_id: "surugadai", distance: "10000m", time: "29:02.44", date: "2026-05-24" },
  { pb_id: "pb-oda-10000m", athlete_id: "oda", university_id: "josai", distance: "10000m", time: "29:05.77", date: "2026-05-24" },
  { pb_id: "pb-sugawara-5000m", athlete_id: "sugawara", university_id: "musashino", distance: "5000m", time: "14:08.10", date: "2026-04-27" },
  { pb_id: "pb-nishio-5000m", athlete_id: "nishio", university_id: "fujisawa", distance: "5000m", time: "14:12.40", date: "2026-04-27" }
];

export function getPersonalBestsByAthleteId(athleteId: string) {
  return personalBests.filter((record) => record.athlete_id === athleteId);
}
