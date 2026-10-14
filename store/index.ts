"use client";

import { useSyncExternalStore } from "react";
import { loadState, saveState } from "@/lib/storage";
import { pushToast } from "@/lib/toast";
import type { ClassRoom } from "@/lib/types";
import { createAppStore, type AppState } from "./create-store";

export const appStore = createAppStore({
  load: loadState,
  save: saveState,
  now: () => new Date(),
  notify: (text, kind) => pushToast(text, kind),
});

export function useAppState(): AppState {
  return useSyncExternalStore(
    appStore.subscribe,
    appStore.getState,
    appStore.getServerState,
  );
}

export function activeClassOf(state: AppState): ClassRoom {
  return (
    state.classes.find((c) => c.id === state.activeClassId) ?? state.classes[0]
  );
}
