import {
  DEFAULT_SETTINGS,
  type AbductEffect,
  type AnimationSpeed,
  type ClassRoom,
  type Gender,
  type HistoryEntry,
  type PendingTurn,
  type PersistedState,
  type PickedSnapshot,
  type Settings,
  type Student,
} from "./types";
import { newId } from "./random";

/** Tăng khi đổi cấu trúc dữ liệu lưu; thêm bước vào `migrate` để nâng cấp. */
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = "trabai:state";
const CORRUPT_BACKUP_KEY = "trabai:state:corrupt-backup";
const MAX_HISTORY = 500;

export type LoadResult =
  | { status: "ok"; state: PersistedState }
  | { status: "empty" }
  | { status: "corrupt"; reason: string }
  | { status: "unavailable"; reason: string };

export type SaveResult = { ok: true } | { ok: false; reason: string };

/* ------------------------------------------------------------------ */
/* Kiểm tra & làm sạch dữ liệu đọc ra – không bao giờ ném lỗi          */
/* ------------------------------------------------------------------ */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback: boolean) =>
  typeof v === "boolean" ? v : fallback;
const gender = (v: unknown): Gender =>
  v === "male" || v === "female" || v === "other" ? v : "other";

function sanitizeStudent(raw: unknown, index: number): Student | null {
  if (!isObj(raw)) return null;
  const name = str(raw.name).trim();
  if (!name) return null;
  const no = typeof raw.no === "number" && Number.isFinite(raw.no) ? raw.no : index + 1;
  return {
    id: str(raw.id) || newId("hs"),
    no,
    name,
    gender: gender(raw.gender),
    present: bool(raw.present, true),
  };
}

function sanitizeClass(raw: unknown): ClassRoom | null {
  if (!isObj(raw)) return null;
  const students: Student[] = [];
  const seen = new Set<string>();
  (Array.isArray(raw.students) ? raw.students : []).forEach((s, i) => {
    const st = sanitizeStudent(s, i);
    if (!st) return;
    // id phải duy nhất; nếu trùng (dữ liệu hỏng) thì cấp id mới thay vì mất học sinh
    if (seen.has(st.id)) st.id = newId("hs");
    seen.add(st.id);
    students.push(st);
  });
  const ids = new Set(students.map((s) => s.id));
  const calledIds = (Array.isArray(raw.calledIds) ? raw.calledIds : []).filter(
    (id): id is string => typeof id === "string" && ids.has(id),
  );
  const cycle =
    typeof raw.cycle === "number" && raw.cycle >= 1 ? Math.floor(raw.cycle) : 1;
  return {
    id: str(raw.id) || newId("lop"),
    name: str(raw.name).trim() || "Lớp chưa đặt tên",
    students,
    calledIds: Array.from(new Set(calledIds)),
    cycle,
  };
}

export function sanitizeSettings(raw: unknown): Settings {
  const r = isObj(raw) ? raw : {};
  const speed: AnimationSpeed =
    r.speed === "fast" || r.speed === "slow" || r.speed === "normal"
      ? r.speed
      : DEFAULT_SETTINGS.speed;
  const effect: AbductEffect =
    r.effect === "siege" || r.effect === "single" ? r.effect : DEFAULT_SETTINGS.effect;
  const pc =
    typeof r.pickCount === "number" && Number.isFinite(r.pickCount)
      ? Math.max(1, Math.min(200, Math.floor(r.pickCount)))
      : DEFAULT_SETTINGS.pickCount;
  return {
    pickCount: pc,
    noRepeat: bool(r.noRepeat, DEFAULT_SETTINGS.noRepeat),
    speed,
    effect,
    soundOn: bool(r.soundOn, DEFAULT_SETTINGS.soundOn),
    speechBubbles: bool(r.speechBubbles, DEFAULT_SETTINGS.speechBubbles),
  };
}

function sanitizeSnapshot(raw: unknown): PickedSnapshot | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    no: typeof raw.no === "number" ? raw.no : 0,
    gender: gender(raw.gender),
  };
}

