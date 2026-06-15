import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { previewImport } from "./result-import-commit";
import type {
  ImportAnalysis,
  ImportDateCandidate,
  ImportDistance,
  ImportGroup,
  ImportKind,
  ImportMetadata,
  ImportParsedRow,
  ImportResultStatus,
  ImportSource,
  ImportSourceResult,
  ImportTeamResultRow,
  ImportTeamResultType
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
  entryStatus?: "listed" | "unconfirmed";
  section?: string;
  sectionDistance?: string;
};

type RawTeamRow = {
  resultType: ImportTeamResultType;
  rank: string;
  university: string;
  time: string;
  status: ImportResultStatus;
  note: string;
};

type ParsedSource = {
  source: ImportSource;
  metadata: Partial<ImportMetadata>;
  rows: RawRow[];
  preview: string;
  warning?: string;
};

type CsvRecord = Record<string, string>;
type ReferenceRecords = {
  universities: CsvRecord[];
  athletes: CsvRecord[];
  meets: CsvRecord[];
  races: CsvRecord[];
  entries: CsvRecord[];
  results: CsvRecord[];
  personalBests: CsvRecord[];
};

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
  慶應義塾大: "慶應義塾",
  関西学院大: "関西学院"
};

const universityIdOverrides: Record<string, string> = {
  関西学院: "kwansei-gakuin"
};

export async function analyzeImportSources(input: {
  url?: string;
  text?: string;
  pdf?: File | null;
  onlyUniversity?: boolean;
  importKind?: ImportKind;
  targetDistance?: ImportDistance;
  targetGroup?: ImportGroup;
}): Promise<ImportAnalysis> {
  const parsedSources: ParsedSource[] = [];
  const importKind = input.importKind ?? "result";
  const targetDistance = input.targetDistance ?? "5000m";
  const targetGroup = input.targetGroup ?? "";
  const records = await loadReferenceRecords();

  if (importKind === "ekiden") {
    const text = input.text?.trim();
    if (!text) {
      throw new Error("駅伝は［区間］と［総合］を含むテキストを貼り付けてください。");
    }
    return buildEkidenAnalysis(text, records, Boolean(input.onlyUniversity));
  }

  if (input.url?.trim()) {
    parsedSources.push(await parseUrlSource(input.url.trim(), importKind, targetDistance, targetGroup, records));
  }
  if (input.text?.trim()) {
    parsedSources.push(
      importKind === "entry"
        ? parseEntrySource(input.text.trim(), "text", targetDistance, targetGroup, records)
        : parseTextSource(input.text.trim(), "text")
    );
  }
  if (input.pdf && input.pdf.size > 0) {
    parsedSources.push(await parsePdfSource(input.pdf, importKind, targetDistance, targetGroup, records));
  }

  if (parsedSources.length < 2) {
    throw new Error("URL・コピペ・PDFのうち、内容がある入力を2つ以上指定してください。");
  }

  const groupPdfSource =
    importKind === "entry" && targetGroup
      ? parsedSources.find((source) => source.source === "pdf" && source.rows.length > 0)
      : undefined;
  const primary = groupPdfSource ?? [...parsedSources].sort((a, b) => b.rows.length - a.rows.length)[0];
  if (!primary || primary.rows.length === 0) {
    throw new Error(
      importKind === "entry"
        ? "エントリー行を解析できませんでした。対象種目を確認し、一覧を含むページ・テキスト・PDFを指定してください。"
        : "結果行を解析できませんでした。表の見出しから最終行までを貼り付けてください。"
    );
  }

  const metadata = resolveMetadata(parsedSources, records);
  const dateCandidates = collectDateCandidates(parsedSources);
  const rows = primary.rows
    .filter((row) => !input.onlyUniversity || looksLikeUniversity(row.university, records.universities))
    .map((row) => matchRow(row, parsedSources, records, importKind));
  const completeMatches = rows.filter((row) => row.sourceMatches === parsedSources.length).length;
  const warnings = rows.filter((row) => row.sourceMatches < parsedSources.length || row.matchStatus !== "matched").length;

  return {
    importKind,
    targetGroup,
    metadata,
    dateCandidates,
    rows,
    teamRows: [],
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
    files: (await previewImport({ importKind, metadata, rows })).files,
    warnings: [
      ...parsedSources.flatMap((source) => (source.warning ? [source.warning] : [])),
      ...(dateCandidates.length > 1 && dateCandidates[0].date !== dateCandidates[1].date
        ? ["開催日候補が複数あります。CSV更新前に大会・レース情報で開催日を確認してください。"]
        : []),
      ...(warnings > 0 ? [`${warnings}件は入力間の差異または未登録IDがあります。`] : [])
    ]
  };
}

