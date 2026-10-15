"use client";

import { Minus, Plus } from "lucide-react";
import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type Variant = "primary" | "accent" | "mint" | "sky" | "ghost" | "danger" | "plain";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-sun text-ink hover:bg-[#ffd75e] border-line shadow-[0_4px_0_var(--line)]",
  accent:
    "bg-orange text-white hover:bg-[#ff9a55] border-line shadow-[0_4px_0_var(--line)]",
  mint: "bg-mint text-ink hover:bg-[#98edd1] border-line shadow-[0_4px_0_var(--line)]",
  sky: "bg-sky text-ink hover:bg-[#a6dcfb] border-line shadow-[0_4px_0_var(--line)]",
  ghost:
    "bg-white text-ink hover:bg-cream-2 border-line shadow-[0_4px_0_var(--line)]",
  danger:
    "bg-danger text-white hover:bg-[#ee6770] border-line shadow-[0_4px_0_var(--line)]",
  plain:
    "bg-transparent text-ink hover:bg-black/5 border-transparent shadow-none",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm rounded-xl",
  md: "min-h-11 px-4 py-2 text-[15px] rounded-2xl",
  lg: "min-h-14 px-7 py-3 text-xl rounded-[20px]",
  icon: "size-11 rounded-2xl",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant = "ghost", size = "md", icon, className = "", children, type = "button", ...rest },
  ref,
) {
  const pressable = variant !== "plain";
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      className={`inline-flex select-none items-center justify-center gap-2 border-2 font-extrabold transition-[transform,box-shadow,background-color] ${
        pressable
          ? "active:translate-y-[3px] active:shadow-none disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_var(--line)]"
          : ""
      } disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
});

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div id={id} className="font-extrabold">
          {label}
        </div>
        {description && (
          <div className="text-sm font-semibold text-ink-soft">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-line transition-colors disabled:opacity-50 ${
          checked ? "bg-mint-600" : "bg-[#d8dee6]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full border-2 border-line bg-white transition-all ${
            checked ? "left-[26px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl border-2 border-line bg-white p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-xl px-3 text-[15px] font-extrabold transition disabled:opacity-50 ${
            value === o.value
              ? "bg-sun text-ink shadow-[inset_0_0_0_2px_var(--line)]"
              : "text-ink-soft hover:bg-cream-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  disabled,
  compact,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const size = compact ? "size-9" : "size-11";
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Giảm ${label.toLowerCase()}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${size} grid place-items-center rounded-xl border-2 border-line bg-white shadow-[0_3px_0_var(--line)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-40`}
      >
        <Minus className="size-5" aria-hidden />
      </button>
      <output
        aria-live="polite"
        className={`${compact ? "min-w-7 text-2xl" : "min-w-10 text-3xl"} text-center font-heading font-extrabold tabular-nums`}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={`Tăng ${label.toLowerCase()}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${size} grid place-items-center rounded-xl border-2 border-line bg-white shadow-[0_3px_0_var(--line)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-40`}
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  );
}

export const inputCls =
  "min-h-11 w-full rounded-xl border-2 border-line bg-white px-3 py-2 font-semibold placeholder:font-medium placeholder:text-ink-soft/70 disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-extrabold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm font-semibold text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
