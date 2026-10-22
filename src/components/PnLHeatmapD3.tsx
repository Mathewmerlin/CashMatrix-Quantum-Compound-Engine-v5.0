import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  Flame,
  Calendar,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface HeatmapCell {
  dayIndex: number;
  dayLabel: string;
  dateStr: string;
  hour: number;
  hourLabel: string;
  pnl: number;
  pnlPct: number;
  tradesCount: number;
  winCount: number;
  volumeUSD: number;
  dominantPair: string;
}

interface PnLHeatmapD3Props {
  currentCycleCount?: number;
  isAutoCompounding?: boolean;
}

// Generate realistic deterministic 7-day data with recent real-time pulse
function generate7DayData(pulseOffset = 0): HeatmapCell[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [
    'Sep 30',
    'Oct 01',
    'Oct 02',
    'Oct 03',
    'Oct 04',
    'Oct 05',
    'Oct 06 (Today)',
  ];
  const pairs = ['ETH/USDC', 'WBTC/USDT', 'SOL/USDC', 'ARB/USDT'];
  const cells: HeatmapCell[] = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      // Deterministic pseudo-random seed with market session volatility
      const isMarketPeak = (h >= 8 && h <= 11) || (h >= 13 && h <= 17); // London & NY peak
      const isWeekend = d >= 5;

      const baseMult = isMarketPeak ? 1.8 : 0.9;
      const seed = Math.sin(d * 24 + h + pulseOffset * 0.2);
      const isWin = seed > -0.22; // ~85% win rate

      const pnlMagnitude = Math.abs(seed * 120 + 35) * baseMult;
      const pnl = isWin
        ? Math.round(pnlMagnitude * 100) / 100
        : -Math.round(pnlMagnitude * 0.45 * 100) / 100;

      const pnlPct = +(pnl / 15).toFixed(2);
      const tradesCount = Math.floor(Math.abs(seed * 14) + 4) * (isMarketPeak ? 2 : 1);
      const winCount = isWin
        ? Math.floor(tradesCount * 0.9)
        : Math.floor(tradesCount * 0.3);
      const volumeUSD = Math.round(tradesCount * (800 + Math.abs(seed * 2200)));
      const dominantPair = pairs[(d + h) % pairs.length];

      cells.push({
        dayIndex: d,
        dayLabel: days[d],
        dateStr: dates[d],
        hour: h,
        hourLabel: `${String(h).padStart(2, '0')}:00`,
        pnl,
        pnlPct,
        tradesCount,
        winCount,
        volumeUSD,
        dominantPair,
      });
    }
  }

  return cells;
}

