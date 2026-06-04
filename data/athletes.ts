import { personalBests } from "./personalBests";
import { resultRecords } from "./results";

export type Athlete = {
  id: string;
  slug: string;
  name: string;
  year: string;
  universityId: string;
  hometown: string;
  specialty: string;
  profile: string;
  pb: {
    distance: string;
    time: string;
    date: string;
  }[];
  nextRace: string;
  recentResults: {
    event: string;
    date: string;
    distance: string;
    time: string;
    rank: string;
  }[];
  progress: {
    label: string;
    value: number;
    time: string;
  }[];
  ekiden: {
    race: string;
    section: string;
    result: string;
  }[];
};

export type AthleteRecord = {
  id: string;
  slug: string;
  name: string;
  year: string;
  universityId: string;
  hometown: string;
  specialty: string;
  profile: string;
  nextRace: string;
  progress: Athlete["progress"];
  ekiden: Athlete["ekiden"];
};

const raceNameById: Record<string, string> = {
  "mens-1500m-final": "関東学生1500m記録会 男子1500m 決勝",
  "mens-10000m-3": "関東学生10000m記録挑戦会 男子10000m 3組",
  "mens-5000m-final": "関東学生5000m決勝 男子5000m 決勝",
  "half-final": "箱根予選プレ記録会 ハーフマラソン 決勝",
  "spring-open-5000m-2": "春季オープン 5000m 2組",
  "winter-half": "冬季ハーフ記録会"
};

