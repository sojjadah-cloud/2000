// خط الحلقات المستوحى من عنصر الزنبرك في الهوية (دليل الهوية ص5).
// يُرسم كمسار متجه رفيع كما يظهر في التصاميم المرجعية، ويُستخدم بتوزيع محدود.

function coilPath(loops: number, spread: number, radius: number, stretch: number) {
  const pts: string[] = [];
  // 24 نقطة لكل حلقة كافية لمنحنى ناعم مع وصلات مستديرة، وتُبقي حجم HTML صغيرًا
  const steps = loops * 24;
  const tMax = loops * Math.PI * 2;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    const x = spread * t - radius * Math.sin(t);
    const y = -radius * stretch * Math.cos(t);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
}

export function Coil({
  loops = 5,
  className,
  color = 'var(--color-orange)',
  strokeWidth = 2,
  spread = 7,
  radius = 26,
  stretch = 2.1,
}: {
  loops?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  spread?: number;
  radius?: number;
  stretch?: number;
}) {
  const width = spread * loops * Math.PI * 2 + radius * 2;
  const height = radius * stretch * 2;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={`${-radius - 4} ${-height / 2 - 4} ${width + 8} ${height + 8}`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={coilPath(loops, spread, radius, stretch)} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
