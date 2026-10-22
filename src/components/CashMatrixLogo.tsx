import React from 'react';
import { Camera } from 'lucide-react';
import { useLogo } from '../context/LogoContext';

interface CashMatrixLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
  customLogoUrl?: string | null;
  editable?: boolean;
  onClick?: () => void;
}

export const CashMatrixLogo: React.FC<CashMatrixLogoProps> = ({
  size = 40,
  className = '',
  withGlow = true,
  customLogoUrl,
  editable = false,
  onClick,
}) => {
  // Try to use LogoContext if available
  let contextLogo: string | null = null;
  let openModal: (() => void) | undefined = undefined;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const logoCtx = useLogo();
    contextLogo = logoCtx.customLogo;
    openModal = logoCtx.openLogoModal;
  } catch {
    // Outside context fallback
  }

  const activeLogo = customLogoUrl !== undefined ? customLogoUrl : contextLogo;
  const handleClick = onClick || (editable && openModal ? openModal : undefined);

  return (
    <div
      onClick={handleClick}
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : undefined}
      title={handleClick ? 'Click to add / change logo' : undefined}
      className={`relative inline-flex items-center justify-center shrink-0 ${
        handleClick ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow */}
      {withGlow && (
        <div
          className="absolute inset-0 rounded-full bg-emerald-500/25 blur-md pointer-events-none transition-all duration-300 group-hover:blur-lg group-hover:bg-emerald-400/40"
          style={{ transform: 'scale(1.15)' }}
        />
      )}

      {/* If custom logo is set, display image without enclosing box */}
      {activeLogo ? (
        <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <img
            src={activeLogo}
            alt="CashMatrix Brand Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)] select-none"
          />
        </div>
      ) : (
        /* Default Quantitative SVG Vector Emblem */
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="cmGradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id="cmGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="50%" stopColor="#042f2e" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>

            <linearGradient id="cmGradientAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>

            <linearGradient id="cmShieldStroke" x1="20" y1="10" x2="100" y2="110">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>

            <filter id="cmNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Hexagonal Shield Container */}
          <polygon
            points="60,6 106,32 106,88 60,114 14,88 14,32"
            fill="url(#cmGradientDark)"
            stroke="url(#cmShieldStroke)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Matrix Circuit Guidelines */}
          <path
            d="M60,6 L60,114"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
          <path
            d="M14,32 L106,88"
            stroke="#06b6d4"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
          <path
            d="M14,88 L106,32"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />

          {/* Stylized "C" */}
          <path
            d="M74,34 L46,34 C36,34 28,42 28,52 L28,68 C28,78 36,86 46,86 L74,86"
            stroke="url(#cmGradientPrimary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cmNeonGlow)"
          />

          {/* Stylized "M" */}
          <path
            d="M44,72 L44,46 L60,63 L76,46 L76,72"
            stroke="url(#cmGradientAccent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Quantum Nexus Core */}
          <circle cx="60" cy="63" r="4.5" fill="#ecfeff" className="animate-pulse" />
          <circle cx="60" cy="63" r="8" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.7" />

          {/* Node Matrix Vertices */}
          <circle cx="60" cy="18" r="3" fill="#34d399" />
          <circle cx="94" cy="38" r="3" fill="#22d3ee" />
          <circle cx="94" cy="82" r="3" fill="#34d399" />
          <circle cx="60" cy="102" r="3" fill="#22d3ee" />
          <circle cx="26" cy="82" r="3" fill="#34d399" />
          <circle cx="26" cy="38" r="3" fill="#22d3ee" />
        </svg>
      )}

      {/* Editable Overlay Badge on hover */}
      {editable && (
        <div className="absolute inset-0 z-20 rounded-xl bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <Camera className="w-4 h-4 text-emerald-400 drop-shadow" />
        </div>
      )}
    </div>
  );
};
