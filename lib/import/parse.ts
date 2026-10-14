/** Đọc file bảng tính / văn bản dán thành ma trận chuỗi. Toàn bộ chạy ở trình duyệt. */

export interface ParsedSheet {
  name: string;
  matrix: string[][];
  /** Số dòng bị lệch giữa chỉ số ma trận và số dòng thật trong sheet. */
  rowOffset: number;
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".tsv", ".txt"];

export class ImportError extends Error {}

/** Đọc văn bản có dấu phân tách (CSV/TSV) thành ma trận, hỗ trợ ô trong ngoặc kép. */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const count = (ch: string) => firstLine.split(ch).length - 1;
  let delimiter = ",";
  if (count("\t") > 0) delimiter = "\t";
  else if (count(";") > count(",")) delimiter = ";";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim()));
}

/** Giải mã byte của CSV: ưu tiên UTF-8, nếu lỗi thì thử Windows-1258 (tiếng Việt cũ). */
export function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    try {
      return new TextDecoder("windows-1258").decode(buffer);
    } catch {
      return new TextDecoder("utf-8").decode(buffer);
    }
  }
}

export function parsePastedText(text: string): ParsedSheet[] {
  if (!text.trim()) throw new ImportError("Chưa có dữ liệu để nhập.");
  return [{ name: "Dữ liệu dán", matrix: parseDelimited(text), rowOffset: 0 }];
}

export async function parseFile(file: File): Promise<ParsedSheet[]> {
  const lower = file.name.toLowerCase();
  const ext = ACCEPTED_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!ext) {
    throw new ImportError(
      "Định dạng chưa được hỗ trợ. Hãy chọn file .xlsx, .xls hoặc .csv.",
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError("File quá lớn (tối đa 5 MB).");
  }
  const buffer = await file.arrayBuffer();

  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    const matrix = parseDelimited(decodeText(buffer));
    return [{ name: file.name, matrix, rowOffset: 0 }];
  }

  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "array" });
    const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const ref = ws?.["!ref"];
      const rowOffset = ref ? XLSX.utils.decode_range(ref).s.r : 0;
      const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        blankrows: true,
        defval: "",
        raw: false,
      });
      const matrix = raw.map((r) =>
        (r as unknown[]).map((c) => String(c ?? "").trim()),
      );
      return { name, matrix, rowOffset };
    }).filter((s) => s.matrix.some((r) => r.some((c) => c !== "")));
    if (sheets.length === 0) throw new ImportError("File không có dữ liệu.");
    return sheets;
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError(
      "Không đọc được file này. Hãy kiểm tra file có bị hỏng hoặc đặt mật khẩu không.",
    );
  }
}
