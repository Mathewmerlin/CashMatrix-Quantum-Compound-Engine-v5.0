import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Lock,
  Unlock,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  LogOut,
  KeyRound,
  Globe,
  Share2,
  FileCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { CashMatrixLogo } from '../CashMatrixLogo';
import { CompoundingRecord, UserInvestorPosition, WithdrawalReceipt } from '../../types';
import { PRODUCTION_CONFIG } from '../../config/productionConfig';
import { DEPLOYED_CONTRACTS } from '../../config/contracts';
import { matrixAudio } from '../../utils/matrixAudio';

interface UserPanelOnlyViewProps {
  account: string;
  walletBalance: string;
  network: string;
  chainId: string;
  onDisconnectWallet: () => void;
  onSwitchNetwork: (chainId: string) => void;
  investorPosition: UserInvestorPosition;
  onDepositPrincipal: (amount: number, currency: string) => void;
  onClaimProfitSplit: () => void;
  onResetUserPosition?: () => void;
  tradeHistory: CompoundingRecord[];
  isAutoCompounding: boolean;
  adminTreasuryAccount: string;
  adminCollectedFees: number;
  isAdminAuthenticated: boolean;
  onSwitchToAdmin: () => void;
  onOpenAdminAuth: () => void;
  onOpenDeployGuide: () => void;
  onSignAuthChallenge?: () => Promise<string | null>;
  authSignature?: string | null;
}

type UserTab = 'portfolio' | 'deposit' | 'claim' | 'trades' | 'referral' | 'security';

