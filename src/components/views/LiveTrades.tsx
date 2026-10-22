import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Download,
} from 'lucide-react';
import { TradeReceipt } from '../../types';

interface LiveTradesProps {
  trades: TradeReceipt[];
  onExecuteManualTrade: (pair: string, side: 'BUY' | 'SELL', amount: number) => void;
}

export const LiveTrades: React.FC<LiveTradesProps> = ({
  trades,
  onExecuteManualTrade,
}) => {
  const [filterSide, setFilterSide] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Manual trade form state initialized for BSC Testnet
  const [manualPair, setManualPair] = useState<string>('BNB/USDT');
  const [manualSide, setManualSide] = useState<'BUY' | 'SELL'>('BUY');
  const [manualAmount, setManualAmount] = useState<string>('1.5');
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filteredTrades = trades.filter((t) => {
    if (filterSide !== 'ALL' && t.side !== filterSide) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.pair.toLowerCase().includes(q) ||
        t.txHash.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(manualAmount);
    if (!isNaN(parsed) && parsed > 0) {
      onExecuteManualTrade(manualPair, manualSide, parsed);
      setShowManualModal(false);
    }
  };

  const exportTrades = (format: 'csv' | 'json') => {
    if (trades.length === 0) return;
    let content = '';
    let filename = `cashmatrix_live_trades_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'text/plain';

    if (format === 'csv') {
      const headers = ['TxHash', 'Pair', 'Side', 'Price', 'Amount', 'NotionalUSD', 'GasGwei', 'Status', 'Timestamp'];
      const rows = trades.map((t) => [
        `"${t.txHash}"`,
        `"${t.pair}"`,
        t.side,
        t.price.toFixed(4),
        t.amount.toFixed(4),
        (t.price * t.amount).toFixed(2),
        t.gasGwei,
        t.status,
        `"${t.time}"`
      ].join(','));
      content = [headers.join(','), ...rows].join('\n');
      filename += '.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(trades, null, 2);
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
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
            On-Chain BSC Execution Log
          </h2>
          <p className="text-xs text-slate-400">
            Real-time mempool & DEX swap execution stream on BSC Testnet (Chain 97)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pair, hash, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>

          {/* Filter Side Segmented Control */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['ALL', 'BUY', 'SELL'] as const).map((side) => (
              <button
                key={side}
                onClick={() => setFilterSide(side)}
                className={`px-3 py-1 rounded transition-colors ${
                  filterSide === side
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {side}
              </button>
            ))}
          </div>

          {/* Export Trades Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => exportTrades('csv')}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Export Trades as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportTrades('json')}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Export Trades as JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </button>
          </div>

          {/* Manual Trade Trigger */}
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all font-mono uppercase whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>+ Quick Trade</span>
          </button>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase bg-slate-950/40">
                <th className="py-3 px-4">Tx Hash</th>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4 text-right">Execution Price</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-right">Gas (Gwei)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No transactions matched your query.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isBuy = t.side === 'BUY';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://testnet.bscscan.com/tx/${t.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>{t.txHash.slice(0, 8)}...{t.txHash.slice(-6)}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(t.txHash)}
                            title="Copy Tx Hash"
                            className="text-slate-500 hover:text-slate-300"
                          >
                            {copiedHash === t.txHash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {t.pair}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isBuy ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {t.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200">
                        ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {t.amount.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {t.gasGwei}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            t.status === 'CONFIRMED'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : t.status === 'MINED'
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {t.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Quick Trade Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Dispatch Manual BSC Quant Order
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target BSC Pair</label>
                <select
                  value={manualPair}
                  onChange={(e) => setManualPair(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                >
                  <option value="BNB/USDT">BNB/USDT (PancakeSwap v3)</option>
                  <option value="CAKE/USDT">CAKE/USDT (BiSwap)</option>
                  <option value="BTCB/USDT">BTCB/USDT (Venus)</option>
                  <option value="ETH/USDT">ETH/USDT (PancakeSwap v3)</option>
                  <option value="SOL/USDT">SOL/USDT (THENA DEX)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Order Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualSide('BUY')}
                    className={`py-2 rounded-lg font-bold transition-colors ${
                      manualSide === 'BUY'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualSide('SELL')}
                    className={`py-2 rounded-lg font-bold transition-colors ${
                      manualSide === 'SELL'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Execution Volume (Tokens)</label>
                <input
                  type="number"
                  step="any"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="text-emerald-400">BSC Private RPC Node</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Slippage:</span>
                  <span className="text-cyan-400">0.04%</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg uppercase tracking-wider"
                >
                  Confirm & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
