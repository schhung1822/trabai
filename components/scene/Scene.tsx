"use client";

import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SceneEngine,
  type EngineCallbacks,
  type SfxKind,
} from "@/lib/scene-engine";
import { WORLD_H, WORLD_W, viewBoxFor } from "@/lib/scene-constants";
import { buildWalkerSpecs } from "@/lib/walker-spec";
import type { TurnPhase } from "@/lib/turn-machine";
import { speedFactor } from "@/lib/turn-machine";
import type { AbductEffect, AnimationSpeed, PendingTurn, Student } from "@/lib/types";
import type { SceneTemplate } from "@/templates/types";
import { WalkerAvatar } from "./Avatar";
import { GrabbableProps } from "./decor";
import { Ufo } from "./Ufo";

export interface SceneProgress {
  done: number;
  total: number;
  current: string | null;
}

export interface SceneProps {
  template: SceneTemplate;
  /** Chỉ những học sinh có mặt. */
  students: Student[];
  calledIds: ReadonlySet<string>;
  phase: TurnPhase;
  turn: PendingTurn | null;
  speed: AnimationSpeed;
  effect: AbductEffect;
  bubbles: boolean;
  reducedMotion: boolean;
  /** Chiều cao dành cho phần còn lại của giao diện, để scene vừa màn hình. */
  chromePx: number;
  onPhaseDone: (phase: TurnPhase) => void;
  onProgress?: (p: SceneProgress) => void;
  onSfx?: (kind: SfxKind) => void;
  /** Nội dung phủ lên scene (gợi ý, trạng thái…), căn theo đúng khung scene. */
  overlay?: ReactNode;
}

const MIN_ASPECT = 1.1;
const MAX_ASPECT = 1.78;
const OFF = "translate(-9999 -9999)";

/** Lớp nhân vật: React chỉ render một lần; engine điều khiển transform sau đó. */
const WalkersLayer = memo(function WalkersLayer({
  students,
  calledIds,
  template,
}: {
  students: Student[];
  calledIds: ReadonlySet<string>;
  template: SceneTemplate;
}) {
  const ordered = useMemo(() => {
    const specs = buildWalkerSpecs(
      students.map((s) => s.id),
      template.lanes,
    );
    return students
      .slice()
      .sort(
        (a, b) =>
          (specs.get(a.id)?.y ?? 0) - (specs.get(b.id)?.y ?? 0) ||
          (a.id < b.id ? -1 : 1),
      );
  }, [students, template.lanes]);
  return (
    <g data-layer="walkers">
      {ordered.map((s) => (
        <WalkerAvatar
          key={s.id}
          id={s.id}
          name={s.name}
          gender={s.gender}
          called={calledIds.has(s.id)}
          initialTransform={OFF}
          labelTransform=""
        />
      ))}
    </g>
  );
});

