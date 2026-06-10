import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  ImportAnalysis,
  ImportDistance,
  ImportMetadata,
  ImportParsedRow,
  ImportResultStatus,
  ImportSource,
  ImportSourceResult
} from "./result-import-types";

type RawRow = {
  rank: string;
  bib: string;
  athlete: string;
  year: string;
  university: string;
  time: string;
  note: string;
  resultStatus: ImportResultStatus;
};

type ParsedSource = {
  source: ImportSource;
  metadata: Partial<ImportMetadata>;
  rows: RawRow[];
  preview: string;
  warning?: string;
};

type CsvRecord = Record<string, string>;

const universityAliases: Record<string, string> = {
  早大: "早稲田",
  早稲田大: "早稲田",
  中大: "中央",
  中央大: "中央",
  青学大: "青山学院",
  青山学院大: "青山学院",
  駒大: "駒澤",
  駒澤大: "駒澤",
  順大: "順天堂",
  順天堂大: "順天堂",
  國學院大: "國學院",
  国学院大: "國學院",
  日大: "日本",
  日本大: "日本",
  駿大: "駿河台",
  駿河台大: "駿河台",
  東海大: "東海",
  山梨学大: "山梨学院",
  山梨学院大: "山梨学院",
  法大: "法政",
  日体大: "日本体育",
  大東大: "大東文化",
  国士大: "国士舘",
  城西大: "城西",
  東洋大: "東洋",
  明大: "明治",
  中央学大: "中央学院",
  中央学院大: "中央学院",
  東国大: "東京国際",
  慶大: "慶應義塾",
  慶應義塾大: "慶應義塾"
};

export async function analyzeImportSources(input: {
  url?: string;
  text?: string;
  pdf?: File | null;
  onlyUniversity?: boolean;
}): Promise<ImportAnalysis> {
  const parsedSources: ParsedSource[] = [];

  if (input.url?.trim()) parsedSources.push(await parseUrlSource(input.url.trim()));
  if (input.text?.trim()) parsedSources.push(parseTextSource(input.text.trim(), "text"));
  if (input.pdf && input.pdf.size > 0) parsedSources.push(await parsePdfSource(input.pdf));

  if (parsedSources.length < 2) {
    throw new Error("URL・コピペ・PDFのうち、内容がある入力を2つ以上指定してください。");
  }

  const primary = [...parsedSources].sort((a, b) => b.rows.length - a.rows.length)[0];
  if (!primary || primary.rows.length === 0) {
    throw new Error("結果行を解析できませんでした。表の見出しから最終行までを貼り付けてください。");
  }

  const records = loadReferenceRecords();
  const metadata = resolveMetadata(parsedSources, records);
  const rows = primary.rows
    .filter((row) => !input.onlyUniversity || looksLikeUniversity(row.university, records.universities))
    .map((row) => matchRow(row, parsedSources, records));
  const completeMatches = rows.filter((row) => row.sourceMatches === parsedSources.length).length;
  const warnings = rows.filter((row) => row.sourceMatches < parsedSources.length || row.matchStatus !== "matched").length;

  return {
    metadata,
    rows,
    sources: parsedSources.map(
      (source): ImportSourceResult => ({
        source: source.source,
        label: source.source === "url" ? "URLから取得" : source.source === "pdf" ? "PDFから取得" : "コピペから取得",
        preview: source.preview.slice(0, 12000),
        rowCount: source.rows.length,
        warning: source.warning
      })
    ),
    crossCheck: {
      sourceCount: parsedSources.length,
      completeMatches,
      warnings,
      details: parsedSources.map((source) => `${sourceLabel(source.source)}: ${source.rows.length}件`)
    },
    files: buildFileDiffs(metadata, rows, records),
    warnings: [
      ...parsedSources.flatMap((source) => (source.warning ? [source.warning] : [])),
      ...(warnings > 0 ? [`${warnings}件は入力間の差異または未登録IDがあります。`] : [])
    ]
  };
}

