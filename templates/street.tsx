import {
  Car,
  Cloud,
  Driving,
  Lamp,
  LampGlow,
  Moto,
  OUT,
  ParkedMoto,
  RoundTree,
  Shop,
  type ShopKind,
} from "@/components/scene/decor";
import { WORLD_H, WORLD_W } from "@/lib/scene-constants";
import type { LayerProps, SceneTemplate } from "./types";

const SHOPS: ShopKind[] = ["banhmi", "trasua", "hotoc", "bunchar", "sach", "taphoa"];
const SHOP_Y = 235;
const SHOP_W = 267;

const LAMPS = [534, 1068];
const BACK_TREES = [267, 801, 1335];

function Skyline() {
  const blocks: [number, number, number, string][] = [
    [0, 330, 150, "#CBE2F2"], [140, 290, 130, "#D9D6F0"], [260, 340, 160, "#CBE2F2"],
    [420, 280, 140, "#E2D9F3"], [550, 320, 150, "#CBE2F2"], [690, 270, 120, "#D9E7F5"],
    [800, 330, 170, "#E2D9F3"], [960, 290, 140, "#CBE2F2"], [1090, 320, 150, "#D9D6F0"],
    [1230, 270, 130, "#CBE2F2"], [1350, 330, 150, "#E2D9F3"], [1490, 300, 140, "#D9E7F5"],
  ];
  return (
    <g>
      {blocks.map(([x, y, w, c], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={540 - y} fill={c} />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: Math.floor(w / 36) }, (_, k) => (
              <rect key={`${r}-${k}`} x={x + 12 + k * 34} y={y + 16 + r * 34} width={16} height={20} rx={3} fill="#fff" opacity={0.55} />
            )),
          )}
        </g>
      ))}
    </g>
  );
}

function StreetBackground({ idp }: LayerProps) {
  return (
    <g>
      <defs>
        <linearGradient id={`${idp}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FD0F4" />
          <stop offset="0.7" stopColor="#CDEFFF" />
          <stop offset="1" stopColor="#EAF9FF" />
        </linearGradient>
        <linearGradient id={`${idp}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66758C" />
          <stop offset="1" stopColor="#505E73" />
        </linearGradient>
      </defs>
      <rect width={WORLD_W} height={WORLD_H} fill={`url(#${idp}-sky)`} />
      {/* mặt trời + mây */}
      <circle cx={1330} cy={120} r={52} fill="#FFE27A" opacity={0.95} />
      <circle cx={1330} cy={120} r={78} fill="#FFE27A" opacity={0.25} />
      <Cloud x={220} y={110} s={1.3} delay={5} drift={70} />
      <Cloud x={620} y={70} s={0.9} delay={20} drift={90} />
      <Cloud x={980} y={150} s={1.1} delay={35} drift={80} />
      <Cloud x={1480} y={220} s={0.8} delay={12} drift={75} />
      <Skyline />

      {/* dãy cửa hàng */}
      {SHOPS.map((kind, i) => (
        <Shop key={kind} kind={kind} x={i * SHOP_W - 1} y={SHOP_Y} />
      ))}

      {/* xe máy đậu */}
      <ParkedMoto x={250} y={548} color="#E8505B" />
      <ParkedMoto x={300} y={552} color="#3E8EDE" />
      <ParkedMoto x={1010} y={548} color="#FFC93C" />
      <ParkedMoto x={1390} y={552} color="#7C5CE0" />

      {/* vỉa hè sau */}
      <rect x={0} y={520} width={WORLD_W} height={96} fill="#EDE6D6" />
      <rect x={0} y={520} width={WORLD_W} height={8} fill="#D5CCB8" />
      {Array.from({ length: 32 }, (_, i) => (
        <path key={i} d={`M ${i * 52} 528 L ${i * 52 - 14} 612`} stroke="#D9D0BC" strokeWidth={2} />
      ))}
      <rect x={0} y={606} width={WORLD_W} height={14} fill="#CFC6B2" {...OUT} strokeWidth={1.6} />

      {/* cây hàng sau + đèn */}
      {BACK_TREES.map((x) => (
        <RoundTree key={x} x={x} y={590} s={0.72} />
      ))}
      {LAMPS.map((x) => (
        <Lamp key={x} x={x} y={600} h={118} />
      ))}

      {/* lòng đường */}
      <rect x={0} y={620} width={WORLD_W} height={152} fill={`url(#${idp}-road)`} />
      <path d="M 0 696 L 1600 696" stroke="#F4E9A8" strokeWidth={4} strokeDasharray="44 34" />
      <path d="M 0 628 L 1600 628" stroke="#fff" strokeWidth={2} opacity={0.5} />
      <path d="M 0 764 L 1600 764" stroke="#fff" strokeWidth={2} opacity={0.5} />
      {/* vạch qua đường */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={700 + i * 14} y={622} width={9} height={148} fill="#fff" opacity={0.75} />
      ))}

      <Driving dir="ltr" y={668} duration={17} delay={3}>
        <Car color="#E8505B" />
      </Driving>
      <Driving dir="ltr" y={672} duration={11} delay={9}>
        <Moto color="#2EC4A0" shirt="#FFC93C" />
      </Driving>
      <Driving dir="rtl" y={738} duration={19} delay={11}>
        <Car color="#3E8EDE" s={1.05} />
      </Driving>
      <Driving dir="rtl" y={742} duration={12} delay={2}>
        <Moto color="#FF8A3D" shirt="#E8505B" s={1.05} />
      </Driving>
      <Driving dir="ltr" y={738} duration={14} delay={7}>
        <Moto color="#7C5CE0" shirt="#2EC4A0" s={1.05} />
      </Driving>

      {/* vỉa hè trước */}
      <rect x={0} y={770} width={WORLD_W} height={14} fill="#CFC6B2" {...OUT} strokeWidth={1.6} />
      <rect x={0} y={784} width={WORLD_W} height={WORLD_H - 784} fill="#F2EBDC" />
      {Array.from({ length: 36 }, (_, i) => (
        <path key={i} d={`M ${i * 48} 784 L ${i * 48 - 40} 900`} stroke="#E3DAC6" strokeWidth={2} />
      ))}
      <path d="M 0 840 L 1600 840" stroke="#E3DAC6" strokeWidth={2} />
    </g>
  );
}

