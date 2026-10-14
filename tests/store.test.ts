import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppStore, type StoreDeps } from "@/store/create-store";
import {
  STORAGE_VERSION,
  migrate,
  sanitizeSettings,
  type LoadResult,
} from "@/lib/storage";
import type { PersistedState } from "@/lib/types";

function makeStore(overrides: Partial<StoreDeps> = {}) {
  let saved: PersistedState | null = null;
  const notify = vi.fn();
  const deps: StoreDeps = {
    load: () => (saved ? { status: "ok", state: structuredClone(saved) } : { status: "empty" }),
    save: (s) => {
      saved = structuredClone(s);
      return { ok: true };
    },
    now: () => new Date("2026-01-01T00:00:00Z"),
    notify,
    ...overrides,
  };
  return { store: createAppStore(deps), deps, notify, getSaved: () => saved };
}

describe("store: hydrate & dữ liệu demo", () => {
  it("lần đầu mở: tạo lớp demo ~20 học sinh và lưu lại", () => {
    const { store, getSaved } = makeStore();
    expect(store.getState().hydrated).toBe(false);
    store.hydrate();
    const s = store.getState();
    expect(s.hydrated).toBe(true);
    expect(s.classes).toHaveLength(1);
    expect(s.classes[0].students).toHaveLength(20);
    expect(getSaved()?.classes[0].students).toHaveLength(20);
  });

  it("localStorage không dùng được: vẫn chạy, báo lỗi lưu", () => {
    const { store } = makeStore({
      load: () => ({ status: "unavailable", reason: "blocked" }),
      save: () => ({ ok: false, reason: "blocked" }),
    });
    store.hydrate();
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().saveError).toBe("blocked");
    expect(store.getState().classes[0].students.length).toBeGreaterThan(0);
    // thao tác vẫn hoạt động
    expect(store.addStudent({ name: "Bạn mới", gender: "other" })).toBe(true);
  });

  it("dữ liệu hỏng: khởi tạo lại và thông báo, không crash", () => {
    const { store, notify } = makeStore({
      load: () => ({ status: "corrupt", reason: "bad json" }) as LoadResult,
    });
    store.hydrate();
    expect(store.getState().classes[0].students).toHaveLength(20);
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/bị lỗi/), "error");
  });
});

