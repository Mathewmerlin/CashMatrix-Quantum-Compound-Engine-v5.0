import { useState, useEffect, useCallback, useRef } from 'react';
import { PRODUCTION_CONFIG } from '../config/productionConfig';
import { DEPLOYED_CONTRACTS } from '../config/contracts';

export const SUPPORTED_NETWORKS: Record<
  string,
  { name: string; symbol: string; rpcUrl: string; blockExplorer: string; chainIdDec: number }
> = {
  '0x61': {
    name: 'BNB Smart Chain Testnet',
    symbol: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com',
    chainIdDec: 97,
  },
  '0x38': {
    name: 'BNB Smart Chain Mainnet',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    chainIdDec: 56,
  },
};

export interface TokenBalances {
  BNB: string;
  USDT: string;
  USDC: string;
}

interface UseWeb3Options {
  onLogInfo?: (msg: string, details?: any) => void;
  onLogWarn?: (msg: string, details?: any) => void;
  onLogError?: (msg: string, err?: any, details?: any) => void;
}

function padAddress(addr: string): string {
  const clean = addr.toLowerCase().replace(/^0x/, '');
  return clean.padStart(64, '0');
}

function padUint256(amountBigInt: bigint): string {
  return amountBigInt.toString(16).padStart(64, '0');
}

