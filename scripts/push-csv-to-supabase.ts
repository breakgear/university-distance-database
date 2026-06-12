import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminConfig } from "../lib/supabase/config.ts";
import {
  primaryKeys,
  readCsvTable,
  tableNames,
  toDatabaseRows,
  type CsvRecord,
  type TableName
} from "./supabase-data.ts";

const args = process.argv.slice(2);

async function main() {
  const csvDir = path.resolve(readOption("--csv-dir") || path.join(process.cwd(), "csv"));
  const dryRun = args.includes("--dry-run");
  const csvData = Object.fromEntries(
    tableNames.map((tableName) => [tableName, readCsvTable(csvDir, tableName).rows])
  ) as Record<TableName, CsvRecord[]>;

  validateReferences(csvData);

  console.log(`Source: ${csvDir}`);
  for (const tableName of tableNames) {
    console.log(`- ${tableName}: ${csvData[tableName].length} rows`);
  }

  if (dryRun) {
    console.log("Dry run completed. Supabase was not updated.");
    return;
  }

  const { url, secretKey } = requireSupabaseAdminConfig();
  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  for (const tableName of tableNames) {
    const rows = toDatabaseRows(tableName, csvData[tableName]).map((row) =>
      tableName === "athletes" ? { ...row, next_race: null } : row
    );
    for (let offset = 0; offset < rows.length; offset += 500) {
      const chunk = rows.slice(offset, offset + 500);
      const { error } = await supabase
        .from(tableName)
        .upsert(chunk, { onConflict: primaryKeys[tableName] });
      if (error) throw new Error(`${tableName} の同期に失敗しました: ${error.message}`);
    }
    console.log(`Synced ${tableName}: ${rows.length}`);
  }

  const athletesWithNextRace = toDatabaseRows("athletes", csvData.athletes).filter(
    (row) => row.next_race
  );
  for (let offset = 0; offset < athletesWithNextRace.length; offset += 500) {
    const chunk = athletesWithNextRace.slice(offset, offset + 500);
    const { error } = await supabase.from("athletes").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`athletes.next_race の同期に失敗しました: ${error.message}`);
  }
  console.log(`Synced athletes.next_race: ${athletesWithNextRace.length}`);
  console.log("CSV data was synced to Supabase.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

function readOption(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function validateReferences(data: Record<TableName, CsvRecord[]>) {
  const errors: string[] = [];
  const ids = {
    universities: collectUnique(data.universities, "id", errors),
    athletes: collectUnique(data.athletes, "id", errors),
    meets: collectUnique(data.meets, "meet_id", errors),
    races: collectUnique(data.races, "race_id", errors),
    entries: collectUnique(data.entries, "entry_id", errors),
    results: collectUnique(data.results, "result_id", errors),
    personal_bests: collectUnique(data.personal_bests, "pb_id", errors)
  };

  for (const athlete of data.athletes) {
    requireReference("athletes.university_id", athlete.id, athlete.university_id, ids.universities, errors);
    if (athlete.next_race) requireReference("athletes.next_race", athlete.id, athlete.next_race, ids.races, errors);
  }
  for (const race of data.races) {
    requireReference("races.meet_id", race.race_id, race.meet_id, ids.meets, errors);
  }
  for (const entry of data.entries) {
    requireReference("entries.meet_id", entry.entry_id, entry.meet_id, ids.meets, errors);
    requireReference("entries.race_id", entry.entry_id, entry.race_id, ids.races, errors);
    requireReference("entries.athlete_id", entry.entry_id, entry.athlete_id, ids.athletes, errors);
    requireReference("entries.university_id", entry.entry_id, entry.university_id, ids.universities, errors);
  }
  for (const result of data.results) {
    requireReference("results.meet_id", result.result_id, result.meet_id, ids.meets, errors);
    requireReference("results.race_id", result.result_id, result.race_id, ids.races, errors);
    requireReference("results.athlete_id", result.result_id, result.athlete_id, ids.athletes, errors);
    requireReference("results.university_id", result.result_id, result.university_id, ids.universities, errors);
  }
  for (const pb of data.personal_bests) {
    requireReference("personal_bests.athlete_id", pb.pb_id, pb.athlete_id, ids.athletes, errors);
    requireReference("personal_bests.university_id", pb.pb_id, pb.university_id, ids.universities, errors);
    if (pb.source_result_id && pb.source_type !== "manual") {
      requireReference(
        "personal_bests.source_result_id",
        pb.pb_id,
        pb.source_result_id,
        ids.results,
        errors
      );
    }
  }

  if (errors.length) throw new Error(`Supabase同期前の整合性チェックに失敗しました。\n${errors.join("\n")}`);
}

function collectUnique(rows: CsvRecord[], key: string, errors: string[]) {
  const values = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (!value) errors.push(`${key} が空欄です。`);
    else if (values.has(value)) errors.push(`${key} が重複しています: ${value}`);
    else values.add(value);
  }
  return values;
}

function requireReference(
  field: string,
  ownerId: string,
  value: string,
  allowed: Set<string>,
  errors: string[]
) {
  if (!value || !allowed.has(value)) errors.push(`${field}: ${ownerId} -> ${value || "(空欄)"}`);
}
