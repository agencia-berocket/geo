interface GeoScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

function getColor(score: number) {
  if (score >= 70) return { stroke: '#22c55e', text: 'text-emerald-400', label: 'Bom' };
  if (score >= 40) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Médio' };
  return { stroke: '#ef4444', text: 'text-red-400', label: 'Crítico' };
}

export default function GeoScoreGauge({ score, size = 'md' }: GeoScoreGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const { stroke, text, label } = getColor(clampedScore);
  const dims = size === 'lg' ? 160 : size === 'sm' ? 80 : 120;
  const radius = dims * 0.38;
  const circumference = 2 * Math.PI * radius;
  // Semicircle: dash offset for 50% arc
  const dashArray = circumference;
  const dashOffset = circumference * (1 - clampedScore / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dims, height: dims * 0.6 }}>
        <svg width={dims} height={dims * 0.6} viewBox={`0 0 ${dims} ${dims * 0.6}`} className="overflow-visible">
          {/* Background arc */}
          <circle
            cx={dims / 2}
            cy={dims * 0.6}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={size === 'sm' ? 6 : 10}
            strokeDasharray={`${circumference / 2} ${circumference / 2}`}
            strokeLinecap="round"
            transform={`rotate(-180 ${dims / 2} ${dims * 0.6})`}
          />
          {/* Score arc */}
          <circle
            cx={dims / 2}
            cy={dims * 0.6}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={size === 'sm' ? 6 : 10}
            strokeDasharray={`${(circumference / 2) * (clampedScore / 100)} ${circumference / 2 + circumference / 2 * (1 - clampedScore / 100)}`}
            strokeLinecap="round"
            transform={`rotate(-180 ${dims / 2} ${dims * 0.6})`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        {/* Score label */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className={`font-bold ${text} ${size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl'}`}>
            {clampedScore}
          </span>
          <span className="text-zinc-500 text-[10px] font-mono -mt-1">GEO SCORE</span>
        </div>
      </div>
      <span className={`text-xs font-semibold ${text}`}>{label}</span>
    </div>
  );
}
