import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type {
  ImportCommitPayload,
  ImportDistance,
  ImportFileDiff,
  ImportParsedRow,
  ImportTeamResultRow
} from "./result-import-types";

export type CsvRecord = Record<string, string>;
export type ImportCsvTable = { headers: string[]; rows: CsvRecord[] };

export const csvFiles = [
  "universities",
  "athletes",
  "meets",
  "races",
  "entries",
  "results",
  "personal_bests",
  "team_results",
  "status_master",
  "event_type_master"
] as const;

export type ImportCsvData = Record<(typeof csvFiles)[number], ImportCsvTable>;

// 既存csv/に未生成のテーブルがあっても空テーブルとして扱うためのヘッダー定義
const emptyTableHeaders: Record<(typeof csvFiles)[number], string[]> = {
  universities: ["id", "slug", "name", "area", "sash_color", "accent", "profile", "listing_events", "has_upcoming", "has_result"],
  athletes: ["id", "slug", "name", "university_id", "year", "hometown", "specialty", "profile", "next_race"],
  meets: ["meet_id", "slug", "meet_name", "date", "venue", "category", "status", "note"],
  races: ["race_id", "slug", "meet_id", "race_name", "distance", "start_time", "status", "result_summary_id"],
  entries: ["entry_id", "meet_id", "race_id", "athlete_id", "university_id", "bib_no", "entry_status"],
  results: ["result_id", "meet_id", "race_id", "athlete_id", "university_id", "distance", "date", "rank", "time", "result_status", "note", "is_pb", "section", "section_distance"],
  personal_bests: ["pb_id", "athlete_id", "university_id", "distance", "time", "date", "source_type", "source_result_id", "note"],
  team_results: ["team_result_id", "meet_id", "race_id", "university_id", "result_type", "rank", "time", "status", "note"],
  status_master: ["status_key", "label", "use_for"],
  event_type_master: ["event_type", "group", "label"]
};

const previewFiles = [
  ["universities", "大学情報を追加・更新", "id"],
  ["athletes", "選手情報を追加・更新", "id"],
  ["meets", "大会情報を追加・更新", "meet_id"],
  ["races", "レース情報を追加・更新", "race_id"],
  ["entries", "掲載状態を追加・更新", "entry_id"],
  ["results", "結果を追加・更新", "result_id"],
  ["personal_bests", "PBを追加・更新", "pb_id"],
  ["team_results", "総合結果を追加・更新", "team_result_id"]
] as const;

const generatedDataFiles = [
  "universities.ts",
  "athletes.ts",
  "meets.ts",
  "races.ts",
  "entries.ts",
  "results.ts",
  "personalBests.ts",
  "teamResults.ts"
] as const;

function useSupabaseImportStorage() {
  return process.env.NODE_ENV === "production" || process.env.ADMIN_IMPORT_STORAGE === "supabase";
}

export async function commitImport(payload: ImportCommitPayload) {
  if (useSupabaseImportStorage()) {
    const { commitSupabaseImport } = await import("./supabase/import-storage");
    return commitSupabaseImport(payload);
  }

  return commitLocalImport(payload);
}

