import { describe, expect, it } from "vitest";
import {
  hashString,
  sampleWithoutReplacement,
  secureRandomInt,
  seededRandom,
} from "@/lib/random";
import {
  getEligibleStudents,
  markCalled,
  maxPickCount,
  pickStudents,
  planTurn,
  startNewCycle,
} from "@/lib/selection";
import { DEFAULT_SETTINGS, type ClassRoom, type Student } from "@/lib/types";

function makeClass(n: number, opts: Partial<ClassRoom> = {}): ClassRoom {
  const students: Student[] = Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    no: i + 1,
    // Cố ý trùng họ tên để chắc chắn id mới là định danh.
    name: i % 2 === 0 ? "Nguyễn Văn An" : `Học sinh ${i + 1}`,
    gender: "other",
    present: true,
  }));
  return { id: "c1", name: "Lớp thử", students, calledIds: [], cycle: 1, ...opts };
}

describe("sampleWithoutReplacement", () => {
  it("chọn đúng số lượng, không trùng, không đổi mảng gốc", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const copy = items.slice();
    for (let k = 0; k <= 30; k++) {
      const out = sampleWithoutReplacement(items, k);
      expect(out).toHaveLength(k);
      expect(new Set(out).size).toBe(k);
    }
    expect(items).toEqual(copy);
  });

  it("từ chối số lượng không hợp lệ", () => {
    expect(() => sampleWithoutReplacement([1, 2], 3)).toThrow();
    expect(() => sampleWithoutReplacement([1, 2], -1)).toThrow();
    expect(() => sampleWithoutReplacement([1, 2], 1.5)).toThrow();
  });

  it("mỗi phần tử có xác suất được chọn như nhau (kiểm tra thống kê)", () => {
    const n = 10;
    const k = 3;
    const trials = 60000;
    const items = Array.from({ length: n }, (_, i) => i);
    const hits = new Array(n).fill(0);
    for (let t = 0; t < trials; t++) {
      for (const x of sampleWithoutReplacement(items, k)) hits[x]++;
    }
    const expected = (trials * k) / n; // 18000
    // sai số chuẩn ≈ sqrt(trials*p*(1-p)) ≈ 112; cho phép ~6 sigma
    for (const h of hits) expect(Math.abs(h - expected)).toBeLessThan(700);
  });

  it("không có thiên lệch vị trí: phần tử đầu và cuối đều có cơ hội như nhau", () => {
    const items = [0, 1, 2, 3, 4];
    const first = new Array(5).fill(0);
    const trials = 50000;
    for (let t = 0; t < trials; t++) {
      first[sampleWithoutReplacement(items, 1)[0]]++;
    }
    for (const h of first) expect(Math.abs(h - trials / 5)).toBeLessThan(600);
  });

  it("dùng randomInt được tiêm vào (xác định được để kiểm thử)", () => {
    // randomInt luôn trả 0 => Fisher–Yates từng phần giữ nguyên thứ tự đầu vào.
    expect(sampleWithoutReplacement([1, 2, 3, 4], 3, () => 0)).toEqual([1, 2, 3]);
  });
});

