/**
 * State machine của một lượt gọi bài:
 * idle → arriving → scanning → abducting → revealing → completed → idle
 *
 * Chỉ cho phép chuyển trạng thái theo đúng thứ tự; mọi chuyển trạng thái
 * sai (ví dụ bấm bắt đầu khi đang chạy) đều bị từ chối.
 */
export type TurnPhase =
  | "idle"
  | "arriving"
  | "scanning"
  | "abducting"
  | "revealing"
  | "completed";

export const PHASE_ORDER: readonly TurnPhase[] = [
  "idle",
  "arriving",
  "scanning",
  "abducting",
  "revealing",
  "completed",
];

const NEXT: Record<TurnPhase, TurnPhase> = {
  idle: "arriving",
  arriving: "scanning",
  scanning: "abducting",
  abducting: "revealing",
  revealing: "completed",
  completed: "idle",
};

export function nextPhase(phase: TurnPhase): TurnPhase {
  return NEXT[phase];
}

export function canTransition(from: TurnPhase, to: TurnPhase): boolean {
  return NEXT[from] === to;
}

/** Đang chạy hoạt cảnh (không phải idle/completed). */
export function isRunning(phase: TurnPhase): boolean {
  return (
    phase === "arriving" ||
    phase === "scanning" ||
    phase === "abducting" ||
    phase === "revealing"
  );
}

/** Có được phép bắt đầu lượt mới không. */
export function canStart(phase: TurnPhase): boolean {
  return phase === "idle";
}

/** Có được phép sửa lớp, danh sách hoặc thiết lập ảnh hưởng đến lượt không. */
export function canEditSession(phase: TurnPhase): boolean {
  return !isRunning(phase);
}

/** Hệ số thời lượng theo tốc độ. */
export function speedFactor(speed: "fast" | "normal" | "slow"): number {
  return speed === "fast" ? 0.6 : speed === "slow" ? 1.5 : 1;
}
