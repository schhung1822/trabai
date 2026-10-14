import { describe, expect, it } from "vitest";
import {
  annotateDuplicates,
  applyImport,
  buildImportRows,
  detectLayout,
  foldText,
  matchHeader,
  normalizeName,
  parseGender,
  summarize,
} from "@/lib/import/normalize";
import { parseDelimited, parsePastedText } from "@/lib/import/parse";
import type { Student } from "@/lib/types";

let counter = 0;
const makeId = () => `n${++counter}`;

function run(matrix: string[][]) {
  const layout = detectLayout(matrix);
  return {
    layout,
    rows: buildImportRows(matrix, layout),
  };
}

describe("nhận diện tên cột", () => {
  it.each([
    ["STT", "no"],
    ["Số thứ tự", "no"],
    ["No.", "no"],
    ["No", "no"],
    ["#", "no"],
    ["Họ tên", "name"],
    ["Họ và tên", "name"],
    ["HỌ VÀ TÊN", "name"],
    ["Tên học sinh", "name"],
    ["Full name", "name"],
    ["Giới tính", "gender"],
    ["Gender", "gender"],
    ["Sex", "gender"],
  ])("%s -> %s", (header, key) => {
    expect(matchHeader(header)).toBe(key);
  });
  it("không nhận diện cột lạ", () => {
    expect(matchHeader("Ghi chú")).toBeNull();
    expect(matchHeader("")).toBeNull();
  });
});

describe("giới tính", () => {
  it.each([
    ["Nam", "male"],
    ["nam", "male"],
    ["Male", "male"],
    ["M", "male"],
    ["Nữ", "female"],
    ["NỮ", "female"],
    ["Nu", "female"],
    ["female", "female"],
    ["F", "female"],
    ["", "other"],
    ["Khác", "other"],
  ])("%s -> %s", (raw, gender) => {
    const r = parseGender(raw);
    expect(r.gender).toBe(gender);
    expect(r.unrecognized).toBe(false);
  });
  it("giá trị lạ -> other kèm cờ không nhận diện", () => {
    expect(parseGender("abc")).toEqual({ gender: "other", unrecognized: true });
  });
});

describe("chuẩn hóa tên", () => {
  it("trim, gom khoảng trắng và giữ nguyên dấu tiếng Việt", () => {
    expect(normalizeName("  Nguyễn   Thị  Ánh  ")).toBe("Nguyễn Thị Ánh");
  });
  it("gộp dấu tổ hợp (NFD) về NFC", () => {
    const nfd = "Nguyễn Văn A";
    expect(normalizeName(nfd)).toBe("Nguyễn Văn A".normalize("NFC"));
    expect(normalizeName(nfd)).toBe(nfd.normalize("NFC"));
  });
  it("foldText bỏ dấu để so sánh", () => {
    expect(foldText("Đặng Thị Ngọc")).toBe("dang thi ngoc");
  });
});

describe("đọc văn bản dán / CSV", () => {
  it("TSV từ Excel", () => {
    const m = parseDelimited("STT\tHọ tên\tGiới tính\n1\tNguyễn Văn An\tNam\n2\tTrần Thị Bình\tNữ");
    expect(m).toEqual([
      ["STT", "Họ tên", "Giới tính"],
      ["1", "Nguyễn Văn An", "Nam"],
      ["2", "Trần Thị Bình", "Nữ"],
    ]);
  });
  it("CSV có ngoặc kép, dấu phẩy trong ô, BOM và CRLF", () => {
    const m = parseDelimited('﻿STT,Họ tên\r\n1,"Lê, Văn ""Bi"""\r\n');
    expect(m).toEqual([
      ["STT", "Họ tên"],
      ["1", 'Lê, Văn "Bi"'],
    ]);
  });
  it("CSV dùng dấu chấm phẩy", () => {
    expect(parseDelimited("STT;Họ tên\n1;An")).toEqual([
      ["STT", "Họ tên"],
      ["1", "An"],
    ]);
  });
  it("dán văn bản rỗng báo lỗi", () => {
    expect(() => parsePastedText("   \n ")).toThrow();
  });
});

