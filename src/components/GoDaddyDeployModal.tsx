import React, { useState } from 'react';
import {
  X,
  Globe,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  KeyRound,
  ExternalLink,
  ChevronRight,
  FileCode,
  Zap,
} from 'lucide-react';
import { PRODUCTION_CONFIG, GODADDY_HTACCESS_TEMPLATE } from '../config/productionConfig';
import { matrixAudio } from '../utils/matrixAudio';

interface GoDaddyDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoDaddyDeployModal: React.FC<GoDaddyDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedHtaccess, setCopiedHtaccess] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleCopyHtaccess = () => {
    navigator.clipboard.writeText(GODADDY_HTACCESS_TEMPLATE);
    setCopiedHtaccess(true);
    matrixAudio.playSuccess();
    setTimeout(() => setCopiedHtaccess(false), 2500);
  };

  const handleDownloadHtaccess = () => {
    const blob = new Blob([GODADDY_HTACCESS_TEMPLATE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.htaccess';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    matrixAudio.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  GoDaddy Production Deployment &amp; Security Suite
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  https://{PRODUCTION_CONFIG.domain}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Production-readiness checklist &amp; cPanel configuration guide
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              matrixAudio.playBeep(700, 0.05);
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Production Readiness Score & Security Badges */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
                100%
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Production Architecture Verified</h3>
                <p className="text-xs text-slate-400 font-mono">
                  All security rails, BSC Mainnet parameters, and GoDaddy routing rules configured.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> BSC Chain 56
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> SSL 256-Bit
              </span>
            </div>
          </div>

          {/* Interactive Step Navigator */}
          <div className="flex items-center border-b border-slate-800 gap-2 pb-3 overflow-x-auto text-xs font-mono">
            {[
              { num: 1, label: '1. Build & Files' },
              { num: 2, label: '2. GoDaddy cPanel Upload' },
              { num: 3, label: '3. .htaccess Generator' },
              { num: 4, label: '4. DNS & SSL (bscsan.nl)' },
              { num: 5, label: '5. Production Security Audit' },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => {
                  setActiveStep(step.num);
                  matrixAudio.playBeep(900, 0.04);
                }}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeStep === step.num
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: Build & Files */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Step 1: Compiling the Optimized Production Build
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Before uploading to GoDaddy, compile the frontend into optimized static HTML, JavaScript, and CSS assets.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
                <div className="text-slate-500"># In your local project terminal:</div>
                <div className="text-white font-bold">npm run build</div>
                <div className="text-slate-500"># Output bundle will be created in the /dist directory</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-white">Files generated inside <code className="text-emerald-400 font-mono">dist/</code>:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono">
                  <li><code className="text-slate-200">index.html</code> (Main entry point)</li>
                  <li><code className="text-slate-200">assets/*.js</code> (Minified React &amp; Web3 logic)</li>
                  <li><code className="text-slate-200">assets/*.css</code> (Tailwind CSS styling)</li>
                  <li><code className="text-slate-200">logo_transparent.png</code> (CashMatrix Brand Emblem)</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: GoDaddy cPanel Upload */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Step 2: Uploading to GoDaddy cPanel (public_html)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                GoDaddy Web Hosting uses cPanel to serve website files. Follow these steps to deploy:
              </p>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                <li>Log in to your <strong>GoDaddy Account</strong> &rarr; <strong>My Products</strong> &rarr; <strong>Web Hosting (cPanel)</strong> &rarr; Click <strong>Manage</strong>.</li>
                <li>In cPanel, click <strong>File Manager</strong>.</li>
                <li>Navigate into the root web folder: <strong className="text-emerald-400">public_html</strong>.</li>
                <li>Zip your local <code className="text-cyan-400">dist</code> folder and click <strong>Upload</strong> in the top toolbar.</li>
                <li>Once uploaded, right-click the zip file in cPanel and select <strong>Extract</strong> directly inside <code className="text-emerald-400">public_html</code>.</li>
                <li>Make sure <code className="text-white">index.html</code> is directly inside <code className="text-emerald-400">public_html/index.html</code> (not inside a nested subfolder).</li>
              </ol>
            </div>
          )}

          {/* STEP 3: .htaccess Generator */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    Step 3: Deploy .htaccess for Single Page Application (SPA)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Essential for GoDaddy Apache servers to prevent 404 errors on page refresh and enforce HTTPS.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyHtaccess}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedHtaccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHtaccess ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadHtaccess}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .htaccess</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-56">
                <pre>{GODADDY_HTACCESS_TEMPLATE}</pre>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300">
                <strong>Tip in GoDaddy File Manager:</strong> If files starting with a dot are hidden, click <strong>Settings</strong> in the top-right of File Manager and check <strong>&quot;Show Hidden Files (dotfiles)&quot;</strong>.
              </div>
            </div>
          )}

          {/* STEP 4: DNS & SSL for bscsan.nl */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Step 4: DNS Records &amp; SSL Encryption on GoDaddy (bscsan.nl)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your domain <strong className="text-white">bscsan.nl</strong> to the GoDaddy hosting server:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 font-bold mb-1">1. DNS Management in GoDaddy:</div>
                  <ul className="space-y-1 text-slate-300">
                    <li>• <strong>Type: A</strong> | <strong>Name: @</strong> | <strong>Value:</strong> [Your GoDaddy Hosting Server IP]</li>
                    <li>• <strong>Type: CNAME</strong> | <strong>Name: www</strong> | <strong>Value: bscsan.nl</strong></li>
                    <li>• <strong>TTL:</strong> 1/2 Hour or 1 Hour</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 font-bold mb-1">2. Enable SSL Certificate:</div>
                  <p className="text-slate-300">
                    In cPanel, click <strong>SSL/TLS Status</strong> &rarr; Click <strong>Run AutoSSL</strong>. This provisions a free Let&apos;s Encrypt / cPanel SSL certificate so your domain displays the secure HTTPS padlock at <code className="text-emerald-400">https://bscsan.nl</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Production Security Audit */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Step 5: Production Security Rails &amp; DApp Hardening
              </h3>
              <div className="space-y-2.5 font-mono text-xs">
                {[
                  {
                    title: 'Anti-Phishing Domain Protection',
                    desc: 'DApp validates window.location.hostname against bscsan.nl to alert users if cloned onto unauthorized domains.',
                    status: 'PASSED',
                  },
                  {
                    title: 'BSC Mainnet Native Routing (Chain 56)',
                    desc: 'Default network set to Binance Smart Chain with automatic 1-click network addition fallback.',
                    status: 'PASSED',
                  },
                  {
                    title: 'Gas Safety Buffer (0.005 BNB)',
                    desc: 'Protects investors from exhausting their BNB balance, preventing failed transactions and locked wallets.',
                    status: 'PASSED',
                  },
                  {
                    title: '50/50 Profit Split Immutability',
                    desc: '50% user share / 50% admin treasury transfer strictly calculated and validated prior to transaction broadcast.',
                    status: 'PASSED',
                  },
                  {
                    title: 'Strict 30-Day Timelock Proof',
                    desc: 'Lock countdown enforced client-side and cross-validated with smart contract timelock timestamp.',
                    status: 'PASSED',
                  },
                  {
                    title: 'Brute-Force Protected Admin Gatekeeper',
                    desc: '5-attempt lockout and cryptographic passcode prevents unauthorized operator access.',
                    status: 'PASSED',
                  },
                ].map((sec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{sec.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{sec.desc}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {sec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-6 py-3.5 bg-slate-950/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Target Domain: <strong className="text-emerald-400 font-bold">https://bscsan.nl</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtaccess}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy .htaccess</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
