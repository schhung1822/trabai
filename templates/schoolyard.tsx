import {
  Bench,
  Cloud,
  DISPLAY_FONT,
  FlameTree,
  Lamp,
  LampGlow,
  OUT,
  RoundTree,
  VietnamFlag,
} from "@/components/scene/decor";
import { WORLD_H, WORLD_W } from "@/lib/scene-constants";
import type { LayerProps, SceneTemplate } from "./types";

const BUILDING = { x: 150, y: 190, w: 1300, h: 340 };

function Windows() {
  const cols = 14;
  const gap = BUILDING.w / cols;
  return (
    <g>
      {[0, 1, 2].map((row) =>
        Array.from({ length: cols }, (_, c) => {
          const x = BUILDING.x + c * gap + gap / 2 - 22;
          const y = BUILDING.y + 40 + row * 98;
          // chừa chỗ cổng chính ở giữa tầng 1
          if (row === 2 && (c === 6 || c === 7)) return null;
          return (
            <g key={`${row}-${c}`}>
              <rect x={x - 5} y={y - 5} width={54} height={66} rx={4} fill="#F2CF7A" {...OUT} strokeWidth={1.4} />
              <rect x={x} y={y} width={44} height={56} rx={2} fill="#9ED8F2" stroke="#33384d" strokeWidth={1.4} />
              <path d={`M ${x + 22} ${y} L ${x + 22} ${y + 56} M ${x} ${y + 28} L ${x + 44} ${y + 28}`} stroke="#33384d" strokeWidth={1.4} />
              <path d={`M ${x + 5} ${y + 6} L ${x + 17} ${y + 6} L ${x + 5} ${y + 20} Z`} fill="#fff" opacity={0.5} />
            </g>
          );
        }),
      )}
    </g>
  );
}

