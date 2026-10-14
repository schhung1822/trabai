"use client";

import {
  Check,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { AvatarThumb } from "@/components/scene/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Btn, inputCls } from "@/components/ui/controls";
import { foldText } from "@/lib/import/normalize";
import { downloadTemplate } from "@/lib/import/template";
import { pushToast } from "@/lib/toast";
import { GENDER_LABEL, type ClassRoom, type Gender, type Student } from "@/lib/types";
import { appStore } from "@/store";
import type { ConfirmRequest } from "./ConfirmDialog";

const GENDERS: Gender[] = ["male", "female", "other"];

function GenderSelect({
  value,
  onChange,
  label,
  disabled,
  className = "",
}: {
  value: Gender;
  onChange: (g: Gender) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Gender)}
      className={`${inputCls} !w-auto ${className}`}
    >
      {GENDERS.map((g) => (
        <option key={g} value={g}>
          {GENDER_LABEL[g]}
        </option>
      ))}
    </select>
  );
}

function StudentRow({
  s,
  called,
  dupName,
  locked,
  onDelete,
}: {
  s: Student;
  called: boolean;
  dupName: boolean;
  locked: boolean;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [no, setNo] = useState(String(s.no));
  const [gender, setGender] = useState<Gender>(s.gender);

  if (editing) {
    return (
      <li className="rounded-2xl border-2 border-line bg-sky/25 p-2.5">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(no);
            if (!name.trim()) return;
            appStore.updateStudent(s.id, {
              name,
              gender,
              no: Number.isInteger(n) && n > 0 ? n : s.no,
            });
            setEditing(false);
          }}
        >
          <input
            aria-label="STT"
            inputMode="numeric"
            value={no}
            onChange={(e) => setNo(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={`${inputCls} !w-20 text-center`}
          />
          <input
            aria-label="Họ tên"
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setEditing(false);
              }
            }}
            className={`${inputCls} min-w-40 flex-1`}
          />
          <GenderSelect value={gender} onChange={setGender} label="Giới tính" />
          <Btn type="submit" size="icon" variant="mint" aria-label="Lưu thay đổi" disabled={!name.trim()}>
            <Check className="size-5" aria-hidden />
          </Btn>
          <Btn size="icon" variant="ghost" aria-label="Hủy sửa" onClick={() => setEditing(false)}>
            <X className="size-5" aria-hidden />
          </Btn>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-line p-2 pr-3 ${
        s.present ? "bg-white" : "bg-[#eef0f3]"
      }`}
    >
      <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-cream-2 px-1.5 text-sm font-extrabold tabular-nums">
        {s.no}
      </span>
      <span className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-line bg-sky/30 ${s.present ? "" : "opacity-50 grayscale"}`}>
        <AvatarThumb id={s.id} gender={s.gender} size={40} />
      </span>
      <div className="min-w-0 flex-1 basis-40">
        <div className={`truncate font-extrabold ${s.present ? "" : "text-ink-soft line-through"}`}>{s.name}</div>
        <div className="flex flex-wrap gap-1 text-xs font-bold text-ink-soft">
          <span>{GENDER_LABEL[s.gender]}</span>
          {called && <span className="rounded bg-mint/60 px-1.5 text-ink">Đã gọi</span>}
          {dupName && <span className="rounded bg-sun/60 px-1.5 text-ink">Trùng tên</span>}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={!s.present}
        disabled={locked}
        onClick={() => appStore.updateStudent(s.id, { present: !s.present })}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-line px-3 text-sm font-extrabold transition disabled:opacity-50 ${
          s.present ? "bg-mint/60 hover:bg-mint" : "bg-danger/15 text-danger hover:bg-danger/25"
        }`}
        title={s.present ? "Bấm để đánh dấu vắng" : "Bấm để đánh dấu có mặt"}
      >
        {s.present ? <UserCheck className="size-4" aria-hidden /> : <UserX className="size-4" aria-hidden />}
        {s.present ? "Có mặt" : "Vắng"}
        <span className="sr-only">{`– ${s.name}. Bấm để đổi trạng thái`}</span>
      </button>
      <Btn
        size="icon"
        variant="plain"
        className="!size-10"
        disabled={locked}
        aria-label={`Sửa ${s.name}`}
        onClick={() => {
          setName(s.name);
          setNo(String(s.no));
          setGender(s.gender);
          setEditing(true);
        }}
      >
        <Pencil className="size-5" aria-hidden />
      </Btn>
      <Btn size="icon" variant="plain" className="!size-10" disabled={locked} aria-label={`Xóa ${s.name}`} onClick={onDelete}>
        <Trash2 className="size-5 text-danger" aria-hidden />
      </Btn>
    </li>
  );
}

export function StudentsDialog({
  open,
  onClose,
  cls,
  locked,
  onImport,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  cls: ClassRoom;
  locked: boolean;
  onImport: () => void;
  onConfirm: (r: ConfirmRequest) => void;
}) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("other");
  const searchId = useId();
  const nameId = useId();

  const calledSet = useMemo(() => new Set(cls.calledIds), [cls.calledIds]);
  const nameCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of cls.students) {
      const k = foldText(s.name);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [cls.students]);

  const sorted = useMemo(
    () => cls.students.slice().sort((a, b) => a.no - b.no),
    [cls.students],
  );
  const shown = useMemo(() => {
    const q = foldText(query);
    if (!q) return sorted;
    return sorted.filter((s) => foldText(s.name).includes(q) || String(s.no) === query.trim());
  }, [sorted, query]);

  const presentCount = cls.students.filter((s) => s.present).length;
  const absentCount = cls.students.length - presentCount;

  const add = () => {
    if (appStore.addStudent({ name: newName, gender: newGender })) {
      setNewName("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Danh sách học sinh"
      description={`${cls.name} · ${cls.students.length} học sinh · ${presentCount} có mặt${absentCount ? ` · ${absentCount} vắng` : ""}`}
      width={760}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Btn variant="mint" disabled={locked} onClick={onImport} icon={<FileSpreadsheet className="size-5" aria-hidden />}>
          Nhập từ Excel / Sheet
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => downloadTemplate().catch(() => pushToast("Không tạo được file mẫu.", "error"))}
          icon={<Download className="size-5" aria-hidden />}
        >
          Tải file Excel mẫu
        </Btn>
        <Btn
          variant="ghost"
          disabled={locked || absentCount === 0}
          onClick={() => appStore.setAllPresent(true)}
          icon={<UserCheck className="size-5" aria-hidden />}
        >
          Cả lớp có mặt
        </Btn>
        <Btn
          variant="ghost"
          disabled={locked || cls.students.length === 0}
          icon={<Trash2 className="size-5 text-danger" aria-hidden />}
          onClick={() =>
            onConfirm({
              title: "Xóa toàn bộ danh sách?",
              message: (
                <p>
                  {cls.students.length} học sinh của lớp <b>{cls.name}</b> sẽ bị xóa. Hành động này không thể hoàn
                  tác.
                </p>
              ),
              confirmLabel: "Xóa danh sách",
              danger: true,
              onConfirm: () => appStore.setStudents([], true),
            })
          }
        >
          Xóa danh sách
        </Btn>
      </div>

      <form
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line bg-white p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor={nameId} className="sr-only">
          Họ tên học sinh mới
        </label>
        <input
          id={nameId}
          value={newName}
          maxLength={80}
          disabled={locked}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Thêm học sinh: nhập họ tên"
          className={`${inputCls} min-w-44 flex-1`}
        />
        <GenderSelect value={newGender} onChange={setNewGender} label="Giới tính học sinh mới" disabled={locked} />
        <Btn type="submit" variant="primary" disabled={locked || !newName.trim()} icon={<Plus className="size-5" aria-hidden />}>
          Thêm
        </Btn>
      </form>

      <div className="relative mb-3">
        <label htmlFor={searchId} className="sr-only">
          Tìm học sinh theo tên hoặc STT
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc STT…"
          className={`${inputCls} !pl-10`}
        />
      </div>

      {cls.students.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line/40 bg-white p-8 text-center">
          <p className="font-heading text-xl font-extrabold">Lớp chưa có học sinh</p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-ink-soft">
            Thêm từng bạn ở ô phía trên, hoặc nhập cả danh sách từ file Excel/CSV hoặc bảng copy từ Google Sheets.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line/40 bg-white p-6 text-center font-bold text-ink-soft">
          Không tìm thấy học sinh nào khớp “{query}”.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Danh sách học sinh">
          {shown.map((s) => (
            <StudentRow
              key={s.id}
              s={s}
              called={calledSet.has(s.id)}
              dupName={(nameCounts.get(foldText(s.name)) ?? 0) > 1}
              locked={locked}
              onDelete={() =>
                onConfirm({
                  title: `Xóa “${s.name}”?`,
                  message: <p>Học sinh này sẽ bị xóa khỏi lớp {cls.name}. Lịch sử gọi bài cũ vẫn được giữ.</p>,
                  confirmLabel: "Xóa học sinh",
                  danger: true,
                  onConfirm: () => appStore.removeStudent(s.id),
                })
              }
            />
          ))}
        </ul>
      )}
    </Modal>
  );
}