describe("nhập danh sách", () => {
  it("nhận diện tiêu đề và đọc đủ ba cột", () => {
    const { layout, rows } = run([
      ["STT", "Họ và tên", "Giới tính"],
      ["1", "Nguyễn Văn An", "Nam"],
      ["2", "Trần Thị Bình", "Nữ"],
    ]);
    expect(layout.headerRow).toBe(0);
    expect(layout.mapping).toEqual({ no: 0, name: 1, gender: 2 });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ no: 1, name: "Nguyễn Văn An", gender: "male", status: "ok" });
    expect(rows[1]).toMatchObject({ gender: "female" });
  });

  it("bỏ dòng trống và giữ đúng số dòng gốc để báo lỗi", () => {
    const { rows } = run([
      ["STT", "Họ tên"],
      ["", ""],
      ["1", "An"],
      ["", ""],
      ["3", ""],
    ]);
    expect(rows.map((r) => r.sourceRow)).toEqual([3, 5]);
    expect(rows[1].status).toBe("error");
    expect(rows[1].messages[0]).toMatch(/Thiếu họ tên/);
  });

  it("tìm dòng tiêu đề dù có dòng tiêu đề lớp phía trên", () => {
    const { layout, rows } = run([
      ["DANH SÁCH LỚP 10A1", "", ""],
      ["", "", ""],
      ["No.", "Full name", "Sex"],
      ["1", "Lê Văn C", "M"],
    ]);
    expect(layout.headerRow).toBe(2);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceRow: 4, gender: "male" });
  });

  it("không có tiêu đề: đoán cột STT / tên / giới tính theo nội dung", () => {
    const { layout, rows } = run([
      ["1", "Nguyễn Văn An", "Nam"],
      ["2", "Trần Thị Bình", "Nữ"],
      ["3", "Lê Văn Cường", "Nam"],
    ]);
    expect(layout.headerRow).toBe(-1);
    expect(layout.mapping).toEqual({ no: 0, name: 1, gender: 2 });
    expect(rows).toHaveLength(3);
  });

  it("chỉ một cột tên", () => {
    const { layout, rows } = run([["An"], ["Bình"], ["Cường"]]);
    expect(layout.mapping.name).toBe(0);
    expect(rows.map((r) => r.name)).toEqual(["An", "Bình", "Cường"]);
  });

  it("thiếu STT thì tự gán, tránh số đã dùng", () => {
    const { rows } = run([
      ["STT", "Họ tên"],
      ["2", "An"],
      ["", "Bình"],
      ["1", "Cường"],
      ["", "Dũng"],
    ]);
    const res = applyImport(rows, "replace", [], makeId);
    expect(res.students.map((s) => [s.name, s.no])).toEqual([
      ["An", 2],
      ["Bình", 3],
      ["Cường", 1],
      ["Dũng", 4],
    ]);
  });

  it("STT không hợp lệ -> cảnh báo và tự gán", () => {
    const { rows } = run([
      ["STT", "Họ tên"],
      ["abc", "An"],
    ]);
    expect(rows[0].status).toBe("warning");
    expect(rows[0].no).toBeNull();
  });

  it("giới tính lạ -> cảnh báo nhưng vẫn nhập", () => {
    const { rows } = run([
      ["Họ tên", "Giới tính"],
      ["An", "???"],
    ]);
    expect(rows[0].status).toBe("warning");
    expect(rows[0].gender).toBe("other");
  });

  it("cảnh báo (không xóa) khi trùng STT hoặc trùng họ tên", () => {
    const { rows } = run([
      ["STT", "Họ tên"],
      ["1", "Nguyễn Văn An"],
      ["1", "Trần Bình"],
      ["3", "nguyễn văn an"],
    ]);
    const marked = annotateDuplicates(rows);
    expect(marked.every((r) => r.status === "warning")).toBe(true);
    expect(marked[0].messages.join(" ")).toMatch(/Trùng STT 1/);
    expect(marked[2].messages.join(" ")).toMatch(/Trùng họ tên/);
    const res = applyImport(marked, "replace", [], makeId);
    expect(res.students).toHaveLength(3); // không tự xóa
    expect(new Set(res.students.map((s) => s.id)).size).toBe(3);
    const sum = summarize(marked);
    expect(sum).toEqual({ total: 3, ok: 0, warnings: 3, errors: 0 });
  });

  it("dòng lỗi bị bỏ qua, báo đúng số thành công/bỏ qua", () => {
    const { rows } = run([
      ["STT", "Họ tên"],
      ["1", "An"],
      ["2", ""],
      ["3", "Cường"],
    ]);
    const res = applyImport(rows, "replace", [], makeId);
    expect(res.imported).toBe(2);
    expect(res.skipped).toBe(1);
  });

  it("chế độ thêm vào: giữ nguyên danh sách cũ, cảnh báo trùng với lớp hiện có", () => {
    const existing: Student[] = [
      { id: "old1", no: 1, name: "Nguyễn Văn An", gender: "male", present: false },
      { id: "old2", no: 2, name: "Trần Bình", gender: "female", present: true },
    ];
    const { rows } = run([
      ["STT", "Họ tên"],
      ["2", "Lê Cường"],
      ["", "Nguyễn Văn An"],
    ]);
    const marked = annotateDuplicates(rows, existing);
    expect(marked[0].messages.join(" ")).toMatch(/Trùng STT 2 với học sinh đã có/);
    expect(marked[1].messages.join(" ")).toMatch(/Trùng họ tên với học sinh đã có/);
    const res = applyImport(marked, "append", existing, makeId);
    expect(res.students).toHaveLength(4);
    expect(res.students.slice(0, 2)).toEqual(existing);
    // STT tự gán không đè STT đã có
    expect(res.students[3].no).toBe(3);
  });

  it("chế độ thay thế bỏ danh sách cũ", () => {
    const existing: Student[] = [
      { id: "old1", no: 1, name: "Cũ", gender: "other", present: true },
    ];
    const { rows } = run([["Họ tên"], ["Mới"]]);
    const res = applyImport(rows, "replace", existing, makeId);
    expect(res.students.map((s) => s.name)).toEqual(["Mới"]);
  });

  it("giữ nguyên tiếng Việt qua toàn bộ quy trình dán", () => {
    const text = "STT\tHọ tên\tGiới tính\n1\t  Đặng  Thị Ngọc Ánh \tNữ";
    const [sheet] = parsePastedText(text);
    const layout = detectLayout(sheet.matrix);
    const rows = buildImportRows(sheet.matrix, layout);
    expect(rows[0].name).toBe("Đặng Thị Ngọc Ánh");
    expect(rows[0].gender).toBe("female");
  });
});