function commitLocalImport(payload: ImportCommitPayload) {
  const rootDir = process.cwd();
  const csvDir = path.join(rootDir, "csv");
  const prepared = buildImportPlan(payload, csvDir);
  const { data, counts } = prepared;

  if (Object.values(counts).every((count) => count === 0)) {
    return { counts, backupDir: "", changed: false };
  }

  const tempRoot = mkdtempSync(path.join(tmpdir(), "distance-import-"));
  const tempCsv = path.join(tempRoot, "csv");
  const tempData = path.join(tempRoot, "data");
  let backupDir = "";
  let writesStarted = false;
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

    backupDir = path.join(rootDir, ".import-backups", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(backupDir, { recursive: true });
    backupImportFiles(rootDir, csvDir, backupDir);

    writesStarted = true;
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
    let rollbackMessage = "";
    let rollbackSucceeded = false;
    if (writesStarted && backupDir) {
      try {
        restoreImportFiles(rootDir, csvDir, backupDir);
        rollbackSucceeded = true;
      } catch (rollbackError) {
        rollbackMessage = ` 自動復元にも失敗しました: ${
          rollbackError instanceof Error ? rollbackError.message : "復元エラー"
        }`;
      }
    }
    const message = error instanceof Error ? error.message : "CSV更新に失敗しました。";
    throw new Error(
      writesStarted
        ? `${
            rollbackSucceeded
              ? "CSV更新に失敗したため、バックアップから復元しました"
              : "CSV更新に失敗し、バックアップから復元できませんでした"
          }: ${message}${rollbackMessage}`
        : `CSV更新前の検証に失敗しました: ${message}`
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function backupImportFiles(rootDir: string, csvDir: string, backupDir: string) {
  const csvBackupDir = path.join(backupDir, "csv");
  const dataBackupDir = path.join(backupDir, "data");
  mkdirSync(csvBackupDir, { recursive: true });
  mkdirSync(dataBackupDir, { recursive: true });

  for (const name of csvFiles) {
    const source = path.join(csvDir, `${name}.csv`);
    if (existsSync(source)) cpSync(source, path.join(csvBackupDir, `${name}.csv`));
  }

  for (const fileName of generatedDataFiles) {
    const source = path.join(rootDir, "data", fileName);
    if (existsSync(source)) cpSync(source, path.join(dataBackupDir, fileName));
  }
}

function restoreImportFiles(rootDir: string, csvDir: string, backupDir: string) {
  const csvBackupDir = path.join(backupDir, "csv");
  const dataBackupDir = path.join(backupDir, "data");

  for (const name of csvFiles) {
    const backup = path.join(csvBackupDir, `${name}.csv`);
    const destination = path.join(csvDir, `${name}.csv`);
    if (existsSync(backup)) cpSync(backup, destination);
    else rmSync(destination, { force: true });
  }

  for (const fileName of generatedDataFiles) {
    const backup = path.join(dataBackupDir, fileName);
    const destination = path.join(rootDir, "data", fileName);
    if (existsSync(backup)) cpSync(backup, destination);
    else rmSync(destination, { force: true });
  }
}

export async function previewImport(payload: ImportCommitPayload) {
  if (useSupabaseImportStorage()) {
    const { previewSupabaseImport } = await import("./supabase/import-storage");
    return previewSupabaseImport(payload);
  }

  const csvDir = path.join(process.cwd(), "csv");
  const { counts, files } = buildImportPlan(payload, csvDir);
  return { counts, files };
}

// Preview and commit must use the same plan so the reviewed CSV is the CSV that gets written.
function buildImportPlan(payload: ImportCommitPayload, csvDir: string) {
  validateCommitPayload(payload);
  if (!existsSync(csvDir)) throw new Error("csv/ ディレクトリが見つかりません。");

  const data = Object.fromEntries(
    csvFiles.map((name) => {
      const filePath = path.join(csvDir, `${name}.csv`);
      const known = emptyTableHeaders[name];
      // 新規追加テーブルのCSVが未生成でも通常取込を止めない
      if (!existsSync(filePath)) return [name, { headers: [...known], rows: [] }];
      const table = readCsv(filePath);
      // 既存CSVに新規カラム(section等)が無くても書き出し対象に含める
      const headers = [...table.headers, ...known.filter((header) => !table.headers.includes(header))];
      return [name, { headers, rows: table.rows }];
    })
  ) as ImportCsvData;
  return buildImportPlanFromData(payload, data);
}

export function buildImportPlanFromData(payload: ImportCommitPayload, data: ImportCsvData) {
  validateCommitPayload(payload);
  const workingData = Object.fromEntries(
    csvFiles.map((name) => [
      name,
      {
        headers: [...data[name].headers],
        rows: data[name].rows.map((row) => ({ ...row }))
      }
    ])
  ) as ImportCsvData;
  const before = Object.fromEntries(
    previewFiles.map(([name]) => [
      name,
      workingData[name].rows.map((row) => ({ ...row }))
    ])
  ) as Record<(typeof previewFiles)[number][0], CsvRecord[]>;

  const counts = {
    universities: 0,
    athletes: 0,
    meets: 0,
    races: 0,
    entries: 0,
    results: 0,
    personal_bests: 0,
    team_results: 0
  };

  const isEkiden = payload.importKind === "ekiden";

  counts.meets = upsertMeet(workingData.meets.rows, payload);
  counts.races = upsertRace(workingData.races.rows, payload);

  for (const row of payload.rows) {
    counts.universities += ensureUniversity(workingData.universities.rows, row, payload);
    counts.athletes += ensureAthlete(workingData.athletes.rows, row, payload);
    if (!isEkiden) {
      counts.entries += ensureEntry(workingData.entries.rows, row, payload);
    }
    if (payload.importKind === "entry") continue;
    const resultId = `${payload.metadata.raceId}-${row.athleteId}`;
    counts.results += ensureResult(workingData.results.rows, row, payload, resultId);
    if (!isEkiden && row.note === "PB" && row.resultStatus === "finished") {
      counts.personal_bests += upsertPersonalBest(workingData.personal_bests.rows, row, payload, resultId);
    }
  }

  if (isEkiden) {
    for (const teamRow of payload.teamRows ?? []) {
      // 総合のみに登場する大学のFK切れを防ぐため大学も登録する
      counts.universities += ensureUniversityById(
        workingData.universities.rows,
        teamRow.universityId,
        teamRow.university
      );
      counts.team_results += ensureTeamResult(workingData.team_results.rows, teamRow, payload);
    }
  }

  const files = previewFiles.map(([name, changedText, primaryKey]): ImportFileDiff => {
    const previousById = new Map(before[name].map((row) => [row[primaryKey], row]));
    const changedRows = workingData[name].rows.filter((row) => {
      const previous = previousById.get(row[primaryKey]);
      return !previous || !recordsEqual(previous, row);
    });
    return {
      name: `${name}.csv`,
      count: changedRows.length,
      text: changedRows.length ? changedText : "変更なし",
      preview: stringifyCsv(workingData[name].headers, changedRows).trimEnd()
    };
  });

  return { data: workingData, counts, files };
}

export function validateCommitPayload(payload: ImportCommitPayload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("取込データが不正です。");
  }
  if (!["entry", "result", "ekiden"].includes(payload.importKind)) {
    throw new Error("取込種別が不正です。");
  }
  const isEkiden = payload.importKind === "ekiden";
  if (!Array.isArray(payload.rows)) {
    throw new Error("登録対象の行が不正です。");
  }
  if (!payload.rows.length && !(isEkiden && (payload.teamRows?.length ?? 0) > 0)) {
    throw new Error("登録対象の行が選択されていません。");
  }
  if (!payload.metadata?.meetId || !payload.metadata.raceId) {
    throw new Error("大会IDとレースIDを入力してください。");
  }
  if (!["1500m", "3000mSC", "5000m", "10000m", "ハーフ", "駅伝"].includes(payload.metadata.distance)) {
    throw new Error("種目が不正です。");
  }
  if (payload.metadata.date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.metadata.date)) {
    throw new Error("開催日は YYYY-MM-DD 形式で入力してください。");
  }
  for (const row of payload.rows) {
    if (!row.athleteId || !row.universityId || !row.athlete) {
      throw new Error("選手ID・大学ID・選手名が未入力の行があります。");
    }
    if (!["finished", "dns", "dnf", "dq"].includes(row.resultStatus)) {
      throw new Error(`${row.athlete}の結果ステータスが不正です。`);
    }
    if (payload.importKind === "entry" && row.entryStatus && !["listed", "unconfirmed"].includes(row.entryStatus)) {
      throw new Error(`${row.athlete}の掲載状態が不正です。`);
    }
  }
}

function upsertMeet(rows: CsvRecord[], payload: ImportCommitPayload) {
  const current = rows.find((row) => row.meet_id === payload.metadata.meetId);
  const next = {
    meet_id: payload.metadata.meetId,
    slug: current?.slug || payload.metadata.meetId,
    meet_name: current?.meet_name || payload.metadata.meetName,
    date: current?.date || payload.metadata.date || "",
    venue: payload.metadata.venue || current?.venue || "",
    category: current?.category || payload.metadata.category,
    status:
      payload.importKind !== "entry" || current?.status === "result_published"
        ? "result_published"
        : "startlist_published",
    note: current?.note || (payload.importKind === "entry" ? "管理画面からエントリーを取り込み" : "管理画面から結果を取り込み")
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
    status:
      payload.importKind !== "entry" || current?.status === "result_published"
        ? "result_published"
        : "startlist_published",
    result_summary_id:
      payload.importKind !== "entry" ? current?.result_summary_id || payload.metadata.raceId : current?.result_summary_id || ""
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function ensureUniversity(rows: CsvRecord[], row: ImportParsedRow, payload: ImportCommitPayload) {
  const distance: ImportDistance = payload.metadata.distance;
  const current = rows.find((item) => item.id === row.universityId);
  // 駅伝(距離=駅伝)は種目別の掲載種目に加えない
  const listingDistance = distance === "駅伝" ? "" : distance;
  if (current) {
    const next = {
      ...(payload.importKind === "entry" ? { has_upcoming: "TRUE" } : { has_result: "TRUE" }),
      listing_events: listingDistance ? addListValue(current.listing_events, listingDistance) : current.listing_events
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
    listing_events: listingDistance,
    has_upcoming: payload.importKind === "entry" ? "TRUE" : "FALSE",
    has_result: payload.importKind === "entry" ? "FALSE" : "TRUE"
  });
  return 1;
}

function ensureUniversityById(rows: CsvRecord[], universityId: string, universityName: string) {
  if (rows.some((item) => item.id === universityId)) return 0;
  rows.push({
    id: universityId,
    slug: universityId,
    name: universityName || "大学未登録",
    area: "未登録",
    sash_color: "未登録",
    accent: "#64748B",
    profile: "",
    listing_events: "",
    has_upcoming: "FALSE",
    has_result: "TRUE"
  });
  return 1;
}

function ensureAthlete(
  rows: CsvRecord[],
  row: ImportParsedRow,
  payload: ImportCommitPayload
) {
  const current = rows.find((item) => item.id === row.athleteId);
  if (current) {
    const next: CsvRecord = {};
    if (!current.specialty) next.specialty = payload.metadata.distance;
    if ((!current.year || current.year === "学年未登録") && row.year) next.year = row.year;
    if (payload.importKind === "entry" && !current.next_race) next.next_race = payload.metadata.raceId;
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
    specialty: payload.metadata.distance,
    profile: "",
    next_race: payload.importKind === "entry" ? payload.metadata.raceId : ""
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
    entry_status:
      payload.importKind === "entry"
        ? row.entryStatus || "listed"
        : row.resultStatus === "dns"
          ? "dns"
          : "started"
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
    is_pb: row.note === "PB" ? "TRUE" : "FALSE",
    section: row.section ?? "",
    section_distance: row.sectionDistance ?? ""
  };
  if (current) {
    if (recordsEqual(current, next)) return 0;
    Object.assign(current, next);
    return 1;
  }
  rows.push(next);
  return 1;
}

function ensureTeamResult(rows: CsvRecord[], row: ImportTeamResultRow, payload: ImportCommitPayload) {
  const teamResultId = `${payload.metadata.raceId}-${row.universityId}-${row.resultType}`;
  const current = rows.find(
    (item) =>
      item.team_result_id === teamResultId ||
      (item.race_id === payload.metadata.raceId &&
        item.university_id === row.universityId &&
        item.result_type === row.resultType)
  );
  const next = {
    team_result_id: current?.team_result_id || teamResultId,
    meet_id: payload.metadata.meetId,
    race_id: payload.metadata.raceId,
    university_id: row.universityId,
    result_type: row.resultType,
    rank: row.status === "finished" && /^\d+$/.test(row.rank) ? `${row.rank}位` : row.rank.toUpperCase(),
    time: row.time,
    status: row.status,
    note: row.note
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
