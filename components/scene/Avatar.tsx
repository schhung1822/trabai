import { memo } from "react";
import { appearanceFor, shortLabel, type Appearance } from "@/lib/avatar";
import type { Gender } from "@/lib/types";

/**
 * Nhân vật học sinh 2D cartoon, gốc toạ độ ở bàn chân (0,0), cao ~120 đơn vị.
 * Các nhóm có `data-role` được SceneEngine điều khiển trực tiếp trên DOM
 * (không qua React state) để có chuyển động mượt cho 100 nhân vật.
 */

const OL = {
  stroke: "#33384d",
  strokeWidth: 1.65,
  strokeLinejoin: "round" as const,
};

/** Chiều cao gốc của nhãn tên so với bàn chân. */
export const LABEL_BASE_Y = 134;

function HairBack({ ap }: { ap: Appearance }) {
  const c = ap.hairColor;
  switch (ap.hairStyle) {
    case "bob":
      return <rect x={-27} y={-113} width={54} height={42} rx={17} fill={c} {...OL} />;
    case "long":
      return <rect x={-26} y={-113} width={52} height={58} rx={16} fill={c} {...OL} />;
    case "ponytail":
      return (
        <g>
          <ellipse cx={27} cy={-86} rx={7.5} ry={15} fill={c} transform="rotate(-18 27 -98)" {...OL} />
        </g>
      );
    case "twin":
      return (
        <g>
          <ellipse cx={-28} cy={-82} rx={8} ry={13} fill={c} transform="rotate(14 -28 -92)" {...OL} />
          <ellipse cx={28} cy={-82} rx={8} ry={13} fill={c} transform="rotate(-14 28 -92)" {...OL} />
        </g>
      );
    case "bun":
      return <circle cx={0} cy={-121} r={10} fill={c} {...OL} />;
    default:
      return null;
  }
}

function HairFront({ ap }: { ap: Appearance }) {
  const c = ap.hairColor;
  switch (ap.hairStyle) {
    case "side":
      return (
        <path
          d="M -23 -92 C -26 -121 26 -121 23 -92 C 22 -97 21 -99 19 -101 C 10 -99 -4 -95 -16 -104 C -20 -101 -22 -97 -23 -92 Z"
          fill={c}
          {...OL}
        />
      );
    case "buzz":
      return (
        <path
          d="M -22 -95 C -24 -117 24 -117 22 -95 C 14 -104 -14 -104 -22 -95 Z"
          fill={c}
          {...OL}
        />
      );
    case "spiky":
      return (
        <path
          d="M -22 -96 L -21 -119 L -11 -109 L -5 -126 L 3 -110 L 10 -125 L 14 -109 L 22 -119 L 22 -96 C 14 -104 -14 -104 -22 -96 Z"
          fill={c}
          {...OL}
        />
      );
    case "curly":
      return (
        <g fill={c} {...OL}>
          <circle cx={-14} cy={-108} r={9} />
          <circle cx={14} cy={-108} r={9} />
          <circle cx={0} cy={-113} r={10} />
          <circle cx={-21} cy={-98} r={7} />
          <circle cx={21} cy={-98} r={7} />
          <path d="M -20 -97 C -12 -104 12 -104 20 -97 L 20 -100 L -20 -100 Z" stroke="none" />
        </g>
      );
    case "bob":
    case "long":
      return (
        <path
          d="M -23 -90 C -27 -122 27 -122 23 -90 C 14 -98 -14 -98 -23 -90 Z"
          fill={c}
          {...OL}
        />
      );
    case "ponytail":
      return (
        <g>
          <path
            d="M -23 -92 C -26 -121 26 -121 23 -92 C 19 -101 10 -105 0 -104 C -10 -105 -19 -101 -23 -92 Z"
            fill={c}
            {...OL}
          />
          <circle cx={24} cy={-99} r={3.2} fill={ap.accessoryColor} stroke="#33384d" strokeWidth={1} />
        </g>
      );
    case "twin":
      return (
        <g>
          <path
            d="M -23 -92 C -26 -121 26 -121 23 -92 C 19 -101 10 -105 0 -104 C -10 -105 -19 -101 -23 -92 Z"
            fill={c}
            {...OL}
          />
          <circle cx={-24} cy={-95} r={3} fill={ap.accessoryColor} stroke="#33384d" strokeWidth={1} />
          <circle cx={24} cy={-95} r={3} fill={ap.accessoryColor} stroke="#33384d" strokeWidth={1} />
        </g>
      );
    default:
      return (
        <path
          d="M -23 -92 C -26 -121 26 -121 23 -92 C 19 -101 10 -105 0 -104 C -10 -105 -19 -101 -23 -92 Z"
          fill={c}
          {...OL}
        />
      );
  }
}

