"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn, Field, inputCls } from "@/components/ui/controls";
import {
  annotateDuplicates,
  applyImport,
  buildImportRows,
  detectLayout,
  summarize,
  type ColumnMapping,
  type ImportMode,
  type ImportRow,
} from "@/lib/import/normalize";
import {
  ACCEPTED_EXTENSIONS,
  ImportError,
  parseFile,
  parsePastedText,
  type ParsedSheet,
} from "@/lib/import/parse";
import { downloadTemplate } from "@/lib/import/template";
import { newId } from "@/lib/random";
import { pushToast } from "@/lib/toast";
import { GENDER_LABEL, type ClassRoom } from "@/lib/types";
import { appStore } from "@/store";

type Stage = "source" | "preview" | "done";

const colLetter = (i: number) => {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

/** Toàn bộ trạng thái nằm trong ImportFlow; nó chỉ được mount khi mở nên tự đặt lại mỗi lần mở. */
export function ImportDialog({
  open,
  onClose,
  cls,
}: {
  open: boolean;
  onClose: () => void;
  cls: ClassRoom;
}) {
  return open ? <ImportFlow onClose={onClose} cls={cls} /> : null;
}

function ImportFlow({ onClose, cls }: { onClose: () => void; cls: ClassRoom }) {
  const [stage, setStage] = useState<Stage>("source");
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [headerRow, setHeaderRow] = useState(-1);
  const [mapping, setMapping] = useState<ColumnMapping>({ no: null, name: null, gender: null });
  const [mode, setMode] = useState<ImportMode>(cls.students.length > 0 ? "append" : "replace");
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; warnings: number } | null>(null);
  const [sourceName, setSourceName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteId = useId();

  const sheet = sheets[sheetIdx];

  const loadSheets = useCallback((parsed: ParsedSheet[], name: string) => {
    setSheets(parsed);
    setSheetIdx(0);
    setSourceName(name);
    const layout = detectLayout(parsed[0].matrix);
    setHeaderRow(layout.headerRow);
    setMapping(layout.mapping);
    setStage("preview");
    setError(null);
    setConfirmReplace(false);
  }, []);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      loadSheets(await parseFile(file), file.name);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "Không đọc được file. Hãy thử lưu lại dưới dạng .xlsx hoặc .csv.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePaste = () => {
    try {
      loadSheets(parsePastedText(paste), "Dữ liệu dán");
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "Không đọc được dữ liệu đã dán.");
    }
  };

  const switchSheet = (i: number) => {
    setSheetIdx(i);
    const layout = detectLayout(sheets[i].matrix);
    setHeaderRow(layout.headerRow);
    setMapping(layout.mapping);
    setConfirmReplace(false);
  };

  const rows: ImportRow[] = useMemo(() => {
    if (!sheet || mapping.name === null) return [];
    const base = buildImportRows(sheet.matrix, { headerRow, mapping, rowOffset: sheet.rowOffset });
    return annotateDuplicates(base, mode === "append" ? cls.students : []);
  }, [sheet, headerRow, mapping, mode, cls.students]);

  const sum = summarize(rows);
  const width = sheet ? sheet.matrix.reduce((m, r) => Math.max(m, r.length), 0) : 0;
  const colOptions = useMemo(() => {
    if (!sheet) return [];
    const header = headerRow >= 0 ? sheet.matrix[headerRow] : undefined;
    const firstData = sheet.matrix[headerRow + 1];
    return Array.from({ length: width }, (_, i) => {
      const sample = (header?.[i] || firstData?.[i] || "").trim();
      return { value: i, label: `Cột ${colLetter(i)}${sample ? `: ${sample.slice(0, 24)}` : ""}` };
    });
  }, [sheet, headerRow, width]);

  const canImport = sum.total - sum.errors > 0 && mapping.name !== null;

  const doImport = () => {
    const res = applyImport(rows, mode, cls.students, () => newId("hs"));
    appStore.setStudents(res.students, mode === "replace");
    setResult({ imported: res.imported, skipped: res.skipped, warnings: sum.warnings });
    setStage("done");
    pushToast(
      `Đã nhập ${res.imported} học sinh${res.skipped ? `, bỏ qua ${res.skipped} dòng lỗi` : ""}.`,
      "success",
    );
  };

  const onConfirmClick = () => {
    if (mode === "replace" && cls.students.length > 0 && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    doImport();
  };

  const mappingSelect = (key: keyof ColumnMapping, label: string, required = false) => (
    <Field label={label + (required ? " *" : "")} htmlFor={`${pasteId}-${key}`}>
      <select
        id={`${pasteId}-${key}`}
        value={mapping[key] ?? ""}
        onChange={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value);
          setMapping((m) => ({ ...m, [key]: v }));
          setConfirmReplace(false);
        }}
        className={inputCls}
      >
        {!required && <option value="">Không có</option>}
        {required && mapping[key] === null && <option value="">Chọn cột…</option>}
        {colOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );

  const footer =
    stage === "source" ? (
      <Btn variant="ghost" onClick={onClose}>
        Hủy
      </Btn>
    ) : stage === "preview" ? (
      <>
        <Btn
          variant="ghost"
          onClick={() => {
            setStage("source");
            setConfirmReplace(false);
          }}
        >
          Quay lại
        </Btn>
        {confirmReplace ? (
          <Btn variant="danger" onClick={doImport}>
            Xác nhận thay thế {cls.students.length} học sinh cũ
          </Btn>
        ) : (
          <Btn variant="primary" disabled={!canImport} onClick={onConfirmClick}>
            {mode === "replace" ? "Thay thế danh sách" : "Thêm"} · {Math.max(0, sum.total - sum.errors)} học sinh
          </Btn>
        )}
      </>
    ) : (
      <Btn variant="primary" onClick={onClose}>
        Xong
      </Btn>
    );

  return (
    <Modal
      open
      onClose={onClose}
      title="Nhập danh sách từ Excel / Sheet"
      description={
        stage === "source"
          ? "Bước 1: chọn file hoặc dán bảng đã copy"
          : stage === "preview"
            ? `Bước 2: xem trước và xác nhận · ${sourceName}`
            : "Hoàn tất"
      }
      width={900}
      footer={footer}
    >
      {stage === "source" && (
        <div className="space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-3xl border-[3px] border-dashed p-6 text-center transition ${
              dragging ? "border-mint-700 bg-mint/40" : "border-line/50 bg-white"
            }`}
          >
            <FileSpreadsheet className="mx-auto size-10 text-mint-700" aria-hidden />
            <p className="mt-2 font-heading text-xl font-extrabold">Kéo thả file vào đây</p>
            <p className="text-sm font-semibold text-ink-soft">Hỗ trợ .xlsx, .xls, .csv (tối đa 5 MB)</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="sr-only"
                id={`${pasteId}-file`}
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              <Btn
                variant="mint"
                disabled={busy}
                icon={<Upload className="size-5" aria-hidden />}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? "Đang đọc…" : "Chọn file"}
              </Btn>
              <Btn
                variant="ghost"
                icon={<Download className="size-5" aria-hidden />}
                onClick={() => downloadTemplate().catch(() => pushToast("Không tạo được file mẫu.", "error"))}
              >
                Tải file Excel mẫu
              </Btn>
            </div>
          </div>

          <div>
            <label htmlFor={pasteId} className="mb-1.5 flex items-center gap-2 font-extrabold">
              <ClipboardPaste className="size-5 text-sky-600" aria-hidden />
              Hoặc dán bảng đã copy từ Excel / Google Sheets
            </label>
            <textarea
              id={pasteId}
              rows={6}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={"STT\tHọ tên\tGiới tính\n1\tNguyễn Văn An\tNam\n2\tTrần Thị Bích Ngọc\tNữ"}
              className={`${inputCls} font-mono text-sm`}
            />
            <div className="mt-2 flex justify-end">
              <Btn variant="sky" disabled={!paste.trim()} onClick={handlePaste}>
                Đọc dữ liệu đã dán
              </Btn>
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border-2 border-danger bg-danger/10 p-3 font-bold text-danger">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </div>
      )}

      {stage === "preview" && sheet && (
        <div className="space-y-4">
          {sheets.length > 1 && (
            <Field label="Chọn worksheet" htmlFor={`${pasteId}-sheet`}>
              <select
                id={`${pasteId}-sheet`}
                value={sheetIdx}
                onChange={(e) => switchSheet(Number(e.target.value))}
                className={inputCls}
              >
                {sheets.map((s, i) => (
                  <option key={s.name} value={i}>
                    {s.name} ({s.matrix.length} dòng)
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Dòng tiêu đề" htmlFor={`${pasteId}-hdr`}>
              <select
                id={`${pasteId}-hdr`}
                value={headerRow}
                onChange={(e) => {
                  setHeaderRow(Number(e.target.value));
                  setConfirmReplace(false);
                }}
                className={inputCls}
              >
                <option value={-1}>Không có tiêu đề</option>
                {sheet.matrix.slice(0, 10).map((r, i) => (
                  <option key={i} value={i}>
                    Dòng {i + 1 + sheet.rowOffset}: {(r.find((c) => c) ?? "(trống)").slice(0, 20)}
                  </option>
                ))}
              </select>
            </Field>
            {mappingSelect("name", "Cột Họ tên", true)}
            {mappingSelect("no", "Cột STT")}
            {mappingSelect("gender", "Cột Giới tính")}
          </div>

          <fieldset className="rounded-2xl border-2 border-line bg-white p-3">
            <legend className="px-1 text-sm font-extrabold">Cách nhập vào lớp “{cls.name}”</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  ["append", "Thêm vào danh sách", `Giữ ${cls.students.length} học sinh hiện có`],
                  ["replace", "Thay thế danh sách", "Xóa danh sách cũ, dùng danh sách mới"],
                ] as const
              ).map(([v, label, hint]) => (
                <label key={v} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name={`${pasteId}-mode`}
                    checked={mode === v}
                    onChange={() => {
                      setMode(v);
                      setConfirmReplace(false);
                    }}
                    className="mt-1 size-4 accent-[var(--mint-600)]"
                  />
                  <span>
                    <span className="block font-extrabold">{label}</span>
                    <span className="block text-sm font-semibold text-ink-soft">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {confirmReplace && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-danger bg-danger/10 p-3.5">
              <AlertTriangle className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
              <div className="font-semibold">
                <p className="font-extrabold text-danger">Danh sách hiện tại sẽ bị thay thế</p>
                <p className="text-sm">
                  {cls.students.length} học sinh đang có trong lớp <b>{cls.name}</b> sẽ bị xóa và thay bằng{" "}
                  {Math.max(0, sum.total - sum.errors)} học sinh mới. Vòng gọi bài hiện tại cũng được làm mới.
                </p>
              </div>
            </div>
          )}

          {mapping.name === null ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl border-2 border-line bg-sun/30 p-3 font-bold">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              Chưa nhận diện được cột Họ tên. Hãy chọn cột chứa họ tên ở phía trên.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-sm font-extrabold" aria-live="polite">
                <span className="rounded-full border-2 border-line bg-white px-3 py-1">{sum.total} dòng dữ liệu</span>
                <span className="rounded-full border-2 border-line bg-mint/60 px-3 py-1">{sum.ok} hợp lệ</span>
                {sum.warnings > 0 && (
                  <span className="rounded-full border-2 border-line bg-sun/60 px-3 py-1">{sum.warnings} cảnh báo</span>
                )}
                {sum.errors > 0 && (
                  <span className="rounded-full border-2 border-line bg-danger/20 px-3 py-1 text-danger">
                    {sum.errors} lỗi (sẽ bỏ qua)
                  </span>
                )}
              </div>

              <div className="nice-scroll max-h-72 overflow-auto rounded-2xl border-2 border-line bg-white">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <caption className="sr-only">Xem trước danh sách sẽ nhập</caption>
                  <thead className="sticky top-0 z-10 bg-cream-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th scope="col" className="px-3 py-2">Dòng</th>
                      <th scope="col" className="px-3 py-2">STT</th>
                      <th scope="col" className="px-3 py-2">Họ tên</th>
                      <th scope="col" className="px-3 py-2">Giới tính</th>
                      <th scope="col" className="px-3 py-2">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 300).map((r) => (
                      <tr
                        key={r.sourceRow}
                        className={`border-t border-line/15 align-top ${
                          r.status === "error" ? "bg-danger/10" : r.status === "warning" ? "bg-sun/20" : ""
                        }`}
                      >
                        <td className="px-3 py-2 tabular-nums text-ink-soft">{r.sourceRow}</td>
                        <td className="px-3 py-2 tabular-nums">{r.no ?? <span className="text-ink-soft">tự gán</span>}</td>
                        <td className="px-3 py-2 font-bold">{r.name || <span className="text-danger">—</span>}</td>
                        <td className="px-3 py-2">{GENDER_LABEL[r.gender]}</td>
                        <td className="px-3 py-2 font-semibold">
                          {r.status === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-mint-700">
                              <CheckCircle2 className="size-4" aria-hidden /> Hợp lệ
                            </span>
                          ) : (
                            <ul className={r.status === "error" ? "text-danger" : "text-[#8a5a00]"}>
                              {r.messages.map((m, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  {r.status === "error" ? (
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                                  ) : (
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                                  )}
                                  {m}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 300 && (
                  <p className="p-3 text-center text-sm font-bold text-ink-soft">
                    Đang hiện 300/{rows.length} dòng đầu. Tất cả dòng hợp lệ vẫn sẽ được nhập.
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-ink-soft">
                Trùng STT hoặc họ tên chỉ là cảnh báo – ứng dụng không tự xóa vì đó có thể là hai bạn khác nhau.
              </p>
            </>
          )}
        </div>
      )}

      {stage === "done" && result && (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto size-14 text-mint-700" aria-hidden />
          <p className="mt-3 font-heading text-2xl font-extrabold">Đã nhập xong!</p>
          <p className="mt-2 text-lg font-semibold">
            Thành công <b className="text-mint-700">{result.imported}</b> học sinh
            {result.skipped > 0 && (
              <>
                , bỏ qua <b className="text-danger">{result.skipped}</b> dòng lỗi
              </>
            )}
            .
          </p>
          {result.warnings > 0 && (
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {result.warnings} dòng có cảnh báo (trùng STT/họ tên…) vẫn được nhập. Bạn có thể chỉnh lại trong danh
              sách học sinh.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
