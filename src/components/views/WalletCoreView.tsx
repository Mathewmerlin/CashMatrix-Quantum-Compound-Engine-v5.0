import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  LogOut,
  Globe,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SUPPORTED_NETWORKS } from '../../hooks/useWeb3';

interface WalletCoreViewProps {
  account: string | null;
  walletBalance: string;
  network: string;
  chainId: string;
  isConnecting: boolean;
  error: string | null;
  hasProvider: boolean;
  onConnectWallet: () => Promise<boolean>;
  onDisconnectWallet: () => void;
  onSwitchNetwork: (chainId: string) => Promise<void>;
}

export const WalletCoreView: React.FC<WalletCoreViewProps> = ({
  account,
  walletBalance,
  network,
  chainId,
  isConnecting,
  error,
  hasProvider,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchNetwork,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [switchingChainId, setSwitchingChainId] = useState<string | null>(null);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard?.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleNetworkClick = async (targetChainId: string) => {
    setSwitchingChainId(targetChainId);
    await onSwitchNetwork(targetChainId);
    setSwitchingChainId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
          Web3 Wallet Core & EIP-1193 Provider
        </h2>
        <p className="text-xs text-slate-400">
          Native BSC RPC connection, tBNB balances, and multi-chain network manager
        </p>
      </div>

      {!hasProvider && !account && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">No Injected Web3 Provider Detected</p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                Install MetaMask or Rabby browser extension to connect to BSC Testnet (Chain ID 97).
              </p>
            </div>
          </div>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow flex items-center gap-1.5"
          >
            <span>Get MetaMask</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {account ? (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Connected Account</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    LIVE EIP-1193
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm text-white font-bold mt-0.5">
                  <span>{account}</span>
                  <button
                    onClick={copyAddress}
                    title="Copy full address"
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnectWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">Native Balance (tBNB)</span>
              <div className="text-2xl font-bold text-emerald-400">{walletBalance} tBNB</div>
              <span className="text-[11px] text-slate-500">BSC Testnet (Chain ID 97)</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">Active Network</span>
              <div className="text-lg font-bold text-white truncate">{network}</div>
              <span className="text-[11px] text-emerald-400">RPC Synced</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">RPC Endpoint</span>
              <div className="text-sm font-bold text-slate-200 truncate">data-seed-prebsc-1-s1</div>
              <span className="text-[11px] text-slate-500">Fast Binance Seed Node</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect Web3 Wallet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Connect via standard EIP-1193 protocol to authorize settlements on BSC Testnet.
            </p>
          </div>

          <button
            onClick={onConnectWallet}
            disabled={isConnecting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect Injected Wallet</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Network Switcher Section */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Supported Networks
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(SUPPORTED_NETWORKS).map(([hexId, net]) => {
            const isCurrent = chainId.toLowerCase() === hexId.toLowerCase();
            const isSwitching = switchingChainId === hexId;

            return (
              <div
                key={hexId}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs">{net.name}</span>
                  <span className="text-[10px] text-slate-400">{hexId}</span>
                </div>
                <button
                  onClick={() => handleNetworkClick(hexId)}
                  disabled={isCurrent || isSwitching}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isSwitching ? 'Switching...' : isCurrent ? 'Connected' : 'Switch Network'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
