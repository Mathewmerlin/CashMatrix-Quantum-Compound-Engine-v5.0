import React, { useId } from 'react';
import { CompoundingRecord } from '../types';

interface CompoundingChartProps {
  data: CompoundingRecord[];
  initialAsset: number;
  currentCapital: number;
}

export const CompoundingChart: React.FC<CompoundingChartProps> = ({
  data,
  initialAsset,
  currentCapital,
}) => {
  const gradientId = useId();

  // If minimal data, provide points leading up to current
  const points = data.length > 0
    ? data.map((d, i) => ({
        cycle: d.cycle || i + 1,
        value: d.nextTradeAmount,
        yieldGained: d.profitGenerated,
        pair: d.pair,
      }))
    : [{ cycle: 0, value: initialAsset, yieldGained: 0, pair: 'BASE' }];

  const allValues = [initialAsset, ...points.map((p) => p.value)];
  const minVal = Math.min(...allValues) * 0.98;
  const maxVal = Math.max(...allValues, currentCapital) * 1.02;
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const width = 800;
  const height = 220;
  const paddingX = 40;
  const paddingY = 24;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingX + chartW / 2;
    return paddingX + (index / (total - 1)) * chartW;
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / range) * chartH;
  };

  // Build SVG Path
  const totalPoints = points.length;
  const pathD = points.reduce((acc, p, i) => {
    const x = getX(i, totalPoints);
    const y = getY(p.value);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Build closed area for gradient fill
  const lastX = getX(totalPoints - 1, totalPoints);
  const firstX = getX(0, totalPoints);
  const baselineY = height - paddingY;
  const areaD = `${pathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

  return (
    <div className="w-full bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">
            Compounding Trajectory Curve
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-cyan-400">
            Formula: Capital(n+1) = Base + Σ Yield
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-slate-400">
            Initial: <span className="text-slate-200">${initialAsset.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <span className="text-slate-400">
            Current: <span className="text-emerald-400 font-bold">${currentCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * chartH;
            const val = maxVal - pct * range;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Fill Area */}
          {points.length > 1 && (
            <path d={areaD} fill={`url(#${gradientId})`} />
          )}

          {/* Main Line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => {
            const cx = getX(i, totalPoints);
            const cy = getY(p.value);
            const isLast = i === totalPoints - 1;
            return (
              <g key={i} className="cursor-pointer group">
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? 5 : 3.5}
                  fill={isLast ? '#4ade80' : '#38bdf8'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                {isLast && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="1.5"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
        <span>Genesis (Cycle 0)</span>
        <span>Real-time Compound Growth</span>
        <span>Latest Cycle #{data.length > 0 ? data[data.length - 1].cycle : 0}</span>
      </div>
    </div>
  );
};
