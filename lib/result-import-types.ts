export type ImportSource = "url" | "text" | "pdf";
export type ImportKind = "result" | "entry";
export type ImportGroup = "" | `${number}組`;
export type ImportMatchStatus = "matched" | "new" | "warning";
export type ImportDistance = "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ";
export type ImportResultStatus = "finished" | "dns" | "dnf" | "dq";
export type ImportEntryStatus = "listed" | "unconfirmed";

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
  entryStatus?: ImportEntryStatus;
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

export type ImportDateCandidate = {
  date: string;
  context: string;
  score: number;
  source: ImportSource;
};

export type ImportFileDiff = {
  name: string;
  count: number;
  text: string;
  preview: string;
};

export type ImportAnalysis = {
  importKind: ImportKind;
  targetGroup: ImportGroup;
  metadata: ImportMetadata;
  dateCandidates: ImportDateCandidate[];
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
  importKind: ImportKind;
  metadata: ImportMetadata;
  rows: ImportParsedRow[];
};