function StreetForeground() {
  return (
    <g>
      <Lamp x={48} y={900} h={420} s={1.05} />
      <RoundTree x={1568} y={906} s={1.2} />
    </g>
  );
}

function StreetLights() {
  return (
    <g>
      {LAMPS.map((x) => (
        <LampGlow key={x} x={x} y={600} h={118} beamTo={110} />
      ))}
      <LampGlow x={48} y={900} h={420} s={1.05} beamTo={190} />
      {/* cửa sổ cửa hàng sáng đèn */}
      {SHOPS.map((_, i) => (
        <g key={i}>
          <rect x={i * SHOP_W + 21} y={SHOP_Y + 232} width={158} height={53} fill="#FFE9A8" opacity={0.55} />
          <rect x={i * SHOP_W + 34} y={SHOP_Y + 62} width={78} height={64} rx={6} fill="#FFE9A8" opacity={0.5} />
          <rect x={i * SHOP_W + 154} y={SHOP_Y + 62} width={78} height={64} rx={6} fill="#FFE9A8" opacity={0.5} />
          <rect x={i * SHOP_W + 18} y={SHOP_Y + 160} width={231} height={44} rx={10} fill="#FFF3C4" opacity={0.28} />
        </g>
      ))}
    </g>
  );
}

export const streetTemplate: SceneTemplate = {
  id: "ufo-pho",
  name: "UFO gọi bài",
  description:
    "Con phố nhiều cửa hàng: bánh mì, trà sữa, hớt tóc, bún chả… UFO đáp xuống ban ngày rồi trời tối nhẹ.",
  palette: { sky: "#7FD0F4", ground: "#F2EBDC", accent: "#2EC4A0" },
  lanes: [
    { y: 560, scale: 0.62 },
    { y: 596, scale: 0.7 },
    { y: 812, scale: 0.88 },
    { y: 848, scale: 0.97 },
    { y: 886, scale: 1.06 },
  ],
  fx: {
    night: { color: "#0B1D3D", opacity: 0.44 },
    arrive: "top",
    leave: "top",
    hoverY: 150,
    beam: { core: "#9BFFDC", edge: "#4EE3B5", glow: "#B9FFE7" },
    ufo: {
      body: "#C3D1E2",
      bodyDark: "#6F86A6",
      dome: "#8FE9D0",
      light1: "#FFD43B",
      light2: "#FF8A3D",
    },
  },
  Background: StreetBackground,
  Foreground: StreetForeground,
  Lights: StreetLights,
};