export function useWeb3(options?: UseWeb3Options) {
  const [account, setAccount] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0.0000');
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>({
    BNB: '0.0000',
    USDT: '0.00',
    USDC: '0.00',
  });
  const [network, setNetwork] = useState<string>('BNB Smart Chain Testnet (0x61)');
  const [chainId, setChainId] = useState<string>('0x61');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean>(false);
  const [authSignature, setAuthSignature] = useState<string | null>(null);
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>(0);
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(3.0);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Stable provider check on mount only
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        setHasProvider(true);
      } else {
        setHasProvider(false);
      }
    } catch (err: any) {
      optionsRef.current?.onLogError?.('Exception during Web3 provider detection', err);
    }
  }, []);

  const formatBalanceFromHex = (hexBalance: string, decimals = 18, precision = 4): string => {
    try {
      if (!hexBalance || hexBalance === '0x' || hexBalance === '0x0') return '0.0000';
      const cleanHex = hexBalance.startsWith('0x') ? hexBalance : `0x${hexBalance}`;
      const weiBigInt = BigInt(cleanHex);
      const divisor = BigInt(10 ** Math.max(0, decimals - precision));
      const rounded = Number(weiBigInt / divisor) / 10 ** precision;
      return rounded.toFixed(precision);
    } catch {
      return '0.0000';
    }
  };

  const callBscRpc = useCallback(async (method: string, params: any[] = []): Promise<any> => {
    for (const endpoint of PRODUCTION_CONFIG.rpcEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          }),
        });
        if (response.ok) {
          const json = await response.json();
          if (json.result !== undefined) {
            return json.result;
          }
        }
      } catch {
        // Fallback to next endpoint
      }
    }
    return null;
  }, []);

  // Stable block stats poller with empty dependency array to prevent infinite loops
  useEffect(() => {
    let isMounted = true;
    const fetchBscLiveNetworkStats = async () => {
      try {
        const [blockHex, gasHex] = await Promise.all([
          callBscRpc('eth_blockNumber', []),
          callBscRpc('eth_gasPrice', []),
        ]);
        if (isMounted) {
          if (blockHex) setCurrentBlockNumber(parseInt(blockHex, 16));
          if (gasHex) {
            const wei = BigInt(gasHex);
            const gwei = Number(wei / BigInt(10 ** 8)) / 10;
            setGasPriceGwei(gwei > 0 ? gwei : 3.0);
          }
        }
      } catch {
        // Silently continue
      }
    };

    fetchBscLiveNetworkStats();
    const interval = setInterval(fetchBscLiveNetworkStats, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [callBscRpc]);

  const fetchTokenBalance = useCallback(
    async (tokenContractAddress: string, userAddr: string, provider?: any): Promise<string> => {
      try {
        const data = `0x70a08231${padAddress(userAddr)}`;
        let hexResult: string | null = null;

        if (provider) {
          hexResult = await provider.request({
            method: 'eth_call',
            params: [{ to: tokenContractAddress, data }, 'latest'],
          });
        }

        if (!hexResult || hexResult === '0x') {
          hexResult = await callBscRpc('eth_call', [{ to: tokenContractAddress, data }, 'latest']);
        }

        if (hexResult && hexResult !== '0x') {
          return formatBalanceFromHex(hexResult, 18, 2);
        }
      } catch {
        // Ignore fallback
      }
      return '0.00';
    },
    [callBscRpc]
  );

  const fetchBalances = useCallback(
    async (addr: string, ethProvider?: any) => {
      try {
        const provider = ethProvider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
        let bnbFormatted = '0.0000';

        if (provider) {
          try {
            const balanceHex = await provider.request({
              method: 'eth_getBalance',
              params: [addr, 'latest'],
            });
            bnbFormatted = formatBalanceFromHex(balanceHex, 18, 4);
          } catch {
            const bnbHexRpc = await callBscRpc('eth_getBalance', [addr, 'latest']);
            if (bnbHexRpc) bnbFormatted = formatBalanceFromHex(bnbHexRpc, 18, 4);
          }
        } else {
          const bnbHexRpc = await callBscRpc('eth_getBalance', [addr, 'latest']);
          if (bnbHexRpc) bnbFormatted = formatBalanceFromHex(bnbHexRpc, 18, 4);
        }

        setWalletBalance(bnbFormatted);

        const [usdtBal, usdcBal] = await Promise.all([
          fetchTokenBalance(PRODUCTION_CONFIG.tokens.USDT.contractAddress, addr, provider),
          fetchTokenBalance(PRODUCTION_CONFIG.tokens.USDC.contractAddress, addr, provider),
        ]);

        setTokenBalances({
          BNB: bnbFormatted,
          USDT: usdtBal,
          USDC: usdcBal,
        });
      } catch (err: any) {
        optionsRef.current?.onLogError?.('Failed to query live token balances', err, { account: addr });
      }
    },
    [callBscRpc, fetchTokenBalance]
  );

  const switchNetwork = useCallback(
    async (targetChainId = '0x61') => {
      setError(null);
      try {
        const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (!provider) {
          setError('No Web3 wallet extension detected.');
          return;
        }

        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
            const netInfo = SUPPORTED_NETWORKS[targetChainId];
            if (netInfo) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainId,
                    chainName: netInfo.name,
                    rpcUrls: [netInfo.rpcUrl],
                    nativeCurrency: {
                      name: netInfo.symbol,
                      symbol: netInfo.symbol,
                      decimals: 18,
                    },
                    blockExplorerUrls: [netInfo.blockExplorer],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          } else {
            throw switchError;
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Could not switch network on wallet');
      }
    },
    []
  );

  const connectWallet = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsConnecting(true);

    try {
      const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;

      if (!provider) {
        setError('No Web3 provider detected.');
        setIsConnecting(false);
        return false;
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount);

        const currentChainId = await provider.request({ method: 'eth_chainId' });
        setChainId(currentChainId);

        if (currentChainId !== '0x61') {
          try {
            await switchNetwork('0x61');
          } catch {
            // User rejected network switch
          }
        }

        const netInfo = SUPPORTED_NETWORKS[currentChainId] || SUPPORTED_NETWORKS['0x61'];
        setNetwork(`${netInfo.name} (${currentChainId})`);

        await fetchBalances(currentAccount, provider);
        setIsConnecting(false);
        return true;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
    return false;
  }, [fetchBalances, switchNetwork]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setWalletBalance('0.0000');
    setTokenBalances({ BNB: '0.0000', USDT: '0.00', USDC: '0.00' });
    setAuthSignature(null);
    setError(null);
  }, []);

  const signAuthMessage = useCallback(
    async (customMsg?: string): Promise<string | null> => {
      try {
        const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (!provider || !account) {
          setError('No Web3 wallet account connected for signature');
          return null;
        }

        const timestamp = new Date().toISOString();
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'bscsan.nl';
        const messageToSign =
          customMsg ||
          `CashMatrix Protocol Authentication\nDomain: ${domain}\nAddress: ${account}\nVersion: 1\nChain ID: ${chainId}\nTimestamp: ${timestamp}`;

        const sig = await provider.request({
          method: 'personal_sign',
          params: [messageToSign, account],
        });
        setAuthSignature(sig);
        return sig;
      } catch (err: any) {
        setError(err?.message || 'Signature request rejected');
        return null;
      }
    },
    [account, chainId]
  );

  const executeLiveDeposit = useCallback(
    async (
      currency: 'USDT' | 'USDC' | 'BNB',
      amountNum: number
    ): Promise<{ txHash: string; success: boolean; error?: string }> => {
      setIsTransacting(true);
      setError(null);

      try {
        const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (!provider || !account) {
          throw new Error('Please connect your Web3 wallet first.');
        }

        const masterVault = DEPLOYED_CONTRACTS.omniGenesisMaster;
        const tokenConfig = PRODUCTION_CONFIG.tokens[currency] || PRODUCTION_CONFIG.tokens['USDC'];
        const tokenAddress = tokenConfig.contractAddress;
        const tokenUnits = BigInt(Math.floor(amountNum * 10 ** tokenConfig.decimals));

        const approveData = `0x095ea7b3${padAddress(masterVault)}${padUint256(tokenUnits)}`;
        await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: account, to: tokenAddress, data: approveData }],
        });

        const amountHex = padUint256(tokenUnits);
        const dataOffset = padUint256(BigInt(64));
        const strLen = padUint256(BigInt(15));
        const strContent = '5155414e54555f4e4f44455f5635000000000000000000000000000000000000';
        const allocateData = `0x4a632482${amountHex}${dataOffset}${strLen}${strContent}`;

        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: account,
              to: masterVault,
              data: allocateData,
            },
          ],
        });

        setTimeout(() => fetchBalances(account, provider), 3500);
        return { txHash, success: true };
      } catch (err: any) {
        const errorMsg = err?.message || 'Deposit transaction rejected';
        setError(errorMsg);
        return { txHash: '', success: false, error: errorMsg };
      } finally {
        setIsTransacting(false);
      }
    },
    [account, fetchBalances]
  );

  return {
    account,
    walletBalance,
    tokenBalances,
    network,
    chainId,
    isConnecting,
    isTransacting,
    error,
    hasProvider,
    authSignature,
    currentBlockNumber,
    gasPriceGwei,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signAuthMessage,
    executeLiveDeposit,
    refetchBalances: () => account && fetchBalances(account),
    setError,
  };
}