function SchoolBackground({ idp }: LayerProps) {
  return (
    <g>
      <defs>
        <linearGradient id={`${idp}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6EC5F5" />
          <stop offset="1" stopColor="#DDF3FF" />
        </linearGradient>
        <linearGradient id={`${idp}-yard`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9D3C4" />
          <stop offset="1" stopColor="#EBE5D6" />
        </linearGradient>
      </defs>
      <rect width={WORLD_W} height={WORLD_H} fill={`url(#${idp}-sky)`} />
      {/* mặt trời có tia */}
      <g transform="translate(1380 112)">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-4} y={-92} width={8} height={26} rx={4} fill="#FFD84D" opacity={0.8} transform={`rotate(${i * 30})`} />
        ))}
        <circle r={54} fill="#FFE27A" {...OUT} />
        <circle cx={-14} cy={-12} r={14} fill="#fff" opacity={0.4} />
      </g>
      <Cloud x={260} y={100} s={1.4} delay={8} drift={80} />
      <Cloud x={760} y={74} s={1} delay={25} drift={95} />
      <Cloud x={1100} y={160} s={0.9} delay={40} drift={70} />

      {/* hàng cây xa */}
      <g opacity={0.9}>
        {[40, 200, 420, 700, 980, 1250, 1480].map((x, i) => (
          <ellipse key={x} cx={x} cy={500} rx={110 + (i % 3) * 20} ry={62} fill={i % 2 ? "#7BCB8B" : "#69BD7B"} />
        ))}
      </g>

      {/* tòa nhà trường */}
      <rect x={BUILDING.x - 20} y={BUILDING.y - 10} width={BUILDING.w + 40} height={26} rx={6} fill="#D9573F" {...OUT} />
      <path
        d={`M ${BUILDING.x - 40} ${BUILDING.y - 8} L ${BUILDING.x + 60} ${BUILDING.y - 70} L ${BUILDING.x + BUILDING.w - 60} ${BUILDING.y - 70} L ${BUILDING.x + BUILDING.w + 40} ${BUILDING.y - 8} Z`}
        fill="#E26D4F"
        {...OUT}
      />
      {Array.from({ length: 22 }, (_, i) => (
        <path
          key={i}
          d={`M ${BUILDING.x + 20 + i * 58} ${BUILDING.y - 66} L ${BUILDING.x - 20 + i * 58} ${BUILDING.y - 12}`}
          stroke="#B5442F"
          strokeWidth={2}
          opacity={0.55}
        />
      ))}
      <rect x={BUILDING.x} y={BUILDING.y} width={BUILDING.w} height={BUILDING.h} fill="#FFE9A8" {...OUT} />
      <rect x={BUILDING.x} y={BUILDING.y + BUILDING.h - 24} width={BUILDING.w} height={24} fill="#E8CC84" {...OUT} />
      {[0, 1, 2].map((r) => (
        <rect key={r} x={BUILDING.x} y={BUILDING.y + 92 + r * 98} width={BUILDING.w} height={8} fill="#F2CF7A" opacity={0.85} />
      ))}
      <Windows />

      {/* cổng chính + bảng tên */}
      <g transform={`translate(${BUILDING.x + BUILDING.w / 2 - 100} ${BUILDING.y + 232})`}>
        <rect x={0} y={0} width={200} height={108} fill="#F2CF7A" {...OUT} />
        <path d="M 14 108 L 14 38 Q 100 -6 186 38 L 186 108 Z" fill="#8A5A3A" {...OUT} />
        <path d="M 100 14 L 100 108" stroke="#33384d" strokeWidth={2} />
        <circle cx={90} cy={72} r={3.4} fill="#FFC93C" />
        <circle cx={110} cy={72} r={3.4} fill="#FFC93C" />
      </g>
      <g transform={`translate(${BUILDING.x + BUILDING.w / 2 - 230} ${BUILDING.y + 150})`}>
        <rect x={0} y={0} width={460} height={60} rx={14} fill="#2F6FB3" {...OUT} />
        <rect x={7} y={7} width={446} height={46} rx={9} fill="none" stroke="#fff" strokeWidth={1.8} opacity={0.6} />
        <text x={230} y={43} textAnchor="middle" fontSize={33} fontWeight={800} fill="#fff" letterSpacing={1} style={DISPLAY_FONT}>
          TRƯỜNG HỌC VUI
        </text>
      </g>

      {/* hàng rào */}
      <rect x={0} y={520} width={WORLD_W} height={20} fill="#E3DCC9" />
      {Array.from({ length: 60 }, (_, i) => (
        <g key={i}>
          <rect x={i * 28 + 4} y={498} width={8} height={48} rx={3} fill="#3E9C59" {...OUT} strokeWidth={1.2} />
          <path d={`M ${i * 28 + 4} 498 L ${i * 28 + 8} 490 L ${i * 28 + 12} 498`} fill="#3E9C59" stroke="#33384d" strokeWidth={1.2} />
        </g>
      ))}
      <rect x={0} y={512} width={WORLD_W} height={7} fill="#3E9C59" {...OUT} strokeWidth={1.2} />

      {/* sân trường */}
      <rect x={0} y={540} width={WORLD_W} height={WORLD_H - 540} fill={`url(#${idp}-yard)`} />
      <path d="M 0 540 L 1600 540" stroke="#C9C1AD" strokeWidth={3} />
      {/* sân bóng rổ */}
      <g opacity={0.8} fill="none" stroke="#fff" strokeWidth={5}>
        <path d="M 420 620 L 1180 620 L 1260 880 L 340 880 Z" />
        <path d="M 800 620 L 800 880" />
        <ellipse cx={800} cy={750} rx={96} ry={44} />
        <path d="M 520 880 Q 800 760 1080 880" />
      </g>
      <path d="M 340 880 L 420 620 L 1180 620 L 1260 880 Z" fill="#9BD3C1" opacity={0.28} />

      {/* cột bóng rổ */}
      <g transform="translate(160 560)">
        <rect x={-5} y={-170} width={10} height={170} fill="#4A4F63" {...OUT} strokeWidth={1.4} />
        <rect x={-34} y={-196} width={68} height={46} rx={4} fill="#fff" {...OUT} />
        <rect x={-14} y={-176} width={28} height={20} fill="none" stroke="#E8505B" strokeWidth={2.5} />
        <ellipse cx={0} cy={-142} rx={16} ry={5} fill="none" stroke="#FF8A3D" strokeWidth={4} />
        <path d="M -14 -140 L -9 -118 M 14 -140 L 9 -118 M 0 -138 L 0 -116" stroke="#fff" strokeWidth={1.8} />
      </g>

      {/* cây phượng */}
      <FlameTree x={330} y={560} s={1.25} />
      <FlameTree x={1330} y={560} s={1.15} />
      <RoundTree x={720} y={556} s={0.8} leaf="#6CCB7A" leafDark="#55B866" />

      {/* cột cờ */}
      <g transform="translate(1000 566)">
        <rect x={-4} y={-300} width={8} height={300} fill="#C9CFD8" {...OUT} strokeWidth={1.4} />
        <circle cx={0} cy={-304} r={7} fill="#FFC93C" {...OUT} strokeWidth={1.4} />
        <VietnamFlag x={4} y={-290} w={96} />
      </g>

      {/* ghế đá + bảng tin */}
      <Bench x={560} y={582} s={0.8} />
      <g transform="translate(1180 580)">
        <rect x={-30} y={-84} width={60} height={46} rx={4} fill="#9A7B52" {...OUT} strokeWidth={1.4} />
        <rect x={-24} y={-78} width={22} height={18} fill="#fff" />
        <rect x={2} y={-78} width={22} height={34} fill="#FFE27A" />
        <rect x={-24} y={-56} width={22} height={12} fill="#9ED8F2" />
        <rect x={-3} y={-38} width={6} height={38} fill="#4A4F63" />
      </g>
    </g>
  );
}

