export type ScheduleCategory = "track" | "road" | "ekiden" | "international";
export type ScheduleDateStatus = "confirmed" | "approximate" | "unannounced";
export type ScheduleProgress = "completed" | "upcoming";

export type SeasonScheduleItem = {
  id: string;
  monthKey: string;
  dateLabel: string;
  sortDate: string;
  name: string;
  note: string;
  category: ScheduleCategory;
  dateStatus: ScheduleDateStatus;
  progress: ScheduleProgress;
};

export const scheduleCategoryLabels: Record<ScheduleCategory, string> = {
  track: "トラック",
  road: "ロード",
  ekiden: "駅伝",
  international: "国際大会"
};

export const scheduleDateStatusLabels: Record<ScheduleDateStatus, string> = {
  confirmed: "日程掲載",
  approximate: "時期目安",
  unannounced: "日程未発表"
};

export function getScheduleProgress(item: SeasonScheduleItem, now = new Date()): ScheduleProgress {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  return item.sortDate < today ? "completed" : "upcoming";
}

const scheduleItems: SeasonScheduleItem[] = [
  {
    id: "kanaguri-memorial",
    monthKey: "2026-04",
    dateLabel: "4月上旬",
    sortDate: "2026-04-01",
    name: "金栗記念選抜中長距離（熊本）",
    note: "終了・シーズン初戦",
    category: "track",
    dateStatus: "approximate",
    progress: "completed"
  },
  {
    id: "kanto-intercollege-half",
    monthKey: "2026-04",
    dateLabel: "4/5(日)",
    sortDate: "2026-04-05",
    name: "関東インカレ ハーフマラソン（焼津）",
    note: "終了。学生ハーフ・箱根予選に関連するロード大会",
    category: "road",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "nittaidai-327",
    monthKey: "2026-04",
    dateLabel: "4/11(土)〜12(日)",
    sortDate: "2026-04-11",
    name: "日体大長距離競技会 第327回",
    note: "終了",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "hyogo-relay-carnival",
    monthKey: "2026-04",
    dateLabel: "4/18(土)〜19(日)",
    sortDate: "2026-04-18",
    name: "兵庫リレーカーニバル",
    note: "終了。日本グランプリシリーズ",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "japan-student-individual",
    monthKey: "2026-04",
    dateLabel: "4/24(金)〜26(日)",
    sortDate: "2026-04-24",
    name: "日本学生個人選手権（平塚）",
    note: "終了。男子10000m実施",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "nittaidai-328",
    monthKey: "2026-04",
    dateLabel: "4/25(土)〜26(日)",
    sortDate: "2026-04-25",
    name: "日体大長距離競技会 第328回",
    note: "終了",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "gifu-seiryu-half",
    monthKey: "2026-04",
    dateLabel: "4/26(日)",
    sortDate: "2026-04-26",
    name: "ぎふ清流ハーフマラソン",
    note: "終了",
    category: "road",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "oda-memorial",
    monthKey: "2026-04",
    dateLabel: "4/29(水・祝)",
    sortDate: "2026-04-29",
    name: "織田記念国際陸上（広島）",
    note: "終了。日本グランプリシリーズ",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "all-japan-kanto-qualifier",
    monthKey: "2026-05",
    dateLabel: "5/4(月・祝)",
    sortDate: "2026-05-04",
    name: "全日本大学駅伝 関東選考会",
    note: "終了。レモンガススタジアム平塚",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "kanto-intercollege",
    monthKey: "2026-05",
    dateLabel: "5/21(木)〜24(日)",
    sortDate: "2026-05-21",
    name: "関東インカレ 第105回",
    note: "終了。カンセキスタジアムとちぎ",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "regional-intercollege",
    monthKey: "2026-05",
    dateLabel: "5月",
    sortDate: "2026-05-25",
    name: "関西インカレほか地区インカレ",
    note: "終了。地区別に管理可能",
    category: "track",
    dateStatus: "approximate",
    progress: "completed"
  },
  {
    id: "nittaidai-329",
    monthKey: "2026-05",
    dateLabel: "5/30(土)〜31(日)",
    sortDate: "2026-05-30",
    name: "日体大長距離競技会 第329回",
    note: "終了",
    category: "track",
    dateStatus: "confirmed",
    progress: "completed"
  },
  {
    id: "japan-championships-110",
    monthKey: "2026-06",
    dateLabel: "6/12(金)〜14(日)",
    sortDate: "2026-06-12",
    name: "日本選手権 第110回",
    note: "パロマ瑞穂・名古屋",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "nittaidai-330",
    monthKey: "2026-06",
    dateLabel: "6/13(土)〜14(日)",
    sortDate: "2026-06-13",
    name: "日体大長距離競技会 第330回",
    note: "日本選手権と同週末",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "all-star-night-athletics",
    monthKey: "2026-06",
    dateLabel: "6/27(土)",
    sortDate: "2026-06-27",
    name: "オールスターナイト陸上",
    note: "学生選抜系大会",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "nittaidai-331",
    monthKey: "2026-06",
    dateLabel: "6/27(土)〜28(日)",
    sortDate: "2026-06-27",
    name: "日体大長距離競技会 第331回",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hokuren-dc-chitose",
    monthKey: "2026-07",
    dateLabel: "7/4(土)",
    sortDate: "2026-07-04",
    name: "ホクレンDC 第1戦 千歳",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "all-japan-corporate-10000m",
    monthKey: "2026-07",
    dateLabel: "7/5(日)",
    sortDate: "2026-07-05",
    name: "全日本実業団対抗陸上10000m",
    note: "大学所属選手の出場有無は公式情報を確認",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hokuren-dc-abashiri",
    monthKey: "2026-07",
    dateLabel: "7/8(水)",
    sortDate: "2026-07-08",
    name: "ホクレンDC 第2戦 網走",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "u23-asian-championships",
    monthKey: "2026-07",
    dateLabel: "7/9(木)〜12(日)",
    sortDate: "2026-07-09",
    name: "U23アジア選手権",
    note: "大学生世代の国際大会",
    category: "international",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hokuren-dc-kitami",
    monthKey: "2026-07",
    dateLabel: "7/11(土)",
    sortDate: "2026-07-11",
    name: "ホクレンDC 第3戦 北見",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "kanto-abashiri-summer",
    monthKey: "2026-07",
    dateLabel: "7/12(日)",
    sortDate: "2026-07-12",
    name: "関東学生網走夏季記録挑戦競技会",
    note: "関東学生の夏季記録会",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hokuren-dc-fukagawa",
    monthKey: "2026-07",
    dateLabel: "7/15(水)",
    sortDate: "2026-07-15",
    name: "ホクレンDC 第4戦 深川",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hokuren-dc-shibetsu",
    monthKey: "2026-07",
    dateLabel: "7/18(土)",
    sortDate: "2026-07-18",
    name: "ホクレンDC 第5戦 士別",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "world-u20-oregon",
    monthKey: "2026-08",
    dateLabel: "8/5(水)〜9(日)",
    sortDate: "2026-08-05",
    name: "世界U20陸上（オレゴン）",
    note: "大学1年生世代を含む国際大会",
    category: "international",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "twilight-games",
    monthKey: "2026-08",
    dateLabel: "8/8(土)",
    sortDate: "2026-08-08",
    name: "トワイライト・ゲームス",
    note: "関東学連主催・招待系大会",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "japan-intercollege-95",
    monthKey: "2026-09",
    dateLabel: "9/5(土)〜7(月)",
    sortDate: "2026-09-05",
    name: "日本インカレ 第95回",
    note: "日産スタジアム・横浜。10000mなし",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "world-road-championships",
    monthKey: "2026-09",
    dateLabel: "9/19(土)〜20(日)",
    sortDate: "2026-09-19",
    name: "世界ロードランニング選手権",
    note: "5km・1マイル・ハーフ",
    category: "international",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "asian-games-aichi-nagoya",
    monthKey: "2026-09",
    dateLabel: "9/19(土)〜10/4(日)",
    sortDate: "2026-09-19",
    name: "アジア競技大会（愛知・名古屋）",
    note: "5000m・10000m等",
    category: "international",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "kanto-rookie-athletics",
    monthKey: "2026-09",
    dateLabel: "9/25(金)〜27(日)",
    sortDate: "2026-09-25",
    name: "関東学生新人陸上",
    note: "1〜2年生中心",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "nittaidai-332",
    monthKey: "2026-09",
    dateLabel: "9/26(土)〜27(日)",
    sortDate: "2026-09-26",
    name: "日体大長距離競技会 第332回",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "izumo-ekiden-38",
    monthKey: "2026-10",
    dateLabel: "10/12(月・祝)",
    sortDate: "2026-10-12",
    name: "出雲駅伝 第38回",
    note: "スポーツの日",
    category: "ekiden",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hakone-qualifier-103",
    monthKey: "2026-10",
    dateLabel: "10/17(土)",
    sortDate: "2026-10-17",
    name: "箱根駅伝予選会 第103回",
    note: "立川駐屯地〜市街地〜昭和記念公園",
    category: "road",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "all-japan-university-ekiden-58",
    monthKey: "2026-11",
    dateLabel: "11/1(日)",
    sortDate: "2026-11-01",
    name: "全日本大学駅伝 第58回",
    note: "熱田神宮→伊勢神宮",
    category: "ekiden",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "nittaidai-333",
    monthKey: "2026-11",
    dateLabel: "11/7(土)〜8(日)",
    sortDate: "2026-11-07",
    name: "日体大長距離競技会 第333回",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "setagaya-246-half",
    monthKey: "2026-11",
    dateLabel: "11月上旬",
    sortDate: "2026-11-09",
    name: "世田谷246ハーフマラソン",
    note: "2025年は11/9開催。2026年分は例年7月頃発表",
    category: "road",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "nittaidai-334",
    monthKey: "2026-11",
    dateLabel: "11/21(土)〜22(日)",
    sortDate: "2026-11-21",
    name: "日体大長距離競技会 第334回",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "ageo-city-half-39",
    monthKey: "2026-11",
    dateLabel: "11/22(日)",
    sortDate: "2026-11-22",
    name: "上尾シティハーフマラソン 第39回",
    note: "箱根駅伝前の主要ロード大会",
    category: "road",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "hachioji-long-distance",
    monthKey: "2026-11",
    dateLabel: "11月下旬",
    sortDate: "2026-11-25",
    name: "八王子ロングディスタンス",
    note: "日程未発表（2025年は11/22・上柚木）",
    category: "track",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "march-competition",
    monthKey: "2026-11",
    dateLabel: "11月下旬",
    sortDate: "2026-11-26",
    name: "MARCH対抗戦（10000m）",
    note: "日程未発表（2025年は11/22・町田GIONスタジアム）",
    category: "track",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "japan-championships-10000m",
    monthKey: "2026-12",
    dateLabel: "12/5(土)",
    sortDate: "2026-12-05",
    name: "日本選手権10000m",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "distance-challenge-osaka",
    monthKey: "2026-12",
    dateLabel: "12/6(日)",
    sortDate: "2026-12-06",
    name: "ディスタンスチャレンジ in 大阪2026",
    note: "",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "kizuna-challenge",
    monthKey: "2026-12",
    dateLabel: "12月中旬",
    sortDate: "2026-12-15",
    name: "絆記録挑戦会（上尾）",
    note: "日程未発表。10000m中心",
    category: "track",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "university-hosted-meets",
    monthKey: "2026-12",
    dateLabel: "12月下旬",
    sortDate: "2026-12-25",
    name: "大学主催記録会（早稲田大競技会など）",
    note: "大会ごとに個別登録する運用を想定",
    category: "track",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "hakone-ekiden-103",
    monthKey: "2027-01",
    dateLabel: "2027/1/2(土)〜3(日)",
    sortDate: "2027-01-02",
    name: "箱根駅伝 第103回",
    note: "1/2〜3固定",
    category: "ekiden",
    dateStatus: "confirmed",
    progress: "upcoming"
  },
  {
    id: "marugame-half-2027",
    monthKey: "2027-01",
    dateLabel: "2027/1月下旬〜2月上旬",
    sortDate: "2027-01-25",
    name: "丸亀国際ハーフマラソン",
    note: "日程未発表",
    category: "road",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "japan-student-half-2027",
    monthKey: "2027-02",
    dateLabel: "2027/2月",
    sortDate: "2027-02-10",
    name: "日本学生ハーフマラソン選手権",
    note: "近年は丸亀併催。日程未発表",
    category: "road",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "japan-student-cross-country-2027",
    monthKey: "2027-02",
    dateLabel: "2027/2〜3月",
    sortDate: "2027-02-20",
    name: "日本学生クロスカントリー選手権",
    note: "日程未発表",
    category: "road",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "tachikawa-city-half-2027",
    monthKey: "2027-03",
    dateLabel: "2027/3月上旬",
    sortDate: "2027-03-01",
    name: "立川シティハーフマラソン",
    note: "日程未発表",
    category: "road",
    dateStatus: "unannounced",
    progress: "upcoming"
  },
  {
    id: "kanto-spring-open-2027",
    monthKey: "2027-03",
    dateLabel: "2027/3/26(金)〜28(日)",
    sortDate: "2027-03-26",
    name: "関東学連春季オープン競技会",
    note: "シーズン末の記録会",
    category: "track",
    dateStatus: "confirmed",
    progress: "upcoming"
  }
];

export const seasonSchedule = scheduleItems.sort((left, right) =>
  left.sortDate.localeCompare(right.sortDate)
);

export const scheduleMonthLabels: Record<string, string> = {
  "2026-04": "2026年4月",
  "2026-05": "2026年5月",
  "2026-06": "2026年6月",
  "2026-07": "2026年7月",
  "2026-08": "2026年8月",
  "2026-09": "2026年9月",
  "2026-10": "2026年10月",
  "2026-11": "2026年11月",
  "2026-12": "2026年12月",
  "2027-01": "2027年1月",
  "2027-02": "2027年2月",
  "2027-03": "2027年3月"
};