describe("store: lượt gọi bài", () => {
  let ctx: ReturnType<typeof makeStore>;
  beforeEach(() => {
    ctx = makeStore();
    ctx.store.hydrate();
  });

  it("chốt kết quả một lần: đúng số lượng, lưu lượt chờ + lịch sử + đã gọi", () => {
    const { store } = ctx;
    const r = store.beginTurn();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = store.getState();
    expect(r.turn.picked).toHaveLength(2);
    expect(s.pendingTurn).toEqual(r.turn);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].picked.map((p) => p.id)).toEqual(r.turn.picked.map((p) => p.id));
    expect(s.classes[0].calledIds.sort()).toEqual(r.turn.picked.map((p) => p.id).sort());
    expect(s.phase).toBe("arriving");
  });

  it("bấm liên tục không tạo nhiều lượt", () => {
    const { store } = ctx;
    const first = store.beginTurn();
    const second = store.beginTurn();
    const third = store.beginTurn();
    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: "busy" });
    expect(third).toEqual({ ok: false, reason: "busy" });
    expect(store.getState().history).toHaveLength(1);
    expect(store.getState().classes[0].calledIds).toHaveLength(2);
  });

  it("không tạo lượt mới khi bảng kết quả đang mở (completed)", () => {
    const { store } = ctx;
    store.beginTurn();
    store.skipToCompleted();
    expect(store.getState().phase).toBe("completed");
    expect(store.beginTurn()).toEqual({ ok: false, reason: "busy" });
    store.closeResult();
    expect(store.getState().phase).toBe("idle");
    expect(store.getState().pendingTurn).toBeNull();
    expect(store.beginTurn().ok).toBe(true);
  });

  it("state machine đi đúng thứ tự và bỏ qua advance sai giai đoạn", () => {
    const { store } = ctx;
    store.beginTurn();
    expect(store.advance("scanning")).toBe(false); // sai giai đoạn
    expect(store.advance("arriving")).toBe(true);
    expect(store.getState().phase).toBe("scanning");
    expect(store.advance("arriving")).toBe(false); // gọi trùng
    store.advance("scanning");
    store.advance("abducting");
    store.advance("revealing");
    expect(store.getState().phase).toBe("completed");
    expect(store.advance("completed")).toBe(false);
  });

  it("bỏ qua hoạt cảnh giữ nguyên kết quả đã chốt", () => {
    const { store } = ctx;
    const r = store.beginTurn();
    if (!r.ok) throw new Error("expected ok");
    const before = store.getState().pendingTurn;
    store.advance("arriving");
    expect(store.skipToCompleted()).toBe(true);
    expect(store.getState().pendingTurn).toEqual(before);
    expect(store.getState().history).toHaveLength(1);
  });

  it("khóa sửa lớp / danh sách / thiết lập trong lúc chạy", () => {
    const { store, notify } = ctx;
    store.beginTurn();
    const before = store.getState();
    expect(store.createClass("Lớp X")).toBeNull();
    store.renameClass(before.activeClassId, "Tên khác");
    store.deleteClass(before.activeClassId);
    expect(store.addStudent({ name: "A", gender: "male" })).toBe(false);
    store.removeStudent(before.classes[0].students[0].id);
    store.setSettings({ pickCount: 5 });
    store.setTemplate("san-truong");
    expect(store.getState().classes).toBe(before.classes);
    expect(store.getState().settings).toBe(before.settings);
    expect(store.getState().templateId).toBe(before.templateId);
    expect(notify).toHaveBeenCalled();
    // Riêng âm thanh vẫn đổi được
    store.setSettings({ soundOn: false });
    expect(store.getState().settings.soundOn).toBe(false);
  });

  it("khôi phục kết quả sau khi tải lại trang giữa hoạt cảnh", () => {
    const { store, deps } = ctx;
    const r = store.beginTurn();
    if (!r.ok) throw new Error("expected ok");
    store.advance("arriving"); // đang scanning thì "reload"
    const reloaded = createAppStore(deps);
    reloaded.hydrate();
    const s = reloaded.getState();
    expect(s.phase).toBe("completed");
    expect(s.pendingTurn).toEqual(r.turn);
    // không tạo thêm lượt, không mất lượt
    expect(s.history).toHaveLength(1);
    expect(reloaded.beginTurn()).toEqual({ ok: false, reason: "busy" });
    reloaded.closeResult();
    expect(reloaded.getState().pendingTurn).toBeNull();
    expect(reloaded.getState().classes[0].calledIds).toHaveLength(2);
  });

  it("không gọi lặp trong vòng; hết người thì yêu cầu người dùng quyết định", () => {
    const { store } = ctx;
    store.setSettings({ pickCount: 5 });
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const r = store.beginTurn();
      if (!r.ok) throw new Error("expected ok");
      for (const p of r.turn.picked) {
        expect(seen.has(p.id)).toBe(false);
        seen.add(p.id);
      }
      store.skipToCompleted();
      store.closeResult();
    }
    expect(seen.size).toBe(20);
    const next = store.beginTurn();
    expect(next.ok).toBe(false);
    if (!next.ok && next.reason === "plan") expect(next.plan.kind).toBe("exhausted");
    // chưa bị tự reset
    expect(store.getState().classes[0].calledIds).toHaveLength(20);
    store.startNewRound();
    expect(store.getState().classes[0].calledIds).toHaveLength(0);
    expect(store.getState().classes[0].cycle).toBe(2);
    expect(store.beginTurn().ok).toBe(true);
  });

  it("còn lại ít hơn số cần gọi: có thể gọi số còn lại bằng count riêng", () => {
    const { store } = ctx;
    store.setSettings({ pickCount: 7 });
    for (let i = 0; i < 2; i++) {
      store.beginTurn();
      store.skipToCompleted();
      store.closeResult();
    }
    // đã gọi 14, còn 6 < 7
    const blocked = store.beginTurn();
    expect(blocked.ok).toBe(false);
    if (!blocked.ok && blocked.reason === "plan") {
      expect(blocked.plan).toEqual({ kind: "insufficient", count: 7, eligible: 6 });
    }
    const rest = store.beginTurn({ count: 6 });
    expect(rest.ok).toBe(true);
    if (rest.ok) expect(rest.turn.picked).toHaveLength(6);
    // cài đặt số người gọi không bị ghi đè
    expect(store.getState().settings.pickCount).toBe(7);
  });

  it("không chọn học sinh vắng", () => {
    const { store } = ctx;
    const cls = store.getState().classes[0];
    cls.students.slice(0, 17).forEach((s) => store.updateStudent(s.id, { present: false }));
    const presentIds = new Set(
      store.getState().classes[0].students.filter((s) => s.present).map((s) => s.id),
    );
    expect(presentIds.size).toBe(3);
    store.setSettings({ pickCount: 3 });
    const r = store.beginTurn();
    if (!r.ok) throw new Error("expected ok");
    for (const p of r.turn.picked) expect(presentIds.has(p.id)).toBe(true);
  });

  it("xóa học sinh dọn luôn danh sách đã gọi", () => {
    const { store } = ctx;
    const r = store.beginTurn();
    if (!r.ok) throw new Error("expected ok");
    store.skipToCompleted();
    store.closeResult();
    store.removeStudent(r.turn.picked[0].id);
    expect(store.getState().classes[0].calledIds).not.toContain(r.turn.picked[0].id);
  });

  it("xóa lớp cuối cùng vẫn còn một lớp trống", () => {
    const { store } = ctx;
    store.deleteClass(store.getState().activeClassId);
    expect(store.getState().classes).toHaveLength(1);
    expect(store.getState().classes[0].students).toHaveLength(0);
    expect(store.getState().activeClassId).toBe(store.getState().classes[0].id);
  });
});

