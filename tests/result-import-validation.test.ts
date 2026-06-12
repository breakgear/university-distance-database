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

test("不正な日付と種目を拒否する", () => {
  const badDate = validPayload();
  badDate.metadata.date = "6/12";
  assert.throws(() => parseImportCommitPayload(badDate), /YYYY-MM-DD/);

  const badDistance = validPayload();
  badDistance.metadata.distance = "3000m";
  assert.throws(() => parseImportCommitPayload(badDistance), /種目/);
});
