"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn } from "@/components/ui/controls";
import { appStore } from "@/store";
import type { AppState } from "@/store/create-store";
import type { ClassRoom } from "@/lib/types";
import type { ConfirmRequest } from "./ConfirmDialog";

const fmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : fmt.format(d);
}

export function HistoryDialog({
  open,
  onClose,
  state,
  cls,
  locked,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  cls: ClassRoom;
  locked: boolean;
  onConfirm: (r: ConfirmRequest) => void;
}) {
  const [all, setAll] = useState(false);
  const entries = useMemo(
    () => (all ? state.history : state.history.filter((h) => h.classId === cls.id)),
    [all, state.history, cls.id],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lịch sử gọi bài"
      description={all ? "Tất cả các lớp" : `Lớp ${cls.name}`}
      width={640}
      footer={
        <>
          <Btn
            variant="ghost"
            disabled={locked || entries.length === 0}
            icon={<Trash2 className="size-5 text-danger" aria-hidden />}
            onClick={() =>
              onConfirm({
                title: all ? "Xóa toàn bộ lịch sử?" : `Xóa lịch sử lớp ${cls.name}?`,
                message: (
                  <p>
                    {entries.length} lượt gọi bài sẽ bị xóa khỏi lịch sử. Việc này không ảnh hưởng đến danh sách bạn
                    đã gọi trong vòng hiện tại.
                  </p>
                ),
                confirmLabel: "Xóa lịch sử",
                danger: true,
                onConfirm: () => appStore.clearHistory(all ? undefined : cls.id),
              })
            }
          >
            Xóa lịch sử
          </Btn>
          <Btn variant="primary" onClick={onClose}>
            Xong
          </Btn>
        </>
      }
    >
      <label className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => setAll(e.target.checked)}
          className="size-5 accent-[var(--mint-600)]"
        />
        Hiện cả các lớp khác
      </label>

      {entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line/40 bg-white p-8 text-center">
          <p className="font-heading text-xl font-extrabold">Chưa có lượt gọi bài nào</p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Bấm “Khởi động UFO” để bắt đầu. Mỗi lượt sẽ được ghi lại ở đây.
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {entries.map((h, idx) => (
            <li key={h.id} className="rounded-2xl border-2 border-line bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                <span>
                  Lượt {entries.length - idx} · vòng {h.cycle}
                  {all && ` · ${h.className}`}
                </span>
                <time dateTime={h.at}>{formatTime(h.at)}</time>
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {h.picked.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-full border-2 border-line bg-mint/40 px-3 py-1 text-sm font-extrabold"
                  >
                    <span className="text-ink-soft">{p.no}.</span> {p.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