async function buildEkidenAnalysis(
  text: string,
  records: ReferenceRecords,
  onlyUniversity: boolean
): Promise<ImportAnalysis> {
  const parsed = parseEkidenSource(text);
  if (parsed.sectionRows.length === 0 && parsed.teamRows.length === 0) {
    throw new Error("駅伝の区間記録・総合結果を解析できませんでした。［区間］と［総合］の見出しと、タブ区切りの行を貼り付けてください。");
  }

  const pseudoSource: ParsedSource = {
    source: "text",
    metadata: parsed.metadata,
    rows: parsed.sectionRows,
    preview: parsed.preview
  };
  const metadata: ImportMetadata = {
    ...resolveMetadata([pseudoSource], records),
    distance: "駅伝",
    category: "ekiden"
  };

  const rows = parsed.sectionRows
    .filter((row) => !onlyUniversity || looksLikeUniversity(row.university, records.universities))
    .map((row) => matchRow(row, [pseudoSource], records, "ekiden"));
  const teamRows = parsed.teamRows.map((row) => matchTeamRow(row, records));

  const newRows = rows.filter((row) => row.matchStatus === "new").length;
  const newTeams = teamRows.filter((row) => row.matchStatus === "new").length;

  return {
    importKind: "ekiden",
    targetGroup: "",
    metadata,
    dateCandidates: collectDateCandidates([pseudoSource]),
    rows,
    teamRows,
    sources: [
      {
        source: "text",
        label: "コピペから取得",
        preview: parsed.preview.slice(0, 12000),
        rowCount: parsed.sectionRows.length,
        warning: undefined
      }
    ],
    crossCheck: {
      sourceCount: 1,
      completeMatches: rows.length - newRows,
      warnings: newRows + newTeams,
      details: [`区間: ${rows.length}件`, `総合: ${teamRows.length}件`]
    },
    files: (await previewImport({ importKind: "ekiden", metadata, rows, teamRows })).files,
    warnings:
      newRows + newTeams > 0
        ? [`${newRows + newTeams}件は未登録の選手・大学です。反映前に確認してください。`]
        : []
  };
}

export function parseEkidenSource(text: string): {
  metadata: Partial<ImportMetadata>;
  sectionRows: RawRow[];
  teamRows: RawTeamRow[];
  preview: string;
} {
  const normalized = htmlToText(text).normalize("NFKC").replace(/\r\n?/g, "\n");
  const rawLines = normalized.split("\n");
  const sectionRows: RawRow[] = [];
  const teamRows: RawTeamRow[] = [];
  const headerLines: string[] = [];
  let mode: "header" | "section" | "team" = "header";

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[[［「]?\s*区間/.test(line)) {
      mode = "section";
      continue;
    }
    if (/^[[［「]?\s*総合(成績|結果)?\s*[\]］」]?$/.test(line) || /^[[［「]\s*総合/.test(line)) {
      mode = "team";
      continue;
    }

    const cells = line.split(/\t|\s{2,}/).map((cell) => cell.trim()).filter(Boolean);

    if (mode === "team" || /^(総合|往路|復路)\b/.test(line)) {
      const teamRow = parseEkidenTeamCells(cells);
      if (teamRow) teamRows.push(teamRow);
      continue;
    }

    if (mode === "section" || /\d+\s*区/.test(cells[0] ?? "")) {
      const sectionRow = parseEkidenSectionCells(cells);
      if (sectionRow) {
        sectionRows.push(sectionRow);
        continue;
      }
    }

    if (mode === "header") headerLines.push(line);
  }

  const headerText = headerLines.join("\n");
  const raceLine = headerLines.find((line) => /駅伝|区間|往路|復路/.test(line));
  const meetLine = headerLines.find((line) => /(?:大会|選手権|駅伝|記録会)/.test(line));
  const venueMatch = headerText.match(/(?:競技場名|会場|コース)[:：]\s*([^\n]+)/);

  return {
    metadata: {
      meetName: meetLine ?? headerLines[0] ?? "",
      raceName: raceLine ?? meetLine ?? headerLines[0] ?? "",
      date: extractEventDate(headerText, [meetLine ?? "", raceLine ?? ""].filter(Boolean)),
      venue: venueMatch?.[1]?.trim() ?? "",
      distance: "駅伝"
    },
    sectionRows,
    teamRows,
    preview: normalized
  };
}

function parseEkidenSectionCells(cells: string[]): RawRow | null {
  if (cells.length < 4) return null;
  const sectionCell = cells.find((cell) => /\d+\s*区|^アンカー$/.test(cell)) ?? cells[0];
  const section = (sectionCell.match(/\d+\s*区/)?.[0] ?? sectionCell).replace(/\s+/g, "");
  const distanceCell = cells.find((cell) => /\d+(?:\.\d+)?\s*km/i.test(cell)) ?? "";
  const sectionDistance = distanceCell.replace(/\s+/g, "");
  const timeCell = cells.find((cell) => /\d{1,2}:\d{2}(?::\d{2})?/.test(cell)) ?? "";
  const statusCell = cells.find((cell) => /\b(DNS|DNF|DQ|繰)\b|繰り上げ/.test(cell));
  const resultStatus = detectResultStatus(statusCell ?? timeCell);
  const rankCell = cells.find((cell) => /^\d+$/.test(cell)) ?? "";

  // 標準レイアウトは [区, 距離, 順位, 選手, 大学, 記録, (備考)]。
  // 記録（無ければ状態）の直前を大学、その前を選手とみなす。
  // これで大学が「早大」等の略称でも「早稲田」等の正式名でも取りこぼさず、末尾の備考列にも引っ張られない。
  const anchorCell = timeCell || statusCell || "";
  const anchorIndex = anchorCell ? cells.indexOf(anchorCell) : cells.length;
  let universityCell = anchorIndex >= 1 ? cells[anchorIndex - 1] : "";
  let athleteCell = anchorIndex >= 2 ? cells[anchorIndex - 2] : "";
  // アンカーが取れない（記録・状態が末尾でない）場合は、区・距離・順位を除いた残りで補完
  if (!universityCell || !athleteCell) {
    const used = new Set([sectionCell, distanceCell, timeCell, statusCell, rankCell].filter(Boolean) as string[]);
    const others = cells.filter((cell) => !used.has(cell));
    if (others.length >= 2) {
      athleteCell = others[0];
      universityCell = others[1];
    }
  }
  if (!athleteCell || !universityCell) return null;

  return {
    rank: resultStatus === "finished" ? rankCell : resultStatus.toUpperCase(),
    bib: "",
    athlete: normalizeSpaces(athleteCell),
    year: "学年未登録",
    university: normalizeSpaces(universityCell),
    time: resultStatus === "finished" ? normalizeTime(timeCell) : resultStatus.toUpperCase(),
    note: normalizeNote(cells.join(" ")) || (resultStatus === "finished" ? "" : resultStatus.toUpperCase()),
    resultStatus,
    section,
    sectionDistance
  };
}

