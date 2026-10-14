"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Chiều rộng tối đa (px). */
  width?: number;
  /** Bottom-sheet trên màn hình nhỏ. */
  sheet?: boolean;
  /** false: không đóng bằng Escape / click nền (ví dụ lúc đang xử lý). */
  dismissible?: boolean;
  hideClose?: boolean;
  tone?: "default" | "celebrate";
}

/**
 * Dialog dùng phần tử <dialog> gốc: tự khóa nền (inert), giữ focus bên trong,
 * Escape để đóng, và trả focus về nút đã mở khi đóng.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 640,
  sheet = true,
  dismissible = true,
  hideClose = false,
  tone = "default",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return;
    const prev = document.activeElement as HTMLElement | null;
    d.showModal();
    return () => {
      if (d.open) d.close();
      // trả focus về phần tử đã mở dialog (cả khi dialog bị gỡ khỏi DOM)
      if (prev && document.contains(prev) && typeof prev.focus === "function") {
        prev.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`app-dialog ${sheet ? "sheet" : ""}`}
      style={{ ["--dlg-w" as string]: `${width}px` }}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onMouseDown={(e) => {
        // Chỉ đóng khi nhấn thẳng vào nền (backdrop), không phải khi kéo chọn chữ ra ngoài.
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col" style={{ maxHeight: "min(90dvh, 900px)" }}>
          <header
            className={`flex items-start gap-3 border-b-2 border-line/15 px-5 pb-3 pt-4 sm:px-6 ${
              tone === "celebrate"
                ? "bg-gradient-to-r from-mint/60 via-sun/40 to-sky/50"
                : "bg-cream-2/60"
            }`}
          >
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="font-heading text-2xl font-extrabold leading-tight text-ink sm:text-[1.65rem]"
              >
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm font-semibold text-ink-soft">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-white shadow-[0_3px_0_var(--line)] transition hover:bg-cream-2 active:translate-y-[2px] active:shadow-none"
              >
                <X className="size-5" aria-hidden />
              </button>
            )}
          </header>
          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {children}
          </div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-line/15 bg-cream-2/60 px-5 py-3.5 sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
