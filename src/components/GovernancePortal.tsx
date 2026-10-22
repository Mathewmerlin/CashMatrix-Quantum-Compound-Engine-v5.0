import { useEffect, useState } from 'react';

const TIMELOCK_ADDRESS =
  '0xBa9F7EF5B23F65A691a98Ba52C69E1C423d9dA9C';

const DEFAULT_RPC =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  rpcUrl?: string;
}

interface TimelockStatus {
  delaySeconds: string;
  block: string;
}

export default function GovernancePortal({ rpcUrl = DEFAULT_RPC }: Props) {
  const [status, setStatus] = useState<TimelockStatus | null>(null);
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

      if (!response.ok) {
        throw new Error(`RPC HTTP error ${response.status}`);
      }

      const body = await response.json();
      if (body.error) {
        throw new Error(body.error.message || 'RPC request failed.');
      }
      if (typeof body.result !== 'string') {
        throw new Error('Unexpected RPC response.');
      }
      return body.result;
    }

    async function load() {
      setLoading(true);
      setError(null);
      setStatus(null);

      try {
        const chainId = await rpc('eth_chainId', []);
        if (BigInt(chainId) !== 97n) {
          throw new Error('Wrong RPC network: BSC testnet chain 97 required.');
        }

        const block = await rpc('eth_blockNumber', []);
        const code = await rpc('eth_getCode', [TIMELOCK_ADDRESS, block]);

        if (!/^0x[0-9a-fA-F]+$/.test(code) || code === '0x0') {
          throw new Error('No timelock bytecode found at this address.');
        }

        // getMinDelay() selector from your supplied ABI.
        const result = await rpc('eth_call', [
          { to: TIMELOCK_ADDRESS, data: '0xf27a0c92' },
          block,
        ]);

        if (!/^0x[0-9a-fA-F]{64}$/.test(result)) {
          throw new Error('Invalid getMinDelay() response.');
        }

        if (active) {
          setStatus({
            delaySeconds: BigInt(result).toString(),
            block: BigInt(block).toString(),
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Timelock read failed.',
          );
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
          <h2 className="text-2xl font-bold">Governance Portal</h2>
          <p className="mt-1 text-sm text-cyan-400">
            BSC Testnet · Chain 97 · Read-only
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="rounded border border-cyan-700 px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </header>

      <div className="mt-6 rounded border border-slate-700 p-4">
        <h3 className="font-semibold">Minimum governance delay</h3>

        {loading && (
          <p role="status" className="mt-2">Reading timelock state…</p>
        )}

        {error && (
          <p role="alert" className="mt-2 text-red-300">
            {error} Delay is unknown while reads are failing.
          </p>
        )}

        {status && (
          <>
            <p className="mt-2 text-xl font-bold">
              {status.delaySeconds} seconds
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Snapshot block: {status.block}
            </p>
            {BigInt(status.delaySeconds) < 172800n && (
              <p className="mt-2 text-amber-300">
                Warning: minimum delay is below the intended 48 hours.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 rounded border border-amber-800 p-4">
        <h3 className="font-semibold text-amber-300">
          Proposal integration pending
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Operations are not loaded yet. This is not an assertion that no
          operations exist. Scheduling, cancellation, and execution controls
          will be connected after event tracking and permissions are implemented.
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        This component does not request wallet access, signatures, or transactions.
        A timelock delay alone does not enforce multisig approval.
      </p>

      <div className="mt-6 text-sm">
        <p className="text-slate-400">Timelock contract</p>
        <code className="break-all">{TIMELOCK_ADDRESS}</code>
      </div>
    </section>
  );
}
