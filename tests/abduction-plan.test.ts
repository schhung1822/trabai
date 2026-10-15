import { describe, expect, it } from "vitest";
import { buildSingleAttemptPlan } from "@/lib/abduction-plan";

const roster = ["a", "b", "c", "d", "e"].map((id) => ({ id, name: id.toUpperCase() }));

describe("single abduction visual plan", () => {
  it("luôn bắt đủ đúng mục tiêu và có lượt hụt khi còn học sinh khác", () => {
    const targets = [roster[1], roster[3]];
    const plan = buildSingleAttemptPlan(roster, targets, () => 0.25);

    expect(plan.filter((attempt) => attempt.outcome === "success").map((attempt) => attempt.student.id))
      .toEqual(["b", "d"]);
    expect(plan.some((attempt) => attempt.outcome === "miss")).toBe(true);
    expect(plan.filter((attempt) => attempt.outcome === "miss").every((attempt) => !["b", "d"].includes(attempt.student.id)))
      .toBe(true);
  });

  it("không tạo lượt hụt giả khi toàn bộ lớp đều là mục tiêu", () => {
    const plan = buildSingleAttemptPlan(roster.slice(0, 2), roster.slice(0, 2), () => 0.5);
    expect(plan).toEqual([
      { student: roster[0], outcome: "success" },
      { student: roster[1], outcome: "success" },
    ]);
  });
});