function SchoolForeground() {
  return (
    <g>
      <Lamp x={56} y={900} h={380} />
      <FlameTree x={1546} y={910} s={1.4} />
    </g>
  );
}

function SchoolLights() {
  return (
    <g>
      <LampGlow x={56} y={900} h={380} beamTo={170} />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 14 }, (_, c) => {
          if (row === 2 && (c === 6 || c === 7)) return null;
          const gap = BUILDING.w / 14;
          return (
            <rect
              key={`${row}-${c}`}
              x={BUILDING.x + c * gap + gap / 2 - 22}
              y={BUILDING.y + 40 + row * 98}
              width={44}
              height={56}
              fill="#FFF0A8"
              opacity={0.65}
            />
          );
        }),
      )}
    </g>
  );
}

export const schoolTemplate: SceneTemplate = {
  id: "san-truong",
  name: "Sân trường UFO",
  description:
    "Học sinh đi dạo trong sân trường có cột cờ, cây phượng và sân bóng rổ. UFO bay vào từ bên trái.",
  palette: { sky: "#6EC5F5", ground: "#EBE5D6", accent: "#E26D4F" },
  lanes: [
    { y: 612, scale: 0.68 },
    { y: 662, scale: 0.76 },
    { y: 724, scale: 0.85 },
    { y: 796, scale: 0.95 },
    { y: 874, scale: 1.05 },
  ],
  fx: {
    night: { color: "#082B3A", opacity: 0.46 },
    arrive: "left",
    leave: "right",
    hoverY: 130,
    beam: { core: "#B6FFF0", edge: "#5BEBD0", glow: "#D2FFF6" },
    ufo: {
      body: "#D3DFEC",
      bodyDark: "#7C93B3",
      dome: "#9BF0E0",
      light1: "#FFE066",
      light2: "#FF9F59",
    },
  },
  Background: SchoolBackground,
  Foreground: SchoolForeground,
  Lights: SchoolLights,
};
