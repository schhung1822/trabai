import type { CSSProperties, ReactNode } from "react";

/** Nét viền chung để đồng bộ phong cách cartoon với nhân vật. */
export const OUT = {
  stroke: "#33384d",
  strokeWidth: 2,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};
const OUT_THIN = { ...OUT, strokeWidth: 1.4 };

export const DISPLAY_FONT: CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
};

/* ------------------------------------------------------------------ */
/* Bầu trời, mây                                                       */
/* ------------------------------------------------------------------ */

export function Cloud({
  x,
  y,
  s = 1,
  fill = "#fff",
  opacity = 0.95,
  drift = 60,
  delay = 0,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
  opacity?: number;
  drift?: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <g
        className="cloud-drift"
        style={{ animationDuration: `${drift}s`, animationDelay: `${-delay}s` }}
      >
        <path
          d="M -70 20 C -92 20 -92 -6 -70 -8 C -70 -34 -34 -40 -22 -18 C -8 -42 36 -38 40 -10 C 66 -14 80 18 56 20 Z"
          fill={fill}
        />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Cây                                                                 */
/* ------------------------------------------------------------------ */

/** Cây xanh tròn. (x, y) = gốc cây. */
export function RoundTree({
  x,
  y,
  s = 1,
  leaf = "#5CBF6E",
  leafDark = "#47A85C",
  trunk = "#9A6B45",
}: {
  x: number;
  y: number;
  s?: number;
  leaf?: string;
  leafDark?: string;
  trunk?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -9 0 L -6 -90 L 6 -90 L 9 0 Z" fill={trunk} {...OUT} />
      <path d="M 0 -60 L 24 -96" stroke={trunk} strokeWidth={6} strokeLinecap="round" />
      <circle cx={-34} cy={-128} r={38} fill={leafDark} {...OUT} />
      <circle cx={34} cy={-128} r={38} fill={leafDark} {...OUT} />
      <circle cx={0} cy={-158} r={46} fill={leaf} {...OUT} />
      <circle cx={-6} cy={-118} r={42} fill={leaf} {...OUT} />
      <circle cx={-14} cy={-170} r={9} fill="#fff" opacity={0.22} />
      <circle cx={22} cy={-130} r={7} fill="#fff" opacity={0.18} />
    </g>
  );
}

/** Cây phượng (hoa đỏ) cho sân trường. */
export function FlameTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const dots: [number, number, number][] = [
    [-52, -150, 6], [-20, -190, 7], [22, -196, 6], [56, -158, 7], [-6, -150, 6],
    [38, -126, 6], [-48, -118, 6], [8, -216, 6], [-34, -172, 5], [70, -128, 5],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -12 0 L -7 -100 L 7 -100 L 12 0 Z" fill="#8A5A3A" {...OUT} />
      <path d="M 0 -76 L -40 -118" stroke="#8A5A3A" strokeWidth={8} strokeLinecap="round" />
      <path d="M 0 -84 L 44 -122" stroke="#8A5A3A" strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={0} cy={-150} rx={88} ry={56} fill="#4FB26A" {...OUT} />
      <ellipse cx={-42} cy={-132} rx={52} ry={38} fill="#3E9C59" {...OUT} />
      <ellipse cx={46} cy={-136} rx={52} ry={38} fill="#3E9C59" {...OUT} />
      <ellipse cx={4} cy={-176} rx={56} ry={36} fill="#5CC277" {...OUT} />
      {dots.map(([dx, dy, r], i) => (
        <circle key={i} cx={dx} cy={dy} r={r} fill="#EE4B3F" stroke="#B22E2A" strokeWidth={1.2} />
      ))}
    </g>
  );
}

/** Cây dừa. */
export function Palm({ x, y, s = 1, color = "#2E7D4F" }: { x: number; y: number; s?: number; color?: string }) {
  const leaf = (rot: number) => (
    <path
      transform={`rotate(${rot})`}
      d="M 0 0 C 30 -30 80 -26 110 4 C 78 -12 40 -10 0 0 Z"
      fill={color}
      {...OUT_THIN}
    />
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -7 0 C -4 -80 6 -150 18 -210 L 28 -208 C 18 -150 12 -80 9 0 Z" fill="#8A6044" {...OUT} />
      <g transform="translate(23 -210)">
        {[-160, -125, -90, -55, -20, 15, 50].map((r, i) => (
          <g key={i}>{leaf(r)}</g>
        ))}
        <circle cx={0} cy={4} r={7} fill="#6B4A32" {...OUT_THIN} />
        <circle cx={-8} cy={10} r={6} fill="#7A5A3A" {...OUT_THIN} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Đèn đường                                                           */
/* ------------------------------------------------------------------ */

/** Đèn đường kiểu cổ; (x, y) = chân cột. */
export function Lamp({
  x,
  y,
  h = 160,
  s = 1,
  color = "#3F4A5E",
}: {
  x: number;
  y: number;
  h?: number;
  s?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-9} y={-12} width={18} height={12} rx={3} fill={color} {...OUT_THIN} />
      <rect x={-4} y={-h} width={8} height={h - 8} rx={3} fill={color} {...OUT_THIN} />
      <path d={`M 0 ${-h} C 0 ${-h - 26} 26 ${-h - 22} 26 ${-h - 12}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <path d={`M 14 ${-h - 12} L 38 ${-h - 12} L 33 ${-h - 2} L 19 ${-h - 2} Z`} fill={color} {...OUT_THIN} />
      <ellipse cx={26} cy={-h} rx={9} ry={5} fill="#FFF3B0" stroke="#33384d" strokeWidth={1.2} />
    </g>
  );
}

/** Quầng sáng đèn (dùng trong lớp "Lights" hiện khi trời tối). */
export function LampGlow({
  x,
  y,
  h = 160,
  s = 1,
  color = "#FFE08A",
  beamTo = 110,
}: {
  x: number;
  y: number;
  h?: number;
  s?: number;
  color?: string;
  beamTo?: number;
}) {
  const cx = x + 26 * s;
  const cy = y - h * s;
  return (
    <g>
      <circle cx={cx} cy={cy} r={46 * s} fill={color} opacity={0.26} />
      <circle cx={cx} cy={cy} r={22 * s} fill={color} opacity={0.55} />
      <path
        d={`M ${cx - 10 * s} ${cy + 4} L ${cx + 10 * s} ${cy + 4} L ${cx + beamTo * s} ${y + 4} L ${cx - beamTo * s} ${y + 4} Z`}
        fill={color}
        opacity={0.16}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Phương tiện (hướng sang phải; (x, y) = tâm đáy)                     */
/* ------------------------------------------------------------------ */

export function Car({
  x = 0,
  y = 0,
  s = 1,
  color = "#E8505B",
}: {
  x?: number;
  y?: number;
  s?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={80} ry={6} fill="rgba(20,30,50,.25)" />
      <path d="M -36 -38 L -22 -64 L 32 -64 L 48 -38 Z" fill={color} {...OUT} />
      <path d="M -29 -41 L -19 -60 L 0 -60 L 0 -41 Z" fill="#CFEFFF" {...OUT_THIN} />
      <path d="M 6 -41 L 6 -60 L 30 -60 L 41 -41 Z" fill="#CFEFFF" {...OUT_THIN} />
      <rect x={-74} y={-42} width={148} height={30} rx={11} fill={color} {...OUT} />
      <rect x={-74} y={-26} width={148} height={6} fill="#000" opacity={0.12} />
      <rect x={64} y={-36} width={9} height={8} rx={3} fill="#FFE08A" stroke="#33384d" strokeWidth={1.2} />
      <rect x={-73} y={-36} width={7} height={8} rx={3} fill="#FF6B6B" stroke="#33384d" strokeWidth={1.2} />
      {[-42, 42].map((wx) => (
        <g key={wx} transform={`translate(${wx} -12)`}>
          <circle r={14} fill="#2D3340" {...OUT} />
          <circle r={6} fill="#B9C2D0" />
        </g>
      ))}
    </g>
  );
}

export function Moto({
  x = 0,
  y = 0,
  s = 1,
  color = "#2EC4A0",
  shirt = "#FFC93C",
  rider = true,
}: {
  x?: number;
  y?: number;
  s?: number;
  color?: string;
  shirt?: string;
  rider?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={46} ry={5} fill="rgba(20,30,50,.25)" />
      {rider && (
        <g>
          <path d="M -6 -50 L -2 -76 L 16 -74 L 14 -48 Z" fill={shirt} {...OUT} />
          <path d="M 14 -70 L 30 -54" stroke={shirt} strokeWidth={7} strokeLinecap="round" />
          <path d="M 6 -48 L 22 -34 L 18 -20" fill="none" stroke="#3D4B6B" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={7} cy={-88} r={11} fill="#F4C7A0" {...OUT} />
          <path d="M -5 -90 C -5 -104 20 -104 19 -90 Z" fill={color} {...OUT_THIN} />
        </g>
      )}
      <path d="M -30 -20 C -30 -34 -6 -40 8 -36 L 24 -36 L 32 -22 Z" fill={color} {...OUT} />
      <rect x={-20} y={-42} width={26} height={8} rx={4} fill="#33384d" />
      <path d="M 26 -50 L 34 -44 L 28 -22" fill="none" stroke="#33384d" strokeWidth={3} strokeLinecap="round" />
      <path d="M 24 -50 L 36 -52" stroke="#33384d" strokeWidth={3.4} strokeLinecap="round" />
      {[-30, 32].map((wx) => (
        <g key={wx} transform={`translate(${wx} -14)`}>
          <circle r={14} fill="#2D3340" {...OUT} />
          <circle r={5} fill="#B9C2D0" />
        </g>
      ))}
    </g>
  );
}

/** Lớp bọc chuyển động lặp cho phương tiện chạy ngang. */
export function Driving({
  children,
  dir,
  y,
  duration,
  delay = 0,
}: {
  children: ReactNode;
  dir: "ltr" | "rtl";
  y: number;
  duration: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(0 ${y})`}>
      <g
        className={dir === "ltr" ? "drive-ltr" : "drive-rtl"}
        style={{ animationDuration: `${duration}s`, animationDelay: `${-delay}s` }}
      >
        {dir === "rtl" ? <g transform="scale(-1 1)">{children}</g> : children}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Cửa hàng phố Việt Nam                                               */
/* ------------------------------------------------------------------ */

export type ShopKind = "banhmi" | "trasua" | "hotoc" | "bunchar" | "sach" | "taphoa";

interface ShopTheme {
  label: string;
  facade: string;
  trim: string;
  sign: string;
  signText: string;
  awningA: string;
  awningB: string;
}

const SHOP_THEMES: Record<ShopKind, ShopTheme> = {
  banhmi: { label: "BÁNH MÌ", facade: "#FFE3A3", trim: "#E8B863", sign: "#E8505B", signText: "#FFF6E0", awningA: "#E8505B", awningB: "#FFF6E0" },
  trasua: { label: "TRÀ SỮA", facade: "#FFD3DE", trim: "#F2A3B8", sign: "#8A5BD6", signText: "#FFF", awningA: "#8A5BD6", awningB: "#FFF" },
  hotoc: { label: "HỚT TÓC", facade: "#CFE8F7", trim: "#8CC3E3", sign: "#2F6FB3", signText: "#FFF", awningA: "#2F6FB3", awningB: "#FFF" },
  bunchar: { label: "BÚN CHẢ", facade: "#FFD9B0", trim: "#F2A965", sign: "#E26D2A", signText: "#FFF7E8", awningA: "#E26D2A", awningB: "#FFF1D6" },
  sach: { label: "NHÀ SÁCH", facade: "#D5ECD2", trim: "#9BD097", sign: "#2E9C6B", signText: "#FFF", awningA: "#2E9C6B", awningB: "#FFF" },
  taphoa: { label: "TẠP HÓA", facade: "#F6E4C8", trim: "#D9B98A", sign: "#C0453A", signText: "#FFF", awningA: "#F2B134", awningB: "#FFF6E0" },
};

function Awning({ w, a, b }: { w: number; a: string; b: string }) {
  const n = 8;
  const seg = w / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          d={`M ${i * seg} 0 L ${(i + 1) * seg} 0 L ${(i + 1) * seg} 20 Q ${(i + 0.5) * seg} 32 ${i * seg} 20 Z`}
          fill={i % 2 === 0 ? a : b}
          {...OUT_THIN}
        />
      ))}
    </g>
  );
}

