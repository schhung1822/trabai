"use client";

import { AlertTriangle, FileSpreadsheet, FlaskConical, Minimize2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header, LogoMark } from "@/components/Header";
import { ControlBar } from "@/components/ControlBar";
import { Toasts } from "@/components/Toasts";
import { Toolbar } from "@/components/Toolbar";
import { ClassesDialog } from "@/components/dialogs/ClassesDialog";
import { ConfirmDialog, type ConfirmRequest } from "@/components/dialogs/ConfirmDialog";
import { HistoryDialog } from "@/components/dialogs/HistoryDialog";
import { ImportDialog } from "@/components/dialogs/ImportDialog";
import { PlanDialog } from "@/components/dialogs/PlanDialog";
import { ResultDialog } from "@/components/dialogs/ResultDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { StudentsDialog } from "@/components/dialogs/StudentsDialog";
import { TemplateDialog } from "@/components/dialogs/TemplateDialog";
import { Scene } from "@/components/scene/Scene";
import { Btn } from "@/components/ui/controls";
import { SoundManager } from "@/lib/audio";
import { useMediaQuery, usePrefersReducedMotion, usePresentation } from "@/lib/hooks";
import type { SfxKind } from "@/lib/scene-engine";
import { getEligibleStudents, type TurnPlan } from "@/lib/selection";
import { canStart, isRunning, type TurnPhase } from "@/lib/turn-machine";
import { appStore, activeClassOf, useAppState } from "@/store";
import { getTemplate } from "@/templates";

type DialogName = "students" | "settings" | "templates" | "history" | "classes" | "import" | null;

const PHASE_TEXT: Partial<Record<TurnPhase, string>> = {
  arriving: "UFO đang bay đến…",
  scanning: "UFO đang quét tìm bạn học sinh…",
  abducting: "UFO đang hút bạn được chọn…",
  revealing: "UFO chuẩn bị rời đi…",
};

