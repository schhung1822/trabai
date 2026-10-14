"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn } from "@/components/ui/controls";

export interface ConfirmRequest {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      title={request?.title ?? ""}
      width={480}
      footer={
        request && (
          <>
            <Btn variant="ghost" onClick={onClose}>
              {request.cancelLabel ?? "Hủy"}
            </Btn>
            <Btn
              variant={request.danger ? "danger" : "primary"}
              onClick={() => {
                const fn = request.onConfirm;
                onClose();
                fn();
              }}
            >
              {request.confirmLabel}
            </Btn>
          </>
        )
      }
    >
      <div className="text-[15px] font-semibold leading-relaxed text-ink">
        {request?.message}
      </div>
    </Modal>
  );
}
