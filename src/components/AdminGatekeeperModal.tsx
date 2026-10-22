import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Settings,
  X,
  Cpu,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { NavModule } from '../types';

interface AdminGatekeeperModalProps {
  onSuccessNavigate?: (module: NavModule) => void;
  onReturnToUserPortal?: () => void;
}

export const AdminGatekeeperModal: React.FC<AdminGatekeeperModalProps> = ({
  onSuccessNavigate,
  onReturnToUserPortal,
}) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    changePassword,
    targetModule,
    isLockedOut,
    lockoutRemainingSec,
    currentPasswordHint,
    failedAttempts,
  } = useAdminAuth();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Change password inputs
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Please enter the Admin passcode.');
      return;
    }

    const res = login(passwordInput.trim());
    if (res.success) {
      setErrorMessage(null);
      setSuccessMessage('Admin clearance verified. Decrypting protocol modules...');
      setTimeout(() => {
        setSuccessMessage(null);
        setPasswordInput('');
        if (targetModule && onSuccessNavigate) {
          onSuccessNavigate(targetModule);
        } else if (onSuccessNavigate) {
          onSuccessNavigate('terminal');
        }
      }, 400);
    } else {
      setErrorMessage(res.error || 'Authentication failed.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    setChangePassSuccess(null);

    if (newPassInput !== confirmPassInput) {
      setChangePassError('New passcodes do not match.');
      return;
    }

    const res = changePassword(oldPassInput, newPassInput);
    if (res.success) {
      setChangePassSuccess('Admin passcode updated successfully.');
      setOldPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      setTimeout(() => {
        setIsChangingPass(false);
        setChangePassSuccess(null);
      }, 1200);
    } else {
      setChangePassError(res.error || 'Failed to update passcode.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Outer Matrix Glass Frame */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#030712] border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/60 p-6 md:p-8 overflow-hidden text-slate-100">
        {/* Decorative Matrix Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

        {/* Close / Return X Button */}
        <button
          onClick={() => {
            closeAuthModal();
            if (onReturnToUserPortal) onReturnToUserPortal();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          title="Return to User Portal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 shrink-0">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800 uppercase tracking-widest font-bold">
                Restricted Admin Area
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                AUTH-L5
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white matrix-glow-green mt-1">
              Admin Operator Clearance
            </h2>
          </div>
        </div>

        {/* Description Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-1.5 mb-5">
          <p className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              The <strong>User Portal</strong> is publicly accessible. All advanced quant execution engines, terminal controls, private keys, and protocol treasury operations are restricted to authenticated admins.
            </span>
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Target Module:</span>
            <span className="text-emerald-400 uppercase font-semibold">
              {targetModule ? `${targetModule.toUpperCase()} ENGINE` : 'QUANTUM CONSOLE'}
            </span>
          </div>
        </div>

        {!isChangingPass ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                <span>CRYPTOGRAPHIC ADMIN PASSCODE</span>
                {failedAttempts > 0 && !isLockedOut && (
                  <span className="text-amber-400 text-[10px]">
                    Failed attempts: {failedAttempts}/5
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
                  placeholder="Enter admin passcode..."
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-600 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error or Lockout alerts */}
            {isLockedOut && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  Brute-force protection engaged. System locked for <strong>{lockoutRemainingSec}s</strong>.
                </span>
              </div>
            )}

            {errorMessage && !isLockedOut && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  if (onReturnToUserPortal) onReturnToUserPortal();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>User Portal</span>
              </button>

              <button
                type="submit"
                disabled={isLockedOut}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Verify & Unlock</span>
              </button>
            </div>

            {/* Change Passcode Accordion Trigger */}
            <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setIsChangingPass(true)}
                className="hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-3 h-3" />
                <span>Change Master Passcode</span>
              </button>
              <span className="font-mono text-[10px]">Session AES-256</span>
            </div>
          </form>
        ) : (
          /* Change Passcode Subform */
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Update Master Passcode</span>
              </span>
              <button
                type="button"
                onClick={() => setIsChangingPass(false)}
                className="text-[11px] font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Current Passcode
              </label>
              <input
                type="password"
                value={oldPassInput}
                onChange={(e) => setOldPassInput(e.target.value)}
                placeholder="Current passcode..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                New Passcode
              </label>
              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Minimum 4 characters..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Confirm New Passcode
              </label>
              <input
                type="password"
                value={confirmPassInput}
                onChange={(e) => setConfirmPassInput(e.target.value)}
                placeholder="Confirm new passcode..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {changePassError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {changePassError}
              </div>
            )}

            {changePassSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                {changePassSuccess}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChangingPass(false)}
                className="px-3 py-2 rounded-lg bg-slate-900 text-slate-300 text-xs font-mono"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono"
              >
                Save New Passcode
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
