"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { AvatarThumb } from "@/components/scene/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Btn } from "@/components/ui/controls";
import { usePrefersReducedMotion } from "@/lib/hooks";
import type { PendingTurn } from "@/lib/types";

/**
 * Bảng kết quả luôn là danh sách văn bản rõ ràng – không phụ thuộc vào việc đọc hoạt cảnh.
 */
export function ResultDialog({
  turn,
  open,
  onNext,
  onClose,
  nextDisabledReason,
}: {
  turn: PendingTurn | null;
  open: boolean;
  onNext: () => void;
  onClose: () => void;
  nextDisabledReason?: string | null;
}) {
  const reduce = usePrefersReducedMotion();
  return (
    <Modal
      open={open && turn !== null}
      onClose={onClose}
      title="Mời các bạn lên trả bài!"
      description={
        turn ? `${turn.picked.length} bạn được UFO mời lên bảng` : undefined
      }
      width={560}
      tone="celebrate"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Đóng
          </Btn>
          <Btn
            variant="primary"
            icon={<ArrowRight className="size-5" aria-hidden />}
            onClick={onNext}
            title={nextDisabledReason ?? undefined}
          >
            Gọi lượt tiếp theo
          </Btn>
        </>
      }
    >
      <ol className="space-y-2.5" aria-label="Danh sách học sinh được gọi">
        {turn?.picked.map((p, i) => (
          <motion.li
            key={p.id}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.12 * i, type: "spring", stiffness: 380, damping: 26 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white p-2.5 pr-4 shadow-[0_4px_0_rgba(51,56,77,.25)]"
          >
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-line bg-gradient-to-b from-sky/50 to-mint/40">
              <AvatarThumb id={p.id} gender={p.gender} size={52} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                STT {p.no}
              </span>
              <span className="block break-words font-heading text-xl font-extrabold leading-tight sm:text-2xl">
                {p.name}
              </span>
            </span>
            <Sparkles className="size-6 shrink-0 text-orange" aria-hidden />
          </motion.li>
        ))}
      </ol>
    </Modal>
  );
}
