import { useEffect, useState } from 'react';

const VAULT_ADDRESS =
  '0xeD862497CBb436dCAAE77FEba005c43d5f9448eb';

const DEFAULT_RPC =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  rpcUrl?: string;
}

interface PauseStatus {
  paused: boolean;
  block: string;
  checkedAt: string;
}

export default function EmergencyPause({ rpcUrl = DEFAULT_RPC }: Props) {
  const [status, setStatus] = useState<PauseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let requestId = 0;

    async function rpc(
      method: string,
      params: unknown[],
    ): Promise<string> {
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

    async function loadStatus() {
      setLoading(true);
      setError(null);
      setStatus(null);

      try {
        const chainId = await rpc('eth_chainId', []);

        if (BigInt(chainId) !== 97n) {
          throw new Error('Wrong network: this component requires BSC testnet.');
        }

        const block = await rpc('eth_blockNumber', []);
        const code = await rpc('eth_getCode', [VAULT_ADDRESS, block]);

        if (!/^0x[0-9a-fA-F]+$/.test(code) || code === '0x0') {
          throw new Error('No vault contract bytecode found at this address.');
        }

        // paused() selector from the ABI supplied in this conversation.
        const result = await rpc('eth_call', [
          {
            to: VAULT_ADDRESS,
            data: '0x5c975abb',
          },
          block,
        ]);

        if (!/^0x[0-9a-fA-F]{64}$/.test(result)) {
          throw new Error('Invalid paused() response from the vault.');
        }

        const value = BigInt(result);

        if (value !== 0n && value !== 1n) {
          throw new Error('Vault returned an invalid pause flag.');
        }

        if (active) {
          setStatus({
            paused: value === 1n,
            block: BigInt(block).toString(),
            checkedAt: new Date().toLocaleString(),
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Unable to read vault status.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStatus();

    return () => {
      active = false;
      controller.abort();
    };
  }, [rpcUrl, refresh]);

  return (
    <section className="rounded-xl border border-cyan-900 bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Emergency Controls</h2>
          <p className="mt-1 text-sm text-cyan-400">
            BSC Testnet · Chain 97 · Read-only status
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="rounded border border-cyan-700 px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Refresh status'}
        </button>
      </header>

      <div className="mt-6 rounded border border-slate-700 p-4">
        <h3 className="font-semibold">Vault pause flag</h3>

        {loading && (
          <p role="status" className="mt-2 text-slate-400">
            Reading contract state…
          </p>
        )}

        {error && (
          <div role="alert" className="mt-2 text-red-300">
            <p>{error}</p>
            <p className="mt-1 text-sm">
              Status is unknown while the read is failing.
            </p>
          </div>
        )}

        {status && (
          <>
            <p
              className={`mt-2 text-xl font-bold ${
                status.paused ? 'text-amber-300' : 'text-cyan-300'
              }`}
            >
              {status.paused ? 'PAUSED' : 'NOT PAUSED'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Block {status.block} · Checked {status.checkedAt}
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="rounded border border-red-800 px-4 py-2 opacity-50"
        >
          Emergency pause — not enabled
        </button>
        <button
          type="button"
          disabled
          className="rounded border border-slate-700 px-4 py-2 opacity-50"
        >
          Unpause — not enabled
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Transaction controls will be connected after reviewing the deployed
        contract's authorization rules. No signature or transaction is
        requested by this component.
      </p>

      <p className="mt-4 text-sm text-slate-400">
        This flag does not prove that every vault operation or off-chain
        keeper process is stopped. The contract implementation determines
        which operations the pause affects.
      </p>

      <div className="mt-6 text-sm">
        <p className="text-slate-400">Vault contract</p>
        <code className="break-all">{VAULT_ADDRESS}</code>
      </div>
    </section>
  );
}
