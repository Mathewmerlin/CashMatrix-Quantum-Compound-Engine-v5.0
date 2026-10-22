import { useEffect, useState } from 'react';
import { DEPLOYED_CONTRACTS } from '../config/contracts';

const KEEPER_ADDRESS = DEPLOYED_CONTRACTS.omniGenesisMaster;
const CIRCUIT_BREAKER = DEPLOYED_CONTRACTS.vaultCircuitBreaker;
const DEFAULT_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  rpcUrl?: string;
}

interface KeeperSnapshot {
  vault: string;
  isPaused: boolean;
  isTripped: boolean;
  block: string;
}

export default function KeeperBotDashboard({ rpcUrl = DEFAULT_RPC }: Props) {
  const [snapshot, setSnapshot] = useState<KeeperSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let requestId = 0;

    async function rpc(method: string, params: unknown[]): Promise<string> {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: ++requestId,
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`RPC HTTP error ${response.status}`);
      const body = await response.json();
      if (body.error) throw new Error(body.error.message || 'RPC request failed.');
      return body.result;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const chainId = await rpc('eth_chainId', []);
        if (BigInt(chainId) !== 97n) {
          throw new Error('Wrong RPC network: BSC Testnet (Chain 97) required.');
        }

        const block = await rpc('eth_blockNumber', []);
        const callMaster = (data: string) => rpc('eth_call', [{ to: KEEPER_ADDRESS, data }, block]);
        const callCircuit = (data: string) => rpc('eth_call', [{ to: CIRCUIT_BREAKER, data }, block]);

        const [pausedHex, trippedHex] = await Promise.all([
          callMaster('0xb187bd26').catch(() => '0x00'), // isPaused()
          callCircuit('0x12d6a546').catch(() => '0x00'), // isEmergencyTripped()
        ]);

        const nextSnapshot: KeeperSnapshot = {
          vault: KEEPER_ADDRESS,
          isPaused: pausedHex !== '0x00' && pausedHex !== '0x' && BigInt(pausedHex) !== 0n,
          isTripped: trippedHex !== '0x00' && trippedHex !== '0x' && BigInt(trippedHex) !== 0n,
          block: BigInt(block).toString(),
        };

        if (active) setSnapshot(nextSnapshot);
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Keeper state read failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [rpcUrl, refresh]);

  return (
    <section className="rounded-xl border border-cyan-900 bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">OmniGenesis Keeper & Circuit Breaker</h2>
          <p className="mt-1 text-sm text-cyan-400">BSC Testnet · Chain 97 · Live Pointers</p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="rounded border border-cyan-700 px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Polling...' : 'Refresh'}
        </button>
      </header>

      {loading && <p role="status" className="mt-6 text-cyan-400">Reading contract states...</p>}

      {error && (
        <div role="alert" className="mt-6 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {snapshot && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded border border-slate-700 p-4">
            <h3 className="text-sm text-slate-400">Vault Contract</h3>
            <p className="mt-2 font-mono text-xs text-emerald-400 break-all">{snapshot.vault}</p>
          </div>

          <div className="rounded border border-slate-700 p-4">
            <h3 className="text-sm text-slate-400">Circuit Breaker</h3>
            <p className={`mt-2 font-semibold ${snapshot.isTripped ? 'text-red-400' : 'text-emerald-400'}`}>
              {snapshot.isTripped ? '⚠️ TRIPPED (HALTED)' : '✅ NORMAL (ACTIVE)'}
            </p>
          </div>

          <div className="rounded border border-slate-700 p-4">
            <h3 className="text-sm text-slate-400">Block Height</h3>
            <p className="mt-2 text-lg font-semibold">{snapshot.block}</p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded border border-emerald-800 p-4 bg-emerald-950/30">
        <h3 className="font-semibold text-emerald-400">Automation Engine Active</h3>
        <p className="mt-2 text-sm text-slate-300">
          PM2 Daemon <code className="text-cyan-300">cashmatrix-keeper</code> is running in background.
        </p>
      </div>
    </section>
  );
}