async function parseUrlSource(url: string): Promise<ParsedSource> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; UniversityDistanceDatabase/1.0)" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`URLの取得に失敗しました: HTTP ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const asciiHead = bytes.subarray(0, 2000).toString("latin1");
  const charset =
    contentType.match(/charset=([^;\s]+)/i)?.[1] ??
    asciiHead.match(/charset=["']?([^"'\s>]+)/i)?.[1] ??
    "utf-8";
  let html: string;
  try {
    html = new TextDecoder(normalizeCharset(charset)).decode(bytes);
  } catch {
    html = new TextDecoder("utf-8").decode(bytes);
  }

  const parsed = parseHtmlResult(html);
  return { ...parsed, source: "url" };
}

async function parsePdfSource(file: File): Promise<ParsedSource> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const result = await pdfParse(Buffer.from(await file.arrayBuffer()));
  const parsed = parseTextSource(result.text, "pdf");
  return {
    ...parsed,
    warning: parsed.rows.length === 0 ? "PDFから表を抽出できませんでした。画像PDFの場合はコピペ結果も併用してください。" : undefined
  };
}

function parseHtmlResult(html: string): Omit<ParsedSource, "source"> {
  const raceName = cleanText(extractTag(html, "h1"));
  const meetName = cleanText(extractTag(html, "h3").split("\n")[0]);
  const plain = htmlToText(html);
  const dateMatch = plain.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  const startMatch = plain.match(/(\d{1,2})時\s*(\d{1,2})分/);
  const venueMatch = plain.match(/競技場名[:：]\s*([^\n]+)/);
  const rows = Array.from(html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi))
    .map((match) => Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cleanText(htmlToText(cell[1]))))
    .filter((cells) => cells.length >= 7)
    .map(parseHtmlCells)
    .filter((row): row is RawRow => Boolean(row));

  return {
    metadata: {
      meetName,
      raceName,
      date: dateMatch ? `${dateMatch[1]}-${pad(dateMatch[2])}-${pad(dateMatch[3])}` : "",
      venue: venueMatch?.[1]?.trim() ?? "",
      distance: detectDistance(raceName),
      startTime: startMatch ? `${pad(startMatch[1])}:${pad(startMatch[2])}` : ""
    },
    rows,
    preview: plain
  };
}

function parseHtmlCells(cells: string[]): RawRow | null {
  const [rankCell, , bib, nameCell, , affiliationCell, timeCell, noteCell = ""] = cells;
  const note = normalizeNote(noteCell);
  const resultStatus = detectResultStatus(note || timeCell);
  if (!bib || !nameCell || (!timeCell && resultStatus === "finished")) return null;
  const { name, year } = splitAthleteYear(nameCell);

  return {
    rank: resultStatus === "finished" ? rankCell || "" : resultStatus.toUpperCase(),
    bib: bib.trim(),
    athlete: name,
    year,
    university: affiliationCell.split("\n")[0].trim(),
    time: resultStatus === "finished" ? normalizeTime(timeCell) : resultStatus.toUpperCase(),
    note: note || (resultStatus === "finished" ? "" : resultStatus.toUpperCase()),
    resultStatus
  };
}

function parseTextSource(text: string, source: "text" | "pdf"): ParsedSource {
  if (/<tr\b/i.test(text) && /<td\b/i.test(text)) {
    return { ...parseHtmlResult(text), source };
  }

  const normalized = text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
  const lines = normalized.split("\n");
  const raceLine = lines.find((line) => /(?:1500|5000|10000|ハーフ).*(?:決勝|総合|組)/i.test(line.normalize("NFKC")));
  const raceName = raceLine ? normalizeSpaces(raceLine) : "";
  const meetName =
    lines.find((line) => /(?:大会|選手権|記録会|インカレ|選考会)/.test(line) && line.trim() !== raceName)?.trim() ?? "";
  const dateMatch = normalized.match(/(20\d{2})[年\/-]\s*(\d{1,2})[月\/-]\s*(\d{1,2})日?/);
  const venueMatch = normalized.match(/(?:競技場名|会場)[:：]\s*([^\n]+)/);
  const rows = parseTabularText(normalized);

  return {
    source,
    metadata: {
      meetName,
      raceName,
      date: dateMatch ? `${dateMatch[1]}-${pad(dateMatch[2])}-${pad(dateMatch[3])}` : "",
      venue: venueMatch?.[1]?.trim() ?? "",
      distance: detectDistance(raceName || normalized.slice(0, 300))
    },
    rows,
    preview: normalized
  };
}

