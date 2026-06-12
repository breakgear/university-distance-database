import assert from "node:assert/strict";
import test from "node:test";
import { getScheduleProgress, type SeasonScheduleItem } from "../data/seasonSchedule";

const baseItem: SeasonScheduleItem = {
  id: "test-meet",
  monthKey: "2026-06",
  dateLabel: "6/12(金)",
  sortDate: "2026-06-12",
  name: "テスト大会",
  note: "",
  category: "track",
  dateStatus: "confirmed",
  progress: "upcoming"
};

test("年間大会メモの終了判定は固定progressではなく日付から決める", () => {
  assert.equal(getScheduleProgress(baseItem, new Date("2026-06-11T12:00:00+09:00")), "upcoming");
  assert.equal(getScheduleProgress(baseItem, new Date("2026-06-13T12:00:00+09:00")), "completed");
});
