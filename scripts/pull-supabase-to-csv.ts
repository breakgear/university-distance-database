import { mkdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminConfig } from "../lib/supabase/config.ts";
import {
  primaryKeys,
  stripDatabaseMetadata,
  tableHeaders,
  tableNames,
  writeCsvTable
} from "./supabase-data.ts";

const args = process.argv.slice(2);

async function main() {
  const csvDir = path.resolve(readOption("--csv-dir") || path.join(process.cwd(), "csv"));
  const skipGenerate = args.includes("--skip-generate");
  const { url, secretKey } = requireSupabaseAdminConfig();
  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  mkdirSync(csvDir, { recursive: true });

  for (const tableName of tableNames) {
    const rows: Record<string, unknown>[] = [];
    const pageSize = 1_000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(primaryKeys[tableName], { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw new Error(`${tableName} の取得に失敗しました: ${error.message}`);
      rows.push(...((data || []) as Record<string, unknown>[]));
      if (!data || data.length < pageSize) break;
    }

    const cleanRows = stripDatabaseMetadata(rows);
    writeCsvTable(csvDir, tableName, tableHeaders[tableName], cleanRows);
    console.log(`Pulled ${tableName}: ${cleanRows.length}`);
  }

  if (!skipGenerate) {
    execFileSync(
      process.execPath,
      ["--no-warnings", "--experimental-strip-types", "scripts/import-csv.ts", "--csv-dir", csvDir],
      { cwd: process.cwd(), stdio: "inherit" }
    );
  }

  console.log("Supabase data was written to CSV.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
function readOption(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