function parseEkidenTeamCells(cells: string[]): RawTeamRow | null {
  if (cells.length < 3) return null;
  const typeCell = cells.find((cell) => /^(総合|往路|復路)$/.test(cell));
  const resultType = (typeCell ?? "総合") as ImportTeamResultType;
  const timeCell = cells.find((cell) => /\d{1,2}:\d{2}(?::\d{2})?/.test(cell)) ?? "";
  const statusCell = cells.find((cell) => /\b(DNS|DNF|DQ)\b/.test(cell));
  const status = detectResultStatus(statusCell ?? timeCell);
  const rankCell = cells.find((cell) => /^\d+$/.test(cell)) ?? "";
  // 大学名セル：種別・順位・記録・状態 以外の文字セル（総合は略称ではなく正式名のことが多い）
  const universityCell =
    cells.find(
      (cell) =>
        cell !== typeCell &&
        cell !== timeCell &&
        cell !== statusCell &&
        cell !== rankCell &&
        !/^\d+$/.test(cell) &&
        !/^(総合|往路|復路)$/.test(cell)
    ) ?? "";
  if (!universityCell) return null;

  return {
    resultType,
    rank: status === "finished" ? rankCell : status.toUpperCase(),
    university: normalizeSpaces(universityCell),
    time: status === "finished" ? normalizeTime(timeCell) : status.toUpperCase(),
    status,
    note: normalizeNote(cells.join(" "))
  };
}

function matchTeamRow(row: RawTeamRow, records: ReferenceRecords): ImportTeamResultRow {
  const normalizedUniversity = normalizeUniversity(row.university);
  const university = records.universities.find(
    (item) => normalizeLookup(normalizeUniversity(item.name)) === normalizeLookup(normalizedUniversity)
  );
  const universityId =
    university?.id ??
    universityIdOverrides[normalizedUniversity] ??
    createId("university", normalizedUniversity);

  return {
    resultType: row.resultType,
    rank: row.rank,
    university: normalizedUniversity || "大学未登録",
    time: row.time,
    status: row.status,
    note: row.note,
    matchStatus: university ? "matched" : "new",
    universityId
  };
}

async function parseUrlSource(
  url: string,
  importKind: ImportKind,
  targetDistance: ImportDistance,
  targetGroup: ImportGroup,
  records: ReferenceRecords
): Promise<ParsedSource> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("URLの形式が正しくありません。");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("URLは http または https で指定してください。");
  }

  const response = await safeRemoteFetch(parsedUrl);
  if (!response.ok) throw new Error(`URLの取得に失敗しました: HTTP ${response.status}`);

  const bytes = await readLimitedResponse(response, 20 * 1024 * 1024);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf") || bytes.subarray(0, 4).toString("ascii") === "%PDF") {
    return parsePdfBuffer(bytes, "url", importKind, targetDistance, targetGroup, records);
  }
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

  if (importKind === "entry") {
    const nishiEntry = await parseNishiUrlEntrySource(url, html, targetDistance);
    if (nishiEntry) return nishiEntry;
  }

  const parsed =
    importKind === "entry"
      ? parseEntrySource(htmlToText(html), "url", targetDistance, targetGroup, records)
      : { ...parseHtmlResult(html), source: "url" as const };
  return parsed;
}

async function parseNishiUrlEntrySource(
  url: string,
  body: string,
  targetDistance: ImportDistance
): Promise<ParsedSource | null> {
  const direct = parseNishiEntryJson(body, "url", targetDistance);
  if (direct) return direct;
  if (!/ResultTrackACtrl|ResultTrackA\.js/.test(body)) return null;

  const jsonUrl = new URL(url);
  if (!/\.html?$/i.test(jsonUrl.pathname)) return null;
  jsonUrl.pathname = jsonUrl.pathname.replace(/\.html?$/i, ".json");

  const response = await safeRemoteFetch(jsonUrl);
  if (!response.ok) return null;
  const bodyBytes = await readLimitedResponse(response, 5 * 1024 * 1024);
  return parseNishiEntryJson(bodyBytes.toString("utf8"), "url", targetDistance);
}

async function safeRemoteFetch(initialUrl: URL) {
  let current = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    await assertPublicRemoteUrl(current);
    const response = await fetch(current, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UniversityDistanceDatabase/1.0)" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000)
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    current = new URL(location, current);
  }
  throw new Error("URLのリダイレクト回数が多すぎます。");
}

