"use client";

import { Check } from "lucide-react";
import { TemplateThumb } from "@/components/scene/TemplateThumb";
import { Modal } from "@/components/ui/Modal";
import { TEMPLATES } from "@/templates";
import { appStore } from "@/store";

export function TemplateDialog({
  open,
  onClose,
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  currentId: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chọn template"
      description="Cùng danh sách lớp và cách chọn ngẫu nhiên, chỉ khác bối cảnh hoạt cảnh."
      width={860}
    >
      <div role="radiogroup" aria-label="Template hoạt cảnh" className="grid gap-4 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const selected = t.id === currentId;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                appStore.setTemplate(t.id);
                onClose();
              }}
              className={`group flex flex-col overflow-hidden rounded-3xl border-[3px] bg-white text-left transition hover:-translate-y-1 ${
                selected
                  ? "border-mint-700 shadow-[0_6px_0_var(--mint-700)]"
                  : "border-line shadow-[0_6px_0_rgba(51,56,77,.3)]"
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden border-b-[3px] border-line">
                <TemplateThumb template={t} />
                {selected && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border-2 border-line bg-mint px-2.5 py-1 text-xs font-extrabold">
                    <Check className="size-3.5" aria-hidden /> Đang dùng
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3.5 rounded-full border-2 border-line"
                    style={{ background: t.palette.accent }}
                    aria-hidden
                  />
                  <span className="font-heading text-xl font-extrabold leading-tight">{t.name}</span>
                </div>
                <p className="text-sm font-semibold leading-snug text-ink-soft">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