describe("secureRandomInt", () => {
  it("luôn nằm trong [0, max)", () => {
    for (let i = 0; i < 5000; i++) {
      const v = secureRandomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(secureRandomInt(1)).toBe(0);
  });
  it("từ chối max không hợp lệ", () => {
    expect(() => secureRandomInt(0)).toThrow();
    expect(() => secureRandomInt(-3)).toThrow();
    expect(() => secureRandomInt(2.5)).toThrow();
  });
});

describe("hash/seeded (ổn định theo id)", () => {
  it("cùng id cho cùng kết quả", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
    const a = seededRandom(hashString("x"));
    const b = seededRandom(hashString("x"));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("tập đủ điều kiện", () => {
  it("loại học sinh vắng", () => {
    const cls = makeClass(10);
    cls.students[0].present = false;
    cls.students[5].present = false;
    const ids = getEligibleStudents(cls, true).map((s) => s.id);
    expect(ids).not.toContain("s1");
    expect(ids).not.toContain("s6");
    expect(ids).toHaveLength(8);
  });

  it("không bao giờ chọn học sinh vắng", () => {
    const cls = makeClass(12);
    for (const i of [0, 3, 4, 9]) cls.students[i].present = false;
    for (let t = 0; t < 2000; t++) {
      const picked = pickStudents(cls, false, 5);
      for (const s of picked) expect(s.present).toBe(true);
    }
  });

  it("chế độ không lặp loại học sinh đã gọi; tắt chế độ thì không loại", () => {
    const cls = markCalled(makeClass(6), ["s1", "s2"]);
    expect(getEligibleStudents(cls, true).map((s) => s.id)).toEqual([
      "s3",
      "s4",
      "s5",
      "s6",
    ]);
    expect(getEligibleStudents(cls, false)).toHaveLength(6);
  });

  it("hai học sinh trùng họ tên vẫn là hai người độc lập", () => {
    const cls = makeClass(4); // s1 và s3 cùng tên
    const called = markCalled(cls, ["s1"]);
    const ids = getEligibleStudents(called, true).map((s) => s.id);
    expect(ids).toContain("s3");
    expect(ids).not.toContain("s1");
  });
});

describe("vòng không lặp – mô phỏng nhiều lượt", () => {
  it("gọi hết cả lớp đúng một lần mỗi người trong một vòng", () => {
    let cls = makeClass(20);
    const seen: string[] = [];
    const settings = { ...DEFAULT_SETTINGS, pickCount: 4, noRepeat: true };
    for (let turn = 0; turn < 5; turn++) {
      const plan = planTurn(cls, settings);
      expect(plan.kind).toBe("ready");
      const picked = pickStudents(cls, true, settings.pickCount);
      expect(picked).toHaveLength(4);
      seen.push(...picked.map((s) => s.id));
      cls = markCalled(cls, picked.map((s) => s.id));
    }
    expect(new Set(seen).size).toBe(20);
    expect(seen).toHaveLength(20);
    expect(planTurn(cls, settings).kind).toBe("exhausted");
  });

  it("không chọn trùng trong cùng một lượt", () => {
    const cls = makeClass(8);
    for (let t = 0; t < 1000; t++) {
      const ids = pickStudents(cls, true, 8).map((s) => s.id);
      expect(new Set(ids).size).toBe(8);
    }
  });

  it("khi không đủ người: báo 'insufficient' thay vì chọn trùng hay tự reset", () => {
    const cls = markCalled(makeClass(5), ["s1", "s2", "s3", "s4"]);
    const plan = planTurn(cls, { ...DEFAULT_SETTINGS, pickCount: 2 });
    expect(plan).toEqual({ kind: "insufficient", count: 2, eligible: 1 });
    // Chưa ai bị reset
    expect(cls.calledIds).toHaveLength(4);
    // Việc chọn trực tiếp với count lớn hơn cũng bị chặn
    expect(() => pickStudents(cls, true, 2)).toThrow();
  });

  it("bắt đầu vòng mới đưa tất cả trở lại và tăng số vòng", () => {
    const cls = markCalled(makeClass(5), ["s1", "s2", "s3", "s4", "s5"]);
    const next = startNewCycle(cls);
    expect(next.calledIds).toEqual([]);
    expect(next.cycle).toBe(cls.cycle + 1);
    expect(getEligibleStudents(next, true)).toHaveLength(5);
  });

  it("markCalled không tạo id lặp", () => {
    const cls = markCalled(markCalled(makeClass(3), ["s1"]), ["s1", "s2"]);
    expect(cls.calledIds.sort()).toEqual(["s1", "s2"]);
  });
});

describe("planTurn", () => {
  it("lớp trống / không ai có mặt", () => {
    expect(planTurn(makeClass(0), DEFAULT_SETTINGS).kind).toBe("no-students");
    const cls = makeClass(3);
    cls.students.forEach((s) => (s.present = false));
    expect(planTurn(cls, DEFAULT_SETTINGS).kind).toBe("no-students");
  });

  it("số người gọi vượt số học sinh có mặt", () => {
    const cls = makeClass(3);
    expect(planTurn(cls, { ...DEFAULT_SETTINGS, pickCount: 4 })).toEqual({
      kind: "count-too-high",
      count: 4,
      present: 3,
    });
    expect(maxPickCount(cls)).toBe(3);
  });

  it("tắt không lặp thì luôn gọi được dù đã gọi hết", () => {
    const cls = markCalled(makeClass(3), ["s1", "s2", "s3"]);
    expect(
      planTurn(cls, { ...DEFAULT_SETTINGS, pickCount: 2, noRepeat: false }).kind,
    ).toBe("ready");
  });

  it("lớp 100 học sinh vẫn chọn đúng", () => {
    const cls = makeClass(100);
    const picked = pickStudents(cls, true, 7);
    expect(new Set(picked.map((s) => s.id)).size).toBe(7);
  });
});