async function assertPublicRemoteUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URLは http または https で指定してください。");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("ローカルネットワークのURLは取得できません。");
  }
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("ローカルまたはプライベートネットワークのURLは取得できません。");
  }
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  const parts = ipv4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

async function readLimitedResponse(response: Response, limit: number) {
  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > limit) throw new Error(`取得先のファイルは${Math.floor(limit / 1024 / 1024)}MB以下にしてください。`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > limit) throw new Error(`取得先のファイルは${Math.floor(limit / 1024 / 1024)}MB以下にしてください。`);
  return bytes;
}

export function parseNishiEntryJson(
  text: string,
  source: ImportSource,
  targetDistance: ImportDistance
): ParsedSource | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const document = data as {
    Title?: unknown;
    SubTitle?: unknown;
    ResultInfo?: Record<string, unknown>;
  };
  const groups = document.ResultInfo?.["1"];
  if (!Array.isArray(groups)) return null;

  const rows: RawRow[] = [];
  const previewLines = [
    String(document.Title ?? ""),
    String(document.SubTitle ?? "")
  ];

  for (const groupValue of groups) {
    if (!groupValue || typeof groupValue !== "object") continue;
    const group = groupValue as { Status?: unknown; ResultList?: unknown };
    previewLines.push(String(group.Status ?? ""));
    if (!Array.isArray(group.ResultList)) continue;

    for (const rowValue of group.ResultList) {
      if (!rowValue || typeof rowValue !== "object") continue;
      const row = rowValue as Record<string, unknown>;
      const athleteLines = htmlToText(String(row.KyogishaMei ?? ""))
        .split("\n")
        .map((value) => normalizeSpaces(value))
        .filter(Boolean);
      const universityLines = htmlToText(String(row.ShozokuMei ?? ""))
        .split("\n")
        .map((value) => normalizeSpaces(value))
        .filter(Boolean);
      const athleteValue = (athleteLines.at(-1) ?? "").normalize("NFKC");
      const university = universityLines[0] ?? "";
      const time = normalizeTime(String(row.PreKiroku ?? ""));
      const bib = normalizeSpaces(String(row.No ?? ""));
      if (!athleteValue || !university || !time || !bib) continue;

      const { name: athlete, year } = splitAthleteYear(athleteValue);
      rows.push({
        rank: normalizeSpaces(String(row.Lane ?? "")),
        bib,
        athlete,
        year,
        university,
        time,
        note: "",
        resultStatus: "finished",
        entryStatus: "listed"
      });
      previewLines.push(`${bib} ${athleteValue} ${university} ${time}`);
    }
  }

  const title = normalizeSpaces(String(document.Title ?? ""));
  const raceName = normalizeSpaces(String(document.SubTitle ?? ""));
  return {
    source,
    metadata: {
      meetName: "",
      raceName,
      date: extractEventDate(title, [raceName]),
      venue: "",
      distance: targetDistance
    },
    rows: dedupeEntryRows(rows),
    preview: previewLines.filter(Boolean).join("\n")
  };
}

async function parsePdfSource(
  file: File,
  importKind: ImportKind,
  targetDistance: ImportDistance,
  targetGroup: ImportGroup,
  records: ReferenceRecords
): Promise<ParsedSource> {
  return parsePdfBuffer(Buffer.from(await file.arrayBuffer()), "pdf", importKind, targetDistance, targetGroup, records);
}

async function parsePdfBuffer(
  buffer: Buffer,
  source: "url" | "pdf",
  importKind: ImportKind,
  targetDistance: ImportDistance,
  targetGroup: ImportGroup,
  records: ReferenceRecords
): Promise<ParsedSource> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const result = await pdfParse(buffer);
  let parsed: ParsedSource;
  if (importKind === "entry") {
    const fullDocument = parseEntrySource(result.text, source, targetDistance, "", records);
    if (targetGroup) {
      const groupText = await extractPdfGroupText(buffer, targetGroup);
      if (!groupText) {
        throw new Error(
          `PDF内で「${targetGroup}」の範囲を特定できませんでした。組を指定せずに解析するか、対象組だけをコピペしてください。`
        );
      }
      const selectedGroup = parseEntrySource(groupText, source, targetDistance, targetGroup, records);
      parsed = {
        ...selectedGroup,
        metadata: {
          ...fullDocument.metadata,
          raceName: selectedGroup.metadata.raceName,
          distance: targetDistance
        },
        preview: result.text
      };
    } else {
      parsed = fullDocument;
    }
  } else {
    parsed = parseTextSource(result.text, source);
  }
  return {
    ...parsed,
    warning:
      parsed.rows.length === 0
        ? "PDFから対象種目を抽出できませんでした。画像PDFの場合はコピペも併用してください。"
        : parsed.warning
  };
}

async function extractPdfGroupText(buffer: Buffer, targetGroup: ImportGroup) {
  const pdfjs = await import("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");
  const document = await pdfjs.getDocument(new Uint8Array(buffer)).promise;
  const selectedPages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .map((item) => ({
        text: normalizeSpaces(item.str),
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        width: (item as { width?: number }).width ?? 0
      }))
      .filter((item) => item.text);
    const selectedItems = selectPdfGroupItems(items, targetGroup);
    if (!selectedItems.length) continue;
    const rows = new Map<number, Array<{ text: string; x: number }>>();

    for (const item of selectedItems) {
      const rowKey = Math.round(item.y * 2) / 2;
      const row = rows.get(rowKey) ?? [];
      row.push({ text: item.text, x: item.x });
      rows.set(rowKey, row);
    }

    const pageText = Array.from(rows.entries())
      .sort(([left], [right]) => right - left)
      .map(([, row]) =>
        row
          .sort((left, right) => left.x - right.x)
          .map((item) => item.text)
          .join(" ")
      )
      .join("\n");
    if (pageText) selectedPages.push(pageText);
  }

  return selectedPages.length ? `${targetGroup}\n${selectedPages.join("\n")}` : "";
}

