"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Người dùng bật "giảm chuyển động" trong hệ điều hành. Server luôn trả false (khớp hydration). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Chế độ trình chiếu. Dùng Fullscreen API khi trình duyệt hỗ trợ; nếu không (ví dụ iPhone)
 * vẫn bật bố cục trình chiếu bằng CSS và thoát bằng nút hoặc phím Escape.
 */
export function usePresentation(ref: RefObject<HTMLElement | null>) {
  const [presentation, setPresentation] = useState(false);

  useEffect(() => {
    const onChange = () => setPresentation(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(async () => {
    setPresentation(true);
    try {
      await ref.current?.requestFullscreen?.();
    } catch {
      /* không hỗ trợ / bị chặn: giữ bố cục trình chiếu bằng CSS */
    }
  }, [ref]);

  const exit = useCallback(async () => {
    setPresentation(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* bỏ qua */
    }
  }, []);

  return { presentation, enter, exit };
}

/** Theo dõi một media query (server luôn trả false để khớp hydration). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
