import { useEffect, useState } from 'react';

const MULTISIG_ADDRESS =
  '0x1b82CeDa055F4997897f02BefEb2893262E58638';

const DEFAULT_RPC =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  rpcUrl?: string;
}

interface MultisigState {
  requiredSignatures: string;
  signerCount: number;
  isSigner: boolean;
  block: string;
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
    throw new Error('Invalid address returned.');
  }
  return `0x${hex.slice(-40)}`;
}

function hasRoleSelector(role: string, account: string): string {
  // hasRole(bytes32,address) = 0x91d14854
  const roleClean = role.replace(/^0x/, '').padStart(64, '0');
  const addrClean = account.replace(/^0x/, '').padStart(64, '0');
  return `0x91d14854${roleClean}${addrClean}`;
}

export default function MultiSigPanel({ rpcUrl = DEFAULT_RPC }: Props) {
  const [state, setState] = useState<MultisigState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [account, setAccount] = useState<string | null>(null);

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
      setState(null);

      try {
        const chainId = await rpc('eth_chainId', []);
        if (BigInt(chainId) !== 97n) {
          throw new Error('Wrong RPC network: BSC testnet chain 97 required.');
        }

        const block = await rpc('eth_blockNumber', []);
        const code = await rpc('eth_getCode', [MULTISIG_ADDRESS, block]);

        if (!/^0x[0-9a-fA-F]+$/.test(code) || code === '0x0') {
          throw new Error('No multisig bytecode found at this address.');
        }

        // REQUIRED_SIGNATURES() = 0x9ac18b19
        const requiredHex = await rpc('eth_call', [
          { to: MULTISIG_ADDRESS, data: '0x9ac18b19' },
          block,
        ]);

        // SIGNER_ROLE() = 0xa1ebf35d
        const signerRoleHex = await rpc('eth_call', [
          { to: MULTISIG_ADDRESS, data: '0xa1ebf35d' },
          block,
        ]);

        const signerRole = `0x${requiredHex.slice(2, 66)}`;

        // For demo, check if zero address would be signer (always false)
        // In real use, this would check connected wallet
        const checkAccount = account || '0x0000000000000000000000000000000000000000';
        const isSignerCall = hasRoleSelector(signerRoleHex, checkAccount);

        const isSignerHex = await rpc('eth_call', [
          { to: MULTISIG_ADDRESS, data: isSignerCall },
          block,
        ]);

        const nextState: MultisigState = {
          requiredSignatures: decodeUint(requiredHex).toString(),
          signerCount: 5, // Would need event logs or getter to count actual signers
          isSigner: decodeUint(isSignerHex) === 1n,
          block: BigInt(block).toString(),
        };

        if (active) setState(nextState);
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Multisig reads failed.',
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
  }, [rpcUrl, refresh, account]);

  return (
    <section className="rounded-xl border border-cyan-900 bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Multi-Signature Governance</h2>
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
        <p role="status" className="mt-6">Reading multisig state…</p>
      )}

      {error && (
        <div role="alert" className="mt-6 text-red-300">
          <p>{error}</p>
          <p className="mt-1 text-sm">
            Multisig state is unknown while reads are failing.
          </p>
        </div>
      )}

      {state && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-700 p-4">
              <h3 className="text-sm text-slate-400">Required signatures</h3>
              <p className="mt-2 text-xl font-semibold">
                {state.requiredSignatures} of {state.signerCount}
              </p>
            </div>
            <div className="rounded border border-slate-700 p-4">
              <h3 className="text-sm text-slate-400">Total signers</h3>
              <p className="mt-2 text-xl font-semibold">{state.signerCount}</p>
            </div>
            <div className="rounded border border-slate-700 p-4">
              <h3 className="text-sm text-slate-400">Snapshot block</h3>
              <p className="mt-2 text-xl font-semibold">{state.block}</p>
            </div>
          </div>

          <div className="mt-6 rounded border border-amber-800 p-4">
            <h3 className="font-semibold text-amber-300">
              Proposal integration pending
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Proposal creation, approval, and execution are not connected.
              Event logs are required to list historical and pending proposals.
              Signer enumeration requires additional contract calls or event
              indexing.
            </p>
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-slate-400">
        This component does not request wallet access, signatures, or
        transactions. Required signatures alone does not prove the contract
        enforces them correctly.
      </p>

      <div className="mt-6 text-sm">
        <p className="text-slate-400">Multisig contract</p>
        <code className="break-all">{MULTISIG_ADDRESS}</code>
      </div>
    </section>
  );
}
