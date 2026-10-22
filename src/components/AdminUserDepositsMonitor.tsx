import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  Lock,
  Unlock,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Coins,
  Camera,
} from 'lucide-react';
import { AdminUserRecord, AdminUserMetrics } from '../types';
import { matrixAudio } from '../utils/matrixAudio';
import { useLogo } from '../context/LogoContext';

interface AdminUserDepositsMonitorProps {
  userRecords: AdminUserRecord[];
  metrics: AdminUserMetrics;
  onSimulateNewUserDeposit?: (amount: number, currency: 'USDC' | 'USDT' | 'ETH') => void;
  adminTreasuryAccount?: string;
  isCompact?: boolean;
}

export const AdminUserDepositsMonitor: React.FC<AdminUserDepositsMonitorProps> = ({
  userRecords,
  metrics,
  onSimulateNewUserDeposit,
  adminTreasuryAccount = '0x71C94B3b7f884a29a059A9482928cB7239A2F86B',
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'USDC' | 'USDT' | 'ETH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_COMPOUNDING' | 'LOCK_MATURED' | 'WITHDRAWN'>('ALL');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [simulationAmount, setSimulationAmount] = useState<string>('5000');
  const [simulationCurrency, setSimulationCurrency] = useState<'USDC' | 'USDT' | 'ETH'>('USDC');
  const [showSimModal, setShowSimModal] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);
  const { openLogoModal } = useLogo();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    matrixAudio.playBeep(920, 0.05);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredUsers = useMemo(() => {
    return userRecords.filter((u) => {
      const matchesSearch =
        u.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.ensName && u.ensName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCurrency = currencyFilter === 'ALL' || u.currency === currencyFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesCurrency && matchesStatus;
    });
  }, [userRecords, searchQuery, currencyFilter, statusFilter]);

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(simulationAmount);
    if (!isNaN(parsed) && parsed > 0 && onSimulateNewUserDeposit) {
      onSimulateNewUserDeposit(parsed, simulationCurrency);
      matrixAudio.playAccessGranted();
      setSimSuccessMsg(`Injected simulation deposit: $${parsed.toLocaleString()} ${simulationCurrency}`);
      setTimeout(() => {
        setSimSuccessMsg(null);
        setShowSimModal(false);
      }, 1500);
    }
  };

  const exportCsv = () => {
    if (userRecords.length === 0) return;
    const headers = ['User Address', 'ENS', 'Deposit Amount', 'Currency', 'Status', 'Lock Expiry Days', 'Accrued Yield', 'Admin 50% Cut', 'TxHash', 'Timestamp'];
    const rows = userRecords.map((u) => [
      `"${u.address}"`,
      `"${u.ensName || ''}"`,
      u.depositedAmount,
      u.currency,
      u.status,
      u.lockExpiryDays,
      u.accruedYield.toFixed(2),
      u.adminYieldPaid.toFixed(2),
      `"${u.txHash}"`,
      new Date(u.depositTimestamp).toISOString(),
    ].join(','));
    const content = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashmatrix_bsc_testnet_deposits_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    matrixAudio.playBeep(880, 0.05);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Monitor KPI Hero Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>TOTAL USERS</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              BSC
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">
            {metrics.totalUserCount.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Active:</span>
            <span className="text-cyan-400 font-bold">{metrics.activeDepositorsCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 opacity-80" />
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>TVL DEPOSITS</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              USD
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ${metrics.totalDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Avg / Depositor:</span>
            <span className="text-white font-bold">${metrics.avgDepositAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>30-DAY LOCKED</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
              ESCROW
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            ${metrics.thirtyDayLockedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Lock Ratio:</span>
            <span className="text-amber-400">
              {metrics.totalDepositAmount > 0
                ? ((metrics.thirtyDayLockedAmount / metrics.totalDepositAmount) * 100).toFixed(1)
                : '100'}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>ADMIN 50% CUT</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 border border-slate-700">
              TREASURY
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ${metrics.totalAdminYieldCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={adminTreasuryAccount}>
            Treasury: <span className="text-slate-300">{adminTreasuryAccount.slice(0, 6)}...{adminTreasuryAccount.slice(-4)}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Coins className="w-3.5 h-3.5 text-blue-400" />
              <span>USDC POOL</span>
            </span>
            <span className="text-[10px] text-blue-400">STABLE</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            ${metrics.currencyBreakdown.USDC.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.totalDepositAmount > 0
              ? ((metrics.currencyBreakdown.USDC / metrics.totalDepositAmount) * 100).toFixed(1)
              : '0'}% TVL
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>ETH / USDT</span>
            </span>
            <span className="text-[10px] text-emerald-400">DIVERSIFIED</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            ${(metrics.currencyBreakdown.ETH + metrics.currencyBreakdown.USDT).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ETH/USDT multi-asset
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user address or ENS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {(['ALL', 'USDC', 'USDT', 'ETH'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrencyFilter(curr)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  currencyFilter === curr
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSimulateNewUserDeposit && (
            <button
              onClick={() => setShowSimModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Record Inflow</span>
            </button>
          )}

          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openLogoModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Brand Logo</span>
          </button>
        </div>
      </div>

      {/* Manual Inflow Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Record BSC Testnet Deposit</h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Currency</label>
                <div className="flex gap-2">
                  {(['USDC', 'USDT', 'ETH'] as const).map((curr) => (
                    <button
                      type="button"
                      key={curr}
                      onClick={() => setSimulationCurrency(curr)}
                      className={`flex-1 py-1.5 rounded border transition-colors ${
                        simulationCurrency === curr
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {simSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{simSuccessMsg}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="flex-1 py-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg uppercase tracking-wider"
                >
                  Execute Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Depositors Registry Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white tracking-wider uppercase">
              BSC Testnet Depositor Register ({filteredUsers.length} of {metrics.totalUserCount})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Chain ID 97 Escrow Auditor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Wallet</th>
                <th className="py-3 px-4">Deposited Amount</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">30-Day Lock Status</th>
                <th className="py-3 px-4">Accrued Profit</th>
                <th className="py-3 px-4">Admin 50% Share</th>
                <th className="py-3 px-4">Bot State</th>
                <th className="py-3 px-4 text-right">BscScan Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No depositors found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.isCurrentUser;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-emerald-950/30 border-l-2 border-l-emerald-400' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'}`} />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-200">
                              <span>
                                {user.ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  YOU
                                </span>
                              )}
                              <button
                                onClick={() => handleCopy(user.address)}
                                title="Copy full address"
                                className="text-slate-500 hover:text-white ml-0.5"
                              >
                                {copiedAddress === user.address ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(user.depositTimestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-bold text-white">
                          ${user.depositedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-950/70 text-emerald-300 border-emerald-800">
                          {user.currency}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.status === 'ACTIVE_COMPOUNDING' ? (
                          <div className="flex items-center gap-1.5 text-amber-300">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-[11px]">{user.lockExpiryDays}d remaining</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[11px]">Lock Matured</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        +${user.accruedYield.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-cyan-300 font-bold">
                        ${(user.accruedYield * 0.5).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>ACTIVE</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`https://testnet.bscscan.com/tx/${user.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>{user.txHash.slice(0, 6)}...{user.txHash.slice(-4)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
