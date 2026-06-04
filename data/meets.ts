export type MeetStatus = "scheduled" | "coming_soon" | "startlist_published" | "result_waiting" | "live" | "result_published";

export type MeetCategory = "track" | "road" | "ekiden";

export type Meet = {
  meet_id: string;
  slug: string;
  meet_name: string;
  date: string;
  venue: string;
  category: MeetCategory;
  status: MeetStatus;
  race_count: number | null;
  published_startlist_count: number;
  published_result_count: number;
  note: string;
};

export const meets: Meet[] = [
  {
    meet_id: "kanto-1500m",
    slug: "kanto-1500m",
    meet_name: "関東学生1500m記録会",
    date: "2026-06-02",
    venue: "駒沢オリンピック公園陸上競技場",
    category: "track",
    status: "result_published",
    race_count: 1,
    published_startlist_count: 1,
    published_result_count: 1,
    note: "結果公開中"
  },
  {
    meet_id: "night-5000m",
    slug: "night-5000m",
    meet_name: "学生ナイトゲームズ5000m",
    date: "2026-05-22",
    venue: "大井ふ頭中央海浜公園",
    category: "track",
    status: "result_waiting",
    race_count: 2,
    published_startlist_count: 1,
    published_result_count: 0,
    note: "結果待ち"
  },
  {
    meet_id: "kanto-10000m",
    slug: "kanto-10000m",
    meet_name: "関東学生10000m記録挑戦会",
    date: "2026-05-24",
    venue: "町田GIONスタジアム",
    category: "track",
    status: "result_published",
    race_count: 4,
    published_startlist_count: 3,
    published_result_count: 1,
    note: "結果公開中"
  },
  {
    meet_id: "kanto-5000m-final",
    slug: "kanto-5000m-final",
    meet_name: "関東学生5000m決勝",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "track",
    status: "result_published",
    race_count: 1,
    published_startlist_count: 1,
    published_result_count: 1,
    note: "結果公開中"
  },
  {
    meet_id: "izumo-preview",
    slug: "izumo-preview",
    meet_name: "出雲駅伝選考会",
    date: "2026-05-26",
    venue: "夢の島陸上競技場",
    category: "ekiden",
    status: "coming_soon",
    race_count: null,
    published_startlist_count: 0,
    published_result_count: 0,
    note: "大会予定"
  },
  {
    meet_id: "all-japan-prep",
    slug: "all-japan-prep",
    meet_name: "全日本大学駅伝対校選考会",
    date: "2026-06-15",
    venue: "浦和駒場スタジアム",
    category: "ekiden",
    status: "scheduled",
    race_count: null,
    published_startlist_count: 0,
    published_result_count: 0,
    note: "大会予定"
  },
  {
    meet_id: "hakone-qualifier-trial",
    slug: "hakone-qualifier-trial",
    meet_name: "箱根駅伝予選会プレ記録会",
    date: "2026-05-18",
    venue: "相模原ギオンスタジアム",
    category: "road",
    status: "result_published",
    race_count: 1,
    published_startlist_count: 1,
    published_result_count: 1,
    note: "結果公開中"
  },
  {
    meet_id: "spring-open",
    slug: "spring-open",
    meet_name: "春季オープン",
    date: "2026-04-20",
    venue: "会場未定",
    category: "track",
    status: "result_published",
    race_count: 1,
    published_startlist_count: 0,
    published_result_count: 1,
    note: "結果公開中"
  },
  {
    meet_id: "winter-half",
    slug: "winter-half",
    meet_name: "冬季ハーフ記録会",
    date: "2026-02-08",
    venue: "会場未定",
    category: "road",
    status: "result_published",
    race_count: 1,
    published_startlist_count: 0,
    published_result_count: 1,
    note: "結果公開中"
  }
];

export const meetStatusLabels: Record<MeetStatus, string> = {
  scheduled: "予定",
  coming_soon: "まもなく",
  startlist_published: "スタートリスト公開",
  result_waiting: "結果待ち",
  live: "実施中",
  result_published: "結果公開"
};

export const meetCategoryLabels: Record<MeetCategory, string> = {
  track: "トラック",
  road: "ロード",
  ekiden: "駅伝"
};
