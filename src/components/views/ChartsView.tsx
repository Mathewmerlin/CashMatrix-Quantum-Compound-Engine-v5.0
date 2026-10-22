import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Zap,
  Sliders,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';
import { CompoundingRecord, Position, TradeReceipt } from '../../types';

interface ChartsViewProps {
  tradeHistory: CompoundingRecord[];
  trades: TradeReceipt[];
  positions: Position[];
  initialAsset: number;
  accumulatedProfit: number;
  isAutoCompounding: boolean;
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  tradeHistory,
  trades,
  positions,
  initialAsset,
  accumulatedProfit,
  isAutoCompounding,
}) => {
  // Simulator State for Yield Feature
  const [simBase, setSimBase] = useState<number>(initialAsset);
  const [simYieldRate, setSimYieldRate] = useState<number>(0.85); // 0.85% per cycle
  const [simCycles, setSimCycles] = useState<number>(30);
  const [selectedMetric, setSelectedMetric] = useState<'YIELD' | 'CAPITAL'>('YIELD');

  // Prepare Real-time Yield Growth Data
  const yieldChartData = useMemo(() => {
    let runningYield = 0;
    if (tradeHistory.length === 0) {
      return [
        {
          cycle: 'Genesis',
          accumulatedYield: 0,
          totalCapital: initialAsset,
          cycleYield: 0,
          pair: 'N/A',
        },
      ];
    }

    return tradeHistory.map((rec) => {
      runningYield += rec.profitGenerated;
      return {
        cycle: `#${rec.cycle}`,
        timestamp: rec.timestamp,
        accumulatedYield: +(rec.nextTradeAmount - initialAsset).toFixed(2),
        totalCapital: +rec.nextTradeAmount.toFixed(2),
        cycleYield: +rec.profitGenerated.toFixed(2),
        pair: rec.pair,
        yieldPct: +rec.yieldPct.toFixed(2),
      };
    });
  }, [tradeHistory, initialAsset]);

  // Prepare Real-time Trades PnL & Volume Data
  const tradesPnlData = useMemo(() => {
    return trades.slice(0, 20).reverse().map((t, idx) => ({
      index: idx + 1,
      time: t.time,
      pair: t.pair,
      price: t.price,
      volume: +(t.amount * t.price).toFixed(2),
      side: t.side,
      gas: t.gasGwei,
    }));
  }, [trades]);

  // Prepare Positions PnL Data
  const positionsPnlData = useMemo(() => {
    return positions.map((p) => ({
      pair: p.pair,
      pnl: p.unrealizedPnl,
      pnlPct: p.unrealizedPnlPct,
      notional: +(p.size * p.markPrice).toFixed(2),
      marginRatio: p.marginRatio,
    }));
  }, [positions]);

  // Yield Simulation Projections
  const projectionData = useMemo(() => {
    const list = [];
    let compoundCapital = simBase;
    let simpleCapital = simBase;

    for (let c = 0; c <= simCycles; c++) {
      list.push({
        cycle: `C${c}`,
        QuantumCompound: Math.round(compoundCapital * 100) / 100,
        SimpleLinear: Math.round(simpleCapital * 100) / 100,
        Advantage: Math.round((compoundCapital - simpleCapital) * 100) / 100,
      });

      // Quantum Compound: reinvested
      compoundCapital += compoundCapital * (simYieldRate / 100);
      // Simple Linear: based strictly on principal
      simpleCapital += simBase * (simYieldRate / 100);
    }
    return list;
  }, [simBase, simYieldRate, simCycles]);

  const projectedGain = projectionData[projectionData.length - 1].QuantumCompound - simBase;
  const projectedGainPct = ((projectedGain / simBase) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Quantitative Yield & Execution Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time streaming telemetry tracking compounding trajectory and portfolio yield on BSC Testnet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isAutoCompounding ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-slate-300">
              {isAutoCompounding ? 'STREAMING REAL-TIME' : 'STREAM PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 1: Real-Time Accumulated Yield Over Time */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Accumulated Yield & Compounded Capital Curve
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates in real-time on every 3-second quant execution pulse
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedMetric('YIELD')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedMetric === 'YIELD'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Accumulated Yield ($)
            </button>
            <button
              onClick={() => setSelectedMetric('CAPITAL')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedMetric === 'CAPITAL'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Capital ($)
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetric === 'YIELD' ? '#10b981' : '#06b6d4'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={selectedMetric === 'YIELD' ? '#10b981' : '#06b6d4'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cycle" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070d1e',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric === 'YIELD' ? 'accumulatedYield' : 'totalCapital'}
                stroke={selectedMetric === 'YIELD' ? '#10b981' : '#06b6d4'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#yieldGrad)"
                name={selectedMetric === 'YIELD' ? 'Accumulated Yield ($)' : 'Total Capital ($)'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Two Charts: Trade Volume Stream & Positions PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2A: Positions Unrealized PnL */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Positions Unrealized PnL ($)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live mark-to-market performance per active hedge
            </p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionsPnlData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="pair" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070d1e',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="pnl" fill="#10b981" radius={[4, 4, 0, 0]} name="Unrealized PnL ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2B: Live Trades Execution Volume & Gas */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Live Trade Notional Volume ($)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rolling trade sizes dispatched to mempool builders
            </p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradesPnlData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070d1e',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Volume ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Yield Forecasting & Quantum Compounding Feature */}
      <div className="p-6 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-mono uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Quantum Compounding Calculator & Yield Projections
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare exponential compounding returns (reinvested yield) against linear APR
            </p>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-slate-400">Projected Gain: </span>
            <span className="text-emerald-400 font-bold text-sm">+${projectedGain.toFixed(2)} (+{projectedGainPct}%)</span>
          </div>
        </div>

        {/* Sliders Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Starting Capital */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Starting Capital:</span>
              <span className="text-cyan-400 font-bold">${simBase.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={simBase}
              onChange={(e) => setSimBase(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Yield Rate per Cycle */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Avg Yield / Cycle:</span>
              <span className="text-emerald-400 font-bold">+{simYieldRate}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={simYieldRate}
              onChange={(e) => setSimYieldRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Cycles Count */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Projection Cycles:</span>
              <span className="text-white font-bold">{simCycles} Cycles</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={simCycles}
              onChange={(e) => setSimCycles(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cycle" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070d1e',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="QuantumCompound"
                stroke="#10b981"
                strokeWidth={2.5}
                name="Quantum Compounding (Reinvested)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="SimpleLinear"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                name="Simple Linear Return"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
