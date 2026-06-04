export type EventStatus = "startlist" | "result" | "soon" | "waiting" | "live" | "scheduled";

export type RaceResult = {
  rank: number;
  university: string;
  athlete?: string;
  time: string;
  note?: string;
};

export type Event = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  venue: string;
  category: "トラック" | "駅伝" | "ロード";
  distance: string;
  status: EventStatus;
  summary: string;
  focus: string;
  universities: string[];
  startList: string[];
  results: RaceResult[];
};

export const events: Event[] = [
  {
    id: "kanto-10000m",
    name: "関東学生10000m記録挑戦会",
    shortName: "関東10000m",
    date: "2026-05-24",
    venue: "町田GIONスタジアム",
    category: "トラック",
    distance: "10000m",
    status: "startlist",
    summary: "10000mのスタートリスト、PB、大学別の出場選手、結果を確認できる大会です。",
    focus: "PB 28分台、1年生、大学別の出場選手",
    universities: ["青葉学院大", "駿河台体育大", "城西文化大", "東都国際大"],
    startList: ["佐伯 蒼", "森野 健太", "栗原 亮", "平井 悠真", "水嶋 航"],
    results: []
  },
  {
    id: "izumo-preview",
    name: "出雲駅伝選考記録会",
    shortName: "出雲選考",
    date: "2026-05-26",
    venue: "夢の島陸上競技場",
    category: "駅伝",
    distance: "5000m / 10000m",
    status: "soon",
    summary: "5000mと10000mの出場予定、選手PB、結果を確認できる記録会です。",
    focus: "5000m、10000m、出場予定選手",
    universities: ["武蔵野学院大", "藤沢経済大", "青葉学院大"],
    startList: ["中村 遥斗", "ヴィクター キマニ", "河合 俊介", "菅原 直"],
    results: []
  },
  {
    id: "hakone-qualifier-trial",
    name: "箱根駅伝予選会プレ記録会",
    shortName: "箱根予選プレ",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "ロード",
    distance: "ハーフマラソン",
    status: "result",
    summary: "ハーフマラソンの順位、記録、大学別の結果を確認できる大会です。",
    focus: "ハーフ記録、大学別結果、初ハーフ",
    universities: ["城西文化大", "東都国際大", "駿河台体育大"],
    startList: ["森野 健太", "平井 悠真", "小田 智也", "吉岡 連"],
    results: [
      { rank: 1, university: "城西文化大", athlete: "森野 健太", time: "1:02:48", note: "PB" },
      { rank: 2, university: "東都国際大", athlete: "平井 悠真", time: "1:03:02" },
      { rank: 3, university: "駿河台体育大", athlete: "吉岡 連", time: "1:03:21" }
    ]
  },
  {
    id: "kanto-5000m-final",
    name: "関東学生5000m決勝",
    shortName: "関東5000m",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "トラック",
    distance: "5000m",
    status: "result",
    summary: "5000m決勝の順位、記録、PB、大学別の結果を確認できるレースです。",
    focus: "5000m、PB、学年",
    universities: ["青葉学院大", "武蔵野学院大", "藤沢経済大"],
    startList: ["佐伯 蒼", "中村 遥斗", "西尾 大地"],
    results: [
      { rank: 1, university: "青葉学院大", athlete: "佐伯 蒼", time: "13:42.18", note: "PB" },
      { rank: 2, university: "武蔵野学院大", athlete: "中村 遥斗", time: "13:55.02" },
      { rank: 3, university: "藤沢経済大", athlete: "西尾 大地", time: "14:02.44" }
    ]
  },
  {
    id: "kanto-3000msc-final",
    name: "関東学生3000mSC決勝",
    shortName: "関東3000mSC",
    date: "2026-05-17",
    venue: "相模原ギオンスタジアム",
    category: "トラック",
    distance: "3000mSC",
    status: "result",
    summary: "3000mSC決勝の順位、記録、大学別の結果を確認できるレースです。",
    focus: "3000mSC、順位、記録",
    universities: ["駿河台体育大", "城西文化大", "東都国際大"],
    startList: ["吉岡 連", "小田 智也", "平井 悠真"],
    results: [
      { rank: 1, university: "駿河台体育大", athlete: "吉岡 連", time: "8:42.31" },
      { rank: 2, university: "城西文化大", athlete: "小田 智也", time: "8:48.90" },
      { rank: 3, university: "東都国際大", athlete: "平井 悠真", time: "8:51.27" }
    ]
  },
  {
    id: "night-5000m",
    name: "学生ナイトゲームズ5000m",
    shortName: "ナイト5000m",
    date: "2026-05-22",
    venue: "大井ふ頭中央海浜公園",
    category: "トラック",
    distance: "5000m",
    status: "waiting",
    summary: "5000mの出場予定、選手PB、結果待ちステータスを確認できる大会です。",
    focus: "5000m、出場予定、結果待ち",
    universities: ["青葉学院大", "武蔵野学院大", "藤沢経済大"],
    startList: ["佐伯 蒼", "中村 遥斗", "ヴィクター キマニ", "西尾 大地"],
    results: []
  },
  {
    id: "all-japan-prep",
    name: "全日本大学駅伝対校選考会",
    shortName: "全日本選考",
    date: "2026-06-15",
    venue: "浦和駒場スタジアム",
    category: "駅伝",
    distance: "10000m",
    status: "scheduled",
    summary: "全日本大学駅伝への出場権をかけた選考会。組ごとの戦略が重要です。",
    focus: "組配置、順位点、チーム4番手以降の底上げ",
    universities: ["駿河台体育大", "城西文化大", "武蔵野学院大", "東都国際大"],
    startList: [],
    results: []
  }
];
