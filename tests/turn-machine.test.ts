import { describe, expect, it } from "vitest";
import {
  PHASE_ORDER,
  canEditSession,
  canStart,
  canTransition,
  isRunning,
  nextPhase,
  speedFactor,
} from "@/lib/turn-machine";

describe("turn state machine", () => {
  it("đi đúng thứ tự idle → … → completed → idle", () => {
    let p = PHASE_ORDER[0];
    const visited = [p];
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      p = nextPhase(p);
      visited.push(p);
    }
    expect(visited).toEqual([
      "idle",
      "arriving",
      "scanning",
      "abducting",
      "revealing",
      "completed",
      "idle",
    ]);
  });

  it("chỉ cho phép chuyển sang trạng thái kế tiếp", () => {
    expect(canTransition("idle", "arriving")).toBe(true);
    expect(canTransition("idle", "abducting")).toBe(false);
    expect(canTransition("scanning", "idle")).toBe(false);
    expect(canTransition("completed", "idle")).toBe(true);
  });

  it("chỉ bắt đầu được khi idle (chặn bấm liên tục)", () => {
    expect(canStart("idle")).toBe(true);
    for (const p of PHASE_ORDER.filter((x) => x !== "idle")) {
      expect(canStart(p)).toBe(false);
    }
  });

  it("khóa chỉnh sửa trong lúc chạy hoạt cảnh", () => {
    for (const p of ["arriving", "scanning", "abducting", "revealing"] as const) {
      expect(isRunning(p)).toBe(true);
      expect(canEditSession(p)).toBe(false);
    }
    expect(canEditSession("idle")).toBe(true);
    expect(canEditSession("completed")).toBe(true);
  });

  it("hệ số tốc độ", () => {
    expect(speedFactor("fast")).toBeLessThan(speedFactor("normal"));
    expect(speedFactor("slow")).toBeGreaterThan(speedFactor("normal"));
  });
});
