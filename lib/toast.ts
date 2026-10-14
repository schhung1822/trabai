"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "info" | "success" | "error";
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: Toast[] = [];

const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function pushToast(text: string, kind: ToastKind = "info", ms = 4500) {
  const id = nextId++;
  toasts = [...toasts.slice(-3), { id, kind, text }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), ms);
  }
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => EMPTY,
  );
}
