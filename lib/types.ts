export type Gender = "male" | "female" | "other";

export interface Student {
  /** Định danh nội bộ ổn định. Không dùng STT hay họ tên để phân biệt. */
  id: string;
  /** Số thứ tự hiển thị, có thể trùng hoặc bị sửa tay. */
  no: number;
  name: string;
  gender: Gender;
  present: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  students: Student[];
  /** Các id đã được gọi trong vòng hiện tại. */
  calledIds: string[];
  /** Số thứ tự vòng hiện tại (bắt đầu từ 1). */
  cycle: number;
}

export type AnimationSpeed = "fast" | "normal" | "slow";

/** Hiệu ứng hút: "single" = bắt lẻ (UFO bắt từng bạn); "siege" = bao vây (chiếu sáng cả lớp rồi hút ra). */
export type AbductEffect = "single" | "siege";

export interface Settings {
  /** Số học sinh gọi mỗi lượt. */
  pickCount: number;
  /** Không gọi lặp lại trong cùng một vòng. */
  noRepeat: boolean;
  speed: AnimationSpeed;
  effect: AbductEffect;
  soundOn: boolean;
  speechBubbles: boolean;
}

export interface PickedSnapshot {
  id: string;
  no: number;
  name: string;
  gender: Gender;
}

export interface HistoryEntry {
  id: string;
  classId: string;
  className: string;
  /** ISO timestamp. */
  at: string;
  cycle: number;
  picked: PickedSnapshot[];
}

/** Lượt đã chốt nhưng người dùng chưa đóng bảng kết quả. */
export interface PendingTurn {
  id: string;
  classId: string;
  picked: PickedSnapshot[];
  startedAt: string;
}

export interface PersistedState {
  version: number;
  classes: ClassRoom[];
  activeClassId: string;
  templateId: string;
  settings: Settings;
  history: HistoryEntry[];
  pendingTurn: PendingTurn | null;
}

export const DEFAULT_SETTINGS: Settings = {
  pickCount: 2,
  noRepeat: true,
  speed: "normal",
  effect: "single",
  soundOn: true,
  speechBubbles: true,
};

export const GENDER_LABEL: Record<Gender, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Chưa rõ",
};