describe("lưu trữ & migrate", () => {
  it("làm sạch dữ liệu thiếu / sai kiểu mà không ném lỗi", () => {
    const state = migrate({
      version: 0,
      classes: [
        {
          id: "c",
          name: "  ",
          students: [
            { id: "a", name: "An", no: "x", gender: "??", present: "yes" },
            { id: "a", name: "Bình" },
            { name: "" },
            null,
          ],
          calledIds: ["a", "ghost", "a"],
          cycle: -3,
        },
        "rác",
      ],
      activeClassId: "không-tồn-tại",
      settings: { pickCount: 99999, speed: "turbo", noRepeat: "x" },
      history: [{ picked: [] }, 5],
      pendingTurn: { classId: "nope", picked: [{ id: "a", name: "An" }] },
    });
    expect(state).not.toBeNull();
    if (!state) return;
    expect(state.version).toBe(STORAGE_VERSION);
    expect(state.classes).toHaveLength(1);
    const c = state.classes[0];
    expect(c.name).toBe("Lớp chưa đặt tên");
    expect(c.students).toHaveLength(2);
    expect(new Set(c.students.map((s) => s.id)).size).toBe(2); // id trùng được cấp lại
    expect(c.students[0].gender).toBe("other");
    expect(c.students[0].present).toBe(true);
    expect(c.calledIds).toEqual(["a"]);
    expect(c.cycle).toBe(1);
    expect(state.activeClassId).toBe("c");
    expect(state.settings.pickCount).toBe(200);
    expect(state.settings.speed).toBe("normal");
    expect(state.settings.effect).toBe("single");
    expect(state.pendingTurn).toBeNull();
    expect(state.history).toEqual([]);
  });

  it("từ chối dữ liệu không dùng được", () => {
    expect(migrate(null)).toBeNull();
    expect(migrate("x")).toBeNull();
    expect(migrate({ classes: [] })).toBeNull();
  });

  it("thiết lập hợp lệ giữ nguyên", () => {
    expect(
      sanitizeSettings({ pickCount: 3, noRepeat: false, speed: "fast", effect: "siege", soundOn: false, speechBubbles: false }),
    ).toEqual({ pickCount: 3, noRepeat: false, speed: "fast", effect: "siege", soundOn: false, speechBubbles: false });
    // dữ liệu cũ chưa có effect => mặc định "bắt lẻ"; giá trị lạ cũng về mặc định
    expect(sanitizeSettings({ pickCount: 2 }).effect).toBe("single");
    expect(sanitizeSettings({ effect: "boom" }).effect).toBe("single");
  });
});