export const PnLHeatmapD3: React.FC<PnLHeatmapD3Props> = ({
  currentCycleCount = 0,
  isAutoCompounding = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pulseKey, setPulseKey] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');

  // Trigger pulse re-render when cycle increments
  useEffect(() => {
    if (isAutoCompounding && currentCycleCount > 0) {
      setPulseKey((k) => k + 1);
    }
  }, [currentCycleCount, isAutoCompounding]);

  const rawData = useMemo(() => generate7DayData(pulseKey), [pulseKey]);

  // Aggregate KPI metrics
  const total7DayPnL = useMemo(
    () => rawData.reduce((acc, c) => acc + c.pnl, 0),
    [rawData]
  );
  const totalVolume = useMemo(
    () => rawData.reduce((acc, c) => acc + c.volumeUSD, 0),
    [rawData]
  );
  const totalTrades = useMemo(
    () => rawData.reduce((acc, c) => acc + c.tradesCount, 0),
    [rawData]
  );
  const winningCellsCount = useMemo(
    () => rawData.filter((c) => c.pnl > 0).length,
    [rawData]
  );
  const bestCell = useMemo(
    () => rawData.reduce((max, c) => (c.pnl > max.pnl ? c : max), rawData[0]),
    [rawData]
  );

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 36, right: 30, bottom: 45, left: 95 };
    const width = 940 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 940 240`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Scales
    const xScale = d3
      .scaleBand<number>()
      .domain(hours)
      .range([0, width])
      .padding(0.08);

    const yScale = d3
      .scaleBand<string>()
      .domain(days)
      .range([0, height])
      .padding(0.12);

    // Color Scale: Deep Crimson -> Neutral Dark Slate -> Profit Emerald
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-80, -10, 0, 40, 180, 320])
      .range([
        '#ef4444', // heavy loss
        '#f87171', // mild loss
        '#1e293b', // breakeven
        '#059669', // solid profit
        '#10b981', // high profit
        '#4ade80', // explosive profit
      ])
      .clamp(true);

    // X Axis (Hours)
    const xAxis = d3
      .axisTop(xScale)
      .tickValues([0, 3, 6, 9, 12, 15, 18, 21])
      .tickFormat((d) => `${String(d).padStart(2, '0')}h`);

    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis')
      .call(xAxis);

    xAxisGroup.select('.domain').remove();
    xAxisGroup.selectAll('.tick line').remove();
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Y Axis (Days)
    const yAxis = d3.axisLeft(yScale);
    const yAxisGroup = g
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick line').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif');

    // Tooltip trigger helper
    const handleCellHover = (event: MouseEvent, d: HeatmapCell) => {
      setHoveredCell(d);
    };

    const handleCellLeave = () => {
      setHoveredCell(null);
    };

    const handleCellClick = (event: MouseEvent, d: HeatmapCell) => {
      setSelectedCell(d);
    };

    // Draw Heatmap Cells
    const filteredCells = rawData.filter((c) => {
      if (viewFilter === 'PROFIT') return c.pnl > 0;
      if (viewFilter === 'LOSS') return c.pnl < 0;
      return true;
    });

    g.selectAll('.heatmap-cell')
      .data(filteredCells, (d: any) => `${d.dayIndex}-${d.hour}`)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d) => xScale(d.hour) || 0)
      .attr('y', (d) => yScale(d.dayLabel) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', (d) => colorScale(d.pnl))
      .attr('stroke', (d) =>
        selectedCell &&
        selectedCell.dayIndex === d.dayIndex &&
        selectedCell.hour === d.hour
          ? '#38bdf8'
          : '#0f172a'
      )
      .attr('stroke-width', (d) =>
        selectedCell &&
        selectedCell.dayIndex === d.dayIndex &&
        selectedCell.hour === d.hour
          ? 2
          : 0.8
      )
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.15s ease, stroke 0.15s ease')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2);
        handleCellHover(event, d);
      })
      .on('mouseleave', function (event, d) {
        const isSelected =
          selectedCell &&
          selectedCell.dayIndex === d.dayIndex &&
          selectedCell.hour === d.hour;
        d3.select(this)
          .attr('stroke', isSelected ? '#38bdf8' : '#0f172a')
          .attr('stroke-width', isSelected ? 2 : 0.8);
        handleCellLeave();
      })
      .on('click', function (event, d) {
        handleCellClick(event, d);
      });

    // Subtle animated glow pulse on the most recent hour (Day 6, Hour 16)
    const currentHourCell = rawData.find(
      (c) => c.dayIndex === 6 && c.hour === 16
    );
    if (currentHourCell && isAutoCompounding) {
      g.append('rect')
        .attr('x', xScale(currentHourCell.hour) || 0)
        .attr('y', yScale(currentHourCell.dayLabel) || 0)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', 'none')
        .attr('stroke', '#4ade80')
        .attr('stroke-width', 1.8)
        .attr('class', 'animate-pulse');
    }

    // Legend on the bottom
    const legendWidth = 220;
    const legendHeight = 8;
    const legendX = width - legendWidth;
    const legendY = height + 24;

    const legendGroup = g
      .append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Gradient for Legend
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444');
    linearGradient
      .append('stop')
      .attr('offset', '25%')
      .attr('stop-color', '#1e293b');
    linearGradient
      .append('stop')
      .attr('offset', '70%')
      .attr('stop-color', '#10b981');
    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4ade80');

    legendGroup
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .style('fill', 'url(#heatmap-legend-gradient)');

    legendGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 18)
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('-$80.00');

    legendGroup
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('$0.00');

    legendGroup
      .append('text')
      .attr('x', legendWidth)
      .attr('y', 18)
      .attr('text-anchor', 'end')
      .attr('fill', '#4ade80')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('+$320.00+');
  }, [rawData, viewFilter, selectedCell, isAutoCompounding]);

  const activeDisplayCell = hoveredCell || selectedCell;

  return (
    <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              7-Day PnL Execution Heatmap (D3.js)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              168 HOURLY EPOCHS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly visual performance intensity across global trading sessions
          </p>
        </div>

        {/* View Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewFilter('PROFIT')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFilter === 'PROFIT'
                  ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gains Only
            </button>
            <button
              onClick={() => setViewFilter('LOSS')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFilter === 'LOSS'
                  ? 'bg-rose-950 text-rose-400 font-bold border border-rose-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Drawdowns
            </button>
          </div>

          <button
            onClick={() => setPulseKey((k) => k + 1)}
            title="Refresh Heatmap Sample"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 font-sans block">7-Day Net PnL</span>
          <span className="text-lg font-bold text-emerald-400">
            +${total7DayPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">Across 168 hours</span>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 font-sans block">Profitable Windows</span>
          <span className="text-lg font-bold text-cyan-300">
            {((winningCellsCount / 168) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">{winningCellsCount} / 168 hours</span>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 font-sans block">Peak Hour Yield</span>
          <span className="text-lg font-bold text-emerald-400">
            +${bestCell.pnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">{bestCell.dayLabel} @ {bestCell.hourLabel}</span>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 font-sans block">7-Day Notional Dispatched</span>
          <span className="text-lg font-bold text-white">
            ${(totalVolume / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-slate-500 block">{totalTrades.toLocaleString()} MEV bundles</span>
        </div>
      </div>

      {/* D3 Heatmap SVG Container */}
      <div ref={containerRef} className="w-full overflow-x-auto bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
        <svg ref={svgRef} className="w-full h-auto min-w-[720px] select-none" />
      </div>

      {/* Selected / Hovered Cell Inspection Drawer */}
      {activeDisplayCell ? (
        <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono transition-all">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${activeDisplayCell.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {activeDisplayCell.pnl >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{activeDisplayCell.dateStr}</span>
                <span className="text-slate-400">·</span>
                <span className="text-cyan-400">{activeDisplayCell.hourLabel} UTC</span>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {activeDisplayCell.dominantPair}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeDisplayCell.tradesCount} executions ({activeDisplayCell.winCount} successful front-runs) · ${(activeDisplayCell.volumeUSD).toLocaleString()} volume
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-base font-bold ${activeDisplayCell.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeDisplayCell.pnl >= 0 ? '+' : ''}${activeDisplayCell.pnl.toFixed(2)}
            </div>
            <span className={`text-[11px] ${activeDisplayCell.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ({activeDisplayCell.pnl >= 0 ? '+' : ''}{activeDisplayCell.pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Hover or click any cell in the 168-hour grid to inspect hourly MEV bundle breakdown</span>
          </span>
          <span className="text-slate-400">D3.js SVG Rendering Engine</span>
        </div>
      )}
    </div>
  );
};