function parseTabularText(text: string): RawRow[] {
  const lines = text.split("\n");
  const records: string[] = [];
  let current = "";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const isStart =
      /^\s*\d+\t+\d+\t+\d+\t+/.test(line) ||
      /^\s*\t*\d+\t+\d+\t+.+\(\d+\)/.test(line) ||
      /^\s*(?:DNS|DNF|DQ)\s+/.test(line) ||
      /^\s*\d+\s+\d+\s+\d+\s+.+\(\d+\)/.test(line) ||
      /^\s*\d+\D.*\(\d+\)/.test(line);

    if (isStart && current) {
      records.push(current);
      current = line;
    } else if (isStart) {
      current = line;
    } else if (current) {
      current += `\t${line.trim()}`;
    }

    if (current && /(?:\d{1,2}:\d{2}\.\d{2}|DNS|DNF|DQ)(?:\s|$)/.test(current)) {
      records.push(current);
      current = "";
    }
  }
  if (current) records.push(current);

  return records.map(parseTextRecord).filter((row): row is RawRow => Boolean(row));
}

function parseTextRecord(record: string): RawRow | null {
  const compact = record.replace(/[　 ]+/g, " ").trim();
  const statusMatch = compact.match(/\b(DNS|DNF|DQ)\b/i);
  const timeMatch = compact.match(/(\d{1,2}:\d{2}\.\d{2})/);
  if (!statusMatch && !timeMatch) return null;

  const yearMatch = compact.match(/(.+?)\s*\((\d+)\)/);
  if (!yearMatch) return null;

  const prefix = yearMatch[1].trim().split(/\s+/);
  const numericPrefix = prefix.filter((part) => /^\d+$/.test(part));
  const bib = numericPrefix.at(-1) ?? "";
  const rank = statusMatch ? statusMatch[1].toUpperCase() : numericPrefix[0] ?? "";
  const afterName = compact.slice((yearMatch.index ?? 0) + yearMatch[0].length).trim();
  const beforeResult = afterName.split(timeMatch?.[0] ?? statusMatch?.[0] ?? "")[0].trim();
  const universityCandidates = beforeResult.split(/\t|\s{2,}/).filter(Boolean);
  const university = (
    universityCandidates.find((value) => /(?:大|大学)$/.test(value.trim())) ??
      beforeResult.match(/([^\s]+(?:大|大学))/)?.[1] ??
      ""
  ).trim();
  const resultStatus = detectResultStatus(statusMatch?.[1] ?? timeMatch?.[1] ?? "");
  const note = normalizeNote(compact.match(/(PB|SB|DNS|DNF|DQ)\b/gi)?.at(-1) ?? "");

  return {
    rank,
    bib,
    athlete: normalizeSpaces(yearMatch[1].replace(/^\d+(?:\s+\d+){1,2}\s+/, "").replace(/^\d+/, "")),
    year: `${yearMatch[2]}年`,
    university,
    time: resultStatus === "finished" ? normalizeTime(timeMatch?.[1] ?? "") : resultStatus.toUpperCase(),
    note: note || (resultStatus === "finished" ? "" : resultStatus.toUpperCase()),
    resultStatus
  };
}

function resolveMetadata(
  sources: ParsedSource[],
  records: ReturnType<typeof loadReferenceRecords>
): ImportMetadata {
  const pick = <K extends keyof ImportMetadata>(key: K) =>
    sources.map((source) => source.metadata[key]).find((value) => Boolean(value)) as ImportMetadata[K] | undefined;
  const meetName = pick("meetName") || "大会名未登録";
  const raceName = pick("raceName") || "レース名未登録";
  const date = pick("date") || "";
  const existingMeet = records.meets.find(
    (meet) => normalizeLookup(meet.meet_name) === normalizeLookup(meetName) || (date && meet.date === date && normalizeLookup(meet.meet_name).includes(normalizeLookup(meetName)))
  );
  const existingRaceOnDate = !existingMeet && date
    ? records.races.find(
        (race) =>
          normalizeLookup(race.race_name) === normalizeLookup(raceName) &&
          records.meets.some((meet) => meet.meet_id === race.meet_id && meet.date === date)
      )
    : undefined;
  const meetId = existingMeet?.meet_id ?? existingRaceOnDate?.meet_id ?? createId("meet", `${meetName}-${date}`);
  const existingRace = records.races.find(
    (race) => race.meet_id === meetId && normalizeLookup(race.race_name) === normalizeLookup(raceName)
  );
  const matchedMeet = existingMeet ?? records.meets.find((meet) => meet.meet_id === meetId);

  return {
    meetId,
    meetName: matchedMeet?.meet_name || meetName,
    raceId: existingRace?.race_id ?? createId("race", `${meetId}-${raceName}`),
    raceName: existingRace?.race_name || raceName,
    date,
    venue: pick("venue") || "",
    distance: pick("distance") || "5000m",
    startTime: pick("startTime") || "",
    category: (pick("distance") || "5000m") === "ハーフ" ? "road" : "track"
  };
}