function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryEntry[] = [];
  for (const e of raw) {
    if (!isObj(e)) continue;
    const picked = (Array.isArray(e.picked) ? e.picked : [])
      .map(sanitizeSnapshot)
      .filter((x): x is PickedSnapshot => x !== null);
    if (picked.length === 0) continue;
    out.push({
      id: str(e.id) || newId("ls"),
      classId: str(e.classId),
      className: str(e.className, "Lớp"),
      at: str(e.at, new Date(0).toISOString()),
      cycle: typeof e.cycle === "number" ? e.cycle : 1,
      picked,
    });
  }
  return out.slice(0, MAX_HISTORY);
}

function sanitizePending(raw: unknown, classIds: Set<string>): PendingTurn | null {
  if (!isObj(raw)) return null;
  const classId = str(raw.classId);
  if (!classIds.has(classId)) return null;
  const picked = (Array.isArray(raw.picked) ? raw.picked : [])
    .map(sanitizeSnapshot)
    .filter((x): x is PickedSnapshot => x !== null);
  if (picked.length === 0) return null;
  return {
    id: str(raw.id) || newId("luot"),
    classId,
    picked,
    startedAt: str(raw.startedAt, new Date().toISOString()),
  };
}

/**
 * Nâng cấp dữ liệu từ các phiên bản cũ lên bản hiện tại.
 * Hiện chỉ có v1; các bước nâng cấp sau này thêm vào đây theo từng version.
 */
export function migrate(raw: unknown): PersistedState | null {
  if (!isObj(raw)) return null;
  // Ví dụ cho tương lai: if (raw.version === 1) raw = migrateV1toV2(raw);
  const classes = (Array.isArray(raw.classes) ? raw.classes : [])
    .map(sanitizeClass)
    .filter((c): c is ClassRoom => c !== null);
  if (classes.length === 0) return null;
  const classIds = new Set(classes.map((c) => c.id));
  const activeClassId = classIds.has(str(raw.activeClassId))
    ? str(raw.activeClassId)
    : classes[0].id;
  return {
    version: STORAGE_VERSION,
    classes,
    activeClassId,
    templateId: str(raw.templateId, "ufo-pho"),
    settings: sanitizeSettings(raw.settings),
    history: sanitizeHistory(raw.history),
    pendingTurn: sanitizePending(raw.pendingTurn, classIds),
  };
}

/* ------------------------------------------------------------------ */
/* Đọc / ghi localStorage an toàn                                      */
/* ------------------------------------------------------------------ */

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // trình duyệt chặn truy cập
  }
}

export function loadState(): LoadResult {
  const ls = getStorage();
  if (!ls) return { status: "unavailable", reason: "Trình duyệt không cho phép lưu dữ liệu." };
  let text: string | null;
  try {
    text = ls.getItem(STORAGE_KEY);
  } catch (e) {
    return { status: "unavailable", reason: errMsg(e) };
  }
  if (text === null) return { status: "empty" };
  try {
    const state = migrate(JSON.parse(text));
    if (!state) throw new Error("Dữ liệu không đúng định dạng");
    return { status: "ok", state };
  } catch (e) {
    try {
      ls.setItem(CORRUPT_BACKUP_KEY, text); // giữ bản sao để có thể khôi phục thủ công
    } catch {
      /* bỏ qua */
    }
    return { status: "corrupt", reason: errMsg(e) };
  }
}

export function saveState(state: PersistedState): SaveResult {
  const ls = getStorage();
  if (!ls) return { ok: false, reason: "Trình duyệt không cho phép lưu dữ liệu." };
  try {
    const payload: PersistedState = {
      version: STORAGE_VERSION,
      classes: state.classes,
      activeClassId: state.activeClassId,
      templateId: state.templateId,
      settings: state.settings,
      history: state.history.slice(0, MAX_HISTORY),
      pendingTurn: state.pendingTurn,
    };
    ls.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: errMsg(e) };
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