export function AppShell() {
  const state = useAppState();
  const cls = activeClassOf(state);
  const template = getTemplate(state.templateId);
  const reduced = usePrefersReducedMotion();
  const shortViewport = useMediaQuery("(max-height: 520px) and (orientation: landscape)");
  const rootRef = useRef<HTMLDivElement>(null);
  const { presentation, enter, exit } = usePresentation(rootRef);
  const soundRef = useRef<SoundManager | null>(null);

  const [dialog, setDialog] = useState<DialogName>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [plan, setPlan] = useState<Exclude<TurnPlan, { kind: "ready" }> | null>(null);
  const [bannerHidden, setBannerHidden] = useState(false);

  const { phase, settings, hydrated } = state;
  const running = isRunning(phase);

  /* ---------- khởi tạo dữ liệu ở client ---------- */
  useEffect(() => {
    appStore.hydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "trabai:state") appStore.reloadFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- âm thanh ---------- */
  useEffect(() => {
    const sound = new SoundManager();
    soundRef.current = sound;
    const unlock = () => {
      sound.unlock();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      sound.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundRef.current?.setEnabled(settings.soundOn);
  }, [settings.soundOn]);

  useEffect(() => {
    const sync = () =>
      soundRef.current?.setMusic(
        settings.soundOn && !document.hidden && (phase === "idle" || phase === "completed"),
      );
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [settings.soundOn, phase]);

  const prevPhase = useRef<TurnPhase>(phase);
  useEffect(() => {
    if (prevPhase.current !== "completed" && phase === "completed" && hydrated) {
      soundRef.current?.play("done");
    }
    prevPhase.current = phase;
  }, [phase, hydrated]);

  const onSfx = useCallback((k: SfxKind) => soundRef.current?.play(k), []);

  /* ---------- dữ liệu dẫn xuất ---------- */
  const present = useMemo(() => cls.students.filter((s) => s.present), [cls.students]);
  const calledSet = useMemo(() => new Set(cls.calledIds), [cls.calledIds]);
  const eligible = useMemo(
    () => getEligibleStudents(cls, settings.noRepeat).length,
    [cls, settings.noRepeat],
  );
  const lastEntry = useMemo(
    () => state.history.find((h) => h.classId === cls.id) ?? null,
    [state.history, cls.id],
  );

  /* ---------- hành động ---------- */
  const start = useCallback((count?: number) => {
    soundRef.current?.unlock();
    const r = appStore.beginTurn(count !== undefined ? { count } : {});
    if (!r.ok && r.reason === "plan" && r.plan.kind !== "ready") setPlan(r.plan);
  }, []);

  const askNewRound = useCallback((thenStart: boolean) => {
    const c = activeClassOf(appStore.getState());
    setConfirm({
      title: "Bắt đầu vòng mới?",
      message: (
        <p>
          {c.calledIds.length} học sinh đã được gọi sẽ trở lại danh sách đủ điều kiện và có thể được gọi lại. Lịch sử
          gọi bài vẫn được giữ nguyên.
        </p>
      ),
      confirmLabel: "Bắt đầu vòng mới",
      onConfirm: () => {
        appStore.startNewRound();
        setPlan(null);
        if (thenStart) window.setTimeout(() => start(), 0);
      },
    });
  }, [start]);

  const closeResult = useCallback(() => appStore.closeResult(), []);
  const nextTurn = useCallback(() => {
    appStore.closeResult();
    start();
  }, [start]);

  const toggleSound = useCallback(() => {
    const next = !appStore.getState().settings.soundOn;
    soundRef.current?.unlock();
    appStore.setSettings({ soundOn: next });
    if (next) window.setTimeout(() => soundRef.current?.chime(), 60);
  }, []);

  const openDialog = useCallback((d: DialogName) => setDialog(d), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  /* ---------- phím tắt ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName ?? "";
        const interactive =
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "SUMMARY", "DIALOG"].includes(tag) ||
          t?.isContentEditable ||
          t?.getAttribute("role") === "button";
        if (interactive || document.querySelector("dialog[open]")) return;
        if (canStart(appStore.getState().phase) && appStore.getState().hydrated) {
          e.preventDefault();
          start();
        }
      } else if (e.key === "Escape" && presentation && !document.fullscreenElement) {
        if (!document.querySelector("dialog[open]")) void exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, presentation, exit]);

  /* ---------- chưa hydrate: khung tải (khớp SSR) ---------- */
  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark size={72} />
          <p className="font-heading text-2xl font-extrabold">UFO kiểm tra bài cũ</p>
          <p className="font-bold text-ink-soft">Đang tải lớp học…</p>
        </div>
      </div>
    );
  }

  const hasStudents = present.length > 0;
  const isEmptyClass = cls.students.length === 0;
  const resultOpen = phase === "completed" && state.pendingTurn !== null;

  return (
    <div
      ref={rootRef}
      className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#10263b] p-1.5 sm:p-2.5"
    >
      {state.saveError && !bannerHidden && (
        <div
          role="alert"
          className="absolute inset-x-2 top-2 z-40 flex items-start gap-2 rounded-xl border-2 border-line bg-sun px-3 py-2 text-sm font-bold shadow-[0_3px_0_var(--line)]"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="flex-1">
            Không lưu được dữ liệu trên trình duyệt này ({state.saveError}). Bạn vẫn dùng được, nhưng danh sách có thể
            mất khi đóng trang.
          </span>
          <button className="underline" onClick={() => setBannerHidden(true)}>
            Ẩn
          </button>
        </div>
      )}

      <main className="flex min-h-0 w-full flex-1 items-center justify-center">
        <Scene
          template={template}
          students={present}
          calledIds={calledSet}
          phase={phase}
          turn={state.pendingTurn}
          speed={settings.speed}
          effect={settings.effect}
          bubbles={settings.speechBubbles}
          reducedMotion={reduced}
          chromePx={shortViewport ? 12 : 20}
          onPhaseDone={(p) => appStore.advance(p)}
          onSfx={onSfx}
          overlay={
            <>
              {!presentation && (
                <header className="absolute inset-x-0 top-0 z-20 p-2 sm:p-3">
                  <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-2 rounded-2xl border-2 border-line bg-white/88 px-2 py-1.5 shadow-[0_3px_0_rgba(51,56,77,.3)] backdrop-blur-md sm:px-3">
                    <Header className="shrink-0" />
                    <Toolbar
                      classes={state.classes}
                      activeClassId={state.activeClassId}
                      templateName={template.name}
                      soundOn={settings.soundOn}
                      locked={running}
                      onSelectClass={(id) => appStore.setActiveClass(id)}
                      onManageClasses={() => openDialog("classes")}
                      onTemplates={() => openDialog("templates")}
                      onStudents={() => openDialog("students")}
                      onSettings={() => openDialog("settings")}
                      onToggleSound={toggleSound}
                      onFullscreen={() => void enter()}
                    />
                  </div>
                </header>
              )}

              {running && (
                <p
                  className={`pointer-events-none absolute left-3 z-10 rounded-full border-2 border-line bg-[#14304A] px-3 py-1 text-xs font-extrabold text-[#7CF5CF] shadow-[0_2px_0_var(--line)] ${presentation ? "top-3" : "top-[4.75rem] sm:top-[5.25rem]"}`}
                  aria-hidden
                >
                  {phase === "scanning" && settings.effect === "siege"
                    ? "UFO đang bao vây cả lớp…"
                    : PHASE_TEXT[phase]}
                </p>
              )}

              {!hasStudents && (
                <div className="absolute inset-0 grid place-items-center bg-white/30 p-4 backdrop-blur-[2px]">
                  <div className="max-w-md rounded-[28px] border-[3px] border-line bg-cream p-6 text-center shadow-[0_8px_0_rgba(51,56,77,.25)]">
                    <LogoMark size={56} />
                    <h2 className="mt-2 font-heading text-2xl font-extrabold">
                      {isEmptyClass ? "Lớp chưa có học sinh" : "Cả lớp đang được đánh dấu vắng"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">
                      {isEmptyClass
                        ? "Nhập danh sách từ Excel/Google Sheets hoặc thêm từng bạn để UFO có người để gọi."
                        : "Hãy đánh dấu có mặt cho các bạn trong danh sách học sinh."}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {isEmptyClass ? (
                        <>
                          <Btn variant="mint" onClick={() => openDialog("import")} icon={<FileSpreadsheet className="size-5" aria-hidden />}>
                            Nhập từ Excel
                          </Btn>
                          <Btn variant="primary" onClick={() => openDialog("students")} icon={<UserPlus className="size-5" aria-hidden />}>
                            Thêm học sinh
                          </Btn>
                          <Btn variant="ghost" onClick={() => appStore.loadDemoIntoActive()} icon={<FlaskConical className="size-5" aria-hidden />}>
                            Dùng dữ liệu demo
                          </Btn>
                        </>
                      ) : (
                        <Btn variant="primary" onClick={() => openDialog("students")}>
                          Mở danh sách học sinh
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {presentation && (
                <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => void exit()}
                    icon={<Minimize2 className="size-4" aria-hidden />}
                    title="Thoát toàn màn hình (Esc)"
                  >
                    <span className="hidden sm:inline">Thoát toàn màn hình</span>
                  </Btn>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-20 p-2 sm:p-3">
                <ControlBar
                  running={running}
                  canStart={canStart(phase) && !resultOpen}
                  pickCount={settings.pickCount}
                  effect={settings.effect}
                  maxPick={present.length}
                  remaining={eligible}
                  poolSize={present.length}
                  noRepeat={settings.noRepeat}
                  cycle={cls.cycle}
                  last={lastEntry}
                  compact
                  onStart={() => start()}
                  onSkip={() => appStore.skipToCompleted()}
                  onChangeCount={(n) => appStore.setSettings({ pickCount: n })}
                  onChangeEffect={(e) => appStore.setSettings({ effect: e })}
                  onHistory={() => openDialog("history")}
                />
              </div>
            </>
          }
        />
      </main>

      {/* ---------- hộp thoại ---------- */}
      <ResultDialog
        open={resultOpen}
        turn={state.pendingTurn}
        onClose={closeResult}
        onNext={nextTurn}
      />
      <PlanDialog
        plan={plan}
        onClose={() => setPlan(null)}
        onCallRemaining={(n) => {
          setPlan(null);
          start(n);
        }}
        onNewRound={() => askNewRound(true)}
        onOpenSettings={() => {
          setPlan(null);
          openDialog("settings");
        }}
        onOpenStudents={() => {
          setPlan(null);
          openDialog("students");
        }}
      />
      <StudentsDialog
        open={dialog === "students"}
        onClose={closeDialog}
        cls={cls}
        locked={running}
        onImport={() => openDialog("import")}
        onConfirm={setConfirm}
      />
      <ImportDialog open={dialog === "import"} onClose={() => openDialog("students")} cls={cls} />
      <SettingsDialog
        open={dialog === "settings"}
        onClose={closeDialog}
        state={state}
        cls={cls}
        locked={running}
        onConfirm={setConfirm}
      />
      <TemplateDialog open={dialog === "templates"} onClose={closeDialog} currentId={template.id} />
      <HistoryDialog
        open={dialog === "history"}
        onClose={closeDialog}
        state={state}
        cls={cls}
        locked={running}
        onConfirm={setConfirm}
      />
      <ClassesDialog
        open={dialog === "classes"}
        onClose={closeDialog}
        state={state}
        locked={running}
        onConfirm={setConfirm}
      />
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
      <Toasts />
    </div>
  );
}
