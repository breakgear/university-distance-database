import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { ImportCommitPayload, ImportDistance, ImportParsedRow } from "./result-import-types";

type CsvRecord = Record<string, string>;

const csvFiles = [
  "universities",
  "athletes",
  "meets",
  "races",
  "entries",
  "results",
  "personal_bests",
  "status_master",
  "event_type_master"
] as const;

export function commitImport(payload: ImportCommitPayload) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_CSV_WRITE !== "true") {
    throw new Error("本番環境ではCSVを永続更新できません。ローカル環境で実行してください。");
  }

  const rootDir = process.cwd();
  const csvDir = path.join(rootDir, "csv");
  if (!existsSync(csvDir)) throw new Error("csv/ ディレクトリが見つかりません。");
  if (!payload.rows.length) throw new Error("登録対象の結果が選択されていません。");

  const data = Object.fromEntries(
    csvFiles.map((name) => [name, readCsv(path.join(csvDir, `${name}.csv`))])
  ) as Record<(typeof csvFiles)[number], { headers: string[]; rows: CsvRecord[] }>;

  const counts = {
    universities: 0,
    athletes: 0,
    meets: 0,
    races: 0,
    entries: 0,
    results: 0,
    personal_bests: 0
  };

  counts.meets = upsertMeet(data.meets.rows, payload);
  counts.races = upsertRace(data.races.rows, payload);

  for (const row of payload.rows) {
    counts.universities += ensureUniversity(data.universities.rows, row, payload.metadata.distance);
    counts.athletes += ensureAthlete(data.athletes.rows, row, payload.metadata.distance);
    counts.entries += ensureEntry(data.entries.rows, row, payload);
    const resultId = `${payload.metadata.raceId}-${row.athleteId}`;
    counts.results += ensureResult(data.results.rows, row, payload, resultId);
    if (row.note === "PB" && row.resultStatus === "finished") {
      counts.personal_bests += upsertPersonalBest(data.personal_bests.rows, row, payload, resultId);
    }
  }

  if (Object.values(counts).every((count) => count === 0)) {
    return { counts, backupDir: "", changed: false };
  }

  const tempRoot = mkdtempSync(path.join(tmpdir(), "distance-import-"));
  const tempCsv = path.join(tempRoot, "csv");
  const tempData = path.join(tempRoot, "data");
  mkdirSync(tempCsv, { recursive: true });

  try {
    for (const name of csvFiles) {
      writeFileSync(path.join(tempCsv, `${name}.csv`), stringifyCsv(data[name].headers, data[name].rows));
    }

    execFileSync(
      process.execPath,
      ["--no-warnings", "--experimental-strip-types", "scripts/import-csv.ts", "--csv-dir", tempCsv, "--out-dir", tempData],
      { cwd: rootDir, encoding: "utf8", stdio: "pipe" }
    );

    const backupDir = path.join(rootDir, ".import-backups", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(backupDir, { recursive: true });
    cpSync(csvDir, backupDir, { recursive: true });

    for (const name of csvFiles) {
      writeFileSync(path.join(csvDir, `${name}.csv`), stringifyCsv(data[name].headers, data[name].rows));
    }

    execFileSync(
      process.execPath,
      ["--no-warnings", "--experimental-strip-types", "scripts/import-csv.ts"],
      { cwd: rootDir, encoding: "utf8", stdio: "pipe" }
    );

    return { counts, backupDir: path.relative(rootDir, backupDir), changed: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV更新に失敗しました。";
    throw new Error(`CSV更新前の検証に失敗しました: ${message}`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function upsertMeet(rows: CsvRecord[], payload: ImportCommitPayload) {
  const current = rows.find((row) => row.meet_id === payload.metadata.meetId);
  const next = {
    meet_id: payload.metadata.meetId,
    slug: current?.slug || payload.metadata.meetId,
    meet_name: current?.meet_name || payload.metadata.meetName,
    date: payload.metadata.date || current?.date || "",
    venue: payload.metadata.venue || current?.venue || "",
    category: current?.category || payload.metadata.category,
    status: "result_published",
    note: current?.note || "管理画面から結果を取り込み"
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function upsertRace(rows: CsvRecord[], payload: ImportCommitPayload) {
  const current = rows.find((row) => row.race_id === payload.metadata.raceId);
  const next = {
    race_id: payload.metadata.raceId,
    slug: current?.slug || payload.metadata.raceId,
    meet_id: payload.metadata.meetId,
    race_name: current?.race_name || payload.metadata.raceName,
    distance: current?.distance || payload.metadata.distance,
    start_time: payload.metadata.startTime || current?.start_time || "",
    status: "result_published",
    result_summary_id: current?.result_summary_id || payload.metadata.raceId
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function ensureUniversity(rows: CsvRecord[], row: ImportParsedRow, distance: ImportDistance) {
  const current = rows.find((item) => item.id === row.universityId);
  if (current) {
    const next = {
      has_result: "TRUE",
      listing_events: addListValue(current.listing_events, distance)
    };
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push({
    id: row.universityId,
    slug: row.universityId,
    name: row.university,
    area: "未登録",
    sash_color: "未登録",
    accent: "#64748B",
    profile: "",
    listing_events: distance,
    has_upcoming: "FALSE",
    has_result: "TRUE"
  });
  return 1;
}

function ensureAthlete(rows: CsvRecord[], row: ImportParsedRow, distance: ImportDistance) {
  const current = rows.find((item) => item.id === row.athleteId);
  if (current) {
    const next: CsvRecord = {};
    if (!current.specialty) next.specialty = distance;
    if ((!current.year || current.year === "学年未登録") && row.year) next.year = row.year;
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push({
    id: row.athleteId,
    slug: row.athleteId,
    name: row.athlete,
    university_id: row.universityId,
    year: row.year || "学年未登録",
    hometown: "",
    specialty: distance,
    profile: "",
    next_race: ""
  });
  return 1;
}

function ensureEntry(rows: CsvRecord[], row: ImportParsedRow, payload: ImportCommitPayload) {
  const entryId = `entry-${payload.metadata.raceId}-${row.athleteId}`;
  const current = rows.find(
    (item) => item.entry_id === entryId || (item.race_id === payload.metadata.raceId && item.athlete_id === row.athleteId)
  );
  const next = {
    entry_id: current?.entry_id || entryId,
    meet_id: payload.metadata.meetId,
    race_id: payload.metadata.raceId,
    athlete_id: row.athleteId,
    university_id: row.universityId,
    bib_no: row.bib,
    entry_status: row.resultStatus === "dns" ? "dns" : "started"
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function ensureResult(
  rows: CsvRecord[],
  row: ImportParsedRow,
  payload: ImportCommitPayload,
  resultId: string
) {
  const current = rows.find(
    (item) => item.result_id === resultId || (item.race_id === payload.metadata.raceId && item.athlete_id === row.athleteId)
  );
  const next = {
    result_id: current?.result_id || resultId,
    meet_id: payload.metadata.meetId,
    race_id: payload.metadata.raceId,
    athlete_id: row.athleteId,
    university_id: row.universityId,
    distance: payload.metadata.distance,
    date: payload.metadata.date,
    rank: row.resultStatus === "finished" && /^\d+$/.test(row.rank) ? `${row.rank}位` : row.rank.toUpperCase(),
    time: row.time,
    result_status: row.resultStatus,
    note: row.note,
    is_pb: row.note === "PB" ? "TRUE" : "FALSE"
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function upsertPersonalBest(
  rows: CsvRecord[],
  row: ImportParsedRow,
  payload: ImportCommitPayload,
  resultId: string
) {
  const current = rows.find(
    (item) => item.athlete_id === row.athleteId && item.distance === payload.metadata.distance
  );
  if (current && toSeconds(current.time) <= toSeconds(row.time)) return 0;

  const next = {
    pb_id: current?.pb_id || `pb-${row.athleteId}-${payload.metadata.distance}`,
    athlete_id: row.athleteId,
    university_id: row.universityId,
    distance: payload.metadata.distance,
    time: row.time,
    date: payload.metadata.date,
    source_type: "result",
    source_result_id: resultId,
    note: "掲載結果から更新"
  };
  if (current) Object.assign(current, next);
  else rows.push(next);
  return 1;
}

function addListValue(list: string, value: string) {
  const items = list.split("/").map((item) => item.trim()).filter(Boolean);
  if (!items.includes(value)) items.push(value);
  return items.join(" / ");
}

function recordsEqual(current: CsvRecord, next: CsvRecord) {
  return Object.entries(next).every(([key, value]) => current[key] === value);
}

function toSeconds(value: string) {
  const numbers = value.split(":").map(Number);
  if (numbers.some(Number.isNaN)) return Number.POSITIVE_INFINITY;
  if (numbers.length === 3) return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  return numbers[0] * 60 + numbers[1];
}

function readCsv(filePath: string) {
  const text = readFileSync(filePath, "utf8");
  const matrix: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      matrix.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    matrix.push(row);
  }
  const [headers = [], ...body] = matrix;
  return {
    headers,
    rows: body
      .filter((values) => values.some(Boolean))
      .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])))
  };
}

function stringifyCsv(headers: string[], rows: CsvRecord[]) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))
  ].join("\n") + "\n";
}

function escapeCsv(value: string) {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
