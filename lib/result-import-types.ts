export type ImportSource = "url" | "text" | "pdf";
export type ImportMatchStatus = "matched" | "new" | "warning";
export type ImportDistance = "1500m" | "5000m" | "10000m" | "ハーフ";
export type ImportResultStatus = "finished" | "dns" | "dnf" | "dq";

export type ImportMetadata = {
  meetId: string;
  meetName: string;
  raceId: string;
  raceName: string;
  date: string;
  venue: string;
  distance: ImportDistance;
  startTime: string;
  category: "track" | "road";
};

export type ImportParsedRow = {
  sourceKey: string;
  rank: string;
  bib: string;
  athlete: string;
  year: string;
  university: string;
  time: string;
  note: string;
  resultStatus: ImportResultStatus;
  matchStatus: ImportMatchStatus;
  athleteId: string;
  universityId: string;
  sourceMatches: number;
};

export type ImportSourceResult = {
  source: ImportSource;
  label: string;
  preview: string;
  rowCount: number;
  warning?: string;
};

export type ImportFileDiff = {
  name: string;
  count: number;
  text: string;
};

export type ImportAnalysis = {
  metadata: ImportMetadata;
  rows: ImportParsedRow[];
  sources: ImportSourceResult[];
  crossCheck: {
    sourceCount: number;
    completeMatches: number;
    warnings: number;
    details: string[];
  };
  files: ImportFileDiff[];
  warnings: string[];
};

export type ImportCommitPayload = {
  metadata: ImportMetadata;
  rows: ImportParsedRow[];
};

