import type {
  ImportCommitPayload,
  ImportDistance,
  ImportEntryStatus,
  ImportGroup,
  ImportKind,
  ImportMatchStatus,
  ImportMetadata,
  ImportParsedRow,
  ImportResultStatus,
  ImportTeamResultRow,
  ImportTeamResultType
} from "./result-import-types";

const distances = new Set<ImportDistance>(["1500m", "3000mSC", "5000m", "10000m", "ハーフ", "駅伝"]);
const resultStatuses = new Set<ImportResultStatus>(["finished", "dns", "dnf", "dq"]);
const entryStatuses = new Set<ImportEntryStatus>(["listed", "unconfirmed"]);
const matchStatuses = new Set<ImportMatchStatus>(["matched", "new", "warning"]);
const teamResultTypes = new Set<ImportTeamResultType>(["総合", "往路", "復路"]);
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2_000_000;
const MAX_ROWS = 5_000;

export function parseAnalyzeFormData(formData: FormData) {
  const url = readFormString(formData, "url").trim();
  const text = readFormString(formData, "text").trim();
  const pdfValue = formData.get("pdf");
  const pdf = pdfValue instanceof File && pdfValue.size > 0 ? pdfValue : null;
  const importKind = readEnum(readFormString(formData, "importKind") || "result", ["entry", "result", "ekiden"], "取込種別") as ImportKind;
  const targetDistance = readEnum(
    readFormString(formData, "targetDistance") || "5000m",
    Array.from(distances),
    "種目"
  ) as ImportDistance;
  const rawTargetGroup = readFormString(formData, "targetGroup");
  const targetGroup = rawTargetGroup as ImportGroup;

  if (url.length > 2_048) throw new Error("URLが長すぎます。");
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("URLの形式が正しくありません。");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URLは http または https で指定してください。");
    }
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error("コピペ本文が大きすぎます。200万文字以下にしてください。");
  }
  if (targetGroup && !/^\d+組$/.test(targetGroup)) {
    throw new Error("組指定が不正です。");
  }
  if (pdf) {
    if (pdf.size > MAX_PDF_BYTES) throw new Error("PDFは15MB以下のファイルを指定してください。");
    if (pdf.type && pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("PDF形式のファイルを指定してください。");
    }
  }

  return {
    url,
    text,
    pdf,
    onlyUniversity: readFormString(formData, "onlyUniversity") !== "false",
    importKind,
    targetDistance,
    targetGroup
  };
}

export function parseImportCommitPayload(value: unknown): ImportCommitPayload {
  const payload = readObject(value, "取込データ");
  const importKind = readEnum(payload.importKind, ["entry", "result", "ekiden"], "取込種別") as ImportKind;
  const metadata = parseMetadata(payload.metadata);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const teamRows = Array.isArray(payload.teamRows) ? payload.teamRows : [];
  if (importKind === "ekiden") {
    if (rows.length === 0 && teamRows.length === 0) {
      throw new Error("登録対象の区間記録または総合結果がありません。");
    }
  } else if (rows.length === 0) {
    throw new Error("登録対象の行が選択されていません。");
  }
  if (rows.length > MAX_ROWS || teamRows.length > MAX_ROWS) {
    throw new Error(`一度に登録できる行数は${MAX_ROWS}件までです。`);
  }

  return {
    importKind,
    metadata,
    rows: rows.map((row, index) => parseRow(row, index, importKind)),
    teamRows: teamRows.map((row, index) => parseTeamRow(row, index))
  };
}

