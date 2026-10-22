import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { NavModule } from '../../types';

interface AdminGatekeeperViewProps {
  attemptedModule: NavModule;
  onReturnToUserPortal: () => void;
  onUnlockSuccess: () => void;
}

export const AdminGatekeeperView: React.FC<AdminGatekeeperViewProps> = ({
  attemptedModule,
  onReturnToUserPortal,
  onUnlockSuccess,
}) => {
  const {
    login,
    isLockedOut,
    lockoutRemainingSec,
    currentPasswordHint,
    failedAttempts,
  } = useAdminAuth();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Admin master passcode required.');
      return;
    }

    const res = login(passwordInput.trim());
    if (res.success) {
      setErrorMessage(null);
      setIsSuccess(true);
      setTimeout(() => {
        onUnlockSuccess();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#020617]/95 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/80 p-6 sm:p-10 overflow-hidden text-slate-100">
        {/* Futuristic Grid & Corner Brackets */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

        {/* Lockout Header Badge */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 font-bold tracking-widest uppercase">
              ZONE: RESTRICTED ADMIN PROTOCOL
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded bg-slate-900">
            SEC-CLEARANCE-LEVEL-5
          </span>
        </div>

        {/* Center Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
            <Lock className="w-8 h-8 animate-pulse text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white matrix-glow-green">
            Admin Authentication Required
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-2 max-w-md mx-auto">
            The <strong>User Portal</strong> is public for investor deposit & yield. All quantitative trading execution, terminal telemetry, private keys, and protocol matrix modules are strictly password protected.
          </p>
        </div>

        {/* Attempted Target Module Indicator */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-6 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Attempted Module:</span>
          <span className="text-cyan-400 font-bold uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{attemptedModule} Console</span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
              <span>ADMIN MASTER PASSCODE</span>
              {failedAttempts > 0 && !isLockedOut && (
                <span className="text-amber-400 text-[10px]">
                  Failed: {failedAttempts}/5 attempts
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLockedOut}
                autoFocus
                placeholder="Enter master admin passcode..."
                className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3.5 text-sm font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-600 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {isLockedOut && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Anti-bruteforce lockout engaged. Retry in <strong>{lockoutRemainingSec}s</strong>.
              </span>
            </div>
          )}

          {errorMessage && !isLockedOut && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Access granted! Unlocking encrypted terminal...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onReturnToUserPortal}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>← Public User Portal</span>
            </button>

            <button
              type="submit"
              disabled={isLockedOut}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Authenticate & Enter</span>
            </button>
          </div>
        </form>

        {/* Footer Security Badges */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Cryptographic Protection</span>
          </div>
          <span>CASHMATRIX QUANTUM v5.0</span>
        </div>
      </div>
    </div>
  );
};