function ShopWindowItems({ kind }: { kind: ShopKind }) {
  switch (kind) {
    case "banhmi":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${26 + i * 30} 58)`}>
              <ellipse rx={13} ry={7} fill="#E8B26A" {...OUT_THIN} />
              <path d="M -6 -3 L -2 2 M 0 -4 L 4 1 M 6 -3 L 9 1" stroke="#C98A3E" strokeWidth={1.4} />
            </g>
          ))}
          <rect x={16} y={66} width={128} height={6} rx={2} fill="#B07A4A" {...OUT_THIN} />
          <rect x={52} y={20} width={56} height={18} rx={5} fill="#FFF6E0" {...OUT_THIN} />
          <text x={80} y={33} textAnchor="middle" fontSize={11} fontWeight={800} fill="#C0453A" style={DISPLAY_FONT}>
            Nóng giòn!
          </text>
        </g>
      );
    case "trasua":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${28 + i * 32} 36)`}>
              <path d="M -9 0 L 9 0 L 7 30 L -7 30 Z" fill={["#F6D6C0", "#E9C7F0", "#C9E8D2", "#F9C9D4"][i]} {...OUT_THIN} />
              <rect x={-10} y={-3} width={20} height={5} rx={2} fill="#fff" {...OUT_THIN} />
              <path d="M 3 -3 L 6 -22" stroke="#E8505B" strokeWidth={3} strokeLinecap="round" />
              <circle cx={-3} cy={24} r={1.8} fill="#4A3426" />
              <circle cx={2} cy={21} r={1.8} fill="#4A3426" />
              <circle cx={3} cy={26} r={1.8} fill="#4A3426" />
            </g>
          ))}
          <rect x={14} y={66} width={132} height={6} rx={2} fill="#C79CE8" {...OUT_THIN} />
        </g>
      );
    case "hotoc":
      return (
        <g>
          <rect x={16} y={14} width={128} height={56} rx={6} fill="#EAF6FF" {...OUT_THIN} />
          <circle cx={46} cy={44} r={14} fill="#F4C7A0" {...OUT_THIN} />
          <path d="M 32 40 C 34 24 58 24 60 40 C 54 34 38 34 32 40 Z" fill="#33384d" />
          <path d="M 28 70 L 28 58 Q 46 52 64 58 L 64 70 Z" fill="#fff" {...OUT_THIN} />
          <g transform="translate(100 24)">
            <path d="M 0 0 L 22 36" stroke="#33384d" strokeWidth={3} strokeLinecap="round" />
            <path d="M 22 0 L 0 36" stroke="#33384d" strokeWidth={3} strokeLinecap="round" />
            <circle cx={-3} cy={40} r={6} fill="none" stroke="#E8505B" strokeWidth={3} />
            <circle cx={25} cy={40} r={6} fill="none" stroke="#E8505B" strokeWidth={3} />
          </g>
        </g>
      );
    case "bunchar":
      return (
        <g>
          <g transform="translate(46 50)">
            <path d="M -22 0 L 22 0 C 22 20 -22 20 -22 0 Z" fill="#FFF" {...OUT} />
            <ellipse cx={0} cy={0} rx={22} ry={6} fill="#F2C27A" {...OUT_THIN} />
            <circle cx={-8} cy={-1} r={4} fill="#9A5A32" />
            <circle cx={6} cy={-2} r={4} fill="#9A5A32" />
            <path d="M -6 -10 Q -10 -22 -4 -30 M 6 -10 Q 2 -22 8 -30" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.9} className="steam" />
          </g>
          <g transform="translate(108 50)">
            <path d="M -22 0 L 22 0 C 22 20 -22 20 -22 0 Z" fill="#FFF" {...OUT} />
            <ellipse cx={0} cy={0} rx={22} ry={6} fill="#B9E6A0" {...OUT_THIN} />
            <path d="M 14 -14 L -10 8 M 20 -12 L -4 10" stroke="#C98A3E" strokeWidth={2.4} strokeLinecap="round" />
          </g>
          <rect x={14} y={66} width={132} height={6} rx={2} fill="#B07A4A" {...OUT_THIN} />
        </g>
      );
    case "sach":
      return (
        <g>
          {[
            ["#E8505B", 22], ["#FFC93C", 34], ["#3E8EDE", 46], ["#7C5CE0", 58], ["#2EC4A0", 70],
          ].map(([c, bx], i) => (
            <rect key={i} x={Number(bx) - 6} y={34 - (i % 2) * 6} width={11} height={32 + (i % 2) * 6} rx={2} fill={String(c)} {...OUT_THIN} />
          ))}
          <g transform="translate(112 40)">
            <rect x={-26} y={14} width={52} height={10} rx={2} fill="#FFC93C" {...OUT_THIN} />
            <rect x={-22} y={4} width={44} height={10} rx={2} fill="#E8505B" {...OUT_THIN} />
            <rect x={-18} y={-6} width={36} height={10} rx={2} fill="#3E8EDE" {...OUT_THIN} />
          </g>
          <rect x={14} y={66} width={132} height={6} rx={2} fill="#9A7B52" {...OUT_THIN} />
        </g>
      );
    case "taphoa":
      return (
        <g>
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect
                key={`${r}${c}`}
                x={22 + c * 32}
                y={18 + r * 18}
                width={20}
                height={14}
                rx={3}
                fill={["#F4A261", "#E76F51", "#2A9D8F", "#E9C46A"][(r + c) % 4]}
                {...OUT_THIN}
              />
            )),
          )}
          <rect x={14} y={72} width={132} height={4} rx={2} fill="#9A7B52" {...OUT_THIN} />
        </g>
      );
  }
}