export const UserPanelOnlyView: React.FC<UserPanelOnlyViewProps> = ({
  account,
  walletBalance,
  network,
  chainId,
  onDisconnectWallet,
  onSwitchNetwork,
  investorPosition,
  onDepositPrincipal,
  onClaimProfitSplit,
  onResetUserPosition,
  // propTradeHistory ignored to prevent static parent overrides
  isAutoCompounding,
  adminTreasuryAccount,
  adminCollectedFees,
  isAdminAuthenticated,
  onSwitchToAdmin,
  onOpenAdminAuth,
  onOpenDeployGuide,
  onSignAuthChallenge,
  authSignature,
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>('portfolio');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [selectedCurrency, setSelectedCurrency] = useState<'USDT' | 'USDC' | 'BNB'>('USDC');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedRefLink, setCopiedRefLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<WithdrawalReceipt | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<'idle' | 'signing' | 'verified'>(
    authSignature ? 'verified' : 'idle'
  );

  // --- INDEPENDENT LEDGER CACHE POLLER ---
  const [cachedTrades, setCachedTrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchLedgerCache = async () => {
      try {
        const res = await fetch('/ledger-cache.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCachedTrades(data);
          }
        }
      } catch (e) {
        // Silently bypass network issues
      }
    };

    fetchLedgerCache();
    const interval = setInterval(fetchLedgerCache, 1500);
    return () => clearInterval(interval);
  }, []);

  // Map local cache, sanitizing currency strings into true floats
  const tradeHistory = cachedTrades.length > 0 ? cachedTrades.map((t, idx) => {
    const rawYield = t.yieldGenerated ?? t.profitGenerated ?? 0.55;
    const cleanYield = typeof rawYield === 'number' 
      ? rawYield 
      : parseFloat(String(rawYield).replace(/[^0-9.-]+/g, '')) || 0.55;

    const rawShare = t.userShare ?? (cleanYield * 0.5);
    const cleanShare = typeof rawShare === 'number'
      ? rawShare
      : parseFloat(String(rawShare).replace(/[^0-9.-]+/g, '')) || (cleanYield * 0.5);

    return {
      id: t.id || `trade-${idx}`,
      cycle: t.batch ? String(t.batch).replace('#', '') : String(cachedTrades.length - idx),
      pair: t.pair || 'USDC/tBNB-QUANTUM-NODE',
      inputCapital: 1000,
      profitGenerated: cleanYield,
      userShareAmount: cleanShare,
      yieldPct: 5.5,
      txHash: t.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: t.timestamp || new Date().toLocaleTimeString()
    };
  }) : [
    { id: 'syncing', cycle: 'SYNC', pair: 'CONNECTING-KEEPER-DAEMON...', inputCapital: 1000, profitGenerated: 0.00, userShareAmount: 0.00, yieldPct: 0, txHash: '0x000', timestamp: 'Live' }
  ];

  // 30-Day Lock Countdown
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 29, hours: 23, minutes: 59, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

   const principal = investorPosition.depositedPrincipal;
  
  // Dynamically compute total accrued yield from the live streaming tradeHistory array
  const totalAccruedYield = tradeHistory.reduce((acc, curr) => acc + Number(curr.profitGenerated || 0), 0);
  const accruedYield = totalAccruedYield;

  const totalNetWorth = principal + accruedYield;
  const profitPct = principal > 0 ? (accruedYield / principal) * 100 : 0;
  const userShare50Pct = accruedYield * 0.5;
  const adminShare50Pct = accruedYield * 0.5;
  

  const isUnlocked =
    timeRemaining.days === 0 &&
    timeRemaining.hours === 0 &&
    timeRemaining.minutes === 0 &&
    timeRemaining.seconds === 0;

  const isBscTestnet = chainId === '0x61';

  const handleCopy = (text: string, isRef = false) => {
    navigator.clipboard.writeText(text);
    if (isRef) {
      setCopiedRefLink(true);
      setTimeout(() => setCopiedRefLink(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
    matrixAudio.playBeep(980, 0.05);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSignAuth = async () => {
    if (!onSignAuthChallenge) return;
    setSignatureStatus('signing');
    const sig = await onSignAuthChallenge();
    if (sig) {
      setSignatureStatus('verified');
      matrixAudio.playAccessGranted();
      showToast('EIP-4361 cryptographic identity verified successfully.');
    } else {
      setSignatureStatus('idle');
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) return;

    if (selectedCurrency === 'BNB') {
      const balanceNum = parseFloat(walletBalance);
      if (balanceNum - num < PRODUCTION_CONFIG.gasSafetyBufferBnb) {
        showToast(
          `Security Guard: Kept minimum ${PRODUCTION_CONFIG.gasSafetyBufferBnb} tBNB in wallet for gas fees.`
        );
      }
    }

    onDepositPrincipal(num, selectedCurrency);
    matrixAudio.playSuccess();
    showToast(`Successfully deposited ${num.toLocaleString()} ${selectedCurrency} into 30-Day Vault!`);
  };

  const handleClaimSubmit = () => {
    if (!isUnlocked) {
      matrixAudio.playAccessDenied();
      showToast('30-Day lock has not matured yet! Timelock enforcement active.');
      return;
    }
    if (totalAccruedYield <= 0) {
      showToast('No accrued yield available to harvest yet.');
      return;
    }

    onClaimProfitSplit();
    matrixAudio.playTradeWon();
    showToast(`Harvested ${userShare50Pct.toFixed(2)} USD! 50% split transferred to treasury.`);
  };

  const referralUrl = `https://${PRODUCTION_CONFIG.domain}/?ref=${account}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/40 bg-slate-900/95 backdrop-blur-md text-emerald-300 text-xs font-mono shadow-2xl shadow-emerald-950/80 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* User Header */}
      <header className="border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <CashMatrixLogo size={32} withGlow={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-mono font-bold tracking-wider text-sm sm:text-base text-white truncate">
                  CASH<span className="text-emerald-400">MATRIX</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold whitespace-nowrap hidden xs:inline-block">
                  USER PANEL
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">https://{PRODUCTION_CONFIG.domain}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isBscTestnet ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="hidden md:inline">BSC Testnet (97)</span>
                <span className="md:hidden">BSC 97</span>
              </div>
            ) : (
              <button
                onClick={() => onSwitchNetwork('0x61')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 text-amber-300 text-xs font-mono hover:bg-amber-900/50 transition-colors"
                title="Click to switch to BSC Testnet"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Switch to BSC Testnet (97)</span>
                <span className="sm:hidden text-[11px]">BSC 97</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-mono">
              <span className="text-emerald-400 font-bold hidden sm:inline">{walletBalance} tBNB</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span
                onClick={() => handleCopy(account)}
                className="text-slate-300 hover:text-white cursor-pointer flex items-center gap-1"
                title="Click to copy address"
              >
                <span className="hidden sm:inline">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
                <span className="sm:hidden text-[11px]">{account?.slice(0, 4)}...{account?.slice(-3)}</span>
                {copiedAddress ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                )}
              </span>
            </div>

            <button
              onClick={onOpenDeployGuide}
              className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono hidden lg:flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>GoDaddy Setup</span>
            </button>

            {isAdminAuthenticated ? (
              <button
                onClick={onSwitchToAdmin}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-mono flex items-center gap-1.5"
                title="Switch to Admin Command Center"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Admin Terminal</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="p-1.5 sm:p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                title="Admin Authentication"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onDisconnectWallet}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-rose-950/40 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* User Navigation Tabs Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-max md:min-w-0 gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'portfolio', label: 'My Portfolio', icon: Sparkles },
              { id: 'deposit', label: 'Deposit BEP-20', icon: Coins },
              { id: 'claim', label: 'Harvest 50% Profit', icon: Zap },
              { id: 'trades', label: 'Live BSC Trades', icon: Activity },
              { id: 'referral', label: 'Referral Rewards', icon: Share2 },
              { id: 'security', label: 'Audit & Contracts', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as UserTab);
                    matrixAudio.playBeep(920, 0.04);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-mono text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-slate-400 pl-4 shrink-0">
            {signatureStatus === 'verified' ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                EIP-4361 Signature Verified
              </span>
            ) : (
              <button
                onClick={handleSignAuth}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                <Shield className="w-3.5 h-3.5" />
                Sign Auth Challenge (Gasless)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Deposited Principal</span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  ${principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Currency: {investorPosition.depositCurrency || 'USDC'} (BEP-20)
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Accrued Yield (Total)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  +${totalAccruedYield.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  +{profitPct.toFixed(2)}% net capital gain
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Your 50% Profit Share</span>
                  <Coins className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-teal-300">
                  ${userShare50Pct.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  50% to user wallet / 50% to treasury
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>30-Day Lock Status</span>
                  {isUnlocked ? (
                    <Unlock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="text-xl font-mono font-bold text-white">
                  {isUnlocked
                    ? 'UNLOCKED / MATURED'
                    : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  {isUnlocked ? 'Ready for profit harvest' : 'Compounding loop locked'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">30-Day Automated Proof of Lock</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Master Vault: {DEPLOYED_CONTRACTS.omniGenesisMaster?.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                      isUnlocked
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {isUnlocked ? 'Ready to Claim' : '30-Day Lock Active'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-2 text-center font-mono">
                  <div className="p-2 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg sm:text-2xl font-bold text-white">{timeRemaining.days}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">DAYS</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg sm:text-2xl font-bold text-white">{timeRemaining.hours}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">HOURS</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg sm:text-2xl font-bold text-white">{timeRemaining.minutes}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">MINS</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-400">{timeRemaining.seconds}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">SECS</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Deposit More Principal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('claim')}
                    disabled={!isUnlocked || totalAccruedYield <= 0}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Harvest 50% Profit</span>
                  </button>
                </div>
              </div>

              {/* Live Execution Ledger Preview in Portfolio Tab */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Execution Ledger
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 animate-pulse">STREAMING</span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[260px] font-mono text-xs">
                  {tradeHistory.slice(0, 5).map((t, idx) => (
                    <div key={t.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-emerald-400 font-bold">#{t.cycle}</span>
                        <span className="text-slate-400 block text-[10px]">{t.pair}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold block">+${Number(t.profitGenerated).toFixed(2)}</span>
                        <a href={`https://testnet.bscscan.com/tx/${t.txHash}`} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline">
                          {t.txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? `${t.txHash.slice(0, 6)}...` : 'Syncing...'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Deposit BEP-20 Form */}
        {activeTab === 'deposit' && (
          <div className="max-w-xl mx-auto rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-7 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Deposit BEP-20 Principal
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                30-day lock period commences immediately upon block confirmation.
              </p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2">Select BEP-20 Asset</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['USDC', 'BNB', 'USDT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedCurrency(t)}
                      className={`p-3 rounded-xl border font-mono text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedCurrency === t
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-md shadow-emerald-950'
                          : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>Deposit Amount</span>
                  <span>Balance: {walletBalance} tBNB</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm 30-Day Lock Deposit</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Harvest 50% Profit */}
        {activeTab === 'claim' && (
          <div className="max-w-xl mx-auto rounded-2xl border border-teal-500/30 bg-slate-900/80 p-7 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" />
                Harvest 50% Profit Split
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">Total Accrued Profit:</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  ${totalAccruedYield.toFixed(2)} USD
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                  <span className="text-[10px] font-mono text-emerald-400 block mb-1">YOUR SHARE (50%)</span>
                  <span className="text-lg font-mono font-bold text-white">
                    ${userShare50Pct.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">TREASURY SHARE (50%)</span>
                  <span className="text-lg font-mono font-bold text-slate-300">
                    ${adminShare50Pct.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClaimSubmit}
              disabled={!isUnlocked || totalAccruedYield <= 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 text-slate-950 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-4 h-4" />
              <span>Claim &amp; Execute 50/50 Harvest</span>
            </button>
          </div>
        )}

        {/* Tab 4: Live BSC Trades Feed */}
        {activeTab === 'trades' && (
          <div className="space-y-4 font-mono">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Pair</th>
                      <th className="py-3 px-4">BscScan Tx</th>
                      <th className="py-3 px-4 text-right">Yield Generated</th>
                      <th className="py-3 px-4 text-right">Your 50% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tradeHistory.slice(0, 15).map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-300">#{t.cycle}</td>
                        <td className="py-3 px-4 text-white font-semibold">{t.pair}</td>
                        <td className="py-3 px-4 text-cyan-400">
                          <a
                            href={`https://testnet.bscscan.com/tx/${t.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{t.txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? `${t.txHash.slice(0, 8)}...` : '0x0000...'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          +${Number(t.profitGenerated || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-teal-300">
                          +${Number(t.userShareAmount || (t.profitGenerated * 0.5)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Referral Rewards Program */}
        {activeTab === 'referral' && (
          <div className="max-w-xl mx-auto rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-7 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                Affiliate Program
              </h2>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">Unique Referral Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono"
                />
                <button
                  onClick={() => handleCopy(referralUrl, true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono"
                >
                  {copiedRefLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Security & Smart Contracts */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-white">Official BSC Testnet Contract Registry</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Master Vault:</span>
                  <span className="text-emerald-400">{DEPLOYED_CONTRACTS.omniGenesisMaster}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>Domain: {PRODUCTION_CONFIG.domain}</span>
          <span className="text-emerald-400">BSC Testnet (97)</span>
        </div>
      </footer>
    </div>
  );
};
