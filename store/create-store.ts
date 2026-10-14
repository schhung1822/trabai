import { createDemoStudents, createInitialState } from "@/lib/demo";
import { newId, type RandomInt } from "@/lib/random";
import {
  getEligibleStudents,
  markCalled,
  planTurn,
  pickStudents,
  pruneCalled,
  snapshotOf,
  startNewCycle,
  type TurnPlan,
} from "@/lib/selection";
import {
  sanitizeSettings,
  type LoadResult,
  type SaveResult,
} from "@/lib/storage";
import {
  canEditSession,
  canStart,
  nextPhase,
  isRunning,
  type TurnPhase,
} from "@/lib/turn-machine";
import {
  DEFAULT_SETTINGS,
  type ClassRoom,
  type Gender,
  type HistoryEntry,
  type PendingTurn,
  type PersistedState,
  type Settings,
  type Student,
} from "@/lib/types";

export interface AppState extends PersistedState {
  /** false cho tới khi đọc xong localStorage ở client (tránh hydration mismatch). */
  hydrated: boolean;
  phase: TurnPhase;
  /** Lỗi ghi dữ liệu gần nhất, null nếu đang lưu bình thường. */
  saveError: string | null;
}

export type BeginResult =
  | { ok: true; turn: PendingTurn }
  | { ok: false; reason: "busy" }
  | { ok: false; reason: "plan"; plan: TurnPlan };

export interface StoreDeps {
  load: () => LoadResult;
  save: (s: PersistedState) => SaveResult;
  randomInt?: RandomInt;
  now: () => Date;
  notify: (text: string, kind: "info" | "success" | "error") => void;
}

const BLOCKED_MSG =
  "Đang chạy hoạt cảnh gọi bài. Hãy chờ UFO xong hoặc bấm “Bỏ qua hoạt cảnh” rồi chỉnh sửa.";

export const EMPTY_CLASS = (name = "Lớp mới"): ClassRoom => ({
  id: newId("lop"),
  name,
  students: [],
  calledIds: [],
  cycle: 1,
});

function emptyState(): AppState {
  const base = createInitialState();
  return { ...base, hydrated: false, phase: "idle", saveError: null };
}