/**
 * Một mặt tiền cửa hàng rộng 267, cao 285. (x, y) = góc trên trái.
 */
export function Shop({ x, y, kind }: { x: number; y: number; kind: ShopKind }) {
  const t = SHOP_THEMES[kind];
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* mặt tường */}
      <rect x={0} y={44} width={267} height={241} fill={t.facade} {...OUT} />
      <rect x={-5} y={26} width={277} height={24} rx={5} fill={t.trim} {...OUT} />
      <path d="M -5 26 L 20 10 L 247 10 L 272 26 Z" fill={t.sign} opacity={0.9} {...OUT} />
      {/* tầng trên */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${34 + i * 120} 62)`}>
          <rect x={0} y={0} width={78} height={64} rx={t.label === "TRÀ SỮA" ? 30 : 6} fill="#CFEFFF" {...OUT} />
          <path d="M 39 0 L 39 64 M 0 32 L 78 32" stroke="#33384d" strokeWidth={1.6} />
          <path d="M 10 10 L 26 10 L 10 26 Z" fill="#fff" opacity={0.5} />
          <rect x={-8} y={0} width={9} height={64} rx={2} fill={t.trim} {...OUT_THIN} />
          <rect x={77} y={0} width={9} height={64} rx={2} fill={t.trim} {...OUT_THIN} />
        </g>
      ))}
      {/* lan can + chậu cây */}
      <rect x={14} y={130} width={240} height={8} rx={3} fill={t.trim} {...OUT_THIN} />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={20 + i * 18.5} y={138} width={4} height={12} fill="#33384d" opacity={0.7} />
      ))}
      <rect x={14} y={150} width={240} height={5} rx={2} fill={t.trim} {...OUT_THIN} />
      {[48, 190].map((px) => (
        <g key={px} transform={`translate(${px} 130)`}>
          <rect x={-12} y={-4} width={24} height={14} rx={3} fill="#C0644A" {...OUT_THIN} />
          <circle cx={-8} cy={-12} r={9} fill="#4FB26A" {...OUT_THIN} />
          <circle cx={7} cy={-14} r={10} fill="#5CC277" {...OUT_THIN} />
          <circle cx={0} cy={-22} r={8} fill="#47A85C" {...OUT_THIN} />
        </g>
      ))}
      {/* bảng hiệu */}
      <g transform="translate(18 160)">
        <rect x={0} y={0} width={231} height={44} rx={10} fill={t.sign} {...OUT} />
        <rect x={5} y={5} width={221} height={34} rx={7} fill="none" stroke={t.signText} strokeWidth={1.5} opacity={0.6} />
        <text
          x={115.5}
          y={32}
          textAnchor="middle"
          fontSize={29}
          fontWeight={800}
          fill={t.signText}
          letterSpacing={1}
          style={DISPLAY_FONT}
        >
          {t.label}
        </text>
      </g>
      {/* mái che */}
      <g transform="translate(13 206)">
        <Awning w={241} a={t.awningA} b={t.awningB} />
      </g>
      {/* cửa sổ cửa hàng + cửa ra vào */}
      <g transform="translate(22 232)">
        <rect x={0} y={0} width={158} height={53} fill="#FFF8E8" {...OUT} />
        <g transform="translate(0 -6) scale(1 0.9)">
          <ShopWindowItems kind={kind} />
        </g>
      </g>
      <g transform="translate(192 226)">
        <rect x={0} y={0} width={54} height={59} rx={4} fill="#8A5A3A" {...OUT} />
        <rect x={7} y={8} width={40} height={26} rx={3} fill="#CFEFFF" {...OUT_THIN} />
        <circle cx={44} cy={42} r={2.6} fill="#FFC93C" />
        <rect x={13} y={-6} width={28} height={9} rx={4} fill="#fff" {...OUT_THIN} />
        <text x={27} y={1.5} textAnchor="middle" fontSize={7} fontWeight={800} fill="#33384d" style={DISPLAY_FONT}>
          MỞ CỬA
        </text>
      </g>
      {kind === "hotoc" && (
        <g transform="translate(250 190)">
          <rect x={-5} y={0} width={10} height={44} rx={5} fill="#fff" {...OUT_THIN} />
          <path d="M -5 8 L 5 14 M -5 20 L 5 26 M -5 32 L 5 38" stroke="#E8505B" strokeWidth={4} />
          <path d="M -5 4 L 5 10 M -5 16 L 5 22 M -5 28 L 5 34" stroke="#2F6FB3" strokeWidth={4} />
        </g>
      )}
    </g>
  );
}

/** Xe máy đậu sát tường, dùng làm vật trang trí tĩnh. */
export function ParkedMoto({ x, y, s = 0.55, color = "#E8505B" }: { x: number; y: number; s?: number; color?: string }) {
  return <Moto x={x} y={y} s={s} color={color} rider={false} />;
}

/** Ghế đá. */
export function Bench({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-46} y={-30} width={92} height={8} rx={3} fill="#B9814F" {...OUT_THIN} />
      <rect x={-46} y={-44} width={92} height={8} rx={3} fill="#C99560" {...OUT_THIN} />
      <rect x={-40} y={-22} width={7} height={22} fill="#4A4F63" {...OUT_THIN} />
      <rect x={33} y={-22} width={7} height={22} fill="#4A4F63" {...OUT_THIN} />
    </g>
  );
}

/** Lá cờ Việt Nam: nền đỏ, sao vàng 5 cánh. */
export function VietnamFlag({ x, y, w = 70 }: { x: number; y: number; w?: number }) {
  const h = (w * 2) / 3;
  const cx = w / 2;
  const cy = h / 2;
  const R = h * 0.3;
  const r = R * 0.382;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="flag-wave">
        <rect width={w} height={h} fill="#DA251D" {...OUT_THIN} />
        <polygon points={pts} fill="#FFDD00" />
      </g>
    </g>
  );
}