export const athleteRecords: AthleteRecord[] = [
  {
    id: "saeki",
    slug: "saeki-aoi",
    name: "佐伯 蒼",
    year: "3年",
    universityId: "aoba",
    hometown: "宮城",
    specialty: "5000m / 10000m",
    profile: "5000m、10000m、ハーフのPBと最近の結果を掲載しています。",
    nextRace: "男子5000m A組",
    progress: [
      { label: "2024春", value: 850, time: "14:10" },
      { label: "2024秋", value: 836, time: "13:56" },
      { label: "2025秋", value: 824, time: "13:44" },
      { label: "2026春", value: 822, time: "13:42" }
    ],
    ekiden: [
      { race: "出雲駅伝", section: "1区", result: "区間4位" },
      { race: "箱根駅伝", section: "3区", result: "区間7位" }
    ]
  },
  {
    id: "morino",
    slug: "morino-kenta",
    name: "森野 健太",
    year: "4年",
    universityId: "josai",
    hometown: "長野",
    specialty: "10000m / ハーフ",
    profile: "10000m、ハーフのPBと最近の結果を掲載しています。",
    nextRace: "箱根駅伝予選会プレ記録会",
    progress: [
      { label: "2024春", value: 3900, time: "1:05:00" },
      { label: "2024秋", value: 3838, time: "1:03:58" },
      { label: "2025冬", value: 3805, time: "1:03:25" },
      { label: "2026春", value: 3768, time: "1:02:48" }
    ],
    ekiden: [
      { race: "箱根駅伝予選会", section: "チーム2番手", result: "64位" },
      { race: "箱根駅伝", section: "9区", result: "区間8位" }
    ]
  },
  {
    id: "kimani",
    slug: "victor-kimani",
    name: "ヴィクター キマニ",
    year: "2年",
    universityId: "tohto",
    hometown: "ナイロビ",
    specialty: "5000m / 10000m",
    profile: "5000m、10000mのPBと最近の結果を掲載しています。",
    nextRace: "出雲駅伝選考記録会",
    progress: [
      { label: "2024秋", value: 824, time: "13:44" },
      { label: "2025春", value: 817, time: "13:37" },
      { label: "2025秋", value: 810, time: "13:30" },
      { label: "2026春", value: 808, time: "13:28" }
    ],
    ekiden: [
      { race: "全日本大学駅伝", section: "2区", result: "区間2位" },
      { race: "箱根駅伝", section: "2区", result: "区間3位" }
    ]
  },
  {
    id: "nakamura",
    slug: "nakamura-haruto",
    name: "中村 遥斗",
    year: "1年",
    universityId: "musashino",
    hometown: "福岡",
    specialty: "5000m / 10000m",
    profile: "5000m、10000mのPBと最近の結果を掲載しています。",
    nextRace: "出雲駅伝選考記録会",
    progress: [
      { label: "高3春", value: 852, time: "14:12" },
      { label: "高3冬", value: 844, time: "14:04" },
      { label: "大1春", value: 835, time: "13:55" }
    ],
    ekiden: [{ race: "高校駅伝", section: "1区", result: "区間12位" }]
  },
  {
    id: "yoshioka",
    slug: "yoshioka-ryo",
    name: "吉岡 遼",
    year: "2年",
    universityId: "surugadai",
    hometown: "神奈川",
    specialty: "5000m / 10000m",
    profile: "5000m、10000mのPBと最近の結果を掲載しています。",
    nextRace: "男子10000m 3組",
    progress: [
      { label: "2025春", value: 850, time: "14:10" },
      { label: "2025秋", value: 844, time: "14:04" },
      { label: "2026春", value: 838, time: "13:58" }
    ],
    ekiden: [{ race: "全日本大学駅伝", section: "4区", result: "区間9位" }]
  },
  {
    id: "hirai",
    slug: "hirai-yuma",
    name: "平井 悠真",
    year: "3年",
    universityId: "tohto",
    hometown: "埼玉",
    specialty: "10000m / ハーフ",
    profile: "10000m、ハーフのPBと最近の結果を掲載しています。",
    nextRace: "関東学生10000m記録挑戦会",
    progress: [
      { label: "2025春", value: 1765, time: "29:25" },
      { label: "2025秋", value: 1738, time: "28:58" },
      { label: "2026春", value: 1721, time: "28:41" }
    ],
    ekiden: [{ race: "箱根駅伝", section: "7区", result: "区間10位" }]
  },
  {
    id: "kawai",
    slug: "kawai-shunsuke",
    name: "河合 俊介",
    year: "3年",
    universityId: "fujisawa",
    hometown: "千葉",
    specialty: "5000m / 10000m",
    profile: "5000m、10000mのPBと最近の結果を掲載しています。",
    nextRace: "全日本大学駅伝対校選考会",
    progress: [
      { label: "2025春", value: 858, time: "14:18" },
      { label: "2025秋", value: 850, time: "14:10" },
      { label: "2026春", value: 842, time: "14:02" }
    ],
    ekiden: [{ race: "全日本大学駅伝", section: "6区", result: "区間11位" }]
  },
  {
    id: "mizushima",
    slug: "mizushima-wataru",
    name: "水嶋 航",
    year: "1年",
    universityId: "aoba",
    hometown: "東京",
    specialty: "5000m / 10000m",
    profile: "5000m、10000mのPBと最近の結果を掲載しています。",
    nextRace: "男子5000m A組",
    progress: [
      { label: "高3春", value: 860, time: "14:20" },
      { label: "高3冬", value: 852, time: "14:12" },
      { label: "大1春", value: 845, time: "14:05" }
    ],
    ekiden: [{ race: "高校駅伝", section: "3区", result: "区間15位" }]
  },
  {
    id: "takahashi",
    slug: "takahashi-hayate",
    name: "高橋 颯",
    year: "2年",
    universityId: "aoba",
    hometown: "静岡",
    specialty: "ハーフ",
    profile: "ハーフのPBと最近の結果を掲載しています。",
    nextRace: "男子5000m A組",
    progress: [
      { label: "2025春", value: 3905, time: "1:05:05" },
      { label: "2025冬", value: 3835, time: "1:03:55" }
    ],
    ekiden: [{ race: "大学駅伝記録会", section: "掲載なし", result: "掲載なし" }]
  },
  {
    id: "kurihara",
    slug: "kurihara-ryo",
    name: "栗原 亮",
    year: "4年",
    universityId: "surugadai",
    hometown: "群馬",
    specialty: "10000m",
    profile: "10000mのPBと最近の結果を掲載しています。",
    nextRace: "男子10000m 3組",
    progress: [],
    ekiden: []
  },
  {
    id: "oda",
    slug: "oda-tomoya",
    name: "小田 智也",
    year: "4年",
    universityId: "josai",
    hometown: "大阪",
    specialty: "10000m",
    profile: "10000mのPBと最近の結果を掲載しています。",
    nextRace: "男子10000m 3組",
    progress: [],
    ekiden: []
  },
  {
    id: "sugawara",
    slug: "sugawara-nao",
    name: "菅原 直",
    year: "2年",
    universityId: "musashino",
    hometown: "北海道",
    specialty: "5000m",
    profile: "5000mのPBを掲載しています。",
    nextRace: "学生ナイトゲームズ5000m",
    progress: [],
    ekiden: []
  },
  {
    id: "nishio",
    slug: "nishio-daichi",
    name: "西尾 大地",
    year: "2年",
    universityId: "fujisawa",
    hometown: "愛知",
    specialty: "5000m",
    profile: "5000mのPBを掲載しています。",
    nextRace: "全日本大学駅伝対校選考会",
    progress: [],
    ekiden: []
  }
];

export const athletes: Athlete[] = athleteRecords.map((athlete) => ({
  ...athlete,
  pb: personalBests
    .filter((record) => record.athlete_id === athlete.id)
    .map((record) => ({
      distance: record.distance,
      time: record.time,
      date: record.date
    })),
  recentResults: resultRecords
    .filter((result) => result.athlete_id === athlete.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((result) => ({
      event: raceNameById[result.race_id] ?? result.race_id,
      date: result.date,
      distance: result.distance,
      time: result.time,
      rank: result.rank
    }))
}));

export const athleteAliases: Record<string, string> = Object.fromEntries(athleteRecords.map((athlete) => [athlete.id, athlete.name]));

export function getAthleteById(id: string) {
  return athletes.find((athlete) => athlete.id === id);
}
