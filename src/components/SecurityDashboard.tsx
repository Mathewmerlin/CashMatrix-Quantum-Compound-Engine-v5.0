import { useEffect, useState } from 'react';

const ADDRESSES = {
  vault: '0xeD862497CBb436dCAAE77FEba005c43d5f9448eb',
  timelock: '0xBa9F7EF5B23F65A691a98Ba52C69E1C423d9dA9C',
  multisig: '0x1b82CeDa055F4997897f02BefEb2893262E58638',
  keeper: '0x7fB437eb85563903e5d64cE750F939736E9257f7',
  deployer: '0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9',
};

const DEFAULT_RPC =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';

interface Props {
  account?: string | null;
  rpcUrl?: string;
}

interface Permission {
  label: string;
  granted: boolean;
}

interface Snapshot {
  block: string;
  checkedAt: string;
  paused: boolean;
  delay: string;
  configuredTimelock: string;
  configuredMultisig: string;
  keeperVault: string;
  permissions: Permission[];
  warnings: string[];
}

const sameAddress = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

function word(hex: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Unexpected contract response; check deployed bytecode and ABI.');
  }
  return hex.slice(2);
}

function decodeAddress(hex: string): string {
  const value = word(hex);
  if (!/^0{24}/.test(value)) {
    throw new Error('Invalid address returned by contract.');
  }
  return `0x${value.slice(24)}`;
}

function decodeBool(hex: string): boolean {
  const value = BigInt(`0x${word(hex)}`);
  if (value !== 0n && value !== 1n) {
    throw new Error('Invalid boolean returned by contract.');
  }
  return value === 1n;
}

function addressWord(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('Invalid account address.');
  }
  return address.slice(2).toLowerCase().padStart(64, '0');
}

