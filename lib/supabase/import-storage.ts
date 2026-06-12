import "server-only";
import { createSupabaseAdminClient } from "./admin";
import {
  buildImportPlanFromData,
  type CsvRecord,
  type ImportCsvData
} from "../result-import-commit";
import type { ImportCommitPayload } from "../result-import-types";

const headers = {
  universities: ["id", "slug", "name", "area", "sash_color", "accent", "profile", "listing_events", "has_upcoming", "has_result"],
  athletes: ["id", "slug", "name", "university_id", "year", "hometown", "specialty", "profile", "next_race"],
  meets: ["meet_id", "slug", "meet_name", "date", "venue", "category", "status", "note"],
  races: ["race_id", "slug", "meet_id", "race_name", "distance", "start_time", "status", "result_summary_id"],
  entries: ["entry_id", "meet_id", "race_id", "athlete_id", "university_id", "bib_no", "entry_status"],
  results: ["result_id", "meet_id", "race_id", "athlete_id", "university_id", "distance", "date", "rank", "time", "result_status", "note", "is_pb"],
  personal_bests: ["pb_id", "athlete_id", "university_id", "distance", "time", "date", "source_type", "source_result_id", "note"],
  status_master: ["status_key", "label", "use_for"],
  event_type_master: ["event_type", "group", "label"]
} satisfies Record<keyof ImportCsvData, string[]>;

const tableOrder = [
  "universities",
  "meets",
  "races",
  "athletes",
  "entries",
  "results",
  "personal_bests"
] as const;

type DataTable = (typeof tableOrder)[number];

const primaryKeys: Record<DataTable, string> = {
  universities: "id",
  athletes: "id",
  meets: "meet_id",
  races: "race_id",
  entries: "entry_id",
  results: "result_id",
  personal_bests: "pb_id"
};

export async function loadSupabaseReferenceRecords() {
  const data = await loadSupabaseImportData();
  return {
    universities: data.universities.rows,
    athletes: data.athletes.rows,
    meets: data.meets.rows,
    races: data.races.rows,
    entries: data.entries.rows,
    results: data.results.rows,
    personalBests: data.personal_bests.rows
  };
}

export async function previewSupabaseImport(payload: ImportCommitPayload) {
  const data = await loadSupabaseImportData();
  const { counts, files } = buildImportPlanFromData(payload, data);
  return { counts, files };
}

export async function commitSupabaseImport(payload: ImportCommitPayload) {
  const supabase = createSupabaseAdminClient();
  const before = await loadSupabaseImportData();
  const plan = buildImportPlanFromData(payload, before);

  if (Object.values(plan.counts).every((count) => count === 0)) {
    return { counts: plan.counts, backupDir: "", changed: false, deploymentTriggered: false };
  }

  const changes = Object.fromEntries(
    tableOrder.map((table) => {
      const key = primaryKeys[table];
      const previous = new Map(before[table].rows.map((row) => [row[key], row]));
      const changed = plan.data[table].rows.filter((row) => {
        const old = previous.get(row[key]);
        return !old || !recordsEqual(old, row);
      });
      return [table, { changed, previous }];
    })
  ) as Record<DataTable, { changed: CsvRecord[]; previous: Map<string, CsvRecord> }>;

  const completed: DataTable[] = [];
  try {
    for (const table of tableOrder) {
      const rows = changes[table].changed;
      if (!rows.length) continue;
      const { error } = await supabase.from(table).upsert(toDatabaseRows(table, rows));
      if (error) throw new Error(`${table} の更新に失敗しました: ${error.message}`);
      completed.push(table);
    }
  } catch (error) {
    const rollbackError = await rollbackChanges(supabase, completed, changes);
    const message = error instanceof Error ? error.message : "Supabase更新に失敗しました。";
    throw new Error(
      rollbackError
        ? `${message} 自動復元にも失敗しました: ${rollbackError}`
        : `${message} 更新済みのテーブルは元の状態へ復元しました。`
    );
  }

  const deploymentTriggered = await triggerVercelDeployment();
  return {
    counts: plan.counts,
    backupDir: "Supabase",
    changed: true,
    deploymentTriggered
  };
}

async function loadSupabaseImportData(): Promise<ImportCsvData> {
  const supabase = createSupabaseAdminClient();
  const data = {} as ImportCsvData;

  for (const table of tableOrder) {
    const rows: CsvRecord[] = [];
    const pageSize = 1_000;
    for (let from = 0; ; from += pageSize) {
      const { data: page, error } = await supabase
        .from(table)
        .select("*")
        .order(primaryKeys[table], { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`${table} の取得に失敗しました: ${error.message}`);
      rows.push(...((page || []) as Record<string, unknown>[]).map((row) => toCsvRecord(table, row)));
      if (!page || page.length < pageSize) break;
    }
    data[table] = { headers: headers[table], rows };
  }

  data.status_master = { headers: headers.status_master, rows: [] };
  data.event_type_master = { headers: headers.event_type_master, rows: [] };
  return data;
}

async function rollbackChanges(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  completed: DataTable[],
  changes: Record<DataTable, { changed: CsvRecord[]; previous: Map<string, CsvRecord> }>
) {
  try {
    for (const table of [...completed].reverse()) {
      const key = primaryKeys[table];
      const insertedIds = changes[table].changed
        .filter((row) => !changes[table].previous.has(row[key]))
        .map((row) => row[key]);
      if (insertedIds.length) {
        const { error } = await supabase.from(table).delete().in(key, insertedIds);
        if (error) throw error;
      }
    }
    for (const table of tableOrder) {
      if (!completed.includes(table)) continue;
      const oldRows = changes[table].changed
        .map((row) => changes[table].previous.get(row[primaryKeys[table]]))
        .filter((row): row is CsvRecord => Boolean(row));
      if (oldRows.length) {
        const { error } = await supabase.from(table).upsert(toDatabaseRows(table, oldRows));
        if (error) throw error;
      }
    }
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "復元エラー";
  }
}

function toCsvRecord(table: DataTable, row: Record<string, unknown>): CsvRecord {
  return Object.fromEntries(
    headers[table].map((key) => [key, toCsvValue(row[key])])
  );
}

function toDatabaseRows(table: DataTable, rows: CsvRecord[]) {
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === "listing_events") {
        record[key] = value ? value.split("/").map((item) => item.trim()).filter(Boolean) : [];
      } else if (["has_upcoming", "has_result", "is_pb"].includes(key)) {
        record[key] = value.toUpperCase() === "TRUE";
      } else if (key === "bib_no") {
        record[key] = value ? Number.parseInt(value, 10) : null;
      } else {
        record[key] = value || null;
      }
    }
    if (table === "athletes" && !record.next_race) record.next_race = null;
    if (table === "races" && !record.result_summary_id) record.result_summary_id = null;
    if (table === "personal_bests" && !record.source_result_id) record.source_result_id = null;
    return record;
  });
}

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (Array.isArray(value)) return value.join(" / ");
  return String(value);
}

function recordsEqual(left: CsvRecord, right: CsvRecord) {
  return Object.keys(right).every((key) => left[key] === right[key]);
}

async function triggerVercelDeployment() {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return false;
  try {
    const response = await fetch(hook, { method: "POST", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