function Accessory({ ap }: { ap: Appearance }) {
  const col = ap.accessoryColor;
  switch (ap.accessory) {
    case "glasses":
      return (
        <g fill="rgba(255,255,255,.35)" stroke="#33384d" strokeWidth={1.6}>
          <circle cx={-8} cy={-91} r={6.4} />
          <circle cx={8} cy={-91} r={6.4} />
          <path d="M -1.6 -91 L 1.6 -91" fill="none" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M -24 -99 C -25 -126 25 -126 24 -99 Z" fill={col} {...OL} />
          <path d="M 4 -100 L 31 -100 C 31 -94 10 -94 4 -96 Z" fill={col} {...OL} />
          <circle cx={0} cy={-120} r={2.2} fill="#fff" />
        </g>
      );
    case "headband":
      return (
        <path
          d="M -22.5 -99 C -10 -109 10 -109 22.5 -99"
          fill="none"
          stroke={col}
          strokeWidth={5}
          strokeLinecap="round"
        />
      );
    case "bow":
      return (
        <g fill={col} {...OL}>
          <path d="M 14 -111 L 3 -118 L 3 -104 Z" />
          <path d="M 14 -111 L 25 -118 L 25 -104 Z" />
          <circle cx={14} cy={-111} r={3.2} />
        </g>
      );
    default:
      return null;
  }
}

function Leg({
  role,
  x,
  ap,
}: {
  role: "legL" | "legR";
  x: number;
  ap: Appearance;
}) {
  const skirt = ap.bottom === "skirt";
  return (
    <g transform={`translate(${x} -38)`}>
      <g data-role={role}>
        <rect
          x={-4.6}
          y={0}
          width={9.2}
          height={31}
          rx={4.4}
          fill={skirt ? ap.skin : ap.bottomColor}
          {...OL}
        />
        {skirt && <rect x={-4.6} y={19} width={9.2} height={12} rx={3} fill="#fff" {...OL} />}
        {!skirt && (
          <path d="M -1.5 3 L -1.5 26" fill="none" stroke="#fff" strokeWidth={1.3} opacity={0.22} />
        )}
        <path
          d="M -7.5 33 C -7.5 27 7.5 27 8.5 33 C 10.5 38 -8 38 -7.5 33 Z"
          fill={ap.shoe}
          {...OL}
        />
        <path d="M -6.5 34 Q 0 36 7.5 34" fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.55} />
      </g>
    </g>
  );
}

function Arm({
  role,
  x,
  ap,
}: {
  role: "armL" | "armR";
  x: number;
  ap: Appearance;
}) {
  return (
    <g transform={`translate(${x} -68)`}>
      <g data-role={role}>
        <rect x={-3.8} y={-3} width={7.6} height={26} rx={3.8} fill={ap.skin} {...OL} />
        <rect x={-4.2} y={-3.4} width={8.4} height={13} rx={4} fill={ap.shirt} {...OL} />
        <path d="M -3.5 8.5 L 3.5 8.5" stroke="#A7B8CA" strokeWidth={1.2} opacity={0.65} />
        <circle cx={0} cy={22} r={4.2} fill={ap.skin} {...OL} />
      </g>
    </g>
  );
}

