import type { Athlete } from "./athletes";

export type University = {
  id: string;
  slug: string;
  name: string;
  area: string;
  sashColor: string;
  accent: string;
  profile: string;
  style: string;
  coachNote: string;
  bestEkiden: string;
  athletes: string[];
  listing: {
    region: "関東";
    events: Array<"1500m" | "5000m" | "10000m" | "ハーフ">;
    nextAppearance: string;
    latestResult: {
      athlete: string;
      event: "1500m" | "5000m" | "10000m" | "ハーフ";
      time: string;
    };
    hasUpcoming: boolean;
    hasResult: boolean;
  };
};

export const universities: University[] = [
  {
    id: "aoba",
    slug: "waseda",
    name: "早稲田",
    area: "関東",
    sashColor: "赤",
    accent: "#b3263a",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "5000m / 10000m",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "箱根駅伝 総合3位",
    athletes: ["saeki", "mizushima", "takahashi"],
    listing: {
      region: "関東",
      events: ["1500m", "5000m", "10000m", "ハーフ"],
      nextAppearance: "関東学生1500m記録会",
      latestResult: { athlete: "佐伯 蒼", event: "1500m", time: "3:48.20" },
      hasUpcoming: true,
      hasResult: true
    }
  },
  {
    id: "surugadai",
    slug: "aoyama-gakuin",
    name: "青山学院",
    area: "関東",
    sashColor: "緑",
    accent: "#158b63",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "5000m / 10000m",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "全日本大学駅伝 8位",
    athletes: ["yoshioka", "kurihara"],
    listing: {
      region: "関東",
      events: ["5000m", "10000m"],
      nextAppearance: "関東学生10000m記録挑戦会",
      latestResult: { athlete: "吉岡 遼", event: "10000m", time: "28:52.08" },
      hasUpcoming: true,
      hasResult: true
    }
  },
  {
    id: "josai",
    slug: "komazawa",
    name: "駒澤",
    area: "関東",
    sashColor: "紫",
    accent: "#5b3c99",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "10000m / ハーフ",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "箱根駅伝 予選会4位",
    athletes: ["morino", "oda"],
    listing: {
      region: "関東",
      events: ["10000m", "ハーフ"],
      nextAppearance: "箱根駅伝予選会プレ記録会",
      latestResult: { athlete: "森野 健太", event: "ハーフ", time: "1:02:48" },
      hasUpcoming: true,
      hasResult: true
    }
  },
  {
    id: "musashino",
    slug: "chuo",
    name: "中央",
    area: "関東",
    sashColor: "赤",
    accent: "#d64235",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "5000m / 10000m",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "出雲駅伝 5位",
    athletes: ["nakamura", "sugawara"],
    listing: {
      region: "関東",
      events: ["5000m", "10000m"],
      nextAppearance: "学生ナイトゲームズ5000m",
      latestResult: { athlete: "中村 遥斗", event: "5000m", time: "13:55.02" },
      hasUpcoming: true,
      hasResult: true
    }
  },
  {
    id: "tohto",
    slug: "kokugakuin",
    name: "國學院",
    area: "関東",
    sashColor: "金",
    accent: "#c4861f",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "5000m / 10000m",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "箱根駅伝 往路6位",
    athletes: ["kimani", "hirai"],
    listing: {
      region: "関東",
      events: ["10000m"],
      nextAppearance: "関東学生10000m記録挑戦会",
      latestResult: { athlete: "平井 悠真", event: "10000m", time: "28:41.12" },
      hasUpcoming: true,
      hasResult: true
    }
  },
  {
    id: "fujisawa",
    slug: "juntendo",
    name: "順天堂",
    area: "関東",
    sashColor: "青",
    accent: "#174ea6",
    profile: "男子長距離・駅伝の出場予定、最近の結果、種目別PB上位を確認できます。",
    style: "5000m / 10000m",
    coachNote: "出場予定と結果を掲載",
    bestEkiden: "全日本選考会 12位",
    athletes: ["kawai", "nishio"],
    listing: {
      region: "関東",
      events: ["5000m", "10000m"],
      nextAppearance: "全日本大学駅伝対校選考会",
      latestResult: { athlete: "河合 俊介", event: "10000m", time: "29:10.30" },
      hasUpcoming: true,
      hasResult: true
    }
  }
];

export type UniversityPbEvent = "5000m" | "10000m" | "ハーフ";

export type UniversityPbRanking = {
  event: UniversityPbEvent;
  entries: {
    rank: number;
    university: string;
    athlete: string;
    time: string;
  }[];
};

const pbEvents: UniversityPbEvent[] = ["5000m", "10000m", "ハーフ"];

export function buildUniversityPbRankings(universityList: University[], athleteList: Athlete[]): UniversityPbRanking[] {
  const universityById = new Map(universityList.map((university) => [university.id, university]));

  return pbEvents.map((event) => {
    const fastestByUniversity = new Map<
      string,
      {
        university: string;
        athlete: string;
        time: string;
        seconds: number;
      }
    >();

    athleteList.forEach((athlete) => {
      const university = universityById.get(athlete.universityId);
      const pb = athlete.pb.find((record) => record.distance === event);

      if (!university || !pb) return;

      const seconds = toSeconds(pb.time);
      const current = fastestByUniversity.get(university.id);

      if (!current || seconds < current.seconds) {
        fastestByUniversity.set(university.id, {
          university: university.name,
          athlete: athlete.name,
          time: pb.time,
          seconds
        });
      }
    });

    const entries = Array.from(fastestByUniversity.values())
      .sort((a, b) => a.seconds - b.seconds)
      .slice(0, 3)
      .map((entry, index) => ({
        rank: index + 1,
        university: entry.university,
        athlete: entry.athlete,
        time: entry.time
      }));

    return { event, entries };
  });
}

function toSeconds(time: string) {
  const parts = time.split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  const [minutes, seconds] = parts;
  return minutes * 60 + seconds;
}
