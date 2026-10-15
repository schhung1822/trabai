"use client";

import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn, Field, Segmented, Stepper, Switch, inputCls } from "@/components/ui/controls";
import { appStore } from "@/store";
import type { AppState } from "@/store/create-store";
import { getPresentStudents } from "@/lib/selection";
import type { AbductEffect, AnimationSpeed, ClassRoom } from "@/lib/types";
import type { ConfirmRequest } from "./ConfirmDialog";

const EFFECTS: { value: AbductEffect; label: string }[] = [
  { value: "single", label: "Bắt lẻ" },
  { value: "siege", label: "Bao vây" },
];

const SPEEDS: { value: AnimationSpeed; label: string }[] = [
  { value: "fast", label: "Nhanh" },
  { value: "normal", label: "Bình thường" },
  { value: "slow", label: "Chậm" },
];

export function SettingsDialog({
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
  const { settings } = state;
  const present = getPresentStudents(cls).length;
  const maxCount = Math.max(1, present);
  const inputId = useId();
  // Bản nháp đang gõ; null = hiện giá trị đã lưu (tự đồng bộ khi giá trị đổi từ nơi khác).
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(settings.pickCount);
  const setText = (v: string | null) => setDraft(v);
  const close = () => {
    setDraft(null);
    onClose();
  };

  const parsed = /^\d+$/.test(text.trim()) ? Number(text) : NaN;
  let error: string | null = null;
  if (text.trim() === "" || Number.isNaN(parsed) || parsed < 1) {
    error = "Hãy nhập một số nguyên từ 1 trở lên.";
  } else if (parsed > present) {
    error =
      present === 0
        ? "Lớp chưa có học sinh có mặt nên chưa thể gọi. Hãy thêm hoặc đánh dấu có mặt trước."
        : `Lớp chỉ có ${present} học sinh có mặt nên mỗi lượt chỉ gọi tối đa ${present} bạn. Hãy giảm số lượng.`;
  }

  const eligible = cls.students.filter(
    (s) => s.present && !cls.calledIds.includes(s.id),
  ).length;
  const called = getPresentStudents(cls).length - eligible;

  return (
    <Modal open={open} onClose={close} title="Thiết lập gọi bài" width={620}>
      <fieldset disabled={locked} className="space-y-1 disabled:opacity-90">
        {locked && (
          <p className="mb-3 flex items-start gap-2 rounded-xl border-2 border-line bg-sun/30 p-3 text-sm font-bold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            UFO đang hoạt động nên chưa thể đổi thiết lập. Hãy chờ UFO xong hoặc bỏ qua hoạt cảnh.
          </p>
        )}

        <Field
          label="Số người được gọi mỗi lượt"
          htmlFor={inputId}
          error={error}
          hint={`Từ 1 đến ${maxCount} (số học sinh có mặt trong lớp).`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              id={inputId}
              inputMode="numeric"
              value={text}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                setText(v);
                const n = Number(v);
                if (v !== "" && n >= 1 && n <= present) appStore.setSettings({ pickCount: n });
              }}
              onBlur={() => {
                setText(null);
              }}
              className={`${inputCls} !w-24 text-center font-heading text-2xl ${error ? "!border-danger" : ""}`}
            />
            <Stepper
              label="Số người gọi"
              value={Math.min(settings.pickCount, maxCount)}
              min={1}
              max={maxCount}
              onChange={(n) => {
                setText(null);
                appStore.setSettings({ pickCount: n });
              }}
            />
          </div>
        </Field>

        <div className="border-t-2 border-line/10 pt-1">
          <Switch
            checked={settings.noRepeat}
            onChange={(v) => appStore.setSettings({ noRepeat: v })}
            label="Không gọi lặp trong cùng một vòng"
            description="Bạn đã được gọi sẽ không xuất hiện lại cho đến khi bắt đầu vòng mới."
          />
        </div>

        <div className="space-y-2 border-t-2 border-line/10 py-3">
          <div className="font-extrabold">Hiệu ứng hút người</div>
          <Segmented
            label="Hiệu ứng hút người"
            value={settings.effect}
            options={EFFECTS}
            onChange={(v) => appStore.setSettings({ effect: v })}
          />
          <p className="text-sm font-semibold text-ink-soft">
            {settings.effect === "single"
              ? "Bắt lẻ: mỗi lần nhắm khoảng 2 giây, có thể hụt hoặc thành công cho tới khi gọi đủ số bạn."
              : "Bao vây: cả lớp chạy tìm chỗ bám; mỗi lượt hút kéo dài khoảng 5 giây để tăng hồi hộp."}
          </p>
        </div>

        <div className="space-y-2 border-t-2 border-line/10 py-3">
          <div className="font-extrabold">Thời lượng hoạt cảnh</div>
          <Segmented
            label="Thời lượng hoạt cảnh"
            value={settings.speed}
            options={SPEEDS}
            onChange={(v) => appStore.setSettings({ speed: v })}
          />
        </div>
      </fieldset>

      <div className="border-t-2 border-line/10">
        <Switch
          checked={settings.soundOn}
          onChange={(v) => appStore.setSettings({ soundOn: v })}
          label="Âm thanh"
          description="Nhạc nền nhẹ và hiệu ứng UFO. Chỉ phát sau khi bạn tương tác với trang."
        />
        <Switch
          checked={settings.speechBubbles}
          onChange={(v) => appStore.setSettings({ speechBubbles: v })}
          label="Bong bóng thoại vui"
          description="Học sinh nói những câu dí dỏm khi UFO quét qua."
        />
      </div>

      <section className="mt-3 rounded-2xl border-2 border-line bg-white p-4" aria-labelledby={`${inputId}-round`}>
        <h3 id={`${inputId}-round`} className="font-heading text-lg font-extrabold">
          Vòng gọi bài hiện tại: vòng {cls.cycle}
        </h3>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Đã gọi <b className="text-ink">{called}</b> / {getPresentStudents(cls).length} bạn có mặt · còn{" "}
          <b className="text-ink">{eligible}</b> bạn chưa được gọi.
        </p>
        <Btn
          className="mt-3"
          variant="mint"
          disabled={locked || cls.calledIds.length === 0}
          icon={<RotateCcw className="size-5" aria-hidden />}
          onClick={() =>
            onConfirm({
              title: "Bắt đầu vòng mới?",
              message: (
                <p>
                  {cls.calledIds.length} học sinh đã được gọi sẽ trở lại danh sách đủ điều kiện và có thể được gọi
                  lại. Lịch sử gọi bài vẫn được giữ nguyên.
                </p>
              ),
              confirmLabel: "Bắt đầu vòng mới",
              onConfirm: () => appStore.startNewRound(),
            })
          }
        >
          Bắt đầu vòng mới
        </Btn>
      </section>

      <section className="mt-3 rounded-2xl border-2 border-danger/50 bg-white p-4">
        <h3 className="font-heading text-lg font-extrabold text-danger">Xóa dữ liệu</h3>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Xóa mọi lớp, học sinh, thiết lập và lịch sử đã lưu trên trình duyệt này, rồi quay về lớp demo.
        </p>
        <Btn
          className="mt-3"
          variant="ghost"
          disabled={locked}
          icon={<Trash2 className="size-5 text-danger" aria-hidden />}
          onClick={() =>
            onConfirm({
              title: "Xóa toàn bộ dữ liệu?",
              message: <p>Hành động này không thể hoàn tác. Toàn bộ lớp, học sinh và lịch sử sẽ bị xóa.</p>,
              confirmLabel: "Xóa tất cả",
              danger: true,
              onConfirm: () => {
                appStore.resetAll();
                close();
              },
            })
          }
        >
          Xóa toàn bộ dữ liệu
        </Btn>
      </section>
    </Modal>
  );
}
