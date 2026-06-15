import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type CsvValue = string | null;
type CsvRow = Record<string, CsvValue>;

type UniversityRow = {
  id: string;
  slug: string;
  name: string;
  area: string;
  sash_color: string | null;
  accent: string;
  profile: string | null;
  listing_events: string | null;
  has_upcoming: boolean;
  has_result: boolean;
};

type AthleteRow = {
  id: string;
  slug: string;
  name: string;
  university_id: string;
  year: string;
  hometown: string | null;
  specialty: string | null;
  profile: string | null;
  next_race: string | null;
};

type MeetRow = {
  meet_id: string;
  slug: string;
  meet_name: string;
  date: string;
  venue: string | null;
  category: MeetCategory;
  status: MeetStatus;
  note: string | null;
};

type RaceRow = {
  race_id: string;
  slug: string;
  meet_id: string;
  race_name: string;
  distance: Distance;
  start_time: string | null;
  status: RaceStatus;
  result_summary_id: string | null;
};

type EntryRow = {
  entry_id: string;
  meet_id: string;
  race_id: string;
  athlete_id: string;
  university_id: string;
  bib_no: number | null;
  entry_status: EntryStatus;
};

type ResultRow = {
  result_id: string;
  meet_id: string;
  race_id: string;
  athlete_id: string;
  university_id: string;
  distance: Distance;
  date: string;
  rank: string;
  time: string;
  result_status: ResultStatus;
  note: ResultNote | null;
  is_pb: boolean;
  section: string | null;
  section_distance: string | null;
};

type TeamResultRow = {
  team_result_id: string;
  meet_id: string;
  race_id: string;
  university_id: string;
  result_type: TeamResultType;
  rank: string;
  time: string;
  status: ResultStatus;
  note: string | null;
};

type PersonalBestRow = {
  pb_id: string;
  athlete_id: string;
  university_id: string;
  distance: Distance;
  time: string;
  date: string;
  source_type: "result" | "manual" | null;
  source_result_id: string | null;
};

type MeetStatus = "scheduled" | "coming_soon" | "startlist_published" | "result_waiting" | "live" | "result_published";
type RaceStatus = "scheduled" | "startlist_published" | "result_published" | "result_waiting";
type EntryStatus = "entered" | "listed" | "started" | "dns" | "unconfirmed";
type ResultStatus = "finished" | "dns" | "dnf" | "dq";
type MeetCategory = "track" | "road" | "ekiden";
type Distance = "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ" | "駅伝";
type TeamResultType = "総合" | "往路" | "復路";
type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const csvDir = findCsvDir(args.csvDir);
const dataDir = args.outDir ? path.resolve(rootDir, args.outDir) : path.join(rootDir, "data");

const fallbackStatuses = new Set([
  "scheduled",
  "coming_soon",
  "startlist_published",
  "result_waiting",
  "live",
  "result_published",
  "entered",
  "listed",
  "started",
  "unconfirmed",
  "finished",
  "dns",
  "dnf",
  "dq"
]);
const fallbackDistances = new Set(["1500m", "3000mSC", "5000m", "10000m", "ハーフ", "駅伝"]);
const fallbackCategories = new Set(["track", "road", "ekiden"]);

main();

function main() {
  if (!csvDir) {
    fail([`CSVディレクトリが見つかりません。${path.join(rootDir, "csv")} または ${path.join(rootDir, "data", "csv")} を作成してください。`]);
  }

  const raw = loadCsvFiles(csvDir);
  const masters = buildMasters(raw);
  const normalized = normalizeAll(raw);
  const errors = validateAll(normalized, masters);

  if (errors.length > 0) {
    fail(errors);
  }

  mkdirSync(dataDir, { recursive: true });
  writeGeneratedFiles(normalized);

  console.log("CSV import completed.");
  console.log(`Source: ${csvDir}`);
  console.log("Generated:");
  console.log("- data/universities.ts");
  console.log("- data/athletes.ts");
  console.log("- data/meets.ts");
  console.log("- data/races.ts");
  console.log("- data/entries.ts");
  console.log("- data/results.ts");
  console.log("- data/personalBests.ts");
  console.log("- data/teamResults.ts");
}

