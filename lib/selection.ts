import { sampleWithoutReplacement, type RandomInt } from "./random";
import type {
  ClassRoom,
  PickedSnapshot,
  Settings,
  Student,
} from "./types";

/** Học sinh có mặt trong lớp (tham gia hoạt cảnh). */
export function getPresentStudents(cls: ClassRoom): Student[] {
  return cls.students.filter((s) => s.present);
}

/**
 * Tập đủ điều kiện: có mặt, và (nếu bật không lặp) chưa được gọi trong vòng.
 */
export function getEligibleStudents(
  cls: ClassRoom,
  noRepeat: boolean,
): Student[] {
  const called = new Set(cls.calledIds);
  return cls.students.filter(
    (s) => s.present && (!noRepeat || !called.has(s.id)),
  );
}

export type TurnPlan =
  /** Đủ người, có thể bắt đầu. */
  | { kind: "ready"; count: number; eligible: number }
  /** Lớp không có học sinh có mặt. */
  | { kind: "no-students" }
  /** Số người gọi lớn hơn số học sinh có mặt (kể cả khi tắt chế độ không lặp). */
  | { kind: "count-too-high"; count: number; present: number }
  /** Chế độ không lặp: còn ít hơn số cần gọi. Người dùng phải chọn. */
  | { kind: "insufficient"; count: number; eligible: number }
  /** Chế độ không lặp: không còn ai. Phải bắt đầu vòng mới. */
  | { kind: "exhausted"; count: number };

/**
 * Quyết định có thể bắt đầu lượt không. Không bao giờ âm thầm chọn trùng
 * hay tự reset vòng – trả về kết quả để giao diện hỏi người dùng.
 */
export function planTurn(cls: ClassRoom, settings: Settings): TurnPlan {
  const present = getPresentStudents(cls).length;
  const count = settings.pickCount;
  if (present === 0) return { kind: "no-students" };
  if (count > present) return { kind: "count-too-high", count, present };
  const eligible = getEligibleStudents(cls, settings.noRepeat).length;
  if (eligible === 0) return { kind: "exhausted", count };
  if (eligible < count) return { kind: "insufficient", count, eligible };
  return { kind: "ready", count, eligible };
}

/**
 * Chọn ngẫu nhiên `count` học sinh đủ điều kiện, không trùng nhau.
 * Hàm thuần: kết quả được chốt một lần ở đây, hoạt cảnh chỉ biểu diễn lại.
 */
export function pickStudents(
  cls: ClassRoom,
  noRepeat: boolean,
  count: number,
  randomInt?: RandomInt,
): Student[] {
  const eligible = getEligibleStudents(cls, noRepeat);
  return sampleWithoutReplacement(eligible, count, randomInt);
}

export function snapshotOf(s: Student): PickedSnapshot {
  return { id: s.id, no: s.no, name: s.name, gender: s.gender };
}

/** Ghi nhận học sinh đã được gọi trong vòng (không trùng lặp id). */
export function markCalled(cls: ClassRoom, ids: readonly string[]): ClassRoom {
  const set = new Set(cls.calledIds);
  for (const id of ids) set.add(id);
  return { ...cls, calledIds: Array.from(set) };
}

/** Bắt đầu vòng mới: đưa mọi học sinh về trạng thái đủ điều kiện. */
export function startNewCycle(cls: ClassRoom): ClassRoom {
  return { ...cls, calledIds: [], cycle: cls.cycle + 1 };
}

/** Dọn các id đã bị xóa khỏi danh sách đã gọi. */
export function pruneCalled(cls: ClassRoom): ClassRoom {
  const ids = new Set(cls.students.map((s) => s.id));
  const next = cls.calledIds.filter((id) => ids.has(id));
  return next.length === cls.calledIds.length
    ? cls
    : { ...cls, calledIds: next };
}

/** Giới hạn tối đa hợp lệ của số người gọi mỗi lượt. */
export function maxPickCount(cls: ClassRoom): number {
  return getPresentStudents(cls).length;
}
