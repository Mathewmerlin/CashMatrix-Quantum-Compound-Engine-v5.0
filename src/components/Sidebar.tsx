import React from 'react';
import {
  Terminal,
  LineChart,
  ArrowLeftRight,
  TrendingUp,
  Cpu,
  Server,
  Vault,
  Wallet,
  Activity,
  FileText,
  KeyRound,
  Radio,
  Sparkles,
  Users,
  Shield,
  Lock,
  Unlock,
  Camera,
} from 'lucide-react';
import { NavModule, AdminUserMetrics } from '../types';
import { useLogs } from '../context/LogContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useLogo } from '../context/LogoContext';
import { CashMatrixLogo } from './CashMatrixLogo';

interface SidebarProps {
  currentModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  isAutoCompounding: boolean;
  environment: string;
  cycleCount: number;
  metrics?: AdminUserMetrics;
}

const NAV_ITEMS: {
  id: NavModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: 'INVESTOR' | 'MANAGER';
}[] = [
  { id: 'investor', label: 'Investor Portal', icon: Sparkles, section: 'INVESTOR' },
  { id: 'terminal', label: 'Terminal Hub', icon: Terminal, section: 'MANAGER' },
  { id: 'charts', label: 'Quant Charts', icon: LineChart, section: 'MANAGER' },
  { id: 'trades', label: 'Live Trades', icon: ArrowLeftRight, section: 'MANAGER' },
  { id: 'positions', label: 'Positions', icon: TrendingUp, section: 'MANAGER' },
  { id: 'strategies', label: 'Strategies', icon: Cpu, section: 'MANAGER' },
  { id: 'executor', label: 'Executor Node', icon: Server, section: 'MANAGER' },
  { id: 'vault', label: 'Vault Matrix', icon: Vault, section: 'MANAGER' },
  { id: 'wallet', label: 'Wallet Core', icon: Wallet, section: 'MANAGER' },
  { id: 'metrics', label: 'Telemetry', icon: Activity, section: 'MANAGER' },
  { id: 'logs', label: 'System Logs', icon: FileText, section: 'MANAGER' },
  { id: 'secrets', label: 'Key Vault', icon: KeyRound, section: 'MANAGER' },
  { id: 'institutional', label: 'Institutional', icon: Shield, section: 'MANAGER' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isAutoCompounding,
  environment,
  cycleCount,
  metrics,
}) => {
  const { unreadErrorCount } = useLogs();
  const { isAdminAuthenticated, openAuthModal, logout } = useAdminAuth();
  const { openLogoModal, customLogo } = useLogo();
  const isInvestorView = currentModule === 'investor';

  const handleManagerItemClick = (target: NavModule) => {
    if (isAdminAuthenticated) {
      onSelectModule(target);
    } else {
      openAuthModal(target);
    }
  };

  return (
    <aside className="w-[250px] shrink-0 sticky top-0 h-screen bg-[#020617] border-r border-emerald-500/20 flex flex-col justify-between z-30 select-none font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <CashMatrixLogo size={38} withGlow={true} editable={true} />
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-white truncate">
                CashMatrix
              </h1>
              <p className="text-[11px] font-mono text-emerald-400 font-medium tracking-wider">
                BSC TESTNET (97)
              </p>
            </div>
          </div>
          <button
            onClick={openLogoModal}
            title={customLogo ? 'Change brand logo' : 'Add your logo'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all shrink-0 group"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* Dual Panel Switcher Toggle */}
        <div className="mt-4 p-1 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 text-[11px] font-mono">
          <button
            onClick={() => onSelectModule('investor')}
            className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
              isInvestorView
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Investor</span>
          </button>
          <button
            onClick={() => handleManagerItemClick('terminal')}
            className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
              !isInvestorView
                ? 'bg-slate-800 text-emerald-300 shadow-md border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAdminAuthenticated ? (
              <Cpu className="w-3 h-3 text-emerald-400" />
            ) : (
              <Lock className="w-3 h-3 text-amber-400" />
            )}
            <span>Manager</span>
          </button>
        </div>

        {/* Admin Session Status Indicator (Only when in Manager view) */}
        {!isInvestorView && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-1.5">
              {isAdminAuthenticated ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Admin Auth Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-slate-400">Admin Locked</span>
                </>
              )}
            </div>
            {isAdminAuthenticated ? (
              <button
                onClick={logout}
                className="text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                title="Lock Admin Session"
              >
                Lock
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('terminal')}
                className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-bold"
                title="Enter Admin Passcode"
              >
                Login
              </button>
            )}
          </div>
        )}

        {/* Engine Live Status Bar */}
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoCompounding
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              {isAutoCompounding ? 'BOT TRADING' : 'STANDBY'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900">
            TESTNET
          </span>
        </div>
      </div>

      {/* Navigation Links (Conditionally Renders Manager Console) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="pb-1">
          <button
            onClick={() => onSelectModule('investor')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              isInvestorView
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'text-emerald-400 hover:bg-emerald-950/30 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="truncate">Investor Portal</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              PUBLIC
            </span>
          </button>
        </div>

        {/* Manager Console items ONLY render if user has switched away from investor view */}
        {!isInvestorView && (
          <>
            <div className="pt-2 pb-1 text-[10px] font-mono uppercase text-slate-500 px-3 tracking-wider flex items-center justify-between">
              <span>Manager Console</span>
              {!isAdminAuthenticated && (
                <span className="text-[9px] text-amber-400 flex items-center gap-0.5 font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  <span>PROTECTED</span>
                </span>
              )}
            </div>

            {NAV_ITEMS.filter((i) => i.id !== 'investor').map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleManagerItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isAdminAuthenticated && (
                      <Lock className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    )}

                    {item.id === 'terminal' && isAutoCompounding && (
  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
    #{cycleCount}
  </span>
)}

                    {item.id === 'vault' && metrics && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {metrics.totalUserCount}u
                      </span>
                    )}

                    {item.id === 'logs' && unreadErrorCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                        {unreadErrorCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-slate-800/70 bg-slate-950/60 space-y-2">
        {!isInvestorView && isAdminAuthenticated && metrics && (
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>USERS:</span>
              </span>
              <span className="text-emerald-300 font-bold">{metrics.totalUserCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Vault className="w-3 h-3 text-emerald-400" />
                <span>DEPOSITS:</span>
              </span>
              <span className="text-emerald-400 font-bold">${(metrics.totalDepositAmount / 1000).toFixed(0)}k</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>BSC Testnet Relay</span>
          </span>
          <span className="text-emerald-400 text-[10px]">12ms</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>GAS: 10 Gwei</span>
          <span>CHAIN: 97</span>
        </div>
      </div>
    </aside>
  );
};
