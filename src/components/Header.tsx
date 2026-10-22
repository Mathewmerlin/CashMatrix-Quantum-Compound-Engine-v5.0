import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Cpu,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Users,
  DollarSign,
} from 'lucide-react';
import { EnvironmentType, NavModule, AdminUserMetrics } from '../types';
import { matrixAudio } from '../utils/matrixAudio';
import { useAdminAuth } from '../context/AdminAuthContext';
import { CashMatrixLogo } from './CashMatrixLogo';

interface HeaderProps {
  currentModule: NavModule;
  onSelectModule?: (module: NavModule) => void;
  environment: EnvironmentType;
  onToggleEnvironment: () => void;
  isAutoCompounding: boolean;
  onToggleAutoCompounding: () => void;
  account: string | null;
  walletBalance: string;
  network: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenWalletModal: () => void;
  metrics?: AdminUserMetrics;
  onOpenDeployGuide?: () => void;
  onSwitchToUserPanel?: () => void;
}

const MODULE_TITLES: Record<NavModule, { title: string; subtitle: string }> = {
  investor: { title: 'Investor Portal', subtitle: 'Client Quantum Yield Compounding & 50/50 Profit Vault' },
  terminal: { title: 'Terminal Hub', subtitle: 'Automated Compounding & Quantitative Execution' },
  charts: { title: 'Quant Charts', subtitle: 'Real-Time Yield Growth, Trade Volume & Exponential Forecasts' },
  trades: { title: 'Live Trades', subtitle: 'Real-time Execution Stream & On-chain Receipts' },
  positions: { title: 'Leveraged Positions', subtitle: 'Active Derivative & Hedged Portfolio Exposures' },
  strategies: { title: 'Quantitative Strategies', subtitle: 'Algorithmic MEV, Arbitrage & Market Making Logic' },
  executor: { title: 'Executor Node', subtitle: 'Flashbots Relay, Mempool Sniping & Gas Analytics' },
  vault: { title: 'Vault Matrix', subtitle: 'Smart Contract Collateral & Liquidity Capital Pools' },
  wallet: { title: 'Wallet Core', subtitle: 'EIP-1193 RPC Provider, Accounts & Multi-Chain Switcher' },
  metrics: { title: 'System Telemetry', subtitle: 'Hardware Resources, RPC Latency & Bundle Throughput' },
  logs: { title: 'System Logs', subtitle: 'Error Boundary Audit Trail & Mempool RPC Trace Records' },
  secrets: { title: 'Key Vault', subtitle: 'Client-side Zero-Knowledge Encryption Key Manager' },
  institutional: { title: 'Institutional Hub', subtitle: 'Enterprise Liquidity & Custody Management' },
};

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  environment,
  onToggleEnvironment,
  isAutoCompounding,
  onToggleAutoCompounding,
  account,
  walletBalance,
  network,
  onConnectWallet,
  onOpenWalletModal,
  metrics,
  onOpenDeployGuide,
  onSwitchToUserPanel,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(matrixAudio.muted);
  const { isAdminAuthenticated, openAuthModal, logout } = useAdminAuth();
  const currentInfo = MODULE_TITLES[currentModule] || MODULE_TITLES.investor;
  const isInvestorMode = currentModule === 'investor';

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleToggleSound = () => {
    const nextState = matrixAudio.toggleMute();
    setIsMuted(!nextState);
    if (nextState) matrixAudio.playBeep(920, 0.05);
  };

  return (
    <header className="h-16 border-b border-emerald-500/20 bg-[#020617]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs and Module Info */}
      <div className="flex items-center gap-2 text-xs min-w-0">
        <CashMatrixLogo size={22} withGlow={false} editable={true} className="hidden sm:inline-flex" />
        <span className="text-slate-400 font-medium hidden sm:inline">CashMatrix</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
        <span className="font-bold text-white tracking-wide truncate matrix-glow-green">
          {currentInfo.title}
        </span>
        <span className="hidden lg:inline text-slate-500 ml-2 border-l border-slate-800 pl-2 text-[11px] truncate">
          {currentInfo.subtitle}
        </span>
      </div>

      {/* Center: Dual Panel Switcher (Investor vs Admin) */}
      {onSelectModule && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => {
                matrixAudio.playBeep(750, 0.05);
                onSelectModule('investor');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                isInvestorMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>User Portal</span>
            </button>
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  matrixAudio.playBeep(650, 0.05);
                  onSelectModule('terminal');
                } else {
                  openAuthModal('terminal');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                !isInvestorMode
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isAdminAuthenticated ? 'Admin Engine (Unlocked)' : 'Admin Engine (Password Protected)'}
            >
              {isAdminAuthenticated ? (
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Admin Engine</span>
              {!isAdminAuthenticated && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 ml-0.5">
                  LOCK
                </span>
              )}
            </button>
          </div>

          {isAdminAuthenticated && (
            <button
              onClick={logout}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
              title="Lock Admin Session"
            >
              <Lock className="w-3 h-3 text-rose-400" />
              <span className="hidden md:inline">Lock Session</span>
            </button>
          )}

          {isAdminAuthenticated && !isInvestorMode && metrics && (
            <button
              onClick={() => onSelectModule && onSelectModule('vault')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono transition-colors"
              title="Admin Live Monitor: Total Users & Total User Deposits"
            >
              <div className="flex items-center gap-1 text-cyan-300">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold">{metrics.totalUserCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Users</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">${(metrics.totalDepositAmount / 1000).toFixed(0)}k</span>
                <span className="text-[10px] text-slate-400">Deposits</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute Matrix Synth FX' : 'Mute Matrix Synth FX'}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 text-xs transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Live BSC Mainnet Network Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="font-bold">LIVE BSC MAINNET</span>
          <span className="text-[9px] text-emerald-400/80">(0x38)</span>
        </div>

        {/* Global Auto-Compounding Toggle (Visible in Admin Mode) */}
        {!isInvestorMode && (
          <button
            onClick={onToggleAutoCompounding}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap font-mono ${
              isAutoCompounding
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isAutoCompounding ? (
              <>
                <Square className="w-3 h-3 fill-current text-emerald-400" />
                <span>STOP BOT</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-cyan-400" />
                <span>START BOT</span>
              </>
            )}
          </button>
        )}

        {/* Switch to User Panel View button */}
        {onSwitchToUserPanel && (
          <button
            onClick={onSwitchToUserPanel}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 text-xs font-mono transition-colors"
            title="View User Investor Panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>User Panel</span>
          </button>
        )}

        {/* GoDaddy Production Guide button */}
        {onOpenDeployGuide && (
          <button
            onClick={onOpenDeployGuide}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono transition-colors"
            title="Open GoDaddy & bscsan.nl Deployment Guide"
          >
            <span>GoDaddy (bscsan.nl)</span>
          </button>
        )}

        {/* Wallet Connection Capsule */}
        {account ? (
          <button
            onClick={onOpenWalletModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-xs transition-all shadow-inner"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-200 font-semibold">{formatAddress(account)}</span>
            <span className="font-mono text-emerald-400 font-bold ml-1 hidden sm:inline">
              {walletBalance} {network.includes('BNB') || network.includes('0x38') ? 'BNB' : 'ETH'}
            </span>
          </button>
        ) : (
          <button
            onClick={onConnectWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap font-mono uppercase"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Connect Web3</span>
          </button>
        )}
      </div>
    </header>
  );
};