function findCsvDir(explicitDir: string | null) {
  if (explicitDir) {
    const resolved = path.resolve(rootDir, explicitDir);
    return existsSync(resolved) ? resolved : null;
  }

  const candidates = [path.join(rootDir, "csv"), path.join(rootDir, "data", "csv")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function loadCsvFiles(baseDir: string) {
  const required = ["universities", "athletes", "meets", "races", "entries", "results", "personal_bests"];
  const optional = ["team_results", "status_master", "event_type_master"];
  const missing = required.filter((name) => !existsSync(path.join(baseDir, `${name}.csv`)));

  if (missing.length > 0) {
    fail(missing.map((name) => `必須CSVがありません: ${name}.csv`));
  }

  return Object.fromEntries(
    [...required, ...optional].map((name) => {
      const filePath = path.join(baseDir, `${name}.csv`);
      return [name, existsSync(filePath) ? parseCsv(readFileSync(filePath, "utf8")) : []];
    })
  ) as Record<string, CsvRow[]>;
}

function normalizeAll(raw: Record<string, CsvRow[]>) {
  const universities = raw.universities.map((row, index): UniversityRow => ({
    id: required(row, "id", index, "universities"),
    slug: required(row, "slug", index, "universities"),
    name: required(row, "name", index, "universities"),
    area: value(row.area) ?? "関東",
    sash_color: value(row.sash_color),
    accent: value(row.accent) ?? "#b3263a",
    profile: value(row.profile),
    listing_events: value(row.listing_events),
    has_upcoming: toBoolean(row.has_upcoming),
    has_result: toBoolean(row.has_result)
  }));

  const athletes = raw.athletes.map((row, index): AthleteRow => ({
    id: required(row, "id", index, "athletes"),
    slug: required(row, "slug", index, "athletes"),
    name: required(row, "name", index, "athletes"),
    university_id: required(row, "university_id", index, "athletes"),
    year: value(row.year) ?? "学年未登録",
    hometown: value(row.hometown),
    specialty: value(row.specialty),
    profile: value(row.profile),
    next_race: value(row.next_race)
  }));

  const meets = raw.meets.map((row, index): MeetRow => ({
    meet_id: required(row, "meet_id", index, "meets"),
    slug: required(row, "slug", index, "meets"),
    meet_name: required(row, "meet_name", index, "meets"),
    date: required(row, "date", index, "meets"),
    venue: value(row.venue),
    category: required(row, "category", index, "meets") as MeetCategory,
    status: required(row, "status", index, "meets") as MeetStatus,
    note: value(row.note)
  }));

  const races = raw.races.map((row, index): RaceRow => ({
    race_id: required(row, "race_id", index, "races"),
    slug: required(row, "slug", index, "races"),
    meet_id: required(row, "meet_id", index, "races"),
    race_name: required(row, "race_name", index, "races"),
    distance: required(row, "distance", index, "races") as Distance,
    start_time: value(row.start_time),
    status: required(row, "status", index, "races") as RaceStatus,
    result_summary_id: value(row.result_summary_id)
  }));

  const entries = raw.entries.map((row, index): EntryRow => ({
    entry_id: required(row, "entry_id", index, "entries"),
    meet_id: required(row, "meet_id", index, "entries"),
    race_id: required(row, "race_id", index, "entries"),
    athlete_id: required(row, "athlete_id", index, "entries"),
    university_id: required(row, "university_id", index, "entries"),
    bib_no: toNumber(row.bib_no),
    entry_status: required(row, "entry_status", index, "entries") as EntryStatus
  }));

  const results = raw.results.map((row, index): ResultRow => ({
    result_id: required(row, "result_id", index, "results"),
    meet_id: required(row, "meet_id", index, "results"),
    race_id: required(row, "race_id", index, "results"),
    athlete_id: required(row, "athlete_id", index, "results"),
    university_id: required(row, "university_id", index, "results"),
    distance: required(row, "distance", index, "results") as Distance,
    date: required(row, "date", index, "results"),
    rank: required(row, "rank", index, "results"),
    time: required(row, "time", index, "results"),
    result_status: required(row, "result_status", index, "results") as ResultStatus,
    note: value(row.note) as ResultNote | null,
    is_pb: toBoolean(row.is_pb),
    section: value(row.section),
    section_distance: value(row.section_distance)
  }));

  const teamResults = (raw.team_results ?? []).map((row, index): TeamResultRow => ({
    team_result_id: required(row, "team_result_id", index, "team_results"),
    meet_id: required(row, "meet_id", index, "team_results"),
    race_id: required(row, "race_id", index, "team_results"),
    university_id: required(row, "university_id", index, "team_results"),
    result_type: required(row, "result_type", index, "team_results") as TeamResultType,
    rank: value(row.rank) ?? "",
    time: value(row.time) ?? "",
    status: (value(row.status) ?? "finished") as ResultStatus,
    note: value(row.note)
  }));

  const personalBests = raw.personal_bests.map((row, index): PersonalBestRow => ({
    pb_id: required(row, "pb_id", index, "personal_bests"),
    athlete_id: required(row, "athlete_id", index, "personal_bests"),
    university_id: required(row, "university_id", index, "personal_bests"),
    distance: required(row, "distance", index, "personal_bests") as Distance,
    time: required(row, "time", index, "personal_bests"),
    date: required(row, "date", index, "personal_bests"),
    source_type: value(row.source_type) as "result" | "manual" | null,
    source_result_id: value(row.source_result_id)
  }));

  return { universities, athletes, meets, races, entries, results, personalBests, teamResults };
}

function buildMasters(raw: Record<string, CsvRow[]>) {
  const statuses = new Set(fallbackStatuses);
  const distances = new Set(fallbackDistances);
  const categories = new Set(fallbackCategories);

  raw.status_master.forEach((row) => {
    const status = value(row.status_key);
    if (status) statuses.add(status);
  });

  raw.event_type_master.forEach((row) => {
    const eventType = value(row.event_type);
    const group = value(row.group);

    if (!eventType) return;
    if (group === "category") categories.add(eventType);
    else distances.add(eventType);
  });

  return { statuses, distances, categories };
}

function validateAll(data: ReturnType<typeof normalizeAll>, masters: ReturnType<typeof buildMasters>) {
  const errors: string[] = [];
  const universityIds = toIdSet(data.universities, "id");
  const athleteIds = toIdSet(data.athletes, "id");
  const meetIds = toIdSet(data.meets, "meet_id");
  const raceIds = toIdSet(data.races, "race_id");
  const resultIds = toIdSet(data.results, "result_id");
  const athleteById = new Map(data.athletes.map((athlete) => [athlete.id, athlete]));
  const raceById = new Map(data.races.map((race) => [race.race_id, race]));

  checkDuplicates(data.universities, "id", "universities.id", errors);
  checkDuplicates(data.universities, "slug", "universities.slug", errors);
  checkDuplicates(data.athletes, "id", "athletes.id", errors);
  checkDuplicates(data.athletes, "slug", "athletes.slug", errors);
  checkDuplicates(data.meets, "meet_id", "meets.meet_id", errors);
  checkDuplicates(data.meets, "slug", "meets.slug", errors);
  checkDuplicates(data.races, "race_id", "races.race_id", errors);
  checkDuplicates(data.races, "slug", "races.slug", errors);
  checkDuplicates(data.entries, "entry_id", "entries.entry_id", errors);
  checkDuplicates(data.results, "result_id", "results.result_id", errors);
  checkDuplicates(data.personalBests, "pb_id", "personal_bests.pb_id", errors);

  data.athletes.forEach((athlete) => {
    if (!universityIds.has(athlete.university_id)) errors.push(`athletes.university_id が存在しません: ${athlete.id} -> ${athlete.university_id}`);
  });

  data.meets.forEach((meet) => {
    if (!masters.categories.has(meet.category)) errors.push(`meets.category がmaster値外です: ${meet.meet_id} -> ${meet.category}`);
    if (!masters.statuses.has(meet.status)) errors.push(`meets.status がmaster値外です: ${meet.meet_id} -> ${meet.status}`);
  });

  data.races.forEach((race) => {
    if (!meetIds.has(race.meet_id)) errors.push(`races.meet_id が存在しません: ${race.race_id} -> ${race.meet_id}`);
    if (!masters.distances.has(race.distance)) errors.push(`races.distance がmaster値外です: ${race.race_id} -> ${race.distance}`);
    if (!masters.statuses.has(race.status)) errors.push(`races.status がmaster値外です: ${race.race_id} -> ${race.status}`);
  });

  data.entries.forEach((entry) => {
    if (!meetIds.has(entry.meet_id)) errors.push(`entries.meet_id が存在しません: ${entry.entry_id} -> ${entry.meet_id}`);
    if (!raceIds.has(entry.race_id)) errors.push(`entries.race_id が存在しません: ${entry.entry_id} -> ${entry.race_id}`);
    if (!athleteIds.has(entry.athlete_id)) errors.push(`entries.athlete_id が存在しません: ${entry.entry_id} -> ${entry.athlete_id}`);
    if (!universityIds.has(entry.university_id)) errors.push(`entries.university_id が存在しません: ${entry.entry_id} -> ${entry.university_id}`);
    if (!masters.statuses.has(entry.entry_status)) errors.push(`entries.entry_status がmaster値外です: ${entry.entry_id} -> ${entry.entry_status}`);

    const athlete = athleteById.get(entry.athlete_id);
    if (athlete && athlete.university_id !== entry.university_id) {
      errors.push(`entries の大学IDが選手所属と一致しません: ${entry.entry_id} athlete=${athlete.university_id} entry=${entry.university_id}`);
    }
  });

  data.results.forEach((result) => {
    if (!meetIds.has(result.meet_id)) errors.push(`results.meet_id が存在しません: ${result.result_id} -> ${result.meet_id}`);
    if (!raceIds.has(result.race_id)) errors.push(`results.race_id が存在しません: ${result.result_id} -> ${result.race_id}`);
    if (!athleteIds.has(result.athlete_id)) errors.push(`results.athlete_id が存在しません: ${result.result_id} -> ${result.athlete_id}`);
    if (!universityIds.has(result.university_id)) errors.push(`results.university_id が存在しません: ${result.result_id} -> ${result.university_id}`);
    if (!masters.distances.has(result.distance)) errors.push(`results.distance がmaster値外です: ${result.result_id} -> ${result.distance}`);
    if (!masters.statuses.has(result.result_status)) errors.push(`results.result_status がmaster値外です: ${result.result_id} -> ${result.result_status}`);
    if (result.note && !["PB", "SB", "DNS", "DNF", "DQ"].includes(result.note)) errors.push(`results.note が許可値外です: ${result.result_id} -> ${result.note}`);

    const race = raceById.get(result.race_id);
    if (race && race.meet_id !== result.meet_id) errors.push(`results.meet_id と races.meet_id が一致しません: ${result.result_id}`);

    const athlete = athleteById.get(result.athlete_id);
    if (athlete && athlete.university_id !== result.university_id) {
      errors.push(`results の大学IDが選手所属と一致しません: ${result.result_id} athlete=${athlete.university_id} result=${result.university_id}`);
    }
  });

  data.personalBests.forEach((pb) => {
    if (!athleteIds.has(pb.athlete_id)) errors.push(`personal_bests.athlete_id が存在しません: ${pb.pb_id} -> ${pb.athlete_id}`);
    if (!universityIds.has(pb.university_id)) errors.push(`personal_bests.university_id が存在しません: ${pb.pb_id} -> ${pb.university_id}`);
    if (!masters.distances.has(pb.distance)) errors.push(`personal_bests.distance がmaster値外です: ${pb.pb_id} -> ${pb.distance}`);
    if (pb.source_result_id && !resultIds.has(pb.source_result_id)) errors.push(`personal_bests.source_result_id が存在しません: ${pb.pb_id} -> ${pb.source_result_id}`);

    const athlete = athleteById.get(pb.athlete_id);
    if (athlete && athlete.university_id !== pb.university_id) {
      errors.push(`personal_bests の大学IDが選手所属と一致しません: ${pb.pb_id} athlete=${athlete.university_id} pb=${pb.university_id}`);
    }
  });

  checkDuplicates(data.teamResults, "team_result_id", "team_results.team_result_id", errors);
  data.teamResults.forEach((team) => {
    if (!meetIds.has(team.meet_id)) errors.push(`team_results.meet_id が存在しません: ${team.team_result_id} -> ${team.meet_id}`);
    if (!raceIds.has(team.race_id)) errors.push(`team_results.race_id が存在しません: ${team.team_result_id} -> ${team.race_id}`);
    if (!universityIds.has(team.university_id)) errors.push(`team_results.university_id が存在しません: ${team.team_result_id} -> ${team.university_id}`);
    if (!["総合", "往路", "復路"].includes(team.result_type)) errors.push(`team_results.result_type が許可値外です: ${team.team_result_id} -> ${team.result_type}`);
    if (!masters.statuses.has(team.status)) errors.push(`team_results.status がmaster値外です: ${team.team_result_id} -> ${team.status}`);
  });

  return errors;
}

function writeGeneratedFiles(data: ReturnType<typeof normalizeAll>) {
  writeFile("universities.ts", generateUniversities(data));
  writeFile("athletes.ts", generateAthletes(data));
  writeFile("meets.ts", generateMeets(data));
  writeFile("races.ts", generateRaces(data));
  writeFile("entries.ts", generateEntries(data));
  writeFile("results.ts", generateResults(data));
  writeFile("personalBests.ts", generatePersonalBests(data));
  writeFile("teamResults.ts", generateTeamResults(data));
}

function generateUniversities(data: ReturnType<typeof normalizeAll>) {
  const athleteIdsByUniversity = new Map<string, string[]>();
  data.athletes.forEach((athlete) => {
    const list = athleteIdsByUniversity.get(athlete.university_id) ?? [];
    list.push(athlete.id);
    athleteIdsByUniversity.set(athlete.university_id, list);
  });

  const latestResultByUniversity = new Map<string, ResultRow>();
  data.results
    .filter((result) => result.result_status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((result) => {
      if (!latestResultByUniversity.has(result.university_id)) latestResultByUniversity.set(result.university_id, result);
    });

  const universityObjects = data.universities.map((university) => {
    const listingEvents = splitList(university.listing_events);
    const latestResult = latestResultByUniversity.get(university.id);
    const latestAthlete = latestResult ? data.athletes.find((athlete) => athlete.id === latestResult.athlete_id) : null;
    const nextAppearance = findNextAppearance(university.id, data);

    return {
      id: university.id,
      slug: university.slug,
      name: university.name,
      area: university.area,
      sashColor: university.sash_color ?? "未登録",
      accent: university.accent,
      profile: university.profile ?? "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
      style: listingEvents.join(" / "),
      coachNote: "出場予定と結果を掲載",
      bestEkiden: "未登録",
      athletes: athleteIdsByUniversity.get(university.id) ?? [],
      listing: {
        region: university.area,
        events: listingEvents,
        nextAppearance: nextAppearance ?? "未登録",
        latestResult: {
          athlete: latestAthlete?.name ?? "未登録",
          event: latestResult?.distance ?? (listingEvents[0] ?? "5000m"),
          time: latestResult?.time ?? "未登録"
        },
        hasUpcoming: Boolean(nextAppearance),
        hasResult: university.has_result
      }
    };
  });

  return `${header()}
import type { Athlete } from "./athletes";

export type University = {
  id: string;
  slug: string;
  name: string;
  area: string;
  sashColor: string;
  accent: string;
  profile: string;
  style: string;
  coachNote: string;
  bestEkiden: string;
  athletes: string[];
  listing: {
    region: string;
    events: Array<"1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ">;
    nextAppearance: string;
    latestResult: {
      athlete: string;
      event: "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ";
      time: string;
    };
    hasUpcoming: boolean;
    hasResult: boolean;
  };
};

export const universities: University[] = ${literal(universityObjects)};

export type UniversityPbEvent = "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ";

export type UniversityPbRanking = {
  event: UniversityPbEvent;
  entries: {
    rank: number;
    university: string;
    athlete: string;
    time: string;
  }[];
};

const pbEvents: UniversityPbEvent[] = ["1500m", "3000mSC", "5000m", "10000m", "ハーフ"];

export function buildUniversityPbRankings(universityList: University[], athleteList: Athlete[]): UniversityPbRanking[] {
  const universityById = new Map(universityList.map((university) => [university.id, university]));

  return pbEvents.map((event) => {
    const fastestByUniversity = new Map<string, { university: string; athlete: string; time: string; seconds: number }>();

    athleteList.forEach((athlete) => {
      const university = universityById.get(athlete.universityId);
      const pb = athlete.pb.find((record) => record.distance === event);

      if (!university || !pb) return;

      const seconds = toSeconds(pb.time);
      const current = fastestByUniversity.get(university.id);

      if (!current || seconds < current.seconds) {
        fastestByUniversity.set(university.id, { university: university.name, athlete: athlete.name, time: pb.time, seconds });
      }
    });

    const entries = Array.from(fastestByUniversity.values())
      .sort((a, b) => a.seconds - b.seconds)
      .slice(0, 3)
      .map((entry, index) => ({ rank: index + 1, university: entry.university, athlete: entry.athlete, time: entry.time }));

    return { event, entries };
  });
}

function toSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  const [minutes, seconds] = parts;
  return minutes * 60 + seconds;
}
`;
}

function generateAthletes(data: ReturnType<typeof normalizeAll>) {
  const raceNameById = Object.fromEntries(
    data.races.map((race) => {
      const meet = data.meets.find((item) => item.meet_id === race.meet_id);
      return [race.race_id, `${meet?.meet_name ?? race.meet_id} ${race.race_name}`];
    })
  );

  const athleteRecords = data.athletes.map((athlete) => ({
    id: athlete.id,
    slug: athlete.slug,
    name: athlete.name,
    year: athlete.year,
    universityId: athlete.university_id,
    hometown: athlete.hometown ?? "",
    specialty: athlete.specialty ?? "",
    profile: athlete.profile ?? "PBと最近の結果を掲載しています。",
    nextRace: athlete.next_race ?? "",
    progress: [],
    ekiden: []
  }));

  return `${header()}
import { personalBests } from "./personalBests";
import { resultRecords } from "./results";

export type Athlete = {
  id: string;
  slug: string;
  name: string;
  year: string;
  universityId: string;
  hometown: string;
  specialty: string;
  profile: string;
  pb: { distance: string; time: string; date: string }[];
  nextRace: string;
  recentResults: { event: string; date: string; distance: string; time: string; rank: string }[];
  progress: { label: string; value: number; time: string }[];
  ekiden: { race: string; section: string; result: string }[];
};

export type AthleteRecord = {
  id: string;
  slug: string;
  name: string;
  year: string;
  universityId: string;
  hometown: string;
  specialty: string;
  profile: string;
  nextRace: string;
  progress: Athlete["progress"];
  ekiden: Athlete["ekiden"];
};

const raceNameById: Record<string, string> = ${literal(raceNameById)};

export const athleteRecords: AthleteRecord[] = ${literal(athleteRecords)};

export const athletes: Athlete[] = athleteRecords.map((athlete) => ({
  ...athlete,
  pb: personalBests
    .filter((record) => record.athlete_id === athlete.id)
    .map((record) => ({ distance: record.distance, time: record.time, date: record.date })),
  recentResults: resultRecords
    .filter((result) => result.athlete_id === athlete.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((result) => ({
      event: raceNameById[result.race_id] ?? result.race_id,
      date: result.date,
      distance: result.distance,
      time: result.time,
      rank: result.rank
    }))
}));

export const athleteAliases: Record<string, string> = Object.fromEntries(athleteRecords.map((athlete) => [athlete.id, athlete.name]));

export function getAthleteById(id: string) {
  return athletes.find((athlete) => athlete.id === id);
}
`;
}

function generateMeets(data: ReturnType<typeof normalizeAll>) {
  const meetObjects = data.meets.map((meet) => {
    const meetRaces = data.races.filter((race) => race.meet_id === meet.meet_id);
    return {
      meet_id: meet.meet_id,
      slug: meet.slug,
      meet_name: meet.meet_name,
      date: meet.date,
      venue: meet.venue ?? "会場未定",
      category: meet.category,
      status: meet.status,
      race_count: meetRaces.length || null,
      published_startlist_count: meetRaces.filter((race) => race.status === "startlist_published" || race.status === "result_published").length,
      published_result_count: meetRaces.filter((race) => race.status === "result_published").length,
      note: meet.note ?? statusLabel(meet.status)
    };
  });

  return `${header()}
export type MeetStatus = "scheduled" | "coming_soon" | "startlist_published" | "result_waiting" | "live" | "result_published";

export type MeetCategory = "track" | "road" | "ekiden";

export type Meet = {
  meet_id: string;
  slug: string;
  meet_name: string;
  date: string;
  venue: string;
  category: MeetCategory;
  status: MeetStatus;
  race_count: number | null;
  published_startlist_count: number;
  published_result_count: number;
  note: string;
};

export const meets: Meet[] = ${literal(meetObjects)};

export const meetStatusLabels: Record<MeetStatus, string> = {
  scheduled: "予定",
  coming_soon: "まもなく",
  startlist_published: "スタートリスト公開",
  result_waiting: "結果待ち",
  live: "実施中",
  result_published: "結果公開"
};

export const meetCategoryLabels: Record<MeetCategory, string> = {
  track: "トラック",
  road: "ロード",
  ekiden: "駅伝"
};
`;
}

function generateRaces(data: ReturnType<typeof normalizeAll>) {
  const raceObjects = data.races.map((race) => ({
    race_id: race.race_id,
    slug: race.slug,
    meet_id: race.meet_id,
    race_name: race.race_name,
    start_time: race.start_time ?? "開始時刻未定",
    status: race.status,
    distance: race.distance,
    ...(race.result_summary_id ? { result_summary_id: race.result_summary_id } : {})
  }));
  const meetNameById = Object.fromEntries(data.meets.map((meet) => [meet.meet_id, meet.meet_name]));

  return `${header()}
import { EventStatus } from "./events";
import { athletes } from "./athletes";
import { entries } from "./entries";
import { personalBests } from "./personalBests";
import { resultRecords } from "./results";
import { universities } from "./universities";

export type RaceStart = {
  lane: number;
  athlete: string;
  athleteId: string;
  university: string;
  universityId: string;
  year: string;
  pb: string;
  entryStatus: "entered" | "listed" | "started" | "dns" | "unconfirmed";
  tag?: string;
  featured?: boolean;
};

export type RaceResultEntry = {
  rank: number | "-";
  athlete: string;
  athleteId: string;
  university: string;
  universityId: string;
  year: string;
  time: string;
  note?: "PB" | "SB" | "DNS" | "DNF" | "DQ";
  section?: string;
  sectionDistance?: string;
};

export type RaceRecord = {
  race_id: string;
  slug: string;
  meet_id: string;
  race_name: string;
  start_time: string;
  status: "scheduled" | "startlist_published" | "result_published" | "result_waiting";
  distance: "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ" | "駅伝";
  result_summary_id?: string;
};

export type RaceDetail = {
  id: string;
  eventId: string;
  name: string;
  eventName: string;
  startTime: string;
  status: EventStatus;
  distance: string;
  summary: string;
  focus: string[];
  startList: RaceStart[];
  results: RaceResultEntry[];
  relatedRaces: { id: string; name: string; startTime: string; status: EventStatus }[];
  relatedUniversityIds: string[];
};

export const raceRecords: RaceRecord[] = ${literal(raceObjects)};

const meetNameById: Record<string, string> = ${literal(meetNameById)};

const statusMap: Record<RaceRecord["status"], EventStatus> = {
  scheduled: "scheduled",
  startlist_published: "startlist",
  result_published: "result",
  result_waiting: "waiting"
};

export const races: RaceDetail[] = raceRecords.map((race) => {
  const raceEntries = entries.filter((entry) => entry.race_id === race.race_id);
  const raceResults = resultRecords.filter((result) => result.race_id === race.race_id);
  const relatedRaces = raceRecords
    .filter((item) => item.meet_id === race.meet_id && item.race_id !== race.race_id)
    .map((item) => ({ id: item.race_id, name: item.race_name, startTime: item.start_time, status: statusMap[item.status] }));

  return {
    id: race.race_id,
    eventId: race.meet_id,
    name: race.race_name,
    eventName: meetNameById[race.meet_id] ?? race.meet_id,
    startTime: race.start_time,
    status: statusMap[race.status],
    distance: race.distance,
    summary: "掲載データ内の出場予定、結果、大学別の出場選手を確認できます。",
    focus: ["掲載PB", "掲載選手", "掲載結果"],
    startList: raceEntries.map((entry, index) => {
      const athlete = athletes.find((item) => item.id === entry.athlete_id);
      const university = universities.find((item) => item.id === entry.university_id);
      const pb = personalBests.find((record) => record.athlete_id === entry.athlete_id && record.distance === race.distance);

      return {
        lane: entry.bib_no ?? index + 1,
        athlete: athlete?.name ?? "未登録",
        athleteId: entry.athlete_id,
        university: university?.name ?? "大学未登録",
        universityId: entry.university_id,
        year: athlete?.year ?? "学年未登録",
        pb: pb ? \`\${pb.distance} \${pb.time}\` : "PB未登録",
        entryStatus: entry.status
      };
    }),
    results: raceResults.map((result) => {
      const athlete = athletes.find((item) => item.id === result.athlete_id);
      const university = universities.find((item) => item.id === result.university_id);

      return {
        rank: result.rank === "DNS" ? "-" : Number.parseInt(result.rank, 10) || "-",
        athlete: athlete?.name ?? "未登録",
        athleteId: result.athlete_id,
        university: university?.name ?? "大学未登録",
        universityId: result.university_id,
        year: athlete?.year ?? "学年未登録",
        time: result.time,
        note: result.note,
        ...(result.section ? { section: result.section } : {}),
        ...(result.sectionDistance ? { sectionDistance: result.sectionDistance } : {})
      };
    }),
    relatedRaces,
    relatedUniversityIds: Array.from(new Set(raceEntries.map((entry) => entry.university_id)))
  };
});

export function getRaceById(id: string) {
  return races.find((race) => race.id === id);
}

export function getRaceRecordById(id: string) {
  return raceRecords.find((race) => race.race_id === id);
}

export function getRacesByMeetId(meetId: string) {
  return raceRecords.filter((race) => race.meet_id === meetId);
}
`;
}

function generateEntries(data: ReturnType<typeof normalizeAll>) {
  const entries = data.entries.map((entry) => ({
    entry_id: entry.entry_id,
    meet_id: entry.meet_id,
    race_id: entry.race_id,
    athlete_id: entry.athlete_id,
    university_id: entry.university_id,
    bib_no: entry.bib_no,
    status: entry.entry_status
  }));

  return `${header()}
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

export const entries: Entry[] = ${literal(entries)};

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
`;
}

function generateResults(data: ReturnType<typeof normalizeAll>) {
  const resultRecords = data.results.map((result) => ({
    result_id: result.result_id,
    meet_id: result.meet_id,
    race_id: result.race_id,
    athlete_id: result.athlete_id,
    university_id: result.university_id,
    distance: result.distance,
    date: result.date,
    rank: result.rank,
    time: result.time,
    ...(result.note ? { note: result.note } : {}),
    status: result.result_status,
    ...(result.is_pb ? { is_pb: true } : {}),
    ...(result.section ? { section: result.section } : {}),
    ...(result.section_distance ? { sectionDistance: result.section_distance } : {})
  }));

  const resultSummaries = buildResultSummaries(data);
  const universityResultGroups = buildUniversityResultGroups(data);

  return `${header()}
import type { PbDistance } from "./personalBests";

export type ResultStatus = "result_published";

export type ResultCategory = "track" | "road" | "ekiden";

export type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ";

export type ResultDistance = PbDistance | "駅伝";

export type WinnerType = "athlete" | "team";

export type ResultRecord = {
  result_id: string;
  meet_id: string;
  race_id: string;
  athlete_id: string;
  university_id: string;
  distance: ResultDistance;
  date: string;
  rank: string;
  time: string;
  note?: ResultNote;
  status: "finished" | "dns" | "dnf" | "dq";
  is_pb?: boolean;
  section?: string;
  sectionDistance?: string;
};

export type ResultSummary = {
  result_id: string;
  meet_id: string;
  meet_name: string;
  race_id: string;
  race_name: string;
  date: string;
  venue: string;
  category: ResultCategory;
  status: ResultStatus;
  winner_type: WinnerType;
  winner_athlete_id: string;
  winner_name: string;
  winner_university_id: string;
  winner_university_name: string;
  winner_time: string;
  distance: ResultDistance;
  pb_count: number;
  dns_count: number;
  result_count: number;
  notes: ResultNote[];
};

export const resultRecords: ResultRecord[] = ${literal(resultRecords)};

export const resultSummaries: ResultSummary[] = ${literal(resultSummaries)};

export const resultCategoryLabels: Record<ResultCategory, string> = {
  track: "トラック",
  road: "ロード",
  ekiden: "駅伝"
};

export const universityResultGroups = ${literal(universityResultGroups)};

export function getResultsByRaceId(raceId: string) {
  return resultRecords.filter((result) => result.race_id === raceId);
}

export function getResultsByMeetId(meetId: string) {
  return resultRecords.filter((result) => result.meet_id === meetId);
}

export function getResultsByAthleteId(athleteId: string) {
  return resultRecords.filter((result) => result.athlete_id === athleteId);
}

export function getResultsByUniversityId(universityId: string) {
  return resultRecords.filter((result) => result.university_id === universityId);
}
`;
}

function generateTeamResults(data: ReturnType<typeof normalizeAll>) {
  const teamResults = data.teamResults.map((row) => ({
    team_result_id: row.team_result_id,
    meet_id: row.meet_id,
    race_id: row.race_id,
    university_id: row.university_id,
    result_type: row.result_type,
    rank: row.rank,
    time: row.time,
    status: row.status,
    ...(row.note ? { note: row.note } : {})
  }));

  return `${header()}
export type TeamResultType = "総合" | "往路" | "復路";

export type TeamResult = {
  team_result_id: string;
  meet_id: string;
  race_id: string;
  university_id: string;
  result_type: TeamResultType;
  rank: string;
  time: string;
  status: "finished" | "dns" | "dnf" | "dq";
  note?: string;
};

export const teamResults: TeamResult[] = ${literal(teamResults)};

const resultTypeOrder: Record<TeamResultType, number> = { 総合: 0, 往路: 1, 復路: 2 };

export function getTeamResultsByRaceId(raceId: string) {
  return teamResults
    .filter((row) => row.race_id === raceId)
    .sort((a, b) => resultTypeOrder[a.result_type] - resultTypeOrder[b.result_type] || rankValue(a.rank) - rankValue(b.rank));
}

export function getTeamResultsByUniversityId(universityId: string) {
  return teamResults.filter((row) => row.university_id === universityId);
}

function rankValue(rank: string) {
  const parsed = Number.parseInt(rank, 10);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}
`;
}

function generatePersonalBests(data: ReturnType<typeof normalizeAll>) {
  const pbs = data.personalBests.map((pb) => ({
    pb_id: pb.pb_id,
    athlete_id: pb.athlete_id,
    university_id: pb.university_id,
    distance: pb.distance,
    time: pb.time,
    date: pb.date,
    ...(pb.source_type ? { source_type: pb.source_type } : {}),
    ...(pb.source_result_id ? { source_result_id: pb.source_result_id } : {})
  }));

  return `${header()}
export type PbDistance = "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ";

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

export const personalBests: PersonalBest[] = ${literal(pbs)};

export function getPersonalBestsByAthleteId(athleteId: string) {
  return personalBests.filter((record) => record.athlete_id === athleteId);
}
`;
}

function buildResultSummaries(data: ReturnType<typeof normalizeAll>) {
  return data.races
    .map((race) => {
      const raceResults = data.results.filter((result) => result.race_id === race.race_id);
      const isEkiden = race.distance === "駅伝";
      const raceTeams = isEkiden ? data.teamResults.filter((team) => team.race_id === race.race_id) : [];
      if (raceResults.length === 0 && raceTeams.length === 0) return null;

      const meet = data.meets.find((item) => item.meet_id === race.meet_id);
      const notes = Array.from(new Set(raceResults.map((result) => result.note).filter(Boolean))) as ResultNote[];

      // 駅伝は総合1位の大学を優勝として扱う（区間1位の選手ではない）
      const overallTeams = raceTeams.filter((team) => team.result_type === "総合");
      const topTeam =
        overallTeams.find((team) => /^1位?$/.test(team.rank)) ?? overallTeams[0] ?? raceTeams[0];
      const finishedResults = raceResults.filter((result) => result.result_status === "finished");
      const winner = finishedResults.find((result) => result.rank === "1位") ?? finishedResults[0] ?? raceResults[0];
      const winnerAthlete = winner ? data.athletes.find((athlete) => athlete.id === winner.athlete_id) : undefined;
      const winnerUniversity = data.universities.find(
        (university) => university.id === (isEkiden && topTeam ? topTeam.university_id : winner?.university_id)
      );
      const useTeamWinner = isEkiden && Boolean(topTeam);

      return {
        result_id: race.result_summary_id ?? `${race.meet_id}-${race.race_id}`,
        meet_id: race.meet_id,
        meet_name: meet?.meet_name ?? race.meet_id,
        race_id: race.race_id,
        race_name: race.race_name,
        date: meet?.date ?? raceResults[0]?.date ?? "日付未定",
        venue: meet?.venue ?? "会場未定",
        category: meet?.category ?? "track",
        status: "result_published",
        winner_type: useTeamWinner ? "team" : "athlete",
        winner_athlete_id: useTeamWinner ? "" : winner?.athlete_id ?? "",
        winner_name: useTeamWinner ? winnerUniversity?.name ?? "大学未登録" : winnerAthlete?.name ?? "未登録",
        winner_university_id: useTeamWinner ? topTeam!.university_id : winner?.university_id ?? "",
        winner_university_name: winnerUniversity?.name ?? "大学未登録",
        winner_time: useTeamWinner ? topTeam!.time : winner?.time ?? "",
        distance: race.distance,
        pb_count: raceResults.filter((result) => result.is_pb || result.note === "PB").length,
        dns_count: raceResults.filter((result) => result.result_status === "dns" || result.note === "DNS").length,
        result_count: raceResults.length,
        notes
      };
    })
    .filter((summary): summary is NonNullable<typeof summary> => Boolean(summary))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildUniversityResultGroups(data: ReturnType<typeof normalizeAll>) {
  return data.universities
    .map((university) => {
      const rows = data.results
        .filter((result) => result.university_id === university.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .map((result) => {
          const athlete = data.athletes.find((item) => item.id === result.athlete_id);
          return { date: result.date, athlete_name: athlete?.name ?? "未登録", distance: result.distance, time: result.time };
        });

      return rows.length > 0
        ? {
            university_id: university.id,
            university_name: university.name,
            accent: university.accent,
            results: rows
          }
        : null;
    })
    .filter((group): group is NonNullable<typeof group> => Boolean(group));
}

function findNextAppearance(universityId: string, data: ReturnType<typeof normalizeAll>) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingStatuses = new Set(["scheduled", "coming_soon", "startlist_published", "live"]);

  const meet = data.entries
    .filter((entry) => entry.university_id === universityId)
    .map((entry) => data.meets.find((item) => item.meet_id === entry.meet_id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.date >= today && upcomingStatuses.has(item.status))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return meet?.meet_name ?? null;
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [headersRaw, ...body] = rows.filter((line) => line.some((item) => item.trim() !== ""));
  if (!headersRaw) return [];

  const headers = headersRaw.map((header) => header.trim());

  return body.map((line) => {
    const rowObject: CsvRow = {};
    headers.forEach((header, index) => {
      rowObject[header] = parseCell(line[index] ?? "");
    });
    return rowObject;
  });
}

function parseCell(cell: string): CsvValue {
  const trimmed = cell.trim();
  return trimmed === "" ? null : trimmed;
}

function required(row: CsvRow, key: string, index: number, sheet: string) {
  const parsed = value(row[key]);
  if (!parsed) throw new Error(`${sheet} ${index + 2}行目: ${key} は必須です`);
  return parsed;
}

function value(input: CsvValue | undefined) {
  return input === undefined || input === null || input === "" ? null : input;
}

function toBoolean(input: CsvValue | undefined) {
  const parsed = value(input);
  return parsed === "TRUE" || parsed === "true" || parsed === "1";
}

function toNumber(input: CsvValue | undefined) {
  const parsed = value(input);
  return parsed === null ? null : Number(parsed);
}

function splitList(input: string | null) {
  return input
    ? input
        .split(/\s*(?:,|、|\/)\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function checkDuplicates<T extends Record<string, unknown>>(items: T[], key: keyof T, label: string, errors: string[]) {
  const seen = new Set<unknown>();

  items.forEach((item) => {
    const itemKey = item[key];
    if (seen.has(itemKey)) errors.push(`${label} が重複しています: ${String(itemKey)}`);
    seen.add(itemKey);
  });
}

function toIdSet<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return new Set(items.map((item) => String(item[key])));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: "大会予定",
    coming_soon: "まもなく",
    startlist_published: "スタートリスト公開中",
    result_waiting: "結果待ち",
    live: "実施中",
    result_published: "結果公開中"
  };

  return labels[status] ?? "未登録";
}

function writeFile(fileName: string, contents: string) {
  writeFileSync(path.join(dataDir, fileName), contents, "utf8");
}

function header() {
  return "// This file is generated by scripts/import-csv.ts. Do not edit directly.\n";
}

function literal(valueToSerialize: unknown) {
  return JSON.stringify(valueToSerialize, null, 2);
}

function fail(errors: string[]): never {
  console.error("CSV import failed.");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

function parseArgs(argv: string[]) {
  let csvDirArg: string | null = null;
  let outDirArg: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];

    if (item === "--csv-dir") {
      csvDirArg = argv[index + 1] ?? null;
      index += 1;
    }

    if (item === "--out-dir") {
      outDirArg = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { csvDir: csvDirArg, outDir: outDirArg };
}
