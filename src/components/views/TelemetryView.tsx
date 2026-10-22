import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Radio,
  Wifi,
  Zap,
  Server,
  Users,
  ShieldCheck,
  DollarSign,
  Lock,
} from 'lucide-react';
import { PnLHeatmapD3 } from '../PnLHeatmapD3';
import { AdminUserMetrics } from '../../types';

interface TelemetryViewProps {
  isAutoCompounding: boolean;
  cycleCount: number;
  metrics?: AdminUserMetrics;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  isAutoCompounding,
  cycleCount,
  metrics = {
    totalUserCount: 1248,
    activeDepositorsCount: 342,
    totalDepositAmount: 1842500,
    currencyBreakdown: { USDC: 1240000, USDT: 412500, ETH: 190000 },
    totalAdminYieldCollected: 4580.25,
    avgDepositAmount: 5387.42,
    thirtyDayLockedAmount: 1798200,
  },
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
          BSC Hardware & Execution Telemetry
        </h2>
        <p className="text-xs text-slate-400">
          Hardware metrics, mempool socket buffers, and MEV searcher pipeline health on BSC Testnet
        </p>
      </div>

      {/* 7-Day PnL Heatmap */}
      <PnLHeatmapD3
        isAutoCompounding={isAutoCompounding}
        currentCycleCount={cycleCount}
      />

      {/* Primary Hardware Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Node RAM</span>
            </span>
            <span className="text-emerald-400">26.8%</span>
          </div>
          <div className="text-xl font-bold text-white mb-2">
            2.14 GB <span className="text-xs font-normal text-slate-500">/ 8.00 GB</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '26.8%' }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>CPU Load</span>
            </span>
            <span className="text-emerald-400">14.2%</span>
          </div>
          <div className="text-xl font-bold text-white mb-2">
            8 Cores <span className="text-xs font-normal text-slate-500">@ 3.8 GHz</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '14.2%' }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>BSC RPC Ping</span>
            </span>
            <span className="text-emerald-400">OPTIMAL</span>
          </div>
          <div className="text-xl font-bold text-cyan-400 mb-2">
            12 ms
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: '95%' }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>BSC Swap Rate</span>
            </span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-xl font-bold text-white mb-2">
            180 <span className="text-xs font-normal text-slate-500">swaps / min</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>
      </div>

      {/* User Inflow & Depositor Telemetry Strip */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Investor Population &amp; Liquidity Metrics
          </h3>
          <span className="text-xs text-emerald-400">
            {metrics.totalUserCount.toLocaleString()} TOTAL ACCOUNTS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Active Depositors</span>
            <span className="text-base font-bold text-cyan-300">
              {metrics.activeDepositorsCount.toLocaleString()} / {metrics.totalUserCount.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Total User Principal TVL</span>
            <span className="text-base font-bold text-emerald-400">
              ${metrics.totalDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">30-Day Locked Assets</span>
            <span className="text-base font-bold text-amber-300">
              ${metrics.thirtyDayLockedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Admin 50% Profit Harvested</span>
            <span className="text-base font-bold text-emerald-400">
              ${metrics.totalAdminYieldCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
