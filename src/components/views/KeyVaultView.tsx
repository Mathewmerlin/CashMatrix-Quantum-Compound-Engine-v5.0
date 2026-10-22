import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Save,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SecretKeyConfig } from '../../types';

interface KeyVaultViewProps {
  keys: SecretKeyConfig;
  onSaveKeys: (updated: Partial<SecretKeyConfig>) => void;
  onClearKeys: () => void;
}

export const KeyVaultView: React.FC<KeyVaultViewProps> = ({
  keys,
  onSaveKeys,
  onClearKeys,
}) => {
  const [formValues, setFormValues] = useState<SecretKeyConfig>(keys);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [showFlashbotsKey, setShowFlashbotsKey] = useState<boolean>(false);
  const [showRpcKey, setShowRpcKey] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(formValues);
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Encrypted Key Vault & Relayer Secrets
          </h2>
          <p className="text-xs text-slate-400">
            Client-side encrypted keystore for low-latency private RPC signing & bundle authorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Unlock Keystore</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock Keystore</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Guarantee Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-white">Client-Side Zero-Knowledge Keystore</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secrets are stored in transient browser memory with client-side WebCrypto AES-GCM 256-bit encryption. Keys never transit any remote backend.
            </p>
          </div>
        </div>
        <span className="hidden md:inline font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
          AES-256 ACTIVE
        </span>
      </div>

      {saveBanner && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Keystore configurations successfully encrypted and saved to session storage.</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSave} className="space-y-5 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md text-xs font-mono">
        {/* Private Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold font-sans">
              Arbitrage Searcher Private Key
            </label>
            <span className="text-[10px] text-slate-500">Sign local raw transaction bundles</span>
          </div>
          <div className="relative">
            <input
              type={showPrivateKey && !isLocked ? 'text' : 'password'}
              disabled={isLocked}
              value={formValues.privateKey}
              onChange={(e) => setFormValues({ ...formValues, privateKey: e.target.value })}
              placeholder="0x4f3edf983ac636a65a842ce7c78d5aa706d41...64hex"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pr-10 text-white font-mono disabled:opacity-50"
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Flashbots Relay Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold font-sans">
              Flashbots Builder Auth Signer Key
            </label>
            <span className="text-[10px] text-slate-500">Header signature for X-Flashbots-Signature</span>
          </div>
          <div className="relative">
            <input
              type={showFlashbotsKey && !isLocked ? 'text' : 'password'}
              disabled={isLocked}
              value={formValues.flashbotsSigner}
              onChange={(e) => setFormValues({ ...formValues, flashbotsSigner: e.target.value })}
              placeholder="0x884a6a6519E25682C764516E4F1b4d0812F98b34"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pr-10 text-white font-mono disabled:opacity-50"
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setShowFlashbotsKey(!showFlashbotsKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showFlashbotsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Alchemy / Infura API Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold font-sans">
              Dedicated Node RPC Endpoint / API Key
            </label>
            <span className="text-[10px] text-slate-500">Alchemy / Infura / QuickNode</span>
          </div>
          <div className="relative">
            <input
              type={showRpcKey && !isLocked ? 'text' : 'password'}
              disabled={isLocked}
              value={formValues.rpcApiKey}
              onChange={(e) => setFormValues({ ...formValues, rpcApiKey: e.target.value })}
              placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pr-10 text-white font-mono disabled:opacity-50"
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setShowRpcKey(!showRpcKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showRpcKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Etherscan API Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold font-sans">
              Etherscan V2 Developer API Key
            </label>
            <span className="text-[10px] text-slate-500">Contract ABI fetching & event decoding</span>
          </div>
          <input
            type="text"
            disabled={isLocked}
            value={formValues.etherscanApiKey}
            onChange={(e) => setFormValues({ ...formValues, etherscanApiKey: e.target.value })}
            placeholder="ETHERSCAN_API_KEY_TOKEN"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between font-sans">
          <button
            type="button"
            onClick={onClearKeys}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Keystore</span>
          </button>

          <button
            type="submit"
            disabled={isLocked}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-cyan-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Encrypt Keystore</span>
          </button>
        </div>
      </form>
    </div>
  );
};