export function createAppStore(deps: StoreDeps) {
  let state: AppState = emptyServerState;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  function persist() {
    const res = deps.save(state);
    const err = res.ok ? null : res.reason;
    if (err !== state.saveError) {
      state = { ...state, saveError: err };
    }
  }

  /** Cập nhật state; `save` = có ghi xuống localStorage hay không. */
  function commit(next: Partial<AppState>, save = true) {
    state = { ...state, ...next };
    if (save) persist();
    emit();
  }

  function guardEditable(): boolean {
    if (canEditSession(state.phase)) return true;
    deps.notify(BLOCKED_MSG, "info");
    return false;
  }

  const activeIndex = () =>
    Math.max(0, state.classes.findIndex((c) => c.id === state.activeClassId));

  function updateActive(fn: (c: ClassRoom) => ClassRoom) {
    const i = activeIndex();
    const classes = state.classes.slice();
    classes[i] = fn(classes[i]);
    commit({ classes });
  }

  /* -------------------------- hydrate -------------------------- */

  function hydrate() {
    if (state.hydrated) return;
    const res = deps.load();
    if (res.status === "ok") {
      const s = res.state;
      state = {
        ...s,
        hydrated: true,
        phase: s.pendingTurn ? "completed" : "idle",
        saveError: null,
      };
      emit();
      return;
    }
    const fresh = emptyState();
    state = { ...fresh, hydrated: true };
    if (res.status === "corrupt") {
      deps.notify(
        "Dữ liệu đã lưu bị lỗi nên ứng dụng khởi tạo lại với lớp demo. Bản sao dữ liệu cũ vẫn được giữ trong trình duyệt.",
        "error",
      );
    }
    if (res.status === "unavailable") {
      state = { ...state, saveError: res.reason };
      emit();
      return;
    }
    persist();
    emit();
  }

  /** Nạp lại từ localStorage (dùng khi tab khác thay đổi dữ liệu). */
  function reloadFromStorage() {
    if (!state.hydrated || isRunning(state.phase)) return;
    const res = deps.load();
    if (res.status !== "ok") return;
    const s = res.state;
    state = {
      ...s,
      hydrated: true,
      phase: s.pendingTurn ? "completed" : "idle",
      saveError: state.saveError,
    };
    emit();
  }

  /* -------------------------- lớp -------------------------- */

  function createClass(name: string): string | null {
    if (!guardEditable()) return null;
    const cls = EMPTY_CLASS(name.trim() || "Lớp mới");
    commit({ classes: [...state.classes, cls], activeClassId: cls.id });
    return cls.id;
  }

  function renameClass(id: string, name: string) {
    if (!guardEditable()) return;
    const n = name.trim();
    if (!n) return;
    commit({
      classes: state.classes.map((c) => (c.id === id ? { ...c, name: n } : c)),
    });
  }

  function deleteClass(id: string) {
    if (!guardEditable()) return;
    let classes = state.classes.filter((c) => c.id !== id);
    if (classes.length === 0) classes = [EMPTY_CLASS()];
    const activeClassId = classes.some((c) => c.id === state.activeClassId)
      ? state.activeClassId
      : classes[0].id;
    const pendingTurn =
      state.pendingTurn?.classId === id ? null : state.pendingTurn;
    commit({ classes, activeClassId, pendingTurn });
  }

  function setActiveClass(id: string) {
    if (!guardEditable()) return;
    if (!state.classes.some((c) => c.id === id)) return;
    commit({ activeClassId: id });
  }

  /* -------------------------- học sinh -------------------------- */

  function addStudent(input: {
    name: string;
    gender: Gender;
    no?: number;
  }): boolean {
    if (!guardEditable()) return false;
    const name = input.name.replace(/\s+/g, " ").trim().normalize("NFC");
    if (!name) return false;
    updateActive((c) => {
      const maxNo = c.students.reduce((m, s) => Math.max(m, s.no), 0);
      const st: Student = {
        id: newId("hs"),
        no: input.no && input.no > 0 ? Math.floor(input.no) : maxNo + 1,
        name,
        gender: input.gender,
        present: true,
      };
      return { ...c, students: [...c.students, st] };
    });
    return true;
  }

  function updateStudent(
    id: string,
    patch: Partial<Pick<Student, "name" | "gender" | "no" | "present">>,
  ) {
    if (!guardEditable()) return;
    updateActive((c) => ({
      ...c,
      students: c.students.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if (patch.name !== undefined) {
          next.name = patch.name.replace(/\s+/g, " ").trim().normalize("NFC") || s.name;
        }
        if (patch.no !== undefined && !(patch.no > 0)) next.no = s.no;
        return next;
      }),
    }));
  }

  function removeStudent(id: string) {
    if (!guardEditable()) return;
    updateActive((c) =>
      pruneCalled({ ...c, students: c.students.filter((s) => s.id !== id) }),
    );
  }

  function setAllPresent(present: boolean) {
    if (!guardEditable()) return;
    updateActive((c) => ({
      ...c,
      students: c.students.map((s) => ({ ...s, present })),
    }));
  }

  /** Dùng cho import: thay toàn bộ danh sách của lớp đang chọn. */
  function setStudents(students: Student[], resetRound: boolean) {
    if (!guardEditable()) return;
    updateActive((c) => {
      const next = { ...c, students };
      return resetRound ? { ...next, calledIds: [] } : pruneCalled(next);
    });
  }

  function loadDemoIntoActive() {
    if (!guardEditable()) return;
    updateActive((c) => ({
      ...c,
      students: createDemoStudents(),
      calledIds: [],
      cycle: 1,
    }));
  }

  /* -------------------------- thiết lập / template -------------------------- */

  function setSettings(patch: Partial<Settings>) {
    // Âm thanh được phép đổi ngay cả khi đang chạy; các thiết lập khác bị khóa.
    const onlySound = Object.keys(patch).every(
      (k) => k === "soundOn" || k === "speechBubbles",
    );
    if (!onlySound && !guardEditable()) return;
    commit({ settings: sanitizeSettings({ ...state.settings, ...patch }) });
  }

  function setTemplate(id: string) {
    if (!guardEditable()) return;
    commit({ templateId: id });
  }

  /* -------------------------- lượt gọi bài -------------------------- */

  function currentPlan(): TurnPlan {
    return planTurn(state.classes[activeIndex()], state.settings);
  }

  /**
   * Chốt kết quả MỘT LẦN: chọn ngẫu nhiên, ghi nhận đã gọi, ghi lịch sử và lưu lượt chờ
   * trong cùng một bước nguyên tử. Hoạt cảnh sau đó chỉ biểu diễn lại kết quả này.
   * Gọi lại khi đang chạy sẽ bị từ chối ("busy").
   */
  function beginTurn(opts: { count?: number } = {}): BeginResult {
    if (!canStart(state.phase)) return { ok: false, reason: "busy" };
    const cls = state.classes[activeIndex()];
    const settings =
      opts.count !== undefined
        ? { ...state.settings, pickCount: opts.count }
        : state.settings;
    const plan = planTurn(cls, settings);
    if (plan.kind !== "ready") return { ok: false, reason: "plan", plan };

    const picked = pickStudents(
      cls,
      settings.noRepeat,
      plan.count,
      deps.randomInt,
    );
    const snapshots = picked.map(snapshotOf);
    const at = deps.now().toISOString();
    const turn: PendingTurn = {
      id: newId("luot"),
      classId: cls.id,
      picked: snapshots,
      startedAt: at,
    };
    const entry: HistoryEntry = {
      id: newId("ls"),
      classId: cls.id,
      className: cls.name,
      at,
      cycle: cls.cycle,
      picked: snapshots,
    };
    const classes = state.classes.slice();
    classes[activeIndex()] = markCalled(
      cls,
      snapshots.map((s) => s.id),
    );
    commit({
      classes,
      history: [entry, ...state.history],
      pendingTurn: turn,
      phase: nextPhase("idle"),
    });
    return { ok: true, turn };
  }

  /** Scene báo đã xong một giai đoạn. Bỏ qua nếu trạng thái đã khác (chống gọi trùng). */
  function advance(from: TurnPhase): boolean {
    if (state.phase !== from || !isRunning(from)) return false;
    commit({ phase: nextPhase(from) }, false);
    return true;
  }

  /** "Bỏ qua hoạt cảnh": nhảy thẳng tới kết quả đã chốt, không chọn lại. */
  function skipToCompleted(): boolean {
    if (!isRunning(state.phase)) return false;
    commit({ phase: "completed" }, false);
    return true;
  }

  /** Đóng bảng kết quả: xóa lượt chờ, về trạng thái nghỉ. */
  function closeResult() {
    if (state.phase !== "completed") return;
    commit({ phase: "idle", pendingTurn: null });
  }

  function startNewRound() {
    if (!guardEditable()) return;
    updateActive(startNewCycle);
  }

  function clearHistory(classId?: string) {
    if (!guardEditable()) return;
    commit({
      history: classId
        ? state.history.filter((h) => h.classId !== classId)
        : [],
    });
  }

  function resetAll() {
    if (isRunning(state.phase)) return;
    const fresh = emptyState();
    state = { ...fresh, hydrated: true };
    persist();
    emit();
  }

  return {
    getState: () => state,
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getServerState: () => emptyServerState,
    hydrate,
    reloadFromStorage,
    createClass,
    renameClass,
    deleteClass,
    setActiveClass,
    addStudent,
    updateStudent,
    removeStudent,
    setAllPresent,
    setStudents,
    loadDemoIntoActive,
    setSettings,
    setTemplate,
    currentPlan,
    beginTurn,
    advance,
    skipToCompleted,
    closeResult,
    startNewRound,
    clearHistory,
    resetAll,
    eligibleCount: () =>
      getEligibleStudents(state.classes[activeIndex()], state.settings.noRepeat)
        .length,
  };
}

/** Snapshot server/chưa hydrate: ổn định, không chứa dữ liệu ngẫu nhiên. */
const emptyServerState: AppState = {
  version: 1,
  classes: [
    { id: "ssr", name: "", students: [], calledIds: [], cycle: 1 },
  ],
  activeClassId: "ssr",
  templateId: "ufo-pho",
  settings: DEFAULT_SETTINGS,
  history: [],
  pendingTurn: null,
  hydrated: false,
  phase: "idle",
  saveError: null,
};

export type AppStore = ReturnType<typeof createAppStore>;
