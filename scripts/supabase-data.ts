import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const tableNames = [
  "universities",
  "athletes",
  "meets",
  "races",
  "entries",
  "results",
  "personal_bests"
] as const;

export type TableName = (typeof tableNames)[number];
export type CsvRecord = Record<string, string>;

export const primaryKeys: Record<TableName, string> = {
  universities: "id",
  athletes: "id",
  meets: "meet_id",
  races: "race_id",
  entries: "entry_id",
  results: "result_id",
  personal_bests: "pb_id"
};

export function readCsvTable(csvDir: string, tableName: TableName) {
  return readCsv(path.join(csvDir, `${tableName}.csv`));
}

export function readCsv(filePath: string) {
  const text = readFileSync(filePath, "utf8");
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      matrix.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    matrix.push(row);
  }

  const [headers = [], ...rows] = matrix.filter((item) => item.some((value) => value !== ""));
  return {
    headers,
    rows: rows.map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
    )
  };
}

export function writeCsvTable(
  csvDir: string,
  tableName: TableName,
  headers: string[],
  rows: Record<string, unknown>[]
) {
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(toCsvValue(row[header]))).join(","))
  ].join("\n");

  writeFileSync(path.join(csvDir, `${tableName}.csv`), `${text}\n`);
}

export function toDatabaseRows(tableName: TableName, rows: CsvRecord[]) {
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

    if (tableName === "athletes" && !record.next_race) record.next_race = null;
    if (tableName === "races" && !record.result_summary_id) record.result_summary_id = null;
    if (tableName === "personal_bests" && !record.source_result_id) record.source_result_id = null;
    return record;
  });
}

export function stripDatabaseMetadata(rows: Record<string, unknown>[]) {
  return rows.map(({ created_at: _createdAt, updated_at: _updatedAt, ...row }) => row);
}

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (Array.isArray(value)) return value.join(" / ");
  return String(value);
}

function escapeCsv(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
