import assert from "node:assert/strict";
import test from "node:test";
import { parseImportCommitPayload } from "../lib/result-import-validation";

function validPayload() {
  return {
    importKind: "result",
    metadata: {
      meetId: "meet-1",
      meetName: "大会",
      raceId: "race-1",
      raceName: "男子5000m",
      date: "2026-06-12",
      venue: "競技場",
      distance: "5000m",
      startTime: "18:00",
      category: "track"
    },
    rows: [
      {
        sourceKey: "athlete|100",
        rank: "1",
        bib: "100",
        athlete: "選手 太郎",
        year: "3年",
        university: "早稲田",
        time: "13:30.00",
        note: "PB",
        resultStatus: "finished",
        matchStatus: "matched",
        athleteId: "athlete-1",
        universityId: "waseda",
        sourceMatches: 2
      }
    ]
  };
}

test("正しい反映ペイロードを受け付ける", () => {
  const payload = parseImportCommitPayload(validPayload());
  assert.equal(payload.rows[0].athleteId, "athlete-1");
});

test("取込種別の欠落を結果取込として扱わない", () => {
  const payload = validPayload() as Record<string, unknown>;
  delete payload.importKind;
  assert.throws(() => parseImportCommitPayload(payload), /取込種別/);
});

test("不正な結果ステータスを拒否する", () => {
  const payload = validPayload();
  payload.rows[0].resultStatus = "unknown";
  assert.throws(() => parseImportCommitPayload(payload), /結果ステータス/);
});

test("エントリー取込では掲載状態を必須にする", () => {
  const payload = validPayload();
  payload.importKind = "entry";
  assert.throws(() => parseImportCommitPayload(payload), /掲載状態/);
});

test("1500mのPB付き反映ペイロードを受け付ける", () => {
  const raw = validPayload();
  raw.metadata.distance = "1500m";
  raw.metadata.raceName = "男子1500m 決勝";
  raw.rows[0].time = "3:48.20";
  const payload = parseImportCommitPayload(raw);
  assert.equal(payload.metadata.distance, "1500m");
  assert.equal(payload.rows[0].time, "3:48.20");
  assert.equal(payload.rows[0].note, "PB");
});

test("3000mSCの反映ペイロードを受け付ける", () => {
  const raw = validPayload();
  raw.metadata.distance = "3000mSC";
  raw.metadata.raceName = "男子3000mSC 決勝";
  raw.rows[0].time = "8:30.45";
  const payload = parseImportCommitPayload(raw);
  assert.equal(payload.metadata.distance, "3000mSC");
  assert.equal(payload.rows[0].time, "8:30.45");
});

test("駅伝の区間記録と総合結果のペイロードを受け付ける", () => {
  const raw = validPayload() as Record<string, unknown>;
  raw.importKind = "ekiden";
  (raw.metadata as Record<string, unknown>).distance = "駅伝";
  (raw.metadata as Record<string, unknown>).category = "ekiden";
  (raw.metadata as Record<string, unknown>).raceName = "男子 駅伝";
  const row = (raw.rows as Record<string, unknown>[])[0];
  row.time = "1:02:15";
  row.section = "1区";
  row.sectionDistance = "21.3km";
  raw.teamRows = [
    {
      resultType: "総合",
      rank: "1",
      university: "駒澤",
      time: "10:45:23",
      status: "finished",
      note: "",
      matchStatus: "matched",
      universityId: "komazawa"
    }
  ];
  const payload = parseImportCommitPayload(raw);
  assert.equal(payload.importKind, "ekiden");
  assert.equal(payload.metadata.distance, "駅伝");
  assert.equal(payload.rows[0].section, "1区");
  assert.equal(payload.teamRows?.length, 1);
  assert.equal(payload.teamRows?.[0].resultType, "総合");
  assert.equal(payload.teamRows?.[0].universityId, "komazawa");
});

test("駅伝で区間も総合も無ければ拒否する", () => {
  const raw = validPayload() as Record<string, unknown>;
  raw.importKind = "ekiden";
  (raw.metadata as Record<string, unknown>).distance = "駅伝";
  (raw.metadata as Record<string, unknown>).category = "ekiden";
  raw.rows = [];
  raw.teamRows = [];
  assert.throws(() => parseImportCommitPayload(raw), /区間記録または総合結果/);
});

test("不正な日付と種目を拒否する", () => {
  const badDate = validPayload();
  badDate.metadata.date = "6/12";
  assert.throws(() => parseImportCommitPayload(badDate), /YYYY-MM-DD/);

  const badDistance = validPayload();
  badDistance.metadata.distance = "3000m";
  assert.throws(() => parseImportCommitPayload(badDistance), /種目/);
});
