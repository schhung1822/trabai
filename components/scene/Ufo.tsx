import type { SceneFxConfig } from "@/lib/scene-constants";

/**
 * UFO nhìn nghiêng, gốc toạ độ ở tâm đĩa bay. Rộng ~240 đơn vị.
 * Đèn nhấp nháy bằng CSS animation (class ufo-light), mái vòm có phi hành gia ngoài hành tinh dễ thương.
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
  const lightXs = [-96, -68, -40, 40, 68, 96];
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
      </defs>

      {/* quầng sáng dưới đáy */}
      <ellipse cx={0} cy={26} rx={64} ry={11} fill={fx.beamCore} opacity={0.55} />

      {/* đáy đĩa */}
      <path
        d="M -92 12 C -80 44 80 44 92 12 Z"
        fill={fx.bodyDark}
        stroke="#33384d"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* alien trong mái vòm */}
      <g>
        <path d="M -2 -36 Q -6 -52 -12 -54" fill="none" stroke="#33384d" strokeWidth={2} strokeLinecap="round" />
        <circle cx={-12} cy={-55} r={3.4} fill="#FFC93C" stroke="#33384d" strokeWidth={1.6} />
        <path d="M 6 -34 Q 12 -50 20 -52" fill="none" stroke="#33384d" strokeWidth={2} strokeLinecap="round" />
        <circle cx={20} cy={-53} r={3.4} fill="#FF8A3D" stroke="#33384d" strokeWidth={1.6} />
        <ellipse cx={2} cy={-20} rx={19} ry={17} fill="#93E6AE" stroke="#33384d" strokeWidth={2} />
        <ellipse cx={-6} cy={-21} rx={5.2} ry={7.4} fill="#1F2A3A" transform="rotate(14 -6 -21)" />
        <ellipse cx={10} cy={-21} rx={5.2} ry={7.4} fill="#1F2A3A" transform="rotate(-14 10 -21)" />
        <circle cx={-7.6} cy={-24} r={1.6} fill="#fff" />
        <circle cx={8.4} cy={-24} r={1.6} fill="#fff" />
        <path d="M -3 -9 Q 2 -5 7 -9" fill="none" stroke="#33384d" strokeWidth={1.8} strokeLinecap="round" />
      </g>

      {/* mái vòm kính */}
      <path
        d="M -52 -2 C -54 -62 54 -62 52 -2 Z"
        fill={`url(#${idp}-dome)`}
        stroke="#33384d"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path d="M -36 -26 C -34 -42 -18 -50 -8 -50" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />

      {/* thân đĩa */}
      <ellipse
        cx={0}
        cy={4}
        rx={120}
        ry={28}
        fill={`url(#${idp}-body)`}
        stroke="#33384d"
        strokeWidth={2.4}
      />
      <path
        d="M -104 -4 C -70 -20 70 -20 104 -4"
        fill="none"
        stroke="#fff"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.7}
      />
      <ellipse cx={0} cy={11} rx={108} ry={18} fill="none" stroke="#33384d" strokeWidth={1.4} opacity={0.35} />

      {/* màn hình đếm số */}
      <rect x={-24} y={3} width={48} height={18} rx={6} fill="#14304A" stroke="#33384d" strokeWidth={1.8} />
      <text
        data-ufo-led
        x={0}
        y={17}
        textAnchor="middle"
        fontSize={14}
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
          cy={13 + Math.abs(x) * 0.065}
          r={5.2}
          fill={i % 2 === 0 ? fx.light1 : fx.light2}
          stroke="#33384d"
          strokeWidth={1.4}
          style={{ animationDelay: `${(i * 0.17).toFixed(2)}s` }}
        />
      ))}
    </g>
  );
}
