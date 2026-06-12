import assert from "node:assert/strict";
import test from "node:test";
import {
  extractEntryTime,
  extractEventDateCandidates,
  parseTextRecord,
  selectMenEntrySection,
  selectParallelEntrySegments,
  selectPdfGroupItems,
  selectTargetGroupLines
} from "../lib/result-import-parser";

test("組見出しがない場合は対象組を推測せず停止する", () => {
  assert.throws(
    () => selectTargetGroupLines(["男子5000m", "1 100 選手 早稲田大 13:30.00"], "2組"),
    /2組/
  );
});

test("縦並びの組は次の組見出しまでに限定する", () => {
  const result = selectTargetGroupLines(
    ["1組", "1 100 選手A 早稲田大 13:30.00", "2組", "1 200 選手B 中央大 13:31.00", "3組"],
    "2組"
  );
  assert.equal(result.scoped, true);
  assert.deepEqual(result.lines, ["2組", "1 200 選手B 中央大 13:31.00"]);
});

test("横並びの組は見出し順で対象列を選ぶ", () => {
  const result = selectParallelEntrySegments(
    "1 100 選手A 早稲田大 13:30.00 1 200 選手B 中央大 13:31.00",
    "5000m",
    "4組",
    ["3組", "4組"],
    false
  );
  assert.equal(result.ambiguous, false);
  assert.equal(result.lines.length, 1);
  assert.match(result.lines[0], /選手B/);
});

test("横並び範囲で時刻が1件だけなら混入させず警告対象にする", () => {
  const result = selectParallelEntrySegments(
    "1 100 選手A 早稲田大 13:30.00",
    "5000m",
    "2組",
    ["1組", "2組"],
    false
  );
  assert.deepEqual(result.lines, []);
  assert.equal(result.ambiguous, true);
});

test("資格記録の複数表記をCSV向け形式へ正規化する", () => {
  assert.equal(extractEntryTime("選手 早稲田大 17:05.20", "5000m"), "17:05.20");
  assert.equal(extractEntryTime("選手 早稲田大 63:15", "ハーフ"), "63:15");
  assert.equal(extractEntryTime("選手 早稲田大 1:03:15", "ハーフ"), "1:03:15");
  assert.equal(extractEntryTime("選手 早稲田大 13'26\"31", "5000m"), "13:26.31");
  assert.equal(extractEntryTime("選手 早稲田大 13分26秒31", "5000m"), "13:26.31");
});

test("1500mの資格記録を3形式とも正規化する", () => {
  assert.equal(extractEntryTime("選手 早稲田大 3:48.20", "1500m"), "3:48.20");
  assert.equal(extractEntryTime("選手 早稲田大 3'48\"20", "1500m"), "3:48.20");
  assert.equal(extractEntryTime("選手 早稲田大 3分48秒20", "1500m"), "3:48.20");
});

test("1500mの結果行を解析しPB注記を保持する", () => {
  const row = parseTextRecord("1 5 204 田中 太郎 (3) 早稲田大 3:48.20 PB");
  assert.equal(row?.rank, "1");
  assert.equal(row?.bib, "204");
  assert.equal(row?.athlete, "田中 太郎");
  assert.equal(row?.year, "3年");
  assert.equal(row?.time, "3:48.20");
  assert.equal(row?.note, "PB");
  assert.equal(row?.resultStatus, "finished");
});

test("申込期限より開催日を優先する", () => {
  const candidates = extractEventDateCandidates(
    "申込期限：2026年4月20日\n第110回大会 開催日：2026年6月12日",
    ["第110回大会"]
  );
  assert.equal(candidates[0].date, "2026-06-12");
  assert.ok(candidates[0].score > candidates[1].score);
});

test("女子セクションが先にあっても男子対象種目だけを選ぶ", () => {
  const lines = [
    "女子5000m",
    "1 100 女子選手 大学 15:00.00",
    "男子5000m",
    "1 200 男子選手 大学 13:30.00",
    "男子10000m",
    "1 300 別種目選手 大学 28:30.00"
  ];
  assert.deepEqual(selectMenEntrySection(lines, "5000m"), [
    "男子5000m",
    "1 200 男子選手 大学 13:30.00"
  ]);
});

test("結果行の3連番プレフィックスを選手名から除外する", () => {
  const row = parseTextRecord("1 34 109 山口 竣平 (3) 早稲田大 28:22.79");
  assert.equal(row?.rank, "1");
  assert.equal(row?.bib, "109");
  assert.equal(row?.athlete, "山口 竣平");
});

test("上下段に同じx座標の組見出しがあっても対象段だけを抽出する", () => {
  const items = [
    { text: "1組", x: 10, y: 700, width: 20 },
    { text: "2組", x: 300, y: 700, width: 20 },
    { text: "上段1組選手", x: 20, y: 650, width: 80 },
    { text: "上段2組選手", x: 320, y: 650, width: 80 },
    { text: "3組", x: 10, y: 350, width: 20 },
    { text: "4組", x: 300, y: 350, width: 20 },
    { text: "下段3組選手", x: 20, y: 300, width: 80 },
    { text: "下段4組選手", x: 320, y: 300, width: 80 }
  ];

  const firstGroup = selectPdfGroupItems(items, "1組").map((item) => item.text);
  const thirdGroup = selectPdfGroupItems(items, "3組").map((item) => item.text);

  assert.ok(firstGroup.includes("上段1組選手"));
  assert.ok(!firstGroup.includes("下段3組選手"));
  assert.ok(!firstGroup.includes("上段2組選手"));
  assert.ok(thirdGroup.includes("下段3組選手"));
  assert.ok(!thirdGroup.includes("下段4組選手"));
});