function Label({ text, called }: { text: string; called: boolean }) {
  const w = Math.max(40, text.length * 8.1 + 22 + (called ? 17 : 0));
  const tx = called ? 8.5 : 0;
  return (
    <g data-role="label" style={{ pointerEvents: "none" }}>
      <g data-role="labelBox">
        <rect
          x={-w / 2}
          y={-13}
          width={w}
          height={26}
          rx={13}
          fill={called ? "#DFF8EE" : "#FFFFFF"}
          stroke="#33384d"
          strokeWidth={1.5}
        />
        <path d="M -5 12.5 L 0 19 L 5 12.5" fill={called ? "#DFF8EE" : "#FFFFFF"} stroke="#33384d" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M -3.6 12 L 3.6 12" stroke={called ? "#DFF8EE" : "#FFFFFF"} strokeWidth={2.6} />
        {called && (
          <g transform={`translate(${-w / 2 + 14} 0)`}>
            <circle r={6.5} fill="#2EC4A0" />
            <path d="M -3 0.4 L -0.8 2.8 L 3.4 -2.4" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        <text
          x={tx}
          y={5.4}
          textAnchor="middle"
          fontSize={15}
          fontWeight={800}
          fill="#243447"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
        >
          {text}
        </text>
      </g>
    </g>
  );
}

export interface AvatarBodyProps {
  ap: Appearance;
}

/** Chỉ phần thân (không nhãn) – dùng chung cho thumbnail, bảng kết quả. */
export function AvatarBody({ ap }: AvatarBodyProps) {
  const skirt = ap.bottom === "skirt";
  return (
    <g data-role="bob">
      <HairBack ap={ap} />
      {ap.backpack && (
        <rect x={9} y={-72} width={15} height={31} rx={6} fill={ap.bagColor} {...OL} />
      )}
      <Leg role="legL" x={-6.5} ap={ap} />
      <Leg role="legR" x={6.5} ap={ap} />
      {skirt && (
        <g>
          <path d="M -16 -45 L 16 -45 L 24 -26 L -24 -26 Z" fill={ap.bottomColor} {...OL} />
          <path d="M -9 -43 L -12 -28 M 0 -43 L 0 -27 M 9 -43 L 12 -28" stroke="#fff" strokeWidth={1.2} opacity={0.24} />
        </g>
      )}
      {/* thân áo */}
      <rect x={-15.5} y={-75} width={31} height={39} rx={10} fill={ap.shirt} {...OL} />
      <path d="M 11 -69 Q 15 -54 10 -40" fill="none" stroke="#B9C7D5" strokeWidth={2} opacity={0.35} />
      {!skirt && (
        <rect x={-15.5} y={-43} width={31} height={9} rx={4} fill={ap.bottomColor} {...OL} />
      )}
      {ap.backpack && (
        <g fill={ap.bagColor} opacity={0.95}>
          <rect x={-11} y={-74} width={4} height={26} rx={2} />
          <rect x={7} y={-74} width={4} height={26} rx={2} />
        </g>
      )}
      <path d="M -6.5 -75 L 0 -66.5 L 6.5 -75 Z" fill="#DCE8F6" {...OL} />
      <path d="M 0 -66 L 0 -39" stroke="#B7C7D9" strokeWidth={1.2} opacity={0.75} />
      <circle cx={0} cy={-56} r={1.35} fill="#5B6B7E" />
      <circle cx={0} cy={-47} r={1.35} fill="#5B6B7E" />
      <rect x={5.5} y={-58} width={7} height={8} rx={2} fill="none" stroke="#9EB0C3" strokeWidth={1.1} />
      {ap.accessory === "scarf" && (
        <g>
          <path d="M -13 -73.5 L 13 -73.5 L 0 -52 Z" fill="#E53935" {...OL} />
          <circle cx={0} cy={-70} r={3.2} fill="#C62828" {...OL} />
        </g>
      )}
      <Arm role="armL" x={-17.5} ap={ap} />
      <Arm role="armR" x={17.5} ap={ap} />
      {/* đầu */}
      <rect x={-5} y={-76} width={10} height={8} rx={4} fill={ap.skin} {...OL} />
      <circle cx={-22} cy={-91} r={4.6} fill={ap.skin} {...OL} />
      <circle cx={22} cy={-91} r={4.6} fill={ap.skin} {...OL} />
      <circle cx={0} cy={-92} r={22.5} fill={ap.skin} {...OL} />
      <path d="M -14 -102 Q -4 -112 8 -109" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" opacity={0.2} />
      <HairFront ap={ap} />
      <path d="M -14 -108 Q -2 -116 12 -110" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.12} />
      <g data-role="faceCalm">
        <path d="M -12 -98 Q -8 -101 -4 -98 M 4 -98 Q 8 -101 12 -98" fill="none" stroke="#4B3540" strokeWidth={1.4} strokeLinecap="round" />
        <ellipse cx={-8.4} cy={-91} rx={2.7} ry={3.5} fill="#2A2A38" />
        <ellipse cx={8.4} cy={-91} rx={2.7} ry={3.5} fill="#2A2A38" />
        <circle cx={-7.5} cy={-92.4} r={1} fill="#fff" />
        <circle cx={9.3} cy={-92.4} r={1} fill="#fff" />
        {ap.blush && (
          <>
            <ellipse cx={-14} cy={-84} rx={4} ry={2.4} fill="#FF8FA3" opacity={0.5} />
            <ellipse cx={14} cy={-84} rx={4} ry={2.4} fill="#FF8FA3" opacity={0.5} />
          </>
        )}
        <path d="M -1 -88 Q 0 -85.5 2 -87" fill="none" stroke="#B66C62" strokeWidth={1.1} strokeLinecap="round" />
        <path
          d="M -5 -82.5 Q 0 -77.5 5 -82.5"
          fill="none"
          stroke="#8A3B3B"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </g>
      <g data-role="facePanic" style={{ display: "none" }}>
        <path d="M -14 -100 L -4 -97 M 4 -97 L 14 -100" fill="none" stroke="#4B3540" strokeWidth={2} strokeLinecap="round" />
        <ellipse cx={-8.5} cy={-90.5} rx={5.2} ry={6.4} fill="#fff" stroke="#33384d" strokeWidth={1.25} />
        <ellipse cx={8.5} cy={-90.5} rx={5.2} ry={6.4} fill="#fff" stroke="#33384d" strokeWidth={1.25} />
        <circle cx={-7.6} cy={-89} r={2.2} fill="#252536" />
        <circle cx={9.4} cy={-89} r={2.2} fill="#252536" />
        <ellipse cx={0} cy={-78.5} rx={5.2} ry={6.5} fill="#8A3B3B" stroke="#5A2D32" strokeWidth={1.2} />
        <ellipse cx={0} cy={-76} rx={2.8} ry={1.7} fill="#FF9DAF" />
        <path d="M 20 -96 C 27 -88 24 -82 20 -81 C 15 -83 15 -89 20 -96 Z" fill="#7DD8F7" stroke="#3E8EDE" strokeWidth={1.1} />
      </g>
      <Accessory ap={ap} />
    </g>
  );
}

export interface WalkerAvatarProps {
  id: string;
  name: string;
  gender: Gender;
  called: boolean;
  /** Vị trí khởi tạo – engine sẽ ghi đè transform sau khi mount. */
  initialTransform: string;
  labelTransform: string;
}

/** Một nhân vật trong scene, kèm bóng đổ và nhãn tên. */
export const WalkerAvatar = memo(function WalkerAvatar({
  id,
  name,
  gender,
  called,
  initialTransform,
  labelTransform,
}: WalkerAvatarProps) {
  const ap = appearanceFor(id, gender);
  return (
    <g data-walker={id} data-role="root" transform={initialTransform}>
      <ellipse cx={0} cy={1} rx={24} ry={6} fill="rgba(20,30,50,.22)" />
      <g data-role="flip">
        <AvatarBody ap={ap} />
      </g>
      <g data-role="labelWrap" transform={labelTransform}>
        <Label text={shortLabel(name)} called={called} />
      </g>
    </g>
  );
});

/** Avatar tĩnh dùng trong danh sách / bảng kết quả (SVG nhỏ, không nhãn). */
export function AvatarThumb({
  id,
  gender,
  size = 48,
}: {
  id: string;
  gender: Gender;
  size?: number;
}) {
  const ap = appearanceFor(id, gender);
  return (
    <svg
      width={size}
      height={size}
      viewBox="-34 -134 68 100"
      aria-hidden="true"
      focusable="false"
    >
      <AvatarBody ap={ap} />
    </svg>
  );
}
