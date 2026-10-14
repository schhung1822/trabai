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
      className={`mx-auto w-full rounded-[28px] border-[3px] border-line bg-white/85 shadow-[0_6px_0_rgba(51,56,77,.2)] backdrop-blur ${
        p.compact ? "p-2.5" : "p-3.5 sm:p-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {p.running ? (
            <>
              <Btn
                size="lg"
                variant="primary"
                disabled
                aria-live="polite"
                icon={<Rocket className="size-6 animate-pulse" aria-hidden />}
              >
                UFO đang hoạt động…
              </Btn>
              <Btn
                size="lg"
                variant="ghost"
                onClick={p.onSkip}
                icon={<FastForward className="size-6" aria-hidden />}
              >
                Bỏ qua hoạt cảnh
              </Btn>
            </>
          ) : (
            <Btn
              size="lg"
              variant="primary"
              disabled={!p.canStart}
              onClick={p.onStart}
              icon={<Rocket className="size-6" aria-hidden />}
              className="min-w-56"
            >
              Khởi động UFO
            </Btn>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <span id="effect-label" className="text-right text-sm font-extrabold leading-tight text-ink-soft">
              Hiệu ứng
              <br />
              hút người
            </span>
            <div
              role="radiogroup"
              aria-labelledby="effect-label"
              className="grid grid-cols-2 gap-1 rounded-2xl border-2 border-line bg-white p-1"
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
                  className={`min-h-10 rounded-xl px-3 text-sm font-extrabold transition disabled:opacity-60 ${
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

          <div className="flex items-center gap-3">
            <div className="text-right text-sm font-extrabold leading-tight text-ink-soft">
              Số học sinh
              <br />
              sẽ được gọi
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

          <div className="min-w-44" aria-live="polite">
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-ink-soft">
              <Users className="size-4" aria-hidden />
              {p.noRepeat ? `Còn trong lượt chọn (vòng ${p.cycle})` : "Học sinh có mặt"}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-3xl font-extrabold tabular-nums">{p.noRepeat ? p.remaining : p.poolSize}</span>
              <span className="text-lg font-extrabold text-ink-soft tabular-nums">/ {p.poolSize}</span>
            </div>
            {p.noRepeat && (
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

          <Btn variant="sky" onClick={p.onHistory} icon={<History className="size-5" aria-hidden />}>
            Lịch sử gọi bài
          </Btn>
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
