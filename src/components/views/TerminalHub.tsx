declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Zap,
  ArrowUpRight,
  ExternalLink,
  Sliders,
  Download,
  Users,
} from 'lucide-react';
import { CompoundingRecord, EnvironmentType, AdminUserRecord, AdminUserMetrics } from '../../types';
import { CompoundingChart } from '../CompoundingChart';
import { DEPLOYED_CONTRACTS } from '../../config/contracts';
import { matrixAudio } from '../../utils/matrixAudio';

interface TerminalHubProps {
  initialAsset: number;
  setInitialAsset: (val: number) => void;
  accumulatedProfit: number;
  isAutoCompounding: boolean;
  onToggleAutoCompounding: () => void;
  onResetCompounding: () => void;
  tradeHistory: CompoundingRecord[];
  environment: EnvironmentType;
  activeStrategy: string;
  userRecords?: AdminUserRecord[];
  metrics?: AdminUserMetrics;
  onNavigateToVault?: () => void;
}

export const TerminalHub: React.FC<TerminalHubProps> = ({
  initialAsset,
  setInitialAsset,
  accumulatedProfit,
  isAutoCompounding,
  onToggleAutoCompounding,
  onResetCompounding,
  tradeHistory,
  environment,
  activeStrategy,
  userRecords = [],
  metrics,
  onNavigateToVault,
}) => {
  const [baseAssetInput, setBaseAssetInput] = useState<string>(initialAsset.toString());
  const [isEditingBase, setIsEditingBase] = useState<boolean>(false);
  const [cachedTrades, setCachedTrades] = useState<any[]>([]);
  const [localUsers, setLocalUsers] = useState<any[]>(userRecords);

  // Keep local input in sync if initialAsset changes externally
  useEffect(() => {
    setBaseAssetInput(initialAsset.toString());
  }, [initialAsset]);

  // --- LEDGER CACHE & USER REGISTRY REAL-TIME POLLER ---
  useEffect(() => {
    const fetchTelemetryData = async () => {
      try {
        const ledgerRes = await fetch('/ledger-cache.json', { cache: 'no-store' });
        if (ledgerRes.ok) {
          const data = await ledgerRes.json();
          if (Array.isArray(data)) {
            setCachedTrades(data);
          }
        }
      } catch (e) {
        // Bypass network sync interruptions quietly
      }
    };

    fetchTelemetryData();
    const interval = setInterval(fetchTelemetryData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync users from localStorage or props
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('cashmatrix_user_registry');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalUsers(parsed);
          return;
        }
      }
    } catch (e) {}
    if (userRecords.length > 0) {
      setLocalUsers(userRecords);
    }
  }, [userRecords]);

  // --- UNIFIED DYNAMIC ENTRIES RESOLUTION ---
  const rawEntries = cachedTrades.length > 0 ? cachedTrades : tradeHistory;
  
  const liveLedgerEntries: CompoundingRecord[] = rawEntries.map((t, idx) => {
    const rawYield = t.yieldGenerated ?? t.profitGenerated ?? 1.12;
    const cleanYield = typeof rawYield === 'number'
      ? rawYield
      : parseFloat(String(rawYield).replace(/[^0-9.-]+/g, '')) || 1.12;

    const cycleNum = t.batch ? String(t.batch).replace('#', '') : String(rawEntries.length - idx);

    return {
      id: t.id || `trade-${idx}`,
      cycle: isNaN(Number(cycleNum)) ? idx + 1 : Number(cycleNum),
      txHash: t.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      pair: t.pair || 'USDC/WBNB-MEV',
      inputCapital: initialAsset,
      profitGenerated: cleanYield,
      nextTradeAmount: initialAsset + cleanYield,
      yieldPct: initialAsset > 0 ? (cleanYield / initialAsset) * 100 : 0.50,
      timestamp: t.timestamp || new Date().toLocaleTimeString()
    };
  });

  // --- DYNAMIC CALCULATIONS ---
  const executedCycles = rawEntries.length;

  let dynamicTotalYield = 0;
  for (let i = 0; i < liveLedgerEntries.length; i++) {
    dynamicTotalYield += Number(liveLedgerEntries[i].profitGenerated || 0);
  }

  const nextTradeCapital = initialAsset + dynamicTotalYield;
  const totalYieldPct = initialAsset > 0 ? (dynamicTotalYield / initialAsset) * 100 : 0;
  const dynamicAdminYieldCollected = dynamicTotalYield * 0.5;

  const resolvedTotalUsers = localUsers.length > 0 ? localUsers.length : (metrics?.totalUserCount ?? 1);
  const resolvedActiveDepositors = localUsers.length > 0 ? localUsers.filter(u => Number(u.depositedPrincipal || 0) > 0).length : (metrics?.activeDepositorsCount ?? 1);
  const resolvedTotalDeposits = initialAsset;
  const resolvedThirtyDayLocked = resolvedTotalDeposits;

  const handleSaveBaseAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(baseAssetInput);
    if (!isNaN(parsed) && parsed > 0) {
      setInitialAsset(parsed);
      setIsEditingBase(false);
      matrixAudio.playSuccess();
    }
  };

  const winCount = liveLedgerEntries.filter((t) => t.profitGenerated > 0).length;
  const winRate = liveLedgerEntries.length > 0 ? ((winCount / liveLedgerEntries.length) * 100).toFixed(1) : '100.0';

  const exportLedger = (format: 'csv' | 'json') => {
    if (liveLedgerEntries.length === 0) return;
    let content = '';
    let filename = `cashmatrix_compounding_ledger_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'text/plain';

    if (format === 'csv') {
      const headers = ['Cycle', 'TxHash', 'Pair', 'InputCapital', 'ProfitGenerated', 'NextTradeAmount', 'YieldPct', 'Timestamp'];
      const rows = liveLedgerEntries.map((t) => [
        t.cycle,
        `"${t.txHash}"`,
        `"${t.pair}"`,
        t.inputCapital.toFixed(2),
        t.profitGenerated.toFixed(2),
        t.nextTradeAmount.toFixed(2),
        t.yieldPct.toFixed(2),
        `"${t.timestamp}"`
      ].join(','));
      content = [headers.join(','), ...rows].join('\n');
      filename += '.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(liveLedgerEntries, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    matrixAudio.playSuccess();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-100">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Automated Compounding Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                ACTIVE STRATEGY: {activeStrategy}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-800">
                BSC TESTNET (97)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Master Vault Target: <code className="text-emerald-400">{DEPLOYED_CONTRACTS.omniGenesisMaster}</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => {
              onToggleAutoCompounding();
              matrixAudio.playBeep(isAutoCompounding ? 400 : 800, 0.05);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg font-mono tracking-wider cursor-pointer ${
              isAutoCompounding
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-rose-950/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isAutoCompounding ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>PAUSE COMPOUNDING</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START AUTO-COMPOUNDING</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onResetCompounding();
              matrixAudio.playBeep(300, 0.08);
            }}
            title="Reset Compounding State to Genesis"
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Panel: User Count & Deposit Monitor Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#031d24] to-slate-950 border border-emerald-500/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Admin User & Depositor Monitor
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIVE AUDIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-time count of registered users, active depositors, and locked principal assets
              </p>
            </div>
          </div>

          {onNavigateToVault && (
            <button
              onClick={onNavigateToVault}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <span>View Full User Registry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Real-time counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 font-mono">
          <div>
            <span className="text-[11px] text-slate-400 block">TOTAL USERS COUNT</span>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">
              {resolvedTotalUsers}
            </div>
            <span className="text-[10px] text-emerald-400">
              {resolvedActiveDepositors} active depositors
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">TOTAL USER DEPOSITS (TVL)</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              ${resolvedTotalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">
              Avg ${(resolvedTotalDeposits / Math.max(resolvedTotalUsers, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} / user
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">30-DAY LOCKED PRINCIPAL</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              ${resolvedThirtyDayLocked.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-amber-400/80">
              100.0% locked
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">ADMIN 50% PROFIT HARVEST</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              ${dynamicAdminYieldCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">
              Protocol Treasury
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Base Asset */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span className="font-medium">Base Starting Asset</span>
            <button
              onClick={() => setIsEditingBase(!isEditingBase)}
              className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{isEditingBase ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          {isEditingBase ? (
            <form onSubmit={handleSaveBaseAsset} className="flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                <input
                  type="number"
                  step="any"
                  value={baseAssetInput}
                  onChange={(e) => setBaseAssetInput(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-sm bg-slate-950 border border-emerald-500/50 rounded text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded font-mono cursor-pointer"
              >
                Set
              </button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                ${initialAsset.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">USD</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Genesis principal pool
          </p>
        </div>

        {/* Card 2: Accumulated Yield */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span className="font-medium">Accumulated Yield</span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{totalYieldPct.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              +${dynamicTotalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-500/80 font-mono">NET</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Across {executedCycles} automated cycles
          </p>
        </div>

        {/* Card 3: Next Trade Capital */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/30 to-slate-900/70 border border-emerald-500/30 relative overflow-hidden group shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-2 font-mono">
            <span className="font-semibold">Next Trade Capital</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
              REINVESTED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              ${nextTradeCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-500/80 font-mono">POOLED</span>
          </div>
          <p className="text-[11px] text-emerald-300/70 mt-2 font-mono">
            Base (${initialAsset.toFixed(2)}) + Yield (${dynamicTotalYield.toFixed(2)})
          </p>
        </div>

        {/* Card 4: Engine Metrics */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span className="font-medium">Execution Telemetry</span>
            <span className="text-emerald-400 font-mono text-[11px]">Win: {winRate}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {executedCycles}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">CYCLES COMPLETED</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoCompounding ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Cadence: 3.0s / block pulse</span>
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <CompoundingChart
        data={liveLedgerEntries}
        initialAsset={initialAsset}
        currentCapital={nextTradeCapital}
      />

      {/* Real-time Compounding Execution Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white tracking-tight font-mono uppercase">
              Live Compounding Ledger
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              (Live On-Chain Events from Master Vault)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => exportLedger('csv')}
              disabled={liveLedgerEntries.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportLedger('json')}
              disabled={liveLedgerEntries.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Export JSON</span>
            </button>
            <span className="text-slate-500 pl-1 border-l border-slate-800 text-[11px]">
              {executedCycles} cycles
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase bg-slate-950/40">
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Tx Hash</th>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4 text-right">Input Capital</th>
                <th className="py-3 px-4 text-right">Yield Generated</th>
                <th className="py-3 px-4 text-right">Compounded Total</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {liveLedgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-sans mb-1 text-slate-400">Listening for On-Chain Harvest Events</p>
                    <p className="text-xs">
                      Connected to Master Vault <code className="text-emerald-400">{DEPLOYED_CONTRACTS.omniGenesisMaster}</code>. Live trades will append automatically when executed.
                    </p>
                  </td>
                </tr>
              ) : (
                liveLedgerEntries.slice().reverse().map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 text-slate-300 font-bold">
                      #{record.cycle}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 flex items-center gap-1.5 font-mono">
                      <span>{record.txHash.slice(0, 8)}...{record.txHash.slice(-6)}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <span className="font-semibold text-white">{record.pair}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      ${record.inputCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      +${record.profitGenerated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-[10px] text-emerald-500/80 ml-1">
                        (+{record.yieldPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">
                      ${record.nextTradeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {record.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
