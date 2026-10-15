import { Lamp, LampGlow, OUT, Palm } from "@/components/scene/decor";
import { DISPLAY_FONT } from "@/components/scene/decor";
import { WORLD_H, WORLD_W } from "@/lib/scene-constants";
import type { LayerProps, SceneTemplate } from "./types";

const OUT_T = { ...OUT, strokeWidth: 1.6 };

/** Đèn lồng treo: màu xen kẽ. */
function Lantern({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 -14 L 0 0" stroke="#33384d" strokeWidth={1.6} />
      <ellipse cx={0} cy={18} rx={13} ry={17} fill={c} {...OUT_T} />
      <path d="M -6 3 Q 0 18 -6 33 M 6 3 Q 0 18 6 33" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.45} />
      <rect x={-6} y={0} width={12} height={4} rx={1.5} fill="#7A4A2A" />
      <rect x={-6} y={32} width={12} height={4} rx={1.5} fill="#7A4A2A" />
      <path d="M 0 36 L 0 48 M -3 38 L -3 46 M 3 38 L 3 46" stroke="#E8505B" strokeWidth={1.4} />
    </g>
  );
}

const LANTERN_COLORS = ["#E8505B", "#FFC93C", "#FF8A3D", "#E8505B", "#FFD84D"];

/** Một dãy nhà phố cổ. */
function OldHouse({ x, y, w, wall, roof, shutter }: { x: number; y: number; w: number; wall: string; roof: string; shutter: string }) {
  const winCount = Math.max(2, Math.floor(w / 100));
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M -10 0 Q ${w / 2} -52 ${w + 10} 0 L ${w + 10} 22 L -10 22 Z`} fill={roof} {...OUT} />
      {Array.from({ length: Math.floor(w / 18) }, (_, i) => (
        <path key={i} d={`M ${6 + i * 18} 0 Q ${6 + i * 18} 12 ${12 + i * 18} 20`} fill="none" stroke="#33384d" strokeWidth={1.2} opacity={0.35} />
      ))}
      <rect x={0} y={22} width={w} height={248} fill={wall} {...OUT} />
      {Array.from({ length: winCount }, (_, i) => {
        const sp = w / winCount;
        const wx = i * sp + sp / 2 - 24;
        return (
          <g key={i} transform={`translate(${wx} 46)`}>
            <rect x={-14} y={-4} width={14} height={86} fill={shutter} {...OUT_T} />
            <rect x={48} y={-4} width={14} height={86} fill={shutter} {...OUT_T} />
            <rect x={0} y={0} width={48} height={78} rx={24} fill="#F7D98F" {...OUT_T} />
            <path d="M 24 0 L 24 78 M 0 40 L 48 40" stroke="#33384d" strokeWidth={1.3} />
            <rect x={-6} y={80} width={60} height={9} rx={3} fill="#8A5A3A" {...OUT_T} />
          </g>
        );
      })}
      <rect x={0} y={152} width={w} height={10} fill="#00000014" />
      {/* cửa tầng trệt */}
      <rect x={w / 2 - 38} y={176} width={76} height={94} rx={4} fill="#7A4A2A" {...OUT} />
      <path d={`M ${w / 2} 176 L ${w / 2} 270`} stroke="#33384d" strokeWidth={2} />
      <circle cx={w / 2 - 8} cy={226} r={3} fill="#FFC93C" />
      <circle cx={w / 2 + 8} cy={226} r={3} fill="#FFC93C" />
      <rect x={w / 2 - 54} y={150} width={108} height={22} rx={6} fill="#B5452F" {...OUT_T} />
    </g>
  );
}

function SunsetBackground({ idp }: LayerProps) {
  const houses: [number, number, string, string, string][] = [
    [-20, 280, "#F4B84E", "#9C4B35", "#2E8B6B"],
    [262, 250, "#F2A65A", "#8A3F2E", "#35706F"],
    [512, 300, "#F6C768", "#A44E36", "#C0453A"],
    [812, 270, "#EE9B55", "#8A3F2E", "#2E8B6B"],
    [1082, 280, "#F4B84E", "#9C4B35", "#35706F"],
    [1362, 280, "#F2A65A", "#A44E36", "#2E8B6B"],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${idp}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6C55A8" />
          <stop offset="0.38" stopColor="#D3649C" />
          <stop offset="0.7" stopColor="#FF8F6B" />
          <stop offset="1" stopColor="#FFC27A" />
        </linearGradient>
        <radialGradient id={`${idp}-sun`}>
          <stop offset="0" stopColor="#FFF6C8" />
          <stop offset="0.5" stopColor="#FFD56B" />
          <stop offset="1" stopColor="#FFB04D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idp}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9A877" />
          <stop offset="1" stopColor="#EFC795" />
        </linearGradient>
      </defs>
      <rect width={WORLD_W} height={WORLD_H} fill={`url(#${idp}-sky)`} />
      {/* mặt trời lớn */}
      <circle cx={820} cy={330} r={300} fill={`url(#${idp}-sun)`} />
      <circle cx={820} cy={330} r={118} fill="#FFE9A0" opacity={0.95} />
      {/* mây dải */}
      {[
        [210, 120, 260], [1180, 90, 320], [620, 190, 220], [1360, 230, 240],
      ].map(([cx, cy, rx], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={14} fill="#FFB1A6" opacity={0.75} />
          <ellipse cx={cx + 40} cy={cy + 20} rx={rx * 0.7} ry={9} fill="#FF9B9B" opacity={0.6} />
        </g>
      ))}
      {/* đường chân trời: núi + cao ốc xa */}
      <path d="M 0 400 Q 200 330 420 392 T 820 380 T 1240 388 T 1600 350 L 1600 520 L 0 520 Z" fill="#7B5BA0" opacity={0.75} />
      {[
        [90, 330, 60], [180, 300, 48], [1040, 310, 54], [1130, 280, 44], [1440, 320, 58],
      ].map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={520 - y} fill="#5C4488" />
          {Array.from({ length: 5 }, (_, k) => (
            <rect key={k} x={x + 8 + (k % 2) * 22} y={y + 14 + Math.floor(k / 2) * 26} width={9} height={12} fill="#FFD56B" opacity={0.8} />
          ))}
        </g>
      ))}

      {/* nhà phố cổ */}
      {houses.map(([x, w, wall, roof, shutter], i) => (
        <OldHouse key={i} x={x} y={238} w={w} wall={wall} roof={roof} shutter={shutter} />
      ))}

      {/* dây đèn lồng */}
      <path d="M -20 250 Q 400 340 800 262 T 1620 270" fill="none" stroke="#33384d" strokeWidth={2} />
      <path d="M -20 330 Q 360 420 700 340 T 1620 360" fill="none" stroke="#33384d" strokeWidth={2} />
      {Array.from({ length: 18 }, (_, i) => {
        const x = 20 + i * 90;
        const y = 262 + Math.sin((i / 18) * Math.PI * 2.2) * 8 + 44 * Math.sin((i / 17) * Math.PI);
        return <Lantern key={`a${i}`} x={x} y={y} c={LANTERN_COLORS[i % 5]} s={0.9} />;
      })}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 60 + i * 115;
        const y = 350 + 40 * Math.sin((i / 13) * Math.PI);
        return <Lantern key={`b${i}`} x={x} y={y} c={LANTERN_COLORS[(i + 2) % 5]} s={0.75} />;
      })}

      {/* biển hiệu cà phê */}
      <g transform="translate(190 408)">
        <rect width={170} height={42} rx={10} fill="#7A4A2A" {...OUT} />
        <text x={85} y={29} textAnchor="middle" fontSize={22} fontWeight={800} fill="#FFE9A0" style={DISPLAY_FONT}>
          Cà phê phố cổ
        </text>
      </g>
      <g transform="translate(1180 408)">
        <rect width={150} height={42} rx={10} fill="#2E8B6B" {...OUT} />
        <text x={75} y={29} textAnchor="middle" fontSize={22} fontWeight={800} fill="#FFF" style={DISPLAY_FONT}>
          Chè &amp; Bánh
        </text>
      </g>

      {/* đường lát đá */}
      <rect x={0} y={508} width={WORLD_W} height={WORLD_H - 508} fill={`url(#${idp}-ground)`} />
      <rect x={0} y={508} width={WORLD_W} height={10} fill="#B58456" opacity={0.6} />
      {Array.from({ length: 11 }, (_, r) =>
        Array.from({ length: 24 }, (_, c) => {
          const y = 534 + r * 36;
          const k = 0.5 + r * 0.075;
          return (
            <rect
              key={`${r}-${c}`}
              x={((c * 78 + (r % 2) * 39) % 1680) - 40}
              y={y}
              width={70 * k}
              height={24 * k}
              rx={6}
              fill="#CC9866"
              opacity={0.4}
            />
          );
        }),
      )}

      {/* xe đẩy hàng rong */}
      <g transform="translate(1050 618)">
        <ellipse cx={0} cy={2} rx={66} ry={8} fill="rgba(60,30,10,.25)" />
        <path d="M -56 -86 Q 0 -150 56 -86 Z" fill="#E8505B" {...OUT} />
        <path d="M -56 -86 L 56 -86" stroke="#33384d" strokeWidth={2} />
        {[-38, -19, 0, 19, 38].map((px, i) => (
          <path key={i} d={`M ${px} -86 Q ${px + 4} -110 ${px * 0.3} -128`} stroke="#FFF" strokeWidth={5} fill="none" opacity={0.55} />
        ))}
        <rect x={-3} y={-86} width={6} height={50} fill="#8A5A3A" {...OUT_T} />
        <rect x={-56} y={-40} width={112} height={34} rx={6} fill="#FFE9A0" {...OUT} />
        <circle cx={-30} cy={-48} r={9} fill="#FF8A3D" {...OUT_T} />
        <circle cx={-12} cy={-50} r={9} fill="#FFC93C" {...OUT_T} />
        <circle cx={8} cy={-48} r={9} fill="#6CCB7A" {...OUT_T} />
        <circle cx={28} cy={-50} r={9} fill="#E8505B" {...OUT_T} />
        {[-36, 36].map((wx) => (
          <g key={wx} transform={`translate(${wx} -2)`}>
            <circle r={13} fill="#2D3340" {...OUT} />
            <circle r={4} fill="#B9C2D0" />
          </g>
        ))}
      </g>

      {/* đèn đường */}
      <Lamp x={330} y={560} h={200} color="#4A3A33" grabId="sunset-lamp-330" />
      <Lamp x={1250} y={560} h={200} color="#4A3A33" grabId="sunset-lamp-1250" />
      <Palm x={36} y={604} s={0.95} color="#2E7D4F" />
    </g>
  );
}

