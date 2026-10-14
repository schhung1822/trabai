"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn, inputCls } from "@/components/ui/controls";
import { appStore } from "@/store";
import type { AppState } from "@/store/create-store";
import type { ConfirmRequest } from "./ConfirmDialog";

export function ClassesDialog({
  open,
  onClose,
  state,
  locked,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  locked: boolean;
  onConfirm: (r: ConfirmRequest) => void;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const nameId = useId();

  const create = () => {
    const n = newName.trim();
    if (!n) return;
    appStore.createClass(n);
    setNewName("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quản lý lớp"
      description="Tạo, đổi tên hoặc xóa lớp. Mỗi lớp có danh sách và vòng gọi bài riêng."
      width={600}
    >
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label htmlFor={nameId} className="sr-only">
          Tên lớp mới
        </label>
        <input
          id={nameId}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
          placeholder="Tên lớp mới, ví dụ: 10A2"
          className={inputCls}
          disabled={locked}
        />
        <Btn type="submit" variant="mint" disabled={locked || !newName.trim()} icon={<Plus className="size-5" aria-hidden />}>
          Tạo lớp
        </Btn>
      </form>

      <ul className="space-y-2">
        {state.classes.map((c) => {
          const active = c.id === state.activeClassId;
          const isEditing = editing === c.id;
          return (
            <li
              key={c.id}
              className={`flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line p-3 ${
                active ? "bg-mint/40" : "bg-white"
              }`}
            >
              {isEditing ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    appStore.renameClass(c.id, editName);
                    setEditing(null);
                  }}
                >
                  <input
                    autoFocus
                    aria-label={`Tên mới cho lớp ${c.name}`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    className={inputCls}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditing(null);
                      }
                    }}
                  />
                  <Btn type="submit" size="icon" variant="mint" aria-label="Lưu tên lớp">
                    <Check className="size-5" aria-hidden />
                  </Btn>
                  <Btn size="icon" variant="ghost" aria-label="Hủy đổi tên" onClick={() => setEditing(null)}>
                    <X className="size-5" aria-hidden />
                  </Btn>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-lg font-extrabold">{c.name}</div>
                    <div className="text-sm font-semibold text-ink-soft">
                      {c.students.length} học sinh · vòng {c.cycle}
                      {active && " · đang dùng"}
                    </div>
                  </div>
                  {!active && (
                    <Btn size="sm" variant="sky" disabled={locked} onClick={() => appStore.setActiveClass(c.id)}>
                      Chọn lớp này
                    </Btn>
                  )}
                  <Btn
                    size="icon"
                    variant="ghost"
                    disabled={locked}
                    aria-label={`Đổi tên lớp ${c.name}`}
                    onClick={() => {
                      setEditing(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="size-5" aria-hidden />
                  </Btn>
                  <Btn
                    size="icon"
                    variant="ghost"
                    disabled={locked}
                    aria-label={`Xóa lớp ${c.name}`}
                    onClick={() =>
                      onConfirm({
                        title: `Xóa lớp “${c.name}”?`,
                        message: (
                          <p>
                            Lớp có <b>{c.students.length}</b> học sinh sẽ bị xóa cùng vòng gọi bài của lớp. Lịch sử đã
                            ghi vẫn được giữ. Hành động này không thể hoàn tác.
                          </p>
                        ),
                        confirmLabel: "Xóa lớp",
                        danger: true,
                        onConfirm: () => appStore.deleteClass(c.id),
                      })
                    }
                  >
                    <Trash2 className="size-5 text-danger" aria-hidden />
                  </Btn>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
