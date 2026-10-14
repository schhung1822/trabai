"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { dismissToast, useToasts } from "@/lib/toast";

const ICON = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
} as const;

const TONE = {
  info: "bg-sky",
  success: "bg-mint",
  error: "bg-[#ffd3d6]",
} as const;

export function Toasts() {
  const toasts = useToasts();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-3"
    >
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-xl items-start gap-3 rounded-2xl border-2 border-line px-4 py-3 text-[15px] font-bold shadow-[0_5px_0_var(--line)] ${TONE[t.kind]}`}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{t.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Đóng thông báo"
              className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-black/10"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