function SunsetForeground() {
  return (
    <g>
      <Palm x={1520} y={900} s={1.55} color="#276B44" />
      <Lamp x={52} y={900} h={400} color="#4A3A33" grabId="sunset-lamp-52" />
    </g>
  );
}

function SunsetLights() {
  return (
    <g>
      <LampGlow x={330} y={560} h={200} color="#FFD27A" beamTo={120} />
      <LampGlow x={1250} y={560} h={200} color="#FFD27A" beamTo={120} />
      <LampGlow x={52} y={900} h={400} color="#FFD27A" beamTo={190} />
      {/* đèn lồng sáng thêm khi tối */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = 20 + i * 90;
        const y = 262 + Math.sin((i / 18) * Math.PI * 2.2) * 8 + 44 * Math.sin((i / 17) * Math.PI);
        return <circle key={i} cx={x} cy={y + 16} r={30} fill="#FFC070" opacity={0.4} />;
      })}
    </g>
  );
}

export const sunsetTemplate: SceneTemplate = {
  id: "pho-hoang-hon",
  name: "Phố hoàng hôn",
  description:
    "Phố cổ dưới ánh hoàng hôn cam tím, đèn lồng và xe đẩy hàng rong. UFO bay vào từ bên phải.",
  palette: { sky: "#D3649C", ground: "#EFC795", accent: "#FF8A3D" },
  lanes: [
    { y: 590, scale: 0.64 },
    { y: 644, scale: 0.74 },
    { y: 716, scale: 0.84 },
    { y: 796, scale: 0.95 },
    { y: 876, scale: 1.05 },
  ],
  grabPoints: [
    { id: "sunset-lamp-330", kind: "lamp", x: 330, y: 560, scale: 1, render: false },
    { id: "sunset-lamp-1250", kind: "lamp", x: 1250, y: 560, scale: 1, render: false },
    { id: "sunset-lamp-52", kind: "lamp", x: 52, y: 900, scale: 1, render: false },
    { id: "sunset-sign-back", kind: "sign", x: 480, y: 590, scale: 0.6, color: "#B5452F" },
    { id: "sunset-tree-back", kind: "tree", x: 780, y: 644, scale: 0.6, color: "#3E9C59" },
    { id: "sunset-bollard-left", kind: "bollard", x: 240, y: 792, scale: 0.9, color: "#C0453A" },
    { id: "sunset-sign-front", kind: "sign", x: 570, y: 874, scale: 0.94, color: "#2E8B6B" },
    { id: "sunset-bollard-right", kind: "bollard", x: 1190, y: 796, scale: 0.9, color: "#FF8A3D" },
    { id: "sunset-tree-front", kind: "tree", x: 1450, y: 876, scale: 0.82, color: "#2E7D4F" },
  ],
  fx: {
    night: { color: "#25103F", opacity: 0.46 },
    arrive: "right",
    leave: "left",
    hoverY: 140,
    beam: { core: "#C9FFE8", edge: "#7CF0C8", glow: "#E4FFF3" },
    ufo: {
      body: "#D8D3EA",
      bodyDark: "#8479B0",
      dome: "#A5F0DD",
      light1: "#FFD43B",
      light2: "#FF6F91",
    },
  },
  Background: SunsetBackground,
  Foreground: SunsetForeground,
  Lights: SunsetLights,
};
