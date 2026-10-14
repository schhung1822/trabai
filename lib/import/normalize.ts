import type { Gender, Student } from "../types";

/* ------------------------------------------------------------------ */
/* Chuẩn hóa văn bản                                                   */
/* ------------------------------------------------------------------ */

/** Bỏ dấu, hạ chữ thường, gom khoảng trắng – chỉ dùng để SO SÁNH, không để hiển thị. */
export function foldText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

/** Trim, gom khoảng trắng, chuẩn hóa NFC để giữ nguyên dấu tiếng Việt. */
export function normalizeName(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/* Giới tính                                                           */
/* ------------------------------------------------------------------ */

const MALE = new Set(["nam", "male", "m", "trai", "boy", "nam sinh", "con trai"]);
const FEMALE = new Set(["nu", "female", "f", "gai", "girl", "nu sinh", "con gai"]);
const OTHER = new Set([
  "khac",
  "other",
  "chua ro",
  "chua cung cap",
  "x",
  "none",
  "unknown",
]);

export interface GenderResult {
  gender: Gender;
  /** true nếu có giá trị nhưng không nhận diện được. */
  unrecognized: boolean;
}

export function parseGender(raw: string): GenderResult {
  if (raw.trim() === "") return { gender: "other", unrecognized: false };
  const key = foldText(raw);
  if (MALE.has(key)) return { gender: "male", unrecognized: false };
  if (FEMALE.has(key)) return { gender: "female", unrecognized: false };
  if (OTHER.has(key)) return { gender: "other", unrecognized: false };
  return { gender: "other", unrecognized: true };
}

/* ------------------------------------------------------------------ */
/* Nhận diện cột                                                       */
/* ------------------------------------------------------------------ */

export type ColumnKey = "no" | "name" | "gender";

const HEADER_ALIASES: Record<ColumnKey, readonly string[]> = {
  no: ["stt", "so thu tu", "no", "so tt", "tt", "#", "stt hs", "ma so"],
  name: [
    "ho ten",
    "ho va ten",
    "ten hoc sinh",
    "ho ten hoc sinh",
    "ho va ten hoc sinh",
    "full name",
    "fullname",
    "name",
    "student name",
    "student",
    "ten",
    "hoc sinh",
  ],
  gender: ["gioi tinh", "gender", "sex", "gt", "phai"],
};

/** Trả về cột mà ô tiêu đề này thuộc về, hoặc null. */
export function matchHeader(cell: string): ColumnKey | null {
  const key = foldText(cell);
  if (!key) return null;
  for (const col of Object.keys(HEADER_ALIASES) as ColumnKey[]) {
    if (HEADER_ALIASES[col].includes(key)) return col;
  }
  return null;
}

export interface ColumnMapping {
  no: number | null;
  name: number | null;
  gender: number | null;
}

export interface DetectedLayout {
  /** Chỉ số dòng tiêu đề trong ma trận, hoặc -1 nếu không có tiêu đề. */
  headerRow: number;
  mapping: ColumnMapping;
  /** true nếu cột Họ tên được nhận diện từ tiêu đề hoặc đoán khá chắc. */
  confident: boolean;
}

const isBlank = (v: string | undefined) => !v || v.trim() === "";
const isIntLike = (v: string) => /^\d{1,4}(\.0+)?\.?$/.test(v.trim());

/** Tìm dòng tiêu đề trong 10 dòng đầu (có thể có dòng tiêu đề lớp phía trên). */
export function detectLayout(matrix: readonly string[][]): DetectedLayout {
  const scan = Math.min(matrix.length, 10);
  for (let r = 0; r < scan; r++) {
    const mapping: ColumnMapping = { no: null, name: null, gender: null };
    matrix[r].forEach((cell, c) => {
      const k = matchHeader(cell ?? "");
      if (k && mapping[k] === null) mapping[k] = c;
    });
    if (mapping.name !== null) {
      return { headerRow: r, mapping, confident: true };
    }
  }

  // Không có tiêu đề: đoán theo nội dung.
  const data = matrix.filter((row) => row.some((c) => !isBlank(c)));
  const width = data.reduce((m, r) => Math.max(m, r.length), 0);
  const mapping: ColumnMapping = { no: null, name: null, gender: null };
  if (width === 0) return { headerRow: -1, mapping, confident: false };

  const sample = data.slice(0, 50);
  let bestName = -1;
  let bestNameScore = 0;
  for (let c = 0; c < width; c++) {
    const vals = sample.map((r) => (r[c] ?? "").trim()).filter(Boolean);
    if (vals.length === 0) continue;
    const intRatio = vals.filter(isIntLike).length / vals.length;
    const genderRatio =
      vals.filter((v) => {
        const k = foldText(v);
        return MALE.has(k) || FEMALE.has(k) || OTHER.has(k);
      }).length / vals.length;
    if (mapping.no === null && intRatio >= 0.8) {
      mapping.no = c;
      continue;
    }
    if (mapping.gender === null && genderRatio >= 0.7) {
      mapping.gender = c;
      continue;
    }
    const textRatio = 1 - intRatio;
    const avgLen = vals.reduce((s, v) => s + v.length, 0) / vals.length;
    const score = textRatio * avgLen * vals.length;
    if (score > bestNameScore) {
      bestNameScore = score;
      bestName = c;
    }
  }
  if (bestName >= 0) mapping.name = bestName;

  // Cột đầu có vẻ là tiêu đề tự đặt (vd. "Tên em") khi nhiều cột và ô đầu không phải số.
  const first = data[0] ?? [];
  const firstLooksLikeHeader =
    width > 1 &&
    first.length > 0 &&
    !isIntLike(first[mapping.no ?? 0] ?? "") &&
    mapping.no !== null;
  return {
    headerRow: firstLooksLikeHeader ? matrix.indexOf(first) : -1,
    mapping,
    confident: mapping.name !== null && width === 1,
  };
}

/* ------------------------------------------------------------------ */
/* Dòng nhập                                                           */
/* ------------------------------------------------------------------ */

export type RowStatus = "ok" | "warning" | "error";

export interface ImportRow {
  /** Số dòng (bắt đầu từ 1) trong bảng gốc, để báo lỗi dễ tìm. */
  sourceRow: number;
  name: string;
  /** null nếu thiếu hoặc không hợp lệ -> sẽ được tự gán. */
  no: number | null;
  gender: Gender;
  status: RowStatus;
  messages: string[];
}

export const MAX_NAME_LENGTH = 80;

export interface BuildOptions {
  headerRow: number;
  mapping: ColumnMapping;
  /** Số dòng bị lệch so với bảng gốc (dòng đầu của sheet không phải dòng 1). */
  rowOffset?: number;
}

/** Chuyển ma trận thô thành các dòng đã chuẩn hóa + lỗi từng dòng. */
export function buildImportRows(
  matrix: readonly string[][],
  { headerRow, mapping, rowOffset = 0 }: BuildOptions,
): ImportRow[] {
  const rows: ImportRow[] = [];
  const start = headerRow + 1;
  for (let r = start; r < matrix.length; r++) {
    const cells = matrix[r];
    if (cells.every(isBlank)) continue; // bỏ dòng trống
    const messages: string[] = [];
    let status: RowStatus = "ok";
    const warn = (m: string) => {
      messages.push(m);
      if (status === "ok") status = "warning";
    };
    const fail = (m: string) => {
      messages.push(m);
      status = "error";
    };

    const rawName = mapping.name !== null ? (cells[mapping.name] ?? "") : "";
    const name = normalizeName(rawName);
    if (!name) fail("Thiếu họ tên");
    else if (name.length > MAX_NAME_LENGTH)
      fail(`Họ tên dài quá ${MAX_NAME_LENGTH} ký tự`);

    let no: number | null = null;
    if (mapping.no !== null) {
      const rawNo = (cells[mapping.no] ?? "").trim();
      if (rawNo) {
        if (isIntLike(rawNo) && Number(rawNo.replace(/\.+$/, "")) > 0) {
          no = Math.round(Number(rawNo.replace(/\.+$/, "")));
        } else {
          warn(`STT "${rawNo}" không hợp lệ, sẽ tự gán`);
        }
      }
    }

    let gender: Gender = "other";
    if (mapping.gender !== null) {
      const g = parseGender(cells[mapping.gender] ?? "");
      gender = g.gender;
      if (g.unrecognized)
        warn(
          `Giới tính "${(cells[mapping.gender] ?? "").trim()}" không nhận diện được, đặt là "Chưa rõ"`,
        );
    }

    rows.push({
      sourceRow: r + 1 + rowOffset,
      name,
      no,
      gender,
      status,
      messages,
    });
  }
  return rows;
}

/**
 * Gắn cảnh báo trùng STT / trùng họ tên (không xóa gì cả – có thể là hai bạn khác nhau).
 * `existing` là danh sách hiện có khi chế độ "Thêm vào danh sách".
 */
export function annotateDuplicates(
  rows: readonly ImportRow[],
  existing: readonly Student[] = [],
): ImportRow[] {
  const noSeen = new Map<number, number[]>();
  const nameSeen = new Map<string, number[]>();
  rows.forEach((row, i) => {
    if (row.status === "error") return;
    if (row.no !== null) {
      const l = noSeen.get(row.no) ?? [];
      l.push(i);
      noSeen.set(row.no, l);
    }
    const key = foldText(row.name);
    const l = nameSeen.get(key) ?? [];
    l.push(i);
    nameSeen.set(key, l);
  });
  const existingNo = new Set(existing.map((s) => s.no));
  const existingName = new Set(existing.map((s) => foldText(s.name)));

  return rows.map((row, i) => {
    if (row.status === "error") return row;
    const extra: string[] = [];
    if (row.no !== null) {
      const same = noSeen.get(row.no) ?? [];
      if (same.length > 1) {
        const others = same
          .filter((j) => j !== i)
          .map((j) => rows[j].sourceRow)
          .join(", ");
        extra.push(`Trùng STT ${row.no} với dòng ${others}`);
      } else if (existingNo.has(row.no)) {
        extra.push(`Trùng STT ${row.no} với học sinh đã có trong lớp`);
      }
    }
    const key = foldText(row.name);
    const sameName = nameSeen.get(key) ?? [];
    if (sameName.length > 1) {
      const others = sameName
        .filter((j) => j !== i)
        .map((j) => rows[j].sourceRow)
        .join(", ");
      extra.push(`Trùng họ tên với dòng ${others}`);
    } else if (existingName.has(key)) {
      extra.push("Trùng họ tên với học sinh đã có trong lớp");
    }
    if (extra.length === 0) return row;
    return {
      ...row,
      status: "warning",
      messages: [...row.messages, ...extra],
    };
  });
}

export interface ImportSummary {
  total: number;
  ok: number;
  warnings: number;
  errors: number;
}

export function summarize(rows: readonly ImportRow[]): ImportSummary {
  let ok = 0;
  let warnings = 0;
  let errors = 0;
  for (const r of rows) {
    if (r.status === "ok") ok++;
    else if (r.status === "warning") warnings++;
    else errors++;
  }
  return { total: rows.length, ok, warnings, errors };
}

export type ImportMode = "replace" | "append";

export interface ImportResult {
  /** Danh sách học sinh sau khi nhập. */
  students: Student[];
  imported: number;
  skipped: number;
}

/**
 * Áp dụng các dòng hợp lệ. Dòng lỗi bị bỏ qua, dòng cảnh báo vẫn được nhập.
 * Thiếu STT thì tự gán số tiếp theo chưa dùng.
 */
export function applyImport(
  rows: readonly ImportRow[],
  mode: ImportMode,
  existing: readonly Student[],
  makeId: () => string,
): ImportResult {
  const base = mode === "append" ? existing : [];
  const valid = rows.filter((r) => r.status !== "error");
  const used = new Set<number>(base.map((s) => s.no));
  for (const r of valid) if (r.no !== null) used.add(r.no);
  let next = 1;
  const nextFree = () => {
    while (used.has(next)) next++;
    used.add(next);
    return next;
  };
  const added: Student[] = valid.map((r) => ({
    id: makeId(),
    no: r.no ?? nextFree(),
    name: r.name,
    gender: r.gender,
    present: true,
  }));
  return {
    students: [...base, ...added],
    imported: added.length,
    skipped: rows.length - valid.length,
  };
}
