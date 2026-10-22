import { useEffect, useState } from 'react';

const VAULT_ADDRESS =
  '0xeD862497CBb436dCAAE77FEba005c43d5f9448eb';

const DEFAULT_RPC =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  rpcUrl?: string;
}

interface Snapshot {
  block: string;
  asset: string;
  totalAssets: string;
  totalShares: string;
  allocatedAssets: string;
  assetDecimals: number;
  shareDecimals: number;
}

function decodeUint(hex: string): bigint {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Unexpected contract response.');
  }
  return BigInt(hex);
}

function decodeAddress(hex: string): string {
  decodeUint(hex);
  if (!/^0x0{24}[0-9a-fA-F]{40}$/.test(hex)) {
    throw new Error('Invalid asset address returned by vault.');
  }
  return `0x${hex.slice(-40)}`;
}

function decodeDecimals(hex: string): number {
  const value = decodeUint(hex);
  if (value > 255n) throw new Error('Invalid token decimals.');
  return Number(value);
}

// Preserve integer precision; do not convert token balances to Number.
function formatUnits(raw: bigint, decimals: number): string {
  if (decimals === 0) return raw.toString();

  const digits = raw.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, -decimals);
  const fraction = digits.slice(-decimals).replace(/0+$/, '');

  return fraction ? `${whole}.${fraction}` : whole;
}

export default function VaultAnalytics({ rpcUrl = DEFAULT_RPC }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
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
      setSnapshot(null);

      try {
        const chainId = await rpc('eth_chainId', []);
        if (BigInt(chainId) !== 97n) {
          throw new Error('Wrong RPC network: BSC testnet chain 97 required.');
        }

        const block = await rpc('eth_blockNumber', []);
        const code = await rpc('eth_getCode', [VAULT_ADDRESS, block]);

        if (!/^0x[0-9a-fA-F]+$/.test(code) || code === '0x0') {
          throw new Error('No vault bytecode found at this address.');
        }

        const call = (to: string, data: string) =>
          rpc('eth_call', [{ to, data }, block]);

        // Function selectors from your supplied vault ABI.
        const [
          assetHex,
          totalAssetsHex,
          totalSupplyHex,
          allocatedHex,
          shareDecimalsHex,
        ] = await Promise.all([
          call(VAULT_ADDRESS, '0x38d52e0f'), // asset()
          call(VAULT_ADDRESS, '0x01e1d114'), // totalAssets()
          call(VAULT_ADDRESS, '0x18160ddd'), // totalSupply()
          call(VAULT_ADDRESS, '0x35657d98'), // totalAllocatedToStrategies()
          call(VAULT_ADDRESS, '0x313ce567'), // decimals()
        ]);

        const asset = decodeAddress(assetHex);
        const assetDecimals = decodeDecimals(
          await call(asset, '0x313ce567'),
        );
        const shareDecimals = decodeDecimals(shareDecimalsHex);

        const nextSnapshot: Snapshot = {
          block: BigInt(block).toString(),
          asset,
          totalAssets: formatUnits(
            decodeUint(totalAssetsHex), assetDecimals,
          ),
          totalShares: formatUnits(
            decodeUint(totalSupplyHex), shareDecimals,
          ),
          allocatedAssets: formatUnits(
            decodeUint(allocatedHex), assetDecimals,
          ),
          assetDecimals,
          shareDecimals,
        };

        if (active) setSnapshot(nextSnapshot);
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Vault reads failed.',
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
          <h2 className="text-2xl font-bold">Vault Analytics</h2>
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

      {loading && (
        <p role="status" className="mt-6">Reading vault metrics…</p>
      )}

      {error && (
        <div role="alert" className="mt-6 text-red-300">
          <p>{error}</p>
          <p className="mt-1 text-sm">
            Metrics are unavailable while reads are failing.
          </p>
        </div>
      )}

      {snapshot && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['Contract-reported total assets', snapshot.totalAssets, 'asset tokens'],
              ['Total share supply', snapshot.totalShares, 'vault shares'],
              ['Contract-reported strategy allocation', snapshot.allocatedAssets, 'asset tokens'],
            ].map(([label, value, unit]) => (
              <div key={label} className="rounded border border-slate-700 p-4">
                <h3 className="text-sm text-slate-400">{label}</h3>
                <p className="mt-2 break-all text-lg font-semibold">{value}</p>
                <p className="text-sm text-slate-400">{unit}</p>
              </div>
            ))}
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Underlying asset contract</dt>
              <dd className="break-all font-mono">{snapshot.asset}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Token decimals</dt>
              <dd>
                Asset: {snapshot.assetDecimals} · Shares: {snapshot.shareDecimals}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Snapshot block</dt>
              <dd>{snapshot.block}</dd>
            </div>
          </dl>
        </>
      )}

      <div className="mt-6 rounded border border-amber-800 p-4">
        <h3 className="font-semibold text-amber-300">
          Historical analytics not connected
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          No APY, USD valuation, performance changes, or historical charts
          are asserted. These require additional verified data sources.
          Contract-reported balances are not an independent asset audit.
        </p>
      </div>

      <div className="mt-6 text-sm">
        <p className="text-slate-400">Vault contract</p>
        <code className="break-all">{VAULT_ADDRESS}</code>
      </div>
    </section>
  );
}
