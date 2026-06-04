import type { PbDistance } from "./personalBests";

export type ResultStatus = "result_published";

export type ResultCategory = "track" | "road" | "ekiden";

export type ResultNote = "PB" | "SB" | "DNS" | "DNF" | "DQ";

export type WinnerType = "athlete" | "team";

export type ResultRecord = {
  result_id: string;
  meet_id: string;
  race_id: string;
  athlete_id: string;
  university_id: string;
  distance: PbDistance;
  date: string;
  rank: string;
  time: string;
  note?: ResultNote;
  status: "finished" | "dns" | "dnf" | "dq";
  is_pb?: boolean;
};

export type ResultSummary = {
  result_id: string;
  meet_id: string;
  meet_name: string;
  race_id: string;
  race_name: string;
  date: string;
  venue: string;
  category: ResultCategory;
  status: ResultStatus;
  winner_type: WinnerType;
  winner_athlete_id: string;
  winner_name: string;
  winner_university_id: string;
  winner_university_name: string;
  winner_time: string;
  distance: PbDistance;
  pb_count: number;
  dns_count: number;
  result_count: number;
  notes: ResultNote[];
};

export const resultRecords: ResultRecord[] = [
  {
    result_id: "kanto-1500m-mens-1500m-final-saeki",
    meet_id: "kanto-1500m",
    race_id: "mens-1500m-final",
    athlete_id: "saeki",
    university_id: "aoba",
    distance: "1500m",
    date: "2026-06-02",
    rank: "1位",
    time: "3:48.20",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-saeki",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "saeki",
    university_id: "aoba",
    distance: "10000m",
    date: "2026-05-24",
    rank: "1位",
    time: "28:28.90",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-hirai",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "hirai",
    university_id: "tohto",
    distance: "10000m",
    date: "2026-05-24",
    rank: "2位",
    time: "28:41.12",
    note: "SB",
    status: "finished"
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-yoshioka",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "yoshioka",
    university_id: "surugadai",
    distance: "10000m",
    date: "2026-05-24",
    rank: "3位",
    time: "28:52.08",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-kurihara",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "kurihara",
    university_id: "surugadai",
    distance: "10000m",
    date: "2026-05-24",
    rank: "4位",
    time: "29:01.55",
    note: "SB",
    status: "finished"
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-oda",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "oda",
    university_id: "josai",
    distance: "10000m",
    date: "2026-05-24",
    rank: "5位",
    time: "29:08.44",
    status: "finished"
  },
  {
    result_id: "kanto-10000m-mens-10000m-3-mizushima",
    meet_id: "kanto-10000m",
    race_id: "mens-10000m-3",
    athlete_id: "mizushima",
    university_id: "aoba",
    distance: "10000m",
    date: "2026-05-24",
    rank: "DNS",
    time: "DNS",
    note: "DNS",
    status: "dns"
  },
  {
    result_id: "kanto-5000m-final-mens-5000m-final-saeki",
    meet_id: "kanto-5000m-final",
    race_id: "mens-5000m-final",
    athlete_id: "saeki",
    university_id: "aoba",
    distance: "5000m",
    date: "2026-05-18",
    rank: "1位",
    time: "13:42.18",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "hakone-qualifier-trial-half-final-morino",
    meet_id: "hakone-qualifier-trial",
    race_id: "half-final",
    athlete_id: "morino",
    university_id: "josai",
    distance: "ハーフ",
    date: "2026-05-18",
    rank: "1位",
    time: "1:02:48",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "spring-open-5000m-2-saeki",
    meet_id: "spring-open",
    race_id: "spring-open-5000m-2",
    athlete_id: "saeki",
    university_id: "aoba",
    distance: "5000m",
    date: "2026-04-20",
    rank: "2組1着",
    time: "13:42.18",
    note: "PB",
    status: "finished",
    is_pb: true
  },
  {
    result_id: "winter-half-saeki",
    meet_id: "winter-half",
    race_id: "winter-half",
    athlete_id: "saeki",
    university_id: "aoba",
    distance: "ハーフ",
    date: "2026-02-08",
    rank: "12位",
    time: "1:03:55",
    note: "PB",
    status: "finished",
    is_pb: true
  }
];