type PdfTextItem = { text: string; x: number; y: number; width: number };

export function selectPdfGroupItems(items: PdfTextItem[], targetGroup: ImportGroup) {
  const headings = findPdfGroupHeadings(items);
  const selected = headings.find((heading) => heading.text === targetGroup);
  if (!selected) return [];

  // 横方向の境界は同じ段の見出しだけで決め、上下段の同一x座標を混ぜない。
  const sameRow = headings
    .filter((heading) => Math.abs(heading.y - selected.y) <= 10)
    .sort((left, right) => left.x - right.x);
  const sameRowIndex = sameRow.findIndex(
    (heading) => heading.text === selected.text && Math.abs(heading.x - selected.x) < 2
  );
  const previous = sameRow[sameRowIndex - 1];
  const next = sameRow[sameRowIndex + 1];
  const minX = previous ? (previous.x + selected.x) / 2 : Number.NEGATIVE_INFINITY;
  const maxX = next ? (selected.x + next.x) / 2 : Number.POSITIVE_INFINITY;
  const nextVerticalHeading = headings
    .filter(
      (heading) =>
        heading.y < selected.y - 10 &&
        heading.x >= minX &&
        heading.x < maxX
    )
    .sort((left, right) => right.y - left.y)[0];
  const minY = nextVerticalHeading ? nextVerticalHeading.y + 8 : Number.NEGATIVE_INFINITY;

  return items.filter(
    (item) =>
      item.x >= minX &&
      item.x < maxX &&
      item.y <= selected.y + 8 &&
      item.y > minY
  );
}

function findPdfGroupHeadings(items: PdfTextItem[]) {
  const headings = items
    .map((item) => ({ ...item, text: item.text.replace(/\s/g, "") }))
    .filter((item) => /^\d+組$/.test(item.text));
  const rows = new Map<number, typeof items>();

  for (const item of items) {
    const rowKey = Math.round(item.y);
    const row = rows.get(rowKey) ?? [];
    row.push(item);
    rows.set(rowKey, row);
  }

  for (const row of Array.from(rows.values())) {
    const sorted = row.sort((left, right) => left.x - right.x);
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const number = sorted[index];
      const suffix = sorted[index + 1];
      const gap = suffix.x - (number.x + number.width);
      if (/^\d+$/.test(number.text) && suffix.text === "組" && gap >= -2 && gap <= 16) {
        headings.push({
          text: `${number.text}組`,
          x: number.x,
          y: number.y,
          width: suffix.x + suffix.width - number.x
        });
      }
    }
  }

  return headings
    .filter(
      (heading, index, values) =>
        values.findIndex(
          (candidate) =>
            candidate.text === heading.text &&
            Math.abs(candidate.x - heading.x) < 2 &&
            Math.abs(candidate.y - heading.y) < 2
        ) === index
    )
    .sort((left, right) => right.y - left.y || left.x - right.x);
}

