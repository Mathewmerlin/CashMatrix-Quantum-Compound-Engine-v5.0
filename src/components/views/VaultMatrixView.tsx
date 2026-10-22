import React, { useState } from 'react';
import {
  Vault,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  Layers,
  CheckCircle2,
  TrendingUp,
  Percent,
  Lock,
  Code2,
  Terminal,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Cpu,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  Users,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import {
  DEPLOYED_VAULT_NETWORKS,
  VAULT_CONTRACT_METADATA,
  VAULT_ABI,
  SOLIDITY_SOURCE_CODE,
} from '../../contracts/vaultContractData';
import { DEPLOYED_CONTRACTS } from '../../config/contracts';
import { AdminUserRecord, AdminUserMetrics } from '../../types';
import { AdminUserDepositsMonitor } from '../AdminUserDepositsMonitor';

interface VaultMatrixViewProps {
  vaultBalance: number;
  depositAmount: string;
  setDepositAmount: (val: string) => void;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  walletBalance: string;
  adminTreasuryAccount?: string;
  adminCollectedFees?: number;
  userRecords?: AdminUserRecord[];
  metrics?: AdminUserMetrics;
  onSimulateNewUserDeposit?: (amount: number, currency: 'USDC' | 'USDT' | 'ETH') => void;
}

export const VaultMatrixView: React.FC<VaultMatrixViewProps> = ({
  vaultBalance,
  depositAmount,
  setDepositAmount,
  onDeposit,
  onWithdraw,
  walletBalance,
  adminTreasuryAccount = '0x71C94B3b7f884a29a059A9482928cB7239A2F86B',
  adminCollectedFees = 4580.25,
  userRecords = [],
  metrics = {
    totalUserCount: 1248,
    activeDepositorsCount: 342,
    totalDepositAmount: 1842500,
    currencyBreakdown: { USDC: 1240000, USDT: 412500, ETH: 190000 },
    totalAdminYieldCollected: 4580.25,
    avgDepositAmount: 5387.42,
    thirtyDayLockedAmount: 1798200,
  },
  onSimulateNewUserDeposit,
}) => {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'USER_MONITOR' | 'CONTRACT_SOURCE' | 'READ_WRITE' | 'AUDIT'>('OPERATIONS');
  const [activeAction, setActiveAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [collateralAllocations, setCollateralAllocations] = useState<{
    mev: number;
    arbitrage: number;
    marketMaking: number;
  }>({
    mev: 45,
    arbitrage: 35,
    marketMaking: 20,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedAbi, setCopiedAbi] = useState<boolean>(false);

  const [previewAssetInput, setPreviewAssetInput] = useState<string>('1000');
  const [isContractPaused, setIsContractPaused] = useState<boolean>(false);
  const [writeFeedback, setWriteFeedback] = useState<string | null>(null);

  const sharePrice = 1.1842;
  const calculatedShares = parseFloat(previewAssetInput) > 0
    ? (parseFloat(previewAssetInput) / sharePrice).toFixed(4)
    : '0.0000';

  const handlePercentageClick = (pct: number) => {
    if (activeAction === 'DEPOSIT') {
      const maxVal = parseFloat(walletBalance) * 580 || 5000;
      setDepositAmount(((maxVal * pct) / 100).toFixed(2));
    } else {
      setDepositAmount(((vaultBalance * pct) / 100).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (!isNaN(val) && val > 0) {
      if (activeAction === 'DEPOSIT') {
        onDeposit(val);
        setSuccessMessage(`ERC-4626 deposit confirmed on BSC Testnet: Minted ${(val / sharePrice).toFixed(4)} cmBNB shares.`);
      } else {
        if (val > vaultBalance) {
          alert('Withdrawal amount exceeds available vault liquidity.');
          return;
        }
        onWithdraw(val);
        setSuccessMessage(`ERC-4626 redeem confirmed: Burned ${(val / sharePrice).toFixed(4)} cmBNB shares for $${val.toFixed(2)}.`);
      }
      setDepositAmount('');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'abi') => {
    navigator.clipboard?.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedAbi(true);
      setTimeout(() => setCopiedAbi(false), 2000);
    }
  };

  const handleSimulateCompound = () => {
    const yieldHarvest = Math.round((vaultBalance * 0.0045) * 100) / 100;
    onDeposit(yieldHarvest);
    setWriteFeedback(`[TX CONFIRMED] compoundYield(${yieldHarvest} USD): Emitted YieldCompounded event on BSC Testnet.`);
    setTimeout(() => setWriteFeedback(null), 4000);
  };

  const handleToggleEmergencyPause = () => {
    setIsContractPaused(!isContractPaused);
    setWriteFeedback(`[CIRCUIT BREAKER] Vault status toggled to: ${!isContractPaused ? 'PAUSED' : 'UNPAUSED'}`);
    setTimeout(() => setWriteFeedback(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Vault className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
              OmniGenesis Master Vault Matrix (ERC-4626)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
              BSC TESTNET (97)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Contract: <code className="text-emerald-400">{DEPLOYED_CONTRACTS.omniGenesisMaster}</code>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('OPERATIONS')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'OPERATIONS'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vault Operations
          </button>
          <button
            onClick={() => setActiveTab('USER_MONITOR')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'USER_MONITOR'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>User Monitor</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {metrics.totalUserCount.toLocaleString()}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('CONTRACT_SOURCE')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'CONTRACT_SOURCE'
                ? 'bg-slate-800 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Contract Code
          </button>
          <button
            onClick={() => setActiveTab('READ_WRITE')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'READ_WRITE'
                ? 'bg-slate-800 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Read / Write Console
          </button>
        </div>
      </div>

      {/* Vault Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Vault Liquidity (TVL)</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${vaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">ERC-4626 Assets</span>
        </div>

        <div
          onClick={() => setActiveTab('USER_MONITOR')}
          className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-200">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>USER COUNT</span>
            </span>
            <span className="text-[9px] text-emerald-300 group-hover:underline">VIEW</span>
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {metrics.totalUserCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400">
            {metrics.activeDepositorsCount.toLocaleString()} active
          </span>
        </div>

        <div
          onClick={() => setActiveTab('USER_MONITOR')}
          className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-200">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>DEPOSITS</span>
            </span>
            <span className="text-[9px] text-emerald-300 group-hover:underline">VIEW</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${metrics.totalDepositAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400">
            Avg: ${metrics.avgDepositAmount.toFixed(0)}/user
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Share Price</span>
          <div className="text-xl font-bold text-white mt-1">
            ${sharePrice.toFixed(4)}
          </div>
          <span className="text-[10px] text-emerald-400">+18.42% inception</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Compounded APY</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            48.72%
          </div>
          <span className="text-[10px] text-slate-500">3s cycle</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Circuit Breaker</span>
          <div className="text-xl font-bold mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isContractPaused ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            <span className={isContractPaused ? 'text-rose-400' : 'text-emerald-400'}>
              {isContractPaused ? 'PAUSED' : 'ACTIVE'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Guardian Active</span>
        </div>
      </div>

      {/* TAB 1: OPERATIONS */}
      {activeTab === 'OPERATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveAction('DEPOSIT')}
                  className={`px-4 py-1.5 rounded-md font-semibold transition-colors ${
                    activeAction === 'DEPOSIT'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  deposit(assets)
                </button>
                <button
                  onClick={() => setActiveAction('WITHDRAW')}
                  className={`px-4 py-1.5 rounded-md font-semibold transition-colors ${
                    activeAction === 'WITHDRAW'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  withdraw(assets)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Amount to {activeAction === 'DEPOSIT' ? 'Deposit' : 'Withdraw'}:</span>
                  <span>{walletBalance} tBNB Available</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {successMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
              >
                {activeAction === 'DEPOSIT' ? 'Broadcast deposit() On-Chain' : 'Broadcast withdraw() On-Chain'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Strategy Partitioning
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>OmniGenesis Yield Mutator v5</span>
                  <span className="text-emerald-400 font-bold">{collateralAllocations.mev}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={collateralAllocations.mev}
                  onChange={(e) => setCollateralAllocations({ ...collateralAllocations, mev: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MONITOR */}
      {activeTab === 'USER_MONITOR' && (
        <AdminUserDepositsMonitor
          userRecords={userRecords}
          metrics={metrics}
          onSimulateNewUserDeposit={onSimulateNewUserDeposit}
          adminTreasuryAccount={adminTreasuryAccount}
        />
      )}

      {/* TAB 3: CONTRACT SOURCE */}
      {activeTab === 'CONTRACT_SOURCE' && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <span>contracts/OmniGenesis2050Master.sol</span>
            <span className="text-emerald-400">BSC Testnet (Chain ID 97)</span>
          </div>
          <pre className="p-4 text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed select-text">
            <code>{SOLIDITY_SOURCE_CODE}</code>
          </pre>
        </div>
      )}

      {/* TAB 4: READ / WRITE CONSOLE */}
      {activeTab === 'READ_WRITE' && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs space-y-4">
          <h3 className="font-bold text-white uppercase">Read On-Chain Invariants</h3>
          <div className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between">
            <span className="text-slate-400">totalAssets()</span>
            <span className="text-emerald-400 font-bold">${vaultBalance.toFixed(2)} USD</span>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between">
            <span className="text-slate-400">masterAddress</span>
            <span className="text-cyan-400">{DEPLOYED_CONTRACTS.omniGenesisMaster}</span>
          </div>
        </div>
      )}
    </div>
  );
};
