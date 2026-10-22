import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Zap,
  TrendingUp,
  Shield,
  Layers,
  Save,
} from 'lucide-react';
import { QuantStrategy } from '../../types';

interface StrategiesViewProps {
  strategies: QuantStrategy[];
  onToggleStrategy: (id: string) => void;
  onUpdateStrategyParams: (id: string, params: Partial<QuantStrategy>) => void;
  activeStrategy: string;
  onSetActiveStrategy: (name: string) => void;
}

export const StrategiesView: React.FC<StrategiesViewProps> = ({
  strategies,
  onToggleStrategy,
  onUpdateStrategyParams,
  activeStrategy,
  onSetActiveStrategy,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempParams, setTempParams] = useState<Partial<QuantStrategy>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const startEditing = (s: QuantStrategy) => {
    setEditingId(s.id);
    setTempParams({
      slippageTolerance: s.slippageTolerance,
      maxGasGwei: s.maxGasGwei,
      minProfitThreshold: s.minProfitThreshold,
      allocationPct: s.allocationPct,
    });
  };

  const saveParams = (id: string) => {
    onUpdateStrategyParams(id, tempParams);
    setEditingId(null);
    setSavedSuccess(id);
    setTimeout(() => setSavedSuccess(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
            BSC Quantitative Engine Controller
          </h2>
          <p className="text-xs text-slate-400">
            Configure algorithmic parameters, PancakeSwap/Venus bundle routing, and gas execution limits
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          Selected Pipeline: <span className="text-emerald-400 font-bold">{activeStrategy}</span>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {strategies.map((strat) => {
          const isSelected = activeStrategy === strat.name;
          const isEditing = editingId === strat.id;

          return (
            <div
              key={strat.id}
              className={`p-5 rounded-xl transition-all border backdrop-blur-md flex flex-col justify-between ${
                strat.isActive
                  ? isSelected
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/70 border-slate-800'
                  : 'bg-slate-950/50 border-slate-800/50 opacity-75'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        strat.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm tracking-wide font-mono">
                          {strat.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {strat.code}
                      </span>
                    </div>
                  </div>

                  {/* Toggle On/Off Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStrategy(strat.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        strat.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                      title={strat.isActive ? 'Disable Strategy' : 'Enable Strategy'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                          strat.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 my-3 leading-relaxed">
                  {strat.description}
                </p>

                {/* Performance stats row */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs font-mono mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Win Rate</span>
                    <span className="text-emerald-400 font-bold">{strat.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">24h Net Yield</span>
                    <span className="text-white font-bold">+${strat.total24hYield.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Mempool Speed</span>
                    <span className="text-cyan-400 font-bold">{strat.latencyAvgMs} ms</span>
                  </div>
                </div>

                {/* Strategy Execution Target Parameters */}
                <div className="space-y-3 pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Slippage Tolerance:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.05"
                        value={tempParams.slippageTolerance ?? strat.slippageTolerance}
                        onChange={(e) =>
                          setTempParams({ ...tempParams, slippageTolerance: parseFloat(e.target.value) })
                        }
                        className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-white"
                      />
                    ) : (
                      <span className="text-cyan-300">{strat.slippageTolerance}%</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Max Gas Cap:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempParams.maxGasGwei ?? strat.maxGasGwei}
                        onChange={(e) =>
                          setTempParams({ ...tempParams, maxGasGwei: parseInt(e.target.value) })
                        }
                        className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-white"
                      />
                    ) : (
                      <span className="text-slate-200">{strat.maxGasGwei} Gwei</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Min Profit Threshold:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempParams.minProfitThreshold ?? strat.minProfitThreshold}
                        onChange={(e) =>
                          setTempParams({ ...tempParams, minProfitThreshold: parseFloat(e.target.value) })
                        }
                        className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-white"
                      />
                    ) : (
                      <span className="text-emerald-400 font-bold">${strat.minProfitThreshold}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Capital Weight Allocation:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempParams.allocationPct ?? strat.allocationPct}
                        onChange={(e) =>
                          setTempParams({ ...tempParams, allocationPct: parseInt(e.target.value) })
                        }
                        className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-white"
                      />
                    ) : (
                      <span className="text-slate-200">{strat.allocationPct}%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 font-mono text-xs">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveParams(strat.id)}
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 uppercase tracking-wider"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Params
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(strat)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tune Target</span>
                    </button>

                    <button
                      onClick={() => onSetActiveStrategy(strat.name)}
                      disabled={isSelected || !strat.isActive}
                      className={`flex-1 py-1.5 font-bold rounded-lg transition-all uppercase tracking-wider ${
                        isSelected
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                          : strat.isActive
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? 'Engaged' : 'Select Pipeline'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
