import { Users } from "lucide-react";

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="60" height="60" rx="18" fill="#14304A" stroke="#33384d" strokeWidth="3" />
      <path d="M22 44 L12 58 H52 L42 44 Z" fill="#7CF5CF" opacity="0.55" />
      <path d="M20 31 C20 14 44 14 44 31 Z" fill="#8FE9D0" stroke="#33384d" strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="32" cy="33" rx="25" ry="8.5" fill="#C3D1E2" stroke="#33384d" strokeWidth="2.6" />
      <circle cx="17" cy="34" r="2.6" fill="#FFD43B" />
      <circle cx="32" cy="37" r="2.6" fill="#FF8A3D" />
      <circle cx="47" cy="34" r="2.6" fill="#FFD43B" />
      <circle cx="32" cy="24" r="4.4" fill="#93E6AE" stroke="#33384d" strokeWidth="1.6" />
    </svg>
  );
}

export function Header({ className }: { className: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      <div className="min-w-0">
        <h1 className="font-heading text-[1.7rem] font-extrabold leading-none tracking-tight sm:text-3xl">
          App Trả Bài
        </h1>
        <p className="mt-0.5 hidden text-sm font-bold text-ink-soft sm:block short:hidden">UFO gọi bài – vui mà công bằng</p>
      </div>
    </div>
  );
}

export function ClassChip({ name, count }: { name: string; count: number }) {
  return (
    <span className="inline-flex max-w-[16rem] items-center gap-2 rounded-full border-2 border-line bg-mint px-3.5 py-1.5 text-sm font-extrabold shadow-[0_3px_0_var(--line)]">
      <Users className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{name}</span>
      <span className="shrink-0 rounded-full bg-white/70 px-2 text-xs tabular-nums">{count}</span>
    </span>
  );
}
