import type { SceneFxConfig } from "@/lib/scene-constants";

/**
 * UFO nhìn nghiêng, gốc toạ độ ở tâm đĩa bay. Rộng ~360 đơn vị.
 * Nhiều tầng thân, động cơ và đèn tạo cảm giác như một phi thuyền lớn thay vì đĩa bay nhỏ.
 */
export function Ufo({
  fx,
  idp = "ufo",
  lightsOn = true,
}: {
  fx: SceneFxConfig["ufo"] & { beamCore: string };
  idp?: string;
  lightsOn?: boolean;
}) {
  const lightXs = [-142, -106, -70, -34, 34, 70, 106, 142];
  return (
    <g>
      <defs>
        <linearGradient id={`${idp}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F8FC" />
          <stop offset="0.35" stopColor={fx.body} />
          <stop offset="1" stopColor={fx.bodyDark} />
        </linearGradient>
        <radialGradient id={`${idp}-dome`} cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.45" stopColor={fx.dome} stopOpacity="0.85" />
          <stop offset="1" stopColor={fx.dome} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${idp}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={fx.bodyDark} />
          <stop offset="0.5" stopColor="#F8FCFF" />
          <stop offset="1" stopColor={fx.bodyDark} />
        </linearGradient>
        <radialGradient id={`${idp}-engine`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.98" />
          <stop offset="0.42" stopColor={fx.beamCore} stopOpacity="0.9" />
          <stop offset="1" stopColor={fx.beamCore} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* quầng năng lượng nhiều lớp dưới đáy */}
      <ellipse cx={0} cy={43} rx={112} ry={18} fill={`url(#${idp}-engine)`} opacity={0.75} />
      <ellipse cx={0} cy={39} rx={72} ry={11} fill={fx.beamCore} opacity={0.72} />
      <path d="M -72 36 Q 0 62 72 36" fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.65} />

      {/* động cơ hai bên */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 144} 17) scale(${side} 1)`}>
          <path d="M -20 -10 L 22 -3 L 34 18 L -8 21 Z" fill={fx.bodyDark} stroke="#33384d" strokeWidth={2.2} strokeLinejoin="round" />
          <ellipse cx={30} cy={13} rx={14} ry={8} fill={fx.beamCore} stroke="#33384d" strokeWidth={1.8} />
          <ellipse cx={32} cy={12} rx={7} ry={3.5} fill="#fff" opacity={0.85} />
        </g>
      ))}

      {/* đáy đĩa bọc giáp */}
      <path
        d="M -132 12 C -114 58 114 58 132 12 Z"
        fill={fx.bodyDark}
        stroke="#33384d"
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <path d="M -106 29 Q 0 56 106 29" fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.22} />

      {/* alien trong mái vòm */}
      <g transform="translate(0 -8) scale(1.14)">
        <path d="M -2 -36 Q -6 -55 -14 -59" fill="none" stroke="#33384d" strokeWidth={2} strokeLinecap="round" />
        <circle cx={-14} cy={-60} r={3.8} fill="#FFC93C" stroke="#33384d" strokeWidth={1.6} />
        <path d="M 6 -34 Q 12 -53 22 -57" fill="none" stroke="#33384d" strokeWidth={2} strokeLinecap="round" />
        <circle cx={22} cy={-58} r={3.8} fill="#FF8A3D" stroke="#33384d" strokeWidth={1.6} />
        <ellipse cx={2} cy={-20} rx={21} ry={19} fill="#93E6AE" stroke="#33384d" strokeWidth={2} />
        <ellipse cx={-6.5} cy={-21} rx={5.6} ry={8} fill="#1F2A3A" transform="rotate(14 -6 -21)" />
        <ellipse cx={10.5} cy={-21} rx={5.6} ry={8} fill="#1F2A3A" transform="rotate(-14 10 -21)" />
        <circle cx={-8} cy={-24} r={1.7} fill="#fff" />
        <circle cx={8.8} cy={-24} r={1.7} fill="#fff" />
        <path d="M -3 -8 Q 2 -3 8 -8" fill="none" stroke="#33384d" strokeWidth={1.8} strokeLinecap="round" />
      </g>

      {/* mái vòm kính */}
      <path
        d="M -78 -1 C -80 -88 80 -88 78 -1 Z"
        fill={`url(#${idp}-dome)`}
        stroke="#33384d"
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
      <path d="M -56 -32 C -52 -62 -28 -75 -10 -76" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.78} />
      <path d="M 50 -25 Q 65 -13 60 -2" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />

      {/* thân đĩa */}
      <ellipse
        cx={0}
        cy={6}
        rx={170}
        ry={41}
        fill={`url(#${idp}-body)`}
        stroke="#33384d"
        strokeWidth={3}
      />
      <path
        d="M -148 -7 C -104 -31 104 -31 148 -7"
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.7}
      />
      <ellipse cx={0} cy={14} rx={154} ry={25} fill="none" stroke={`url(#${idp}-rim)`} strokeWidth={3} opacity={0.72} />
      {[-126, -90, 90, 126].map((x) => (
        <circle key={x} cx={x} cy={0} r={3.3} fill="#EAF1F8" stroke="#59677A" strokeWidth={1.1} />
      ))}

      {/* màn hình đếm số */}
      <rect x={-32} y={2} width={64} height={24} rx={8} fill="#102A40" stroke="#33384d" strokeWidth={2.2} />
      <rect x={-27} y={6} width={54} height={15} rx={5} fill="#173C54" opacity={0.7} />
      <text
        data-ufo-led
        x={0}
        y={20}
        textAnchor="middle"
        fontSize={16}
        fontWeight={800}
        fill="#7CF5CF"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
      >
        0/0
      </text>

      {/* đèn nhấp nháy */}
      {lightXs.map((x, i) => (
        <circle
          key={x}
          className={lightsOn ? "ufo-light" : undefined}
          cx={x}
          cy={18 + Math.abs(x) * 0.075}
          r={6.3}
          fill={i % 2 === 0 ? fx.light1 : fx.light2}
          stroke="#33384d"
          strokeWidth={1.6}
          style={{ animationDelay: `${(i * 0.17).toFixed(2)}s` }}
        />
      ))}
    </g>
  );
}