export const resultSummaries: ResultSummary[] = [
  {
    result_id: "kanto-1500m-mens-1500m-final",
    meet_id: "kanto-1500m",
    meet_name: "関東学生1500m記録会",
    race_id: "mens-1500m-final",
    race_name: "男子1500m 決勝",
    date: "2026-06-02",
    venue: "駒沢オリンピック公園陸上競技場",
    category: "track",
    status: "result_published",
    winner_type: "athlete",
    winner_athlete_id: "saeki",
    winner_name: "佐伯 蒼",
    winner_university_id: "aoba",
    winner_university_name: "早稲田",
    winner_time: "3:48.20",
    distance: "1500m",
    pb_count: 1,
    dns_count: 0,
    result_count: 1,
    notes: ["PB"]
  },
  {
    result_id: "kanto-10000m-mens-10000m-3",
    meet_id: "kanto-10000m",
    meet_name: "関東学生10000m記録挑戦会",
    race_id: "mens-10000m-3",
    race_name: "男子10000m 3組",
    date: "2026-05-24",
    venue: "町田GIONスタジアム",
    category: "track",
    status: "result_published",
    winner_type: "athlete",
    winner_athlete_id: "saeki",
    winner_name: "佐伯 蒼",
    winner_university_id: "aoba",
    winner_university_name: "早稲田",
    winner_time: "28:28.90",
    distance: "10000m",
    pb_count: 2,
    dns_count: 1,
    result_count: 6,
    notes: ["PB", "DNS"]
  },
  {
    result_id: "kanto-5000m-final-mens-5000m-final",
    meet_id: "kanto-5000m-final",
    meet_name: "関東学生5000m決勝",
    race_id: "mens-5000m-final",
    race_name: "男子5000m 決勝",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "track",
    status: "result_published",
    winner_type: "athlete",
    winner_athlete_id: "saeki",
    winner_name: "佐伯 蒼",
    winner_university_id: "aoba",
    winner_university_name: "早稲田",
    winner_time: "13:42.18",
    distance: "5000m",
    pb_count: 1,
    dns_count: 0,
    result_count: 1,
    notes: ["PB"]
  },
  {
    result_id: "hakone-qualifier-trial-half-final",
    meet_id: "hakone-qualifier-trial",
    meet_name: "箱根駅伝予選会プレ記録会",
    race_id: "half-final",
    race_name: "ハーフマラソン 決勝",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "road",
    status: "result_published",
    winner_type: "athlete",
    winner_athlete_id: "morino",
    winner_name: "森野 健太",
    winner_university_id: "josai",
    winner_university_name: "駒澤",
    winner_time: "1:02:48",
    distance: "ハーフ",
    pb_count: 1,
    dns_count: 0,
    result_count: 1,
    notes: ["PB", "DNS"]
  }
];

export const resultCategoryLabels: Record<ResultCategory, string> = {
  track: "トラック",
  road: "ロード",
  ekiden: "駅伝"
};

export const universityResultGroups = [
  {
    university_id: "aoba",
    university_name: "早稲田",
    accent: "#b3263a",
    results: [
      { date: "2026-06-02", athlete_name: "佐伯 蒼", distance: "1500m", time: "3:48.20" },
      { date: "2026-05-24", athlete_name: "佐伯 蒼", distance: "10000m", time: "28:28.90" },
      { date: "2026-05-18", athlete_name: "佐伯 蒼", distance: "5000m", time: "13:42.18" }
    ]
  },
  {
    university_id: "surugadai",
    university_name: "青山学院",
    accent: "#158b63",
    results: [{ date: "2026-05-24", athlete_name: "吉岡 連", distance: "10000m", time: "28:52.08" }]
  },
  {
    university_id: "josai",
    university_name: "駒澤",
    accent: "#5b3c99",
    results: [{ date: "2026-05-18", athlete_name: "森野 健太", distance: "ハーフ", time: "1:02:48" }]
  }
];

export function getResultsByRaceId(raceId: string) {
  return resultRecords.filter((result) => result.race_id === raceId);
}

export function getResultsByMeetId(meetId: string) {
  return resultRecords.filter((result) => result.meet_id === meetId);
}

export function getResultsByAthleteId(athleteId: string) {
  return resultRecords.filter((result) => result.athlete_id === athleteId);
}

export function getResultsByUniversityId(universityId: string) {
  return resultRecords.filter((result) => result.university_id === universityId);
}