function matchRow(
  row: RawRow,
  sources: ParsedSource[],
  records: ReturnType<typeof loadReferenceRecords>
): ImportParsedRow {
  const normalizedUniversity = normalizeUniversity(row.university);
  const university = records.universities.find(
    (item) => normalizeLookup(normalizeUniversity(item.name)) === normalizeLookup(normalizedUniversity)
  );
  const athlete = records.athletes.find(
    (item) =>
      normalizeLookup(item.name) === normalizeLookup(row.athlete) &&
      (!university || item.university_id === university.id)
  );
  const sourceKey = `${normalizeLookup(row.athlete)}|${row.bib}`;
  const sourceMatches = sources.filter((source) =>
    source.rows.some(
      (candidate) =>
        normalizeLookup(candidate.athlete) === normalizeLookup(row.athlete) &&
        (!candidate.bib || !row.bib || candidate.bib === row.bib) &&
        candidate.time === row.time &&
        candidate.resultStatus === row.resultStatus
    )
  ).length;
  const universityId = university?.id ?? createId("university", normalizedUniversity);
  const athleteId = athlete?.id ?? createId("athlete", `${row.athlete}-${universityId}`);

  return {
    ...row,
    sourceKey,
    university: normalizedUniversity || "大学未登録",
    matchStatus: athlete && university ? (sourceMatches === sources.length ? "matched" : "warning") : "new",
    athleteId,
    universityId,
    sourceMatches
  };
}

function buildFileDiffs(
  metadata: ImportMetadata,
  rows: ImportParsedRow[],
  records: ReturnType<typeof loadReferenceRecords>
) {
  const newUniversities = new Set(rows.filter((row) => !records.universities.some((item) => item.id === row.universityId)).map((row) => row.universityId));
  const newAthletes = rows.filter((row) => !records.athletes.some((item) => item.id === row.athleteId)).length;
  const newMeet = records.meets.some((item) => item.meet_id === metadata.meetId) ? 0 : 1;
  const newRace = records.races.some((item) => item.race_id === metadata.raceId) ? 0 : 1;
  const newEntries = rows.filter(
    (row) => !records.entries.some((item) => item.race_id === metadata.raceId && item.athlete_id === row.athleteId)
  ).length;
  const newResults = rows.filter(
    (row) => !records.results.some((item) => item.race_id === metadata.raceId && item.athlete_id === row.athleteId)
  ).length;
  const newPbs = rows.filter((row) => row.note === "PB" && !records.personalBests.some((item) => item.athlete_id === row.athleteId && item.distance === metadata.distance && item.time === row.time)).length;

  return [
    { name: "universities.csv", count: newUniversities.size, text: newUniversities.size ? "未登録大学を追加" : "既存大学を参照" },
    { name: "athletes.csv", count: newAthletes, text: newAthletes ? "未登録選手を追加" : "既存選手を参照" },
    { name: "meets.csv", count: newMeet, text: newMeet ? "大会を追加" : "大会情報を更新" },
    { name: "races.csv", count: newRace, text: newRace ? "レースを追加" : "レース情報を更新" },
    { name: "entries.csv", count: newEntries, text: "掲載選手を追加" },
    { name: "results.csv", count: newResults, text: "結果を追加" },
    { name: "personal_bests.csv", count: newPbs, text: "PBを追加・更新" }
  ];
}

