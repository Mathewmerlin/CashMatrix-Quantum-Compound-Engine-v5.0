import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { useLogo } from '../context/LogoContext';
import { CashMatrixLogo } from './CashMatrixLogo';
import { matrixAudio } from '../utils/matrixAudio';

export const LogoUploadModal: React.FC = () => {
  const {
    customLogo,
    setCustomLogo,
    resetLogo,
    isLogoModalOpen,
    closeLogoModal,
    uploadLogoFile,
    logoError,
    setLogoError,
  } = useLogo();

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [tempPreview, setTempPreview] = useState<string | null>(customLogo);
  const [isDragging, setIsDragging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync temp preview when modal opens or customLogo changes
  React.useEffect(() => {
    if (isLogoModalOpen) {
      setTempPreview(customLogo);
      setSaveSuccess(false);
      setLogoError(null);
    }
  }, [isLogoModalOpen, customLogo, setLogoError]);

  if (!isLogoModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await uploadLogoFile(file);
    if (success) {
      // Re-read file as preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempPreview(event.target?.result as string);
        setSaveSuccess(true);
        matrixAudio.playBeep(880, 0.08);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const success = await uploadLogoFile(file);
    if (success) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempPreview(event.target?.result as string);
        setSaveSuccess(true);
        matrixAudio.playBeep(880, 0.08);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setLogoError('Please enter a valid image URL');
      return;
    }
    // Test image load
    const img = new Image();
    img.onload = () => {
      setCustomLogo(urlInput.trim());
      setTempPreview(urlInput.trim());
      setSaveSuccess(true);
      setLogoError(null);
      matrixAudio.playBeep(880, 0.08);
    };
    img.onerror = () => {
      setLogoError('Unable to load image from this URL. Please verify the link.');
    };
    img.src = urlInput.trim();
  };

  const handleResetToDefault = () => {
    resetLogo();
    setTempPreview(null);
    setUrlInput('');
    setSaveSuccess(true);
    matrixAudio.playBeep(520, 0.08);
  };

  const handleSelectPreset = (svgDataUri: string) => {
    setCustomLogo(svgDataUri);
    setTempPreview(svgDataUri);
    setSaveSuccess(true);
    matrixAudio.playBeep(880, 0.08);
  };

  // Sample sleek preset brand marks
  const PRESET_LOGOS = [
    {
      id: 'neon-matrix',
      name: 'Cyber Emerald Apex',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M50 15 L85 50 L50 85 L15 50 Z" stroke="%2310b981" stroke-width="6" fill="%23064e3b"/><circle cx="50" cy="50" r="14" fill="%2334d399"/><path d="M35 50 L65 50 M50 35 L50 65" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'hyper-cyan',
      name: 'Quantum Hyper-Node',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="32" stroke="%2306b6d4" stroke-width="5" stroke-dasharray="10 6"/><polygon points="50,25 72,68 28,68" stroke="%2322d3ee" stroke-width="5" fill="%230e7490"/><circle cx="50" cy="54" r="7" fill="%23ecfeff"/></svg>`,
    },
    {
      id: 'gold-fusion',
      name: 'Sovereign Aurum Vault',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M25 35 L50 20 L75 35 L75 65 L50 80 L25 65 Z" stroke="%23f59e0b" stroke-width="5" fill="%2378350f"/><path d="M40 50 L50 40 L60 50 L50 60 Z" fill="%23fbbf24"/></svg>`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/40 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Add / Update Brand Logo
                {customLogo && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Custom Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Replace the top-left sidebar icon with your custom institutional logo
              </p>
            </div>
          </div>
          <button
            onClick={closeLogoModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-slate-300">Live Preview:</span>
            <span className="text-slate-500 text-[11px]">(Top-Left Sidebar display)</span>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <CashMatrixLogo
              size={36}
              withGlow={true}
              customLogoUrl={tempPreview}
            />
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white tracking-tight leading-tight">
                CashMatrix
              </div>
              <div className="text-[10px] font-mono text-emerald-400 tracking-wider">
                QUANTUM FUSION v5.0
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-2 bg-slate-950/30">
          <button
            onClick={() => {
              setActiveTab('upload');
              setLogoError(null);
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            onClick={() => {
              setActiveTab('url');
              setLogoError(null);
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Image URL
          </button>
          <button
            onClick={() => {
              setActiveTab('presets');
              setLogoError(null);
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated Styles
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {logoError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{logoError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Logo applied successfully! Saved permanently.</span>
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/x-icon"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950/30">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Click to browse or drag & drop your logo here
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Supports PNG, SVG, JPG, WEBP, or GIF. Transparent PNG or SVG recommended for best presentation.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Select File from Computer
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Paste Direct Logo Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/logo.png or /logo.svg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors shrink-0"
                >
                  Load & Apply
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Provide an accessible image URL (e.g., hosted on GitHub, Imgur, AWS S3, or relative path).
              </p>
            </div>
          )}

          {/* TAB 3: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select one of our high-resolution institutional badge styles:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.svg)}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-400/60 transition-all flex flex-col items-center gap-2 group text-center"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 group-hover:scale-105 transition-transform">
                      <img
                        src={preset.svg}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-emerald-300">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default Logo
          </button>

          <button
            onClick={closeLogoModal}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