function parseMetadata(value: unknown): ImportMetadata {
  const metadata = readObject(value, "大会・レース情報");
  const date = readString(metadata.date, "開催日", true);
  const startTime = readString(metadata.startTime, "開始時刻", true);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("開催日は YYYY-MM-DD 形式で入力してください。");
  }
  if (startTime && !/^\d{1,2}:\d{2}$/.test(startTime)) {
    throw new Error("開始時刻は HH:MM 形式で入力してください。");
  }

  return {
    meetId: readString(metadata.meetId, "大会ID"),
    meetName: readString(metadata.meetName, "大会名"),
    raceId: readString(metadata.raceId, "レースID"),
    raceName: readString(metadata.raceName, "レース名"),
    date,
    venue: readString(metadata.venue, "会場", true),
    distance: readEnum(metadata.distance, Array.from(distances), "種目") as ImportDistance,
    startTime,
    category: readEnum(metadata.category, ["track", "road", "ekiden"], "カテゴリ") as ImportMetadata["category"]
  };
}

function parseRow(value: unknown, index: number, importKind: ImportKind): ImportParsedRow {
  const row = readObject(value, `${index + 1}行目`);
  const athlete = readString(row.athlete, `${index + 1}行目の選手名`);
  const resultStatus = readEnum(
    row.resultStatus,
    Array.from(resultStatuses),
    `${athlete}の結果ステータス`
  ) as ImportResultStatus;
  const entryStatus =
    row.entryStatus === undefined || row.entryStatus === null || row.entryStatus === ""
      ? undefined
      : (readEnum(row.entryStatus, Array.from(entryStatuses), `${athlete}の掲載状態`) as ImportEntryStatus);
  if (importKind === "entry" && !entryStatus) {
    throw new Error(`${athlete}の掲載状態が未入力です。`);
  }

  return {
    sourceKey: readString(row.sourceKey, `${athlete}の照合キー`, true),
    rank: readString(row.rank, `${athlete}の順位`, true),
    bib: readString(row.bib, `${athlete}のBib`, true),
    athlete,
    year: readString(row.year, `${athlete}の学年`, true),
    university: readString(row.university, `${athlete}の大学名`),
    time: readString(row.time, `${athlete}の記録`, true),
    note: readString(row.note, `${athlete}の備考`, true),
    resultStatus,
    entryStatus,
    section: readString(row.section, `${athlete}の区間`, true) || undefined,
    sectionDistance: readString(row.sectionDistance, `${athlete}の区間距離`, true) || undefined,
    matchStatus: readEnum(
      row.matchStatus,
      Array.from(matchStatuses),
      `${athlete}の照合状態`
    ) as ImportMatchStatus,
    athleteId: readString(row.athleteId, `${athlete}の選手ID`),
    universityId: readString(row.universityId, `${athlete}の大学ID`),
    sourceMatches: readFiniteNumber(row.sourceMatches, `${athlete}の照合入力数`)
  };
}

function parseTeamRow(value: unknown, index: number): ImportTeamResultRow {
  const row = readObject(value, `総合${index + 1}行目`);
  const university = readString(row.university, `総合${index + 1}行目の大学名`);
  return {
    resultType: readEnum(row.resultType, Array.from(teamResultTypes), `${university}の種別`) as ImportTeamResultRow["resultType"],
    rank: readString(row.rank, `${university}の順位`, true),
    university,
    time: readString(row.time, `${university}の記録`, true),
    status: readEnum(row.status, Array.from(resultStatuses), `${university}の状態`) as ImportResultStatus,
    note: readString(row.note, `${university}の備考`, true),
    matchStatus: readEnum(row.matchStatus, Array.from(matchStatuses), `${university}の照合状態`) as ImportMatchStatus,
    universityId: readString(row.universityId, `${university}の大学ID`)
  };
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}が不正です。`);
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, label: string, optional = false) {
  if (value === undefined || value === null) {
    if (optional) return "";
    throw new Error(`${label}が未入力です。`);
  }
  if (typeof value !== "string") throw new Error(`${label}が不正です。`);
  const result = value.trim();
  if (!optional && !result) throw new Error(`${label}が未入力です。`);
  return result;
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readEnum(value: unknown, allowed: readonly string[], label: string) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${label}が不正です。`);
  }
  return value;
}

function readFiniteNumber(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}が不正です。`);
  }
  return value;
}
