import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  PlusCircle,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { Position } from '../../types';

interface PositionsViewProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  onAddCollateral: (id: string, amount: number) => void;
  onAdjustLeverage: (id: string, newLeverage: number) => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions,
  onClosePosition,
  onAddCollateral,
  onAdjustLeverage,
}) => {
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [collateralAmount, setCollateralAmount] = useState<string>('500');
  const [leverageValue, setLeverageValue] = useState<number>(5);
  const [activeModal, setActiveModal] = useState<'COLLATERAL' | 'LEVERAGE' | null>(null);

  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalPositionSize = positions.reduce((acc, p) => acc + p.size * p.markPrice, 0);
  const avgMarginRatio = positions.length > 0
    ? (positions.reduce((acc, p) => acc + p.marginRatio, 0) / positions.length).toFixed(1)
    : '0';

  const handleCollateralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPos && collateralAmount) {
      onAddCollateral(selectedPos.id, parseFloat(collateralAmount));
      setActiveModal(null);
    }
  };

  const handleLeverageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPos) {
      onAdjustLeverage(selectedPos.id, leverageValue);
      setActiveModal(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Total Notional Exposure</span>
          <div className="text-xl font-bold text-white mt-1">
            ${totalPositionSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">Across {positions.length} active BSC hedges</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Net Unrealized PnL</span>
          <div className={`text-xl font-bold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-500/80">Live mark-to-market</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Average Margin Health</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {avgMarginRatio}%
          </div>
          <span className="text-[11px] text-slate-500">Safe threshold &gt; 10%</span>
        </div>
      </div>

      {/* Position Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map((pos) => {
          const isProfitable = pos.unrealizedPnl >= 0;
          return (
            <div
              key={pos.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                {/* Header: Pair + Leverage Badge + PnL */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-white font-mono">{pos.pair}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        pos.direction === 'LONG'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {pos.leverage}X {pos.direction}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <div className={`font-bold text-sm ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfitable ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className={`text-[11px] ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ({isProfitable ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs font-mono border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Entry Price</span>
                    <span className="text-slate-200 font-semibold">${pos.entryPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Mark Price</span>
                    <span className="text-cyan-300 font-semibold">${pos.markPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Liq. Price</span>
                    <span className="text-rose-400 font-semibold">${pos.liquidationPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Margin Ratio</span>
                    <span className="text-emerald-400 font-semibold">{pos.marginRatio}%</span>
                  </div>
                </div>

                {/* Secondary details */}
                <div className="flex items-center justify-between text-[11px] font-mono py-2 text-slate-400">
                  <span>Size: {pos.size} contracts (${(pos.size * pos.markPrice).toFixed(0)})</span>
                  <span>Funding: {(pos.fundingRate * 100).toFixed(4)}% / 8h</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 font-mono text-xs">
                <button
                  onClick={() => {
                    setSelectedPos(pos);
                    setCollateralAmount('250');
                    setActiveModal('COLLATERAL');
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Add Collateral</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPos(pos);
                    setLeverageValue(pos.leverage);
                    setActiveModal('LEVERAGE');
                  }}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Adjust Leverage"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Leverage</span>
                </button>

                <button
                  onClick={() => onClosePosition(pos.id)}
                  className="py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/40 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Collateral Modal */}
      {activeModal === 'COLLATERAL' && selectedPos && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Add Margin Collateral - {selectedPos.pair}
            </h3>
            <form onSubmit={handleCollateralSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Additional USD Collateral</label>
                <input
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Increasing collateral drops liquidation risk and strengthens margin ratio from {selectedPos.marginRatio}% to ~{(selectedPos.marginRatio + 8.2).toFixed(1)}%.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg uppercase tracking-wider"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Leverage Modal */}
      {activeModal === 'LEVERAGE' && selectedPos && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Adjust Leverage - {selectedPos.pair}
            </h3>
            <form onSubmit={handleLeverageSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-2">
                  <span>Selected Leverage:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">{leverageValue}X</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={leverageValue}
                  onChange={(e) => setLeverageValue(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>2X (Conservative)</span>
                  <span>10X (Standard)</span>
                  <span>20X (High Vol)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg uppercase tracking-wider"
                >
                  Apply Leverage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