function parseHtmlResult(html: string): Omit<ParsedSource, "source"> {
  const raceName = cleanText(extractTag(html, "h1"));
  const meetName = cleanText(extractTag(html, "h3").split("\n")[0]);
  const plain = htmlToText(html);
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
      date: extractEventDate(plain, [meetName, raceName]),
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

function parseTextSource(text: string, source: ImportSource): ParsedSource {
  if (/<tr\b/i.test(text) && /<td\b/i.test(text)) {
    return { ...parseHtmlResult(text), source };
  }

  const normalized = text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
  const lines = normalized.split("\n");
  const raceLine = lines.find((line) => /(?:1500|3000|5000|10000|ハーフ).*(?:決勝|総合|組)/i.test(line.normalize("NFKC")));
  const raceName = raceLine ? normalizeSpaces(raceLine) : "";
  const meetName =
    lines.find((line) => /(?:大会|選手権|記録会|インカレ|選考会)/.test(line) && line.trim() !== raceName)?.trim() ?? "";
  const venueMatch = normalized.match(/(?:競技場名|会場)[:：]\s*([^\n]+)/);
  const rows = parseTabularText(normalized);

  return {
    source,
    metadata: {
      meetName,
      raceName,
      date: extractEventDate(normalized, [meetName, raceName]),
      venue: venueMatch?.[1]?.trim() ?? "",
      distance: detectDistance(raceName || normalized.slice(0, 300))
    },
    rows,
    preview: normalized
  };
}

function parseEntrySource(
  text: string,
  source: ImportSource,
  targetDistance: ImportDistance,
  targetGroup: ImportGroup,
  records: ReferenceRecords
): ParsedSource {
  const normalized = htmlToText(text).normalize("NFKC").replace(/\r\n?/g, "\n");
  const allLines = normalized.split("\n").map((line) => normalizeSpaces(line)).filter(Boolean);
  const lines = selectMenEntrySection(allLines, targetDistance);
  const raceLine =
    allLines.find((line) => line.includes(targetDistance) && /(?:男子|エントリー|参加標準)/.test(line)) ?? "";
  const meetName =
    allLines.find((line) => /第?\d+回.*(?:大会|選手権)|日本陸上競技選手権大会/.test(line)) ??
    allLines.find((line) => /(?:大会|選手権|記録会|インカレ|選考会)/.test(line)) ??
    "";
  const date = extractEventDate(normalized, [meetName, raceLine]);
  const venueMatch = normalized.match(/(?:競技場名|会場)[:：]\s*([^\n]+)/);
  const rows: RawRow[] = [];
  const groupOrder = extractGroupOrder(lines);
  const groupSelection = selectTargetGroupLines(lines, targetGroup);
  const parseLines = groupSelection.lines;
  let skippedCandidateCount = 0;
  let skippedAmbiguousGroupCount = 0;

  for (let index = 0; index < parseLines.length; index += 1) {
    const originalLine = parseLines[index];
    const segmentSelection = selectParallelEntrySegments(
      originalLine,
      targetDistance,
      targetGroup,
      groupOrder,
      groupSelection.scoped
    );
    const candidateLines = segmentSelection.lines;
    if (segmentSelection.ambiguous) skippedAmbiguousGroupCount += 1;

    for (const line of candidateLines) {
      const time = extractEntryTime(line, targetDistance);
      const affiliation = findUniversityInEntryLine(line, records.universities);
      if (!affiliation) continue;
      if (!time) {
        if (/^\s*[◎★☆○●]?\s*\d+/.test(line)) skippedCandidateCount += 1;
        continue;
      }

      const beforeUniversity = normalizeSpaces(
        line.slice(0, affiliation.index).replace(/^[◎★☆○●]+/, "")
      );
      const prefixMatch = beforeUniversity.match(/^((?:\d+\s+){1,3})(.+)$/);
      const compactMatch = beforeUniversity.match(/^(\d+)\s*(.+)$/);
      if (!prefixMatch && !compactMatch) continue;
      const numericPrefix = prefixMatch?.[1].trim().split(/\s+/) ?? [compactMatch?.[1] ?? ""];
      const athleteValue = prefixMatch?.[2] ?? compactMatch?.[2] ?? "";
      const { name: athlete, year } = splitAthleteYear(athleteValue);
      if (!athlete || /^\d+$/.test(athlete) || extractEntryTime(athlete, targetDistance)) continue;

      const context = parseLines.slice(Math.max(0, index - 2), index).join(" ");
      const rank =
        numericPrefix[0] ??
        Array.from(context.matchAll(/(?:^|\s)(\d+)(?:\s|$)/g)).at(-1)?.[1] ??
        "";
      const unconfirmed = /キャンセル|出場不可|欠場/.test(context);
      rows.push({
        rank,
        bib: numericPrefix.at(-1) ?? "",
        athlete,
        year,
        university: affiliation.value,
        time,
        note: unconfirmed ? "要確認" : "",
        resultStatus: "finished",
        entryStatus: unconfirmed ? "unconfirmed" : "listed"
      });
    }
  }

  return {
    source,
    metadata: {
      meetName: normalizeSpaces(meetName),
      raceName: targetGroup
        ? `男子${targetDistance} ${targetGroup}`
        : `男子${targetDistance} エントリーリスト`,
      date,
      venue: venueMatch?.[1]?.trim() ?? "",
      distance: targetDistance
    },
    rows: dedupeEntryRows(rows),
    preview: normalized,
    warning:
      [
        skippedCandidateCount > 0
          ? `${skippedCandidateCount}行は大学名を検出しましたが、資格記録を解析できなかったため除外しました。`
          : "",
        skippedAmbiguousGroupCount > 0
          ? `${skippedAmbiguousGroupCount}行は複数組の横並び範囲で対象組を特定できなかったため除外しました。`
          : ""
      ].filter(Boolean).join(" ") || undefined
  };
}

export function selectMenEntrySection(lines: string[], distance: ImportDistance) {
  const normalizedDistance = distance.normalize("NFKC");
  const start = lines.findIndex((line) => {
    const normalized = line.normalize("NFKC");
    return normalized.includes(normalizedDistance) && /男子/.test(normalized);
  });
  if (start < 0) return lines;

  const end = lines.findIndex((line, index) => {
    if (index <= start) return false;
    const normalized = line.normalize("NFKC");
    if (/^女子/.test(normalized)) return true;
    return /^男子/.test(normalized) && !normalized.includes(normalizedDistance);
  });
  return lines.slice(start, end < 0 ? undefined : end);
}

function extractGroupOrder(lines: string[]): ImportGroup[] {
  const groups: ImportGroup[] = [];
  for (const line of lines) {
    for (const match of Array.from(line.matchAll(/(\d+)組/g))) {
      const group = `${match[1]}組` as ImportGroup;
      if (!groups.includes(group)) groups.push(group);
    }
  }
  return groups;
}

export function selectTargetGroupLines(lines: string[], targetGroup: ImportGroup) {
  if (!targetGroup) return { lines, scoped: true };

  const headingRows = lines
    .map((line, index) => ({
      index,
      groups: Array.from(line.matchAll(/(\d+)組/g), (match) => `${match[1]}組` as ImportGroup)
    }))
    .filter((row) => row.groups.length > 0);
  const targetHeading = headingRows.find((row) => row.groups.includes(targetGroup));
  if (!targetHeading) {
    throw new Error(
      `「${targetGroup}」の見出しを特定できませんでした。対象組だけを含むテキストを貼り付けるか、組指定なしで確認してください。`
    );
  }

  if (targetHeading.groups.length > 1) {
    return { lines, scoped: false };
  }

  const nextHeading = headingRows.find((row) => row.index > targetHeading.index);
  return {
    lines: lines.slice(targetHeading.index, nextHeading?.index),
    scoped: true
  };
}

export function extractEventDateCandidates(text: string, anchors: string[]) {
  const matches = Array.from(
    text.matchAll(/(20\d{2})[年\/-]\s*(\d{1,2})[月\/-]\s*(\d{1,2})日?/g)
  );
  if (!matches.length) return [];

  return matches.map((match) => {
    const index = match.index ?? 0;
    const context = text.slice(Math.max(0, index - 60), index + match[0].length + 60);
    const lineStart = text.lastIndexOf("\n", index) + 1;
    const nextLineBreak = text.indexOf("\n", index + match[0].length);
    const labelContext = text.slice(lineStart, nextLineBreak < 0 ? undefined : nextLineBreak);
    let score = 0;
    if (/(?:開催日|競技日|大会日|期日|日程)/.test(labelContext)) score += 100;
    if (/(?:申込|締切|期限|受付)/.test(labelContext)) score -= 150;
    for (const anchor of anchors.filter(Boolean)) {
      const anchorIndex = text.indexOf(anchor);
      if (anchorIndex >= 0) score += Math.max(0, 40 - Math.abs(anchorIndex - index) / 40);
    }
    return {
      date: `${match[1]}-${pad(match[2])}-${pad(match[3])}`,
      context: normalizeSpaces(context).slice(0, 140),
      score: Math.round(score)
    };
  }).sort((left, right) => right.score - left.score);
}

function extractEventDate(text: string, anchors: string[]) {
  const best = extractEventDateCandidates(text, anchors)[0];
  return best && best.score >= 0 ? best.date : "";
}

function collectDateCandidates(sources: ParsedSource[]): ImportDateCandidate[] {
  const candidates = sources.flatMap((source) =>
    extractEventDateCandidates(source.preview, [
      String(source.metadata.meetName ?? ""),
      String(source.metadata.raceName ?? "")
    ]).map((candidate) => ({ ...candidate, source: source.source }))
  );
  const byDate = new Map<string, ImportDateCandidate>();
  for (const candidate of candidates) {
    const current = byDate.get(candidate.date);
    if (!current || candidate.score > current.score) byDate.set(candidate.date, candidate);
  }
  return Array.from(byDate.values()).sort((left, right) => right.score - left.score).slice(0, 5);
}

export function selectParallelEntrySegments(
  line: string,
  distance: ImportDistance,
  targetGroup: ImportGroup,
  groupOrder: ImportGroup[],
  scopedToTargetGroup: boolean
) {
  const matches = Array.from(line.matchAll(entryTimePattern(distance, true)));
  if (matches.length <= 1) {
    return {
      lines: !targetGroup || scopedToTargetGroup ? [line] : [],
      ambiguous: Boolean(targetGroup && !scopedToTargetGroup && matches.length === 1)
    };
  }

  const segments: string[] = [];
  let start = 0;
  for (const match of matches) {
    const end = (match.index ?? 0) + match[0].length;
    segments.push(normalizeSpaces(line.slice(start, end)));
    start = end;
  }

  if (!targetGroup) return { lines: segments, ambiguous: false };
  const groupIndex = groupOrder.indexOf(targetGroup);
  return {
    lines: segments[groupIndex] ? [segments[groupIndex]] : [],
    ambiguous: groupIndex < 0 || !segments[groupIndex]
  };
}

export function extractEntryTime(line: string, distance: ImportDistance) {
  const value = line.match(entryTimePattern(distance))?.[1] ?? "";
  return value ? normalizeTime(value) : "";
}

function entryTimePattern(distance: ImportDistance, global = false) {
  const flags = global ? "g" : "";
  const trackTime = String.raw`(?:\d{1,2}:\d{2}(?:\.\d{1,3})?|\d{1,2}[′'’]\d{2}[″"”]\d{1,3}|\d{1,2}分\d{2}秒\d{1,3})`;
  const roadTime = String.raw`(?:(?:\d{1,2}:\d{2}:\d{2}|\d{2,3}:\d{2})(?:\.\d{1,3})?|\d{1,3}[′'’]\d{2}[″"”]\d{1,3}|\d{1,3}分\d{2}秒\d{1,3})`;
  const patterns: Record<ImportDistance, string> = {
    "1500m": String.raw`(?:^|[^\d:.])(${trackTime})(?=$|[^\d:.])`,
    "3000mSC": String.raw`(?:^|[^\d:.])(${trackTime})(?=$|[^\d:.])`,
    "5000m": String.raw`(?:^|[^\d:.])(${trackTime})(?=$|[^\d:.])`,
    "10000m": String.raw`(?:^|[^\d:.])(${trackTime})(?=$|[^\d:.])`,
    ハーフ: String.raw`(?:^|[^\d:.])(${roadTime})(?=$|[^\d:.])`,
    駅伝: String.raw`(?:^|[^\d:.])(${roadTime})(?=$|[^\d:.])`
  };
  return new RegExp(patterns[distance], flags);
}

export function findUniversityInEntryLine(line: string, universities: CsvRecord[]) {
  const candidates = new Map<string, string>();
  for (const university of universities) {
    const name = university.name?.trim();
    if (!name) continue;
    if (name.endsWith("大学")) {
      candidates.set(name, name);
      candidates.set(`${name.slice(0, -2)}大`, name);
    } else {
      candidates.set(`${name}大`, name);
    }
  }
  for (const [alias, name] of Object.entries(universityAliases)) candidates.set(alias, name);

  const registered = Array.from(candidates.entries())
    .sort(([left], [right]) => right.length - left.length)
    .map(([candidate, value]) => ({ candidate, index: line.indexOf(candidate), value }))
    .filter((match) => match.index > 0)
    .filter((match) => {
      const matchedText = line.slice(match.index, match.index + match.candidate.length);
      const suffix = line.slice(match.index + match.candidate.length);
      if (match.value === "日本" && line.includes("NTT西日本") && matchedText === "日本大") return false;
      if (/^(?:札幌高|付属高|附属高|高校|高等学校)/.test(suffix)) return false;
      return true;
    })
    .sort((left, right) => left.index - right.index)[0];
  if (registered) return registered;

  const inferred = Array.from(line.matchAll(/([^\s]+(?:大学|大))(?=\s|$)/g))
    .map((match) => ({
      candidate: match[1],
      index: match.index ?? -1,
      value: match[1]
    }))
    .filter((match) => match.index > 0)
    .filter((match) => !/^(?:大学|大)$/.test(match.candidate))
    .at(-1);
  return inferred;
}

function dedupeEntryRows(rows: RawRow[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${normalizeLookup(row.athlete)}|${normalizeLookup(row.university)}|${row.bib}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

export function parseTextRecord(record: string): RawRow | null {
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
  records: ReferenceRecords
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
    date: matchedMeet?.date || date,
    venue: pick("venue") || "",
    distance: pick("distance") || "5000m",
    startTime: pick("startTime") || "",
    category: (pick("distance") || "5000m") === "ハーフ" ? "road" : "track"
  };
}

function matchRow(
  row: RawRow,
  sources: ParsedSource[],
  records: ReferenceRecords,
  importKind: ImportKind
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
    source.rows.some((candidate) => rowsAgree(candidate, row, importKind))
  ).length;
  const universityId =
    university?.id ??
    universityIdOverrides[normalizedUniversity] ??
    createId("university", normalizedUniversity);
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

function rowsAgree(candidate: RawRow, row: RawRow, importKind: ImportKind) {
  const commonMatches =
    normalizeLookup(candidate.athlete) === normalizeLookup(row.athlete) &&
    normalizeLookup(normalizeUniversity(candidate.university)) ===
      normalizeLookup(normalizeUniversity(row.university)) &&
    candidate.bib === row.bib &&
    candidate.time === row.time;

  if (!commonMatches) return false;

  if (importKind === "entry") {
    return (candidate.entryStatus ?? "listed") === (row.entryStatus ?? "listed");
  }

  return (
    normalizeRank(candidate.rank) === normalizeRank(row.rank) &&
    candidate.resultStatus === row.resultStatus &&
    normalizeNote(candidate.note) === normalizeNote(row.note)
  );
}

function normalizeRank(value: string) {
  return value.normalize("NFKC").replace(/\s/g, "").replace(/位$/, "").toUpperCase();
}

async function loadReferenceRecords(): Promise<ReferenceRecords> {
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_IMPORT_STORAGE === "supabase") {
    const { loadSupabaseReferenceRecords } = await import("./supabase/import-storage");
    return loadSupabaseReferenceRecords();
  }

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
  const yearToken = match?.[2] ?? "";
  return {
    name: normalizeSpaces(match?.[1] ?? value),
    year: /^[1-6]$/.test(yearToken) ? `${yearToken}年` : "学年未登録"
  };
}

function detectDistance(value: string): ImportDistance {
  const normalized = value.normalize("NFKC").toLowerCase();
  if (normalized.includes("3000") && (normalized.includes("sc") || normalized.includes("障"))) return "3000mSC";
  if (normalized.includes("1500")) return "1500m";
  if (normalized.includes("10000")) return "10000m";
  if (normalized.includes("ハーフ") || normalized.includes("half")) return "ハーフ";
  return "5000m";
}

function normalizeTime(value: string) {
  const normalized = value.normalize("NFKC").trim();
  const quoteMatch = normalized.match(/^(\d{1,3})[′'’](\d{2})[″"”](\d{1,3})$/);
  if (quoteMatch) return `${quoteMatch[1]}:${quoteMatch[2]}.${quoteMatch[3]}`;
  const japaneseMatch = normalized.match(/^(\d{1,3})分(\d{2})秒(\d{1,3})$/);
  if (japaneseMatch) return `${japaneseMatch[1]}:${japaneseMatch[2]}.${japaneseMatch[3]}`;
  return normalized.replace(/[′'’]/g, ":").replace(/[″"”]/g, "").trim();
}

function toSeconds(value: string) {
  const numbers = value.split(":").map(Number);
  if (numbers.some(Number.isNaN)) return Number.POSITIVE_INFINITY;
  if (numbers.length === 3) return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  return numbers[0] * 60 + numbers[1];
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

export function createId(prefix: string, value: string) {
  const ascii = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const containsJapanese = /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
  if (ascii.length >= 4 && !containsJapanese) return ascii.slice(0, 72);
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
