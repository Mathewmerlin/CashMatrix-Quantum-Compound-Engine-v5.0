import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Lock,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ExternalLink,
  Sparkles,
  KeyRound,
  Coins,
  Cpu,
  Layers,
  Check,
  Copy,
} from 'lucide-react';
import { CashMatrixLogo } from '../CashMatrixLogo';
import { PRODUCTION_CONFIG } from '../../config/productionConfig';
import { matrixAudio } from '../../utils/matrixAudio';

interface UserSignInGateProps {
  onConnectWallet: () => Promise<boolean>;
  isConnecting: boolean;
  web3Error: string | null;
  onOpenAdminAuth: () => void;
  onOpenDeployGuide: () => void;
}

export const UserSignInGate: React.FC<UserSignInGateProps> = ({
  onConnectWallet,
  isConnecting,
  web3Error,
  onOpenAdminAuth,
  onOpenDeployGuide,
}) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralValid, setReferralValid] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  // Auto-detect referral code from URL query parameters (?ref=0x...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref);
        setReferralValid(true);
      }
    }
  }, []);

  const handleReferralChange = (val: string) => {
    setReferralCode(val);
    setReferralValid(val.trim().length >= 6);
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(PRODUCTION_CONFIG.officialUrl);
    setCopiedDomain(true);
    matrixAudio.playBeep(880, 0.05);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-teal-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-emerald-500/20 bg-slate-950/70 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <CashMatrixLogo size={34} withGlow={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono font-bold tracking-wider text-sm sm:text-base text-white">
                  CASH<span className="text-emerald-400">MATRIX</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold whitespace-nowrap">
                  BSC MAINNET (56)
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">Quantum-Compound Engine v5.0</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Domain Verification Seal */}
            <div
              onClick={handleCopyDomain}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono cursor-pointer hover:bg-emerald-900/40 transition-colors"
              title="Click to copy official verified URL"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[150px] lg:max-w-none">https://{PRODUCTION_CONFIG.domain}</span>
              {copiedDomain ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
            </div>

            {/* GoDaddy Production Guide Button */}
            <button
              onClick={onOpenDeployGuide}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-950/50"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">GoDaddy &amp; Production Launch</span>
              <span className="lg:hidden text-[11px] sm:text-xs">Setup</span>
            </button>

            {/* Operator Login Key Button */}
            <button
              onClick={onOpenAdminAuth}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Operator &amp; Admin Sign In"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Admin Access</span>
              <span className="sm:hidden text-[11px]">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sign-In Hero & Onboarding Portal */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 flex-1 flex flex-col justify-center w-full">
        {/* Anti-Phishing Security Banner */}
        <div className="mb-6 sm:mb-8 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-sm p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">
              <strong className="text-white font-semibold">Official Security Verification:</strong> Verify URL is{' '}
              <span className="font-mono text-emerald-400 font-bold underline decoration-emerald-500/50">
                https://{PRODUCTION_CONFIG.domain}
              </span>{' '}
              before connecting your Web3 wallet.
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> SSL 256-Bit TLS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Column: Value Proposition & Protocol Proofs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                BNB Smart Chain Automated Yield Matrix
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Institutional Quant Yields, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Compounded Automatically.
                </span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
                Connect your BEP-20 Web3 wallet to enter the private User Panel. Deposit USDT, USDC, or BNB to tap into high-frequency arbitrage loops with guaranteed 30-day proof-of-timelock.
              </p>
            </div>

            {/* Protocol Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  30-Day Timelock Vault
                </div>
                <p className="text-xs text-slate-400">
                  Principal is strictly locked for 30 days to maximize compound growth and prevent liquidity drainage.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  50 / 50 Profit Split
                </div>
                <p className="text-xs text-slate-400">
                  Upon maturity, investors harvest 50% of net profits, with 50% automatically routed to treasury reserves.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold mb-1">
                  <Coins className="w-3.5 h-3.5" />
                  BEP-20 Multi-Asset
                </div>
                <p className="text-xs text-slate-400">
                  Native support for USDT, USDC, and BNB on Binance Smart Chain with ultra-low $0.05 gas fees.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  Live Quant Execution
                </div>
                <p className="text-xs text-slate-400">
                  Real-time trade receipts and transaction hashes verifiable directly on BSCScan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: User Sign-In Card (Connect to Access User Panel) */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl shadow-emerald-950/40 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Sign In to User Panel
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Connect Web3 Wallet to manage your deposits
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              </div>

              {/* Web3 Error notice if any */}
              {web3Error && (
                <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{web3Error}</span>
                </div>
              )}

              {/* Optional Referral Code Input */}
              <div className="mb-5">
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Referral ID / Affiliate Pass <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => handleReferralChange(e.target.value)}
                    placeholder="Enter 0x... or affiliate code"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                  {referralValid && (
                    <span className="absolute right-3 top-2.5 text-emerald-400 text-xs font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enables 5% bonus compounding rebate on initial deposit.
                </p>
              </div>

              {/* Primary Action 1: Connect Web3 Wallet */}
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    matrixAudio.playAccessGranted();
                    await onConnectWallet();
                  }}
                  disabled={isConnecting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Requesting Wallet Authorization...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Connect Web3 Wallet (Enter Panel)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Network Status Notice */}
                <div className="w-full py-2.5 px-4 rounded-xl font-mono text-xs text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>BNB Smart Chain Mainnet (Chain ID 56)</span>
                </div>
              </div>

              {/* Supported Wallets Icons */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
                <p className="text-[11px] font-mono text-slate-500 mb-2">
                  COMPATIBLE WITH ALL BEP-20 WALLETS:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    🦊 MetaMask
                  </span>
                  <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    🛡️ TrustWallet
                  </span>
                  <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    🟡 Binance Web3
                  </span>
                  <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    ⚡ OKX Wallet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left">
            <span>© 2026 CashMatrix Protocol</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Domain: {PRODUCTION_CONFIG.domain}</span>
            <span>•</span>
            <span className="text-emerald-400">BNB Chain Active</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <a
              href="https://bscscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              BSCScan Explorer <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onOpenAdminAuth}
              className="text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" /> Operator Terminal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
