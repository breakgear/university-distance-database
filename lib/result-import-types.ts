export type ImportSource = "url" | "text" | "pdf";
export type ImportKind = "result" | "entry" | "ekiden";
export type ImportGroup = "" | `${number}組`;
export type ImportMatchStatus = "matched" | "new" | "warning";
export type ImportDistance = "1500m" | "3000mSC" | "5000m" | "10000m" | "ハーフ" | "駅伝";
export type ImportResultStatus = "finished" | "dns" | "dnf" | "dq";
export type ImportEntryStatus = "listed" | "unconfirmed";
export type ImportTeamResultType = "総合" | "往路" | "復路";

export type ImportMetadata = {
  meetId: string;
  meetName: string;
  raceId: string;
  raceName: string;
  date: string;
  venue: string;
  distance: ImportDistance;
  startTime: string;
  category: "track" | "road" | "ekiden";
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
  section?: string;
  sectionDistance?: string;
  matchStatus: ImportMatchStatus;
  athleteId: string;
  universityId: string;
  sourceMatches: number;
};

export type ImportTeamResultRow = {
  resultType: ImportTeamResultType;
  rank: string;
  university: string;
  time: string;
  status: ImportResultStatus;
  note: string;
  matchStatus: ImportMatchStatus;
  universityId: string;
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
  teamRows: ImportTeamResultRow[];
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
  teamRows?: ImportTeamResultRow[];
};