function loadReferenceRecords() {
  const csvDir = path.join(process.cwd(), "csv");
  return {
    universities: parseCsvFile(path.join(csvDir, "universities.csv")),
    athletes: parseCsvFile(path.join(csvDir, "athletes.csv")),
    meets: parseCsvFile(path.join(csvDir, "meets.csv")),
    races: parseCsvFile(path.join(csvDir, "races.csv")),
    entries: parseCsvFile(path.join(csvDir, "entries.csv")),
    results: parseCsvFile(path.join(csvDir, "results.csv")),
    personalBests: parseCsvFile(path.join(csvDir, "personal_bests.csv"))
  };
}

function parseCsvFile(filePath: string): CsvRecord[] {
  const text = readFileSync(filePath, "utf8");
  const rows: string[][] = [];
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
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers = [], ...body] = rows;
  return body
    .filter((values) => values.some(Boolean))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function extractTag(html: string, tag: string) {
  return html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "";
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|h\d|tr|li|pre)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanText(value: string) {
  return normalizeSpaces(htmlToText(value).replace(/\n+/g, "\n")).trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function splitAthleteYear(value: string) {
  const match = value.match(/^(.*?)\s*\((\d+)\)\s*$/);
  return {
    name: normalizeSpaces(match?.[1] ?? value),
    year: match ? `${match[2]}年` : "学年未登録"
  };
}

function detectDistance(value: string): ImportDistance {
  const normalized = value.normalize("NFKC").toLowerCase();
  if (normalized.includes("1500")) return "1500m";
  if (normalized.includes("10000")) return "10000m";
  if (normalized.includes("ハーフ") || normalized.includes("half")) return "ハーフ";
  return "5000m";
}

function normalizeTime(value: string) {
  return value.normalize("NFKC").replace(/[′']/g, ":").replace(/[″"]/g, "").trim();
}

function normalizeNote(value: string) {
  const note = value.normalize("NFKC").toUpperCase();
  return ["PB", "SB", "DNS", "DNF", "DQ"].find((item) => note.includes(item)) ?? "";
}

function detectResultStatus(value: string): ImportResultStatus {
  const normalized = value.toUpperCase();
  if (normalized.includes("DNS") || normalized.includes("欠場")) return "dns";
  if (normalized.includes("DNF") || normalized.includes("途中棄権")) return "dnf";
  if (normalized.includes("DQ") || normalized.includes("失格")) return "dq";
  return "finished";
}

function normalizeUniversity(value: string) {
  const compact = normalizeSpaces(value).replace(/\n.*$/, "").trim();
  return universityAliases[compact] ?? compact.replace(/大学$/, "").replace(/大$/, "");
}

function looksLikeUniversity(value: string, universities: CsvRecord[]) {
  const normalized = normalizeUniversity(value);
  return Boolean(
    normalized &&
      (universities.some((item) => normalizeLookup(normalizeUniversity(item.name)) === normalizeLookup(normalized)) ||
        /(?:大|大学)$/.test(value.trim()) ||
        Object.prototype.hasOwnProperty.call(universityAliases, value.trim()))
  );
}

const radicalVariants: Record<string, string> = {
  "⻯": "竜",
  "⻄": "西",
  "⻑": "長",
  "⻘": "青",
  "⻩": "黄",
  "⻲": "亀",
  "⻤": "鬼",
  "⻫": "斉",
  "⻭": "歯",
  "⻝": "食"
};

function normalizeLookup(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[⻯⻄⻑⻘⻩⻲⻤⻫⻭⻝]/g, (char) => radicalVariants[char] ?? char)
    .replace(/[\s　・･]/g, "")
    .toLowerCase();
}

function normalizeSpaces(value: string) {
  return value.normalize("NFKC").replace(/[　\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

function createId(prefix: string, value: string) {
  const ascii = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (ascii.length >= 4) return ascii.slice(0, 72);
  return `${prefix}-${createHash("sha1").update(value).digest("hex").slice(0, 10)}`;
}

function normalizeCharset(charset: string) {
  const normalized = charset.toLowerCase().replace(/["']/g, "");
  if (["shift_jis", "shift-jis", "sjis", "windows-31j"].includes(normalized)) return "shift_jis";
  return normalized;
}

function pad(value: string) {
  return value.padStart(2, "0");
}

function sourceLabel(source: ImportSource) {
  return source === "url" ? "URL" : source === "pdf" ? "PDF" : "コピペ";
}