export function Scene(props: SceneProps) {
  const {
    template,
    students,
    calledIds,
    phase,
    turn,
    speed,
    effect,
    bubbles,
    reducedMotion,
    chromePx,
    overlay,
  } = props;

  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const lastTurnRef = useRef<string | null>(null);

  const [outerW, setOuterW] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [live, setLive] = useState("");

  // Callback mới nhất cho engine (tránh tạo lại engine khi props đổi).
  const cbRef = useRef(props);
  useEffect(() => {
    cbRef.current = props;
  });

  /* ---- đo kích thước ---- */
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      setOuterW(el.getBoundingClientRect().width);
      setViewportH(window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const targetH = Math.max(300, (viewportH || 800) - chromePx);
  const effW = Math.min(outerW || 1000, targetH * MAX_ASPECT);
  const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, effW / targetH));
  const { vbW, vbX } = viewBoxFor(aspect);
  const ppu = effW / vbW;

  /* ---- engine ---- */
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const callbacks: EngineCallbacks = {
      onPhaseDone: (p) => cbRef.current.onPhaseDone(p),
      onProgress: (info) => {
        cbRef.current.onProgress?.(info);
        if (info.current) setLive(`Đang hút ${info.current}. Đã gọi ${info.done}/${info.total}.`);
        else if (info.done > 0) setLive(`Đã gọi ${info.done}/${info.total}.`);
      },
      sfx: (k) => cbRef.current.onSfx?.(k),
    };
    const engine = new SceneEngine(svg, callbacks);
    engineRef.current = engine;
    lastTurnRef.current = null;
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    engineRef.current?.configure({
      lanes: template.lanes,
      grabPoints: template.grabPoints,
      fx: template.fx,
      viewport: { vbX, vbW, ppu: Math.max(0.15, ppu) },
      reducedMotion,
    });
    engineRef.current?.syncRoster(students.map((s) => ({ id: s.id, name: s.name })));
  }, [template, vbX, vbW, ppu, reducedMotion, students]);

  /* ---- chạy / dừng lượt ---- */
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (phase === "arriving" && turn && lastTurnRef.current !== turn.id) {
      lastTurnRef.current = turn.id;
      engine.runTurn({
        targets: turn.picked.map((p) => ({ id: p.id, name: p.name })),
        speedFactor: speedFactor(speed),
        mode: effect,
        bubbles,
      });
    } else if ((phase === "completed" || phase === "idle") && engine.isRunning()) {
      engine.finishNow();
    }
  }, [phase, turn, speed, bubbles, effect]);

  const fx = template.fx;
  const { Background, Foreground, Lights } = template;
  const bgId = `${uid}bg`;

  return (
    <div ref={outerRef} className="w-full">
      <div
        className="relative mx-auto select-none overflow-hidden rounded-[28px] border-[3px] border-[#33384d] bg-sky-200 shadow-[0_10px_0_rgba(51,56,77,0.14),0_24px_50px_-12px_rgba(36,52,71,0.35)]"
        style={{ width: effW || undefined, aspectRatio: aspect }}
      >
        <svg
          ref={svgRef}
          viewBox={`${vbX} 0 ${vbW} ${WORLD_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
          role="img"
          aria-label={`Hoạt cảnh “${template.name}”: ${students.length} học sinh đang đi dạo`}
        >
          <defs>
            <linearGradient id={`${uid}beam`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={fx.beam.core} stopOpacity="0.92" />
              <stop offset="0.6" stopColor={fx.beam.edge} stopOpacity="0.5" />
              <stop offset="1" stopColor={fx.beam.edge} stopOpacity="0.28" />
            </linearGradient>
            <radialGradient id={`${uid}glow`}>
              <stop offset="0" stopColor={fx.beam.glow} stopOpacity="0.95" />
              <stop offset="1" stopColor={fx.beam.edge} stopOpacity="0" />
            </radialGradient>
          </defs>

          <g data-layer="bg">
            <Background idp={bgId} />
          </g>
          <GrabbableProps points={template.grabPoints} />
          <WalkersLayer
            students={students}
            calledIds={calledIds}
            template={template}
          />
          <g data-layer="fg">
            <Foreground idp={bgId} />
          </g>

          <rect
            data-fx="night"
            x={0}
            y={0}
            width={WORLD_W}
            height={WORLD_H}
            fill={fx.night.color}
            opacity={0}
            style={{ pointerEvents: "none" }}
          />
          <g data-fx="lights" opacity={0} style={{ pointerEvents: "none" }}>
            <Lights idp={bgId} />
          </g>

          <g data-fx="beam" opacity={0} style={{ pointerEvents: "none" }}>
            <ellipse data-fx="beam-glow" cx={800} cy={830} rx={150} ry={30} fill={`url(#${uid}glow)`} />
            <polygon data-fx="beam-outer" points="0,0 0,0 0,0 0,0" fill={`url(#${uid}beam)`} />
            <polygon data-fx="beam-inner" points="0,0 0,0 0,0 0,0" fill="#fff" opacity={0.28} />
            {Array.from({ length: 14 }, (_, i) => (
              <circle key={i} data-spark cx={0} cy={0} r={3} fill="#fff" opacity={0} />
            ))}
          </g>

          <g data-fx="ufo" opacity={0} transform="translate(800 -400)" style={{ pointerEvents: "none" }}>
            <Ufo fx={{ ...fx.ufo, beamCore: fx.beam.core }} idp={`${uid}ufo`} />
          </g>

          <g data-fx="abduct" style={{ pointerEvents: "none" }} />

          <g data-fx="hud" opacity={0} style={{ pointerEvents: "none" }}>
            <rect data-hud-bg x={-100} y={-30} width={200} height={60} rx={18} fill="#14304A" stroke="#7CF5CF" strokeWidth={2.4} />
            <text
              data-hud-name
              y={-5}
              textAnchor="middle"
              fontSize={16}
              fontWeight={800}
              fill="#fff"
              style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
            />
            <text
              data-hud-count
              y={18}
              textAnchor="middle"
              fontSize={14}
              fontWeight={800}
              fill="#7CF5CF"
              style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
            />
          </g>

          <g data-fx="bubbles" style={{ pointerEvents: "none" }}>
            {Array.from({ length: 5 }, (_, i) => (
              <g key={i} data-bubble opacity={0}>
                <rect x={-60} y={-42} width={120} height={32} rx={16} fill="#fff" stroke="#33384d" strokeWidth={1.8} />
                <path d="M -6 -11 L 0 0 L 6 -11" fill="#fff" stroke="#33384d" strokeWidth={1.8} strokeLinejoin="round" />
                <path d="M -4.4 -11.4 L 4.4 -11.4" stroke="#fff" strokeWidth={3} />
                <text
                  y={-20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={14}
                  fontWeight={800}
                  fill="#243447"
                  style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
                />
              </g>
            ))}
          </g>
        </svg>
        {overlay}
        <div className="sr-only" aria-live="polite" role="status">
          {phase === "idle" ? "" : live}
        </div>
      </div>
    </div>
  );
}
