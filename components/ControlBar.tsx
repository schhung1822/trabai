"use client";

import { FastForward, History, Rocket, Users } from "lucide-react";
import { Btn, Stepper } from "@/components/ui/controls";
import type { AbductEffect, HistoryEntry } from "@/lib/types";

interface ControlBarProps {
  running: boolean;
  canStart: boolean;
  pickCount: number;
  effect: AbductEffect;
  maxPick: number;
  remaining: number;
  poolSize: number;
  noRepeat: boolean;
  cycle: number;
  last: HistoryEntry | null;
  compact: boolean;
  onStart: () => void;
  onSkip: () => void;
  onChangeCount: (n: number) => void;
  onChangeEffect: (e: AbductEffect) => void;
  onHistory: () => void;
}

export function ControlBar(p: ControlBarProps) {
  const pct = p.poolSize > 0 ? Math.round((p.remaining / p.poolSize) * 100) : 0;
  return (
    <section
      aria-label="Điều khiển gọi bài"
      className={`mx-auto w-full max-w-[1180px] border-line bg-white/88 backdrop-blur-md ${
        p.compact
          ? "rounded-[20px] border-2 p-2 shadow-[0_4px_0_rgba(51,56,77,.22)]"
          : "rounded-[28px] border-[3px] p-3.5 shadow-[0_6px_0_rgba(51,56,77,.2)] sm:p-4"
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between ${p.compact ? "gap-x-3 gap-y-2" : "gap-x-6 gap-y-3"}`}>
        <div className={`flex flex-wrap items-center justify-center ${p.compact ? "gap-x-3 gap-y-2" : "gap-x-6 gap-y-3"}`}>
          <div className={`flex items-center ${p.compact ? "gap-1.5" : "gap-2.5"}`}>
            <span id="effect-label" className={`${p.compact ? "sr-only" : "text-right text-sm font-extrabold leading-tight text-ink-soft"}`}>
              Hiệu ứng hút người
            </span>
            <div
              role="radiogroup"
              aria-labelledby="effect-label"
              className={`grid grid-cols-2 border-2 border-line bg-white ${p.compact ? "gap-0.5 rounded-xl p-0.5" : "gap-1 rounded-2xl p-1"}`}
            >
              {(
                [
                  ["single", "Bắt lẻ"],
                  ["siege", "Bao vây"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={p.effect === v}
                  disabled={p.running}
                  onClick={() => p.onChangeEffect(v)}
                  className={`${p.compact ? "min-h-8 rounded-lg px-2 text-xs" : "min-h-10 rounded-xl px-3 text-sm"} font-extrabold transition disabled:opacity-60 ${
                    p.effect === v
                      ? "bg-sun text-ink shadow-[inset_0_0_0_2px_var(--line)]"
                      : "text-ink-soft hover:bg-cream-2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={`flex items-center ${p.compact ? "gap-1.5" : "gap-3"}`}>
            <div className={`${p.compact ? "text-xs" : "text-right text-sm leading-tight"} font-extrabold text-ink-soft`}>
              {p.compact ? "Số bạn" : <>Số học sinh<br />sẽ được gọi</>}
            </div>
            <Stepper
              label="Số học sinh sẽ được gọi"
              value={Math.min(p.pickCount, Math.max(1, p.maxPick))}
              min={1}
              max={Math.max(1, p.maxPick)}
              disabled={p.running}
              onChange={p.onChangeCount}
              compact
            />
          </div>

          <div className={p.compact ? "flex items-center gap-1.5" : "min-w-44"} aria-live="polite">
            <div className={`flex items-center gap-1.5 font-extrabold text-ink-soft ${p.compact ? "text-xs" : "text-sm"}`}>
              <Users className="size-4" aria-hidden />
              {p.compact
                ? p.noRepeat ? `Còn vòng ${p.cycle}` : "Có mặt"
                : p.noRepeat ? `Còn trong lượt chọn (vòng ${p.cycle})` : "Học sinh có mặt"}
            </div>
            <div className={`flex items-baseline font-extrabold tabular-nums ${p.compact ? "gap-0.5 text-sm" : "gap-1.5"}`}>
              <span className={`font-heading ${p.compact ? "text-xl" : "text-3xl"}`}>{p.noRepeat ? p.remaining : p.poolSize}</span>
              <span className={p.compact ? "text-xs text-ink-soft" : "text-lg text-ink-soft"}>/ {p.poolSize}</span>
            </div>
            {p.noRepeat && !p.compact && (
              <div
                className="mt-0.5 h-2.5 overflow-hidden rounded-full border-2 border-line bg-cream-2"
                role="progressbar"
                aria-label="Học sinh còn lại trong vòng"
                aria-valuemin={0}
                aria-valuemax={p.poolSize}
                aria-valuenow={p.remaining}
              >
                <div className="h-full bg-mint-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          <Btn
            variant="sky"
            size={p.compact ? "icon" : "md"}
            className={p.compact ? "!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]" : ""}
            onClick={p.onHistory}
            aria-label={p.compact ? "Lịch sử gọi bài" : undefined}
            title={p.compact ? "Lịch sử gọi bài" : undefined}
            icon={<History className={p.compact ? "size-4.5" : "size-5"} aria-hidden />}
          >
            {!p.compact && "Lịch sử gọi bài"}
          </Btn>
        </div>

        <div className={`ml-auto flex flex-wrap items-center justify-center ${p.compact ? "gap-2" : "gap-3"}`}>
          {p.running ? (
            <>
              <Btn
                size={p.compact ? "md" : "lg"}
                variant="primary"
                className={p.compact ? "!min-h-10 !rounded-xl !px-3 !py-1.5 !text-sm !shadow-[0_3px_0_var(--line)]" : ""}
                disabled
                aria-live="polite"
                icon={<Rocket className={`${p.compact ? "size-4.5" : "size-6"} animate-pulse`} aria-hidden />}
              >
                UFO đang chạy…
              </Btn>
              <Btn
                size={p.compact ? "sm" : "lg"}
                variant="ghost"
                className={p.compact ? "!min-h-9 !shadow-[0_2px_0_var(--line)]" : ""}
                onClick={p.onSkip}
                icon={<FastForward className={p.compact ? "size-4" : "size-6"} aria-hidden />}
              >
                Bỏ qua
              </Btn>
            </>
          ) : (
            <Btn
              size={p.compact ? "md" : "lg"}
              variant="primary"
              disabled={!p.canStart}
              onClick={p.onStart}
              icon={<Rocket className={p.compact ? "size-5" : "size-6"} aria-hidden />}
              className={p.compact ? "!min-h-10 !rounded-xl !px-4 !py-1.5 !text-base !shadow-[0_3px_0_var(--line)]" : "min-w-56"}
            >
              Khởi động UFO
            </Btn>
          )}
        </div>
      </div>

      {p.last && !p.running && !p.compact && (
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t-2 border-line/10 pt-3 text-sm font-bold text-ink-soft lg:justify-start">
          <span>Lượt gần nhất:</span>
          {p.last.picked.map((x) => (
            <span key={x.id} className="rounded-full border-2 border-line bg-mint/50 px-2.5 py-0.5 font-extrabold text-ink">
              {x.name}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
