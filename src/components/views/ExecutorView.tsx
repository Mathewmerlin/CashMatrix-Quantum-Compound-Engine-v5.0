import React, { useState } from 'react';
import {
  Server,
  Radio,
  Zap,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  Fuel,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { RelayerStatus } from '../../types';

interface ExecutorViewProps {
  relayers: RelayerStatus[];
  onPingRelayers: () => void;
  isPinging: boolean;
}

export const ExecutorView: React.FC<ExecutorViewProps> = ({
  relayers,
  onPingRelayers,
  isPinging,
}) => {
  const [testBundleTx, setTestBundleTx] = useState<string>('0x71c69826e7fe1997444a591ec37a509dadfb432d...rawTx');
  const [targetBlock, setTargetBlock] = useState<number>(21894310);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<{
    success: boolean;
    bundleHash: string;
    gasUsed: number;
    effectivePrice: string;
    profitSimulated: string;
  } | null>(null);

  const handleSimulateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimResult({
        success: true,
        bundleHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        gasUsed: 184520,
        effectivePrice: '14.2 Gwei',
        profitSimulated: '0.0482 ETH ($162.80)',
      });
    }, 900);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Executor Node & RPC Relayers
          </h2>
          <p className="text-xs text-slate-400">
            Private transaction routing via Flashbots Builder, Eden, and BeaverBuild
          </p>
        </div>

        <button
          onClick={onPingRelayers}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isPinging ? 'Measuring Latencies...' : 'Ping All Relayers'}</span>
        </button>
      </div>

      {/* Gas & Block Execution Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Target Block</span>
            <span className="text-emerald-400 text-[10px] font-mono">NEXT</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">#21,894,310</div>
          <span className="text-[11px] text-slate-500 font-mono">12s slot window</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Base Gas Fee</span>
            <Fuel className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">13.8 Gwei</div>
          <span className="text-[11px] text-slate-500 font-mono">EIP-1559 Elastic</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Priority Bribe</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">1.50 Gwei</div>
          <span className="text-[11px] text-slate-500 font-mono">Top of Block inclusion</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>MEV Inclusion Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">98.6%</div>
          <span className="text-[11px] text-slate-500 font-mono">0 reverted bundles</span>
        </div>
      </div>

      {/* Relayers Status Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Live Low-Latency RPC Relayers
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Parallel Multiplexing Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase bg-slate-950/40">
                <th className="py-3 px-4">Relayer / Builder</th>
                <th className="py-3 px-4">RPC Endpoint</th>
                <th className="py-3 px-4 text-right">Ping Latency</th>
                <th className="py-3 px-4 text-right">Gas Limit</th>
                <th className="py-3 px-4 text-right">Bundles Dispatched</th>
                <th className="py-3 px-4 text-right">Inclusion %</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {relayers.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{r.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {r.endpoint}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-cyan-300">
                    {r.latencyMs} ms
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {r.gasGwei} Gwei
                  </td>
                  <td className="py-3 px-4 text-right text-slate-200">
                    {r.bundlesSubmitted.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {r.successRate}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Private Flashbots Transaction Submitter & Simulator */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Flashbots Bundle Pre-Flight & Gas Estimator
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Pre-flight multi-transaction bundles against latest state trie to verify execution without risking front-running.
        </p>

        <form onSubmit={handleSimulateBundle} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Raw Transaction Payload / Bundle Spec</label>
              <input
                type="text"
                value={testBundleTx}
                onChange={(e) => setTestBundleTx(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Block Number</label>
              <input
                type="number"
                value={targetBlock}
                onChange={(e) => setTargetBlock(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSimulating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all font-sans"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating against State...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Validate &amp; Dispatch Bundle</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500">
              Verified across Flashbots, Titan, and Eden relay builder endpoints.
            </span>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/30 text-xs space-y-2 mt-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold font-sans">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Simulation Succeeded (Block #{targetBlock})
                </span>
                <span className="text-[11px] font-mono text-cyan-400">STATUS: INCLUDED</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Bundle Hash:</span>
                  <span className="text-slate-300 font-mono truncate block">{simResult.bundleHash.slice(0, 14)}...</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Gas Consumed:</span>
                  <span className="text-slate-300 font-mono">{simResult.gasUsed.toLocaleString()} units</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Effective Gas:</span>
                  <span className="text-cyan-300 font-mono">{simResult.effectivePrice}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Simulated Profit:</span>
                  <span className="text-emerald-400 font-bold font-mono">{simResult.profitSimulated}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