export default function SecurityDashboard({
  account = null,
  rpcUrl = DEFAULT_RPC,
}: Props) {
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
        throw new Error('RPC returned an unexpected response.');
      }
      return body.result;
    }

    async function load() {
      setLoading(true);
      setError(null);
      setSnapshot(null);

      try {
        const chain = await rpc('eth_chainId', []);
        if (BigInt(chain) !== 97n) {
          throw new Error('Wrong RPC network. This dashboard requires chain 97.');
        }

        // Pin all contract reads to the same block.
        const block = await rpc('eth_blockNumber', []);

        await Promise.all(
          (['vault', 'timelock', 'multisig', 'keeper'] as const).map(
            async (name) => {
              const code = await rpc('eth_getCode', [ADDRESSES[name], block]);
              if (!/^0x[0-9a-fA-F]+$/.test(code) || code === '0x0') {
                throw new Error(`No contract bytecode found for ${name}.`);
              }
            },
          ),
        );

        const call = (to: string, data: string) =>
          rpc('eth_call', [{ to, data }, block]);

        const hasRole = async (
          contract: string,
          role: string,
          subject: string,
        ) => decodeBool(
          await call(
            contract,
            `0x91d14854${word(role)}${addressWord(subject)}`,
          ),
        );

        const [
          pausedHex, delayHex, timelockHex, multisigHex, keeperVaultHex,
          adminRole, strategistRole, guardianRole, vaultKeeperRole,
          proposerRole, executorRole, cancellerRole,
        ] = await Promise.all([
          call(ADDRESSES.vault, '0x5c975abb'),
          call(ADDRESSES.timelock, '0xf27a0c92'),
          call(ADDRESSES.vault, '0xd33219b4'),
          call(ADDRESSES.vault, '0x4783c35b'),
          call(ADDRESSES.keeper, '0xfbfa77cf'),
          call(ADDRESSES.vault, '0xa217fddf'),
          call(ADDRESSES.vault, '0xa378a324'),
          call(ADDRESSES.vault, '0x24ea54f4'),
          call(ADDRESSES.vault, '0x364bc15a'),
          call(ADDRESSES.timelock, '0x8f61f4f5'),
          call(ADDRESSES.timelock, '0x07bd0265'),
          call(ADDRESSES.timelock, '0xb08e51c0'),
        ]);

        const checks = [
          {
            label: 'Timelock has vault admin role',
            contract: ADDRESSES.vault,
            role: adminRole,
            subject: ADDRESSES.timelock,
          },
          {
            label: 'Keeper contract has vault keeper role',
            contract: ADDRESSES.vault,
            role: vaultKeeperRole,
            subject: ADDRESSES.keeper,
          },
          {
            label: 'Deployer retains vault admin role',
            contract: ADDRESSES.vault,
            role: adminRole,
            subject: ADDRESSES.deployer,
          },
          {
            label: 'Deployer retains vault strategist role',
            contract: ADDRESSES.vault,
            role: strategistRole,
            subject: ADDRESSES.deployer,
          },
          {
            label: 'Deployer retains vault guardian role',
            contract: ADDRESSES.vault,
            role: guardianRole,
            subject: ADDRESSES.deployer,
          },
          {
            label: 'Deployer retains timelock admin role',
            contract: ADDRESSES.timelock,
            role: adminRole,
            subject: ADDRESSES.deployer,
          },
          {
            label: 'Deployer can propose directly to timelock',
            contract: ADDRESSES.timelock,
            role: proposerRole,
            subject: ADDRESSES.deployer,
          },
          {
            label: 'Multisig has timelock proposer role',
            contract: ADDRESSES.timelock,
            role: proposerRole,
            subject: ADDRESSES.multisig,
          },
        ];

        if (account) {
          checks.push(
            {
              label: 'Selected account: vault guardian',
              contract: ADDRESSES.vault,
              role: guardianRole,
              subject: account,
            },
            {
              label: 'Selected account: timelock proposer',
              contract: ADDRESSES.timelock,
              role: proposerRole,
              subject: account,
            },
            {
              label: 'Selected account: timelock executor (direct role)',
              contract: ADDRESSES.timelock,
              role: executorRole,
              subject: account,
            },
            {
              label: 'Selected account: timelock canceller',
              contract: ADDRESSES.timelock,
              role: cancellerRole,
              subject: account,
            },
          );
        }

        const permissions = await Promise.all(
          checks.map(async (check) => ({
            label: check.label,
            granted: await hasRole(
              check.contract, check.role, check.subject,
            ),
          })),
        );

        const configuredTimelock = decodeAddress(timelockHex);
        const configuredMultisig = decodeAddress(multisigHex);
        const keeperVault = decodeAddress(keeperVaultHex);
        const delay = BigInt(`0x${word(delayHex)}`);
        const warnings: string[] = [];

        if (!sameAddress(configuredTimelock, ADDRESSES.timelock)) {
          warnings.push('Vault timelock getter does not match the expected deployment.');
        }
        if (!sameAddress(configuredMultisig, ADDRESSES.multisig)) {
          warnings.push('Vault multisig getter does not match the expected deployment.');
        }
        if (!sameAddress(keeperVault, ADDRESSES.vault)) {
          warnings.push('Keeper points to a different vault.');
        }
        if (delay < 172800n) {
          warnings.push('Timelock minimum delay is below 48 hours.');
        }
        if (!permissions[0].granted) {
          warnings.push('Expected timelock does not have the vault admin role.');
        }
        if (!permissions[1].granted) {
          warnings.push('Expected keeper is not authorized on the vault.');
        }
        if (permissions[2].granted || permissions[3].granted) {
          warnings.push('Deployer retains direct vault admin or strategist permissions.');
        }
        if (permissions[4].granted) {
          warnings.push('Deployer retains guardian permissions; review emergency authority.');
        }
        if (permissions[5].granted) {
          warnings.push('Deployer retains timelock administration permissions.');
        }
        if (permissions[6].granted) {
          warnings.push('Deployer can schedule directly; multisig approval is not enforced for that proposer.');
        }
        if (!permissions[7].granted) {
          warnings.push('Expected multisig does not have the timelock proposer role.');
        }

        if (active) {
          setSnapshot({
            block: BigInt(block).toString(),
            checkedAt: new Date().toLocaleString(),
            paused: decodeBool(pausedHex),
            delay: delay.toString(),
            configuredTimelock,
            configuredMultisig,
            keeperVault,
            permissions,
            warnings,
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Security reads failed.');
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
  }, [account, rpcUrl, refresh]);

  return (
    <section className="rounded-xl border border-cyan-900 bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-sm text-cyan-400">
            BSC Testnet · Chain 97 · Read-only
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="rounded border border-cyan-600 px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div role="alert" className="mb-4 rounded border border-red-700 p-4 text-red-300">
          {error}
          <p className="mt-2 text-sm">
            No security status is asserted while reads are failing.
          </p>
        </div>
      )}

      {loading && <p role="status">Reading contract state…</p>}

      {snapshot && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">Vault pause flag</p>
              <p className="text-lg font-semibold">
                {snapshot.paused ? 'Paused' : 'Not paused'}
              </p>
            </div>
            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">Timelock minimum delay</p>
              <p className="text-lg font-semibold">{snapshot.delay} seconds</p>
            </div>
            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">Snapshot block</p>
              <p className="text-lg font-semibold">{snapshot.block}</p>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold">Configuration checks</h3>
          <div className="mb-6 rounded border border-amber-800 p-4">
            {snapshot.warnings.length ? (
              <ul className="list-disc space-y-2 pl-5 text-amber-300">
                {snapshot.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>No warnings from these limited checks—not a security audit.</p>
            )}
          </div>

          <h3 className="mb-3 text-lg font-semibold">Observed permissions</h3>
          <ul className="mb-6 divide-y divide-slate-800">
            {snapshot.permissions.map((permission) => (
              <li key={permission.label} className="flex justify-between gap-4 py-3">
                <span>{permission.label}</span>
                <span className="font-mono">
                  {permission.granted ? 'Granted' : 'Not granted'}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 text-lg font-semibold">Contract pointers</h3>
          <dl className="space-y-3 text-sm">
            {[
              ['Vault', ADDRESSES.vault],
              ['Vault configured timelock', snapshot.configuredTimelock],
              ['Vault configured multisig', snapshot.configuredMultisig],
              ['Keeper configured vault', snapshot.keeperVault],
            ].map(([label, address]) => (
              <div key={label}>
                <dt className="text-slate-400">{label}</dt>
                <dd className="break-all font-mono">{address}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Checked {snapshot.checkedAt}. Refresh to obtain a new snapshot.
          </p>
        </>
      )}

      <p className="mt-6 text-sm text-slate-400">
        Checks cover selected addresses only, not all role holders, multisig
        thresholds, keeper process health, or contract safety. A configured
        multisig address alone does not prove multisig enforcement.
      </p>
    </section>
  );
}

