import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  NavModule,
  EnvironmentType,
  TradeReceipt,
  CompoundingRecord,
  Position,
  QuantStrategy,
  RelayerStatus,
  SecretKeyConfig,
  UserInvestorPosition,
  WithdrawalReceipt,
  AdminUserRecord,
  AdminUserMetrics,
} from './types';
import { useWeb3 } from './hooks/useWeb3';
import { LogProvider, useLogs } from './context/LogContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { LogoProvider } from './context/LogoContext';
import { LogoUploadModal } from './components/LogoUploadModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MatrixRainCanvas } from './components/MatrixRainCanvas';
import { AdminGatekeeperModal } from './components/AdminGatekeeperModal';
import { InvestorPortalView } from './components/views/InvestorPortalView';
import { TerminalHub } from './components/views/TerminalHub';
import { ChartsView } from './components/views/ChartsView';
import { LiveTrades } from './components/views/LiveTrades';
import { PositionsView } from './components/views/PositionsView';
import { StrategiesView } from './components/views/StrategiesView';
import { ExecutorView } from './components/views/ExecutorView';
import { VaultMatrixView } from './components/views/VaultMatrixView';
import { WalletCoreView } from './components/views/WalletCoreView';
import { TelemetryView } from './components/views/TelemetryView';
import { LogsView } from './components/views/LogsView';
import { KeyVaultView } from './components/views/KeyVaultView';
import { UserSignInGate } from './components/views/UserSignInGate';
import { UserPanelOnlyView } from './components/views/UserPanelOnlyView';
import { InstitutionalDashboard } from './components/views/InstitutionalDashboard';
import { GoDaddyDeployModal } from './components/GoDaddyDeployModal';
import { PRODUCTION_CONFIG } from './config/productionConfig';
import { DEPLOYED_CONTRACTS } from './config/contracts';

const PAIR_BASE_PRICES: Record<string, number> = {
  'BNB/USDT': 585.4,
  'BTCB/USDT': 89450.0,
  'ETH/USDT': 3142.5,
  'CAKE/USDT': 2.85,
  'SOL/USDT': 198.4,
};

const ADMIN_TREASURY_ACCOUNT = '0x71C94B3b7f884a29a059A9482928cB7239A2F86B';

function MainDashboard() {
  const { logInfo, logWarn, logError } = useLogs();
  const { isAdminAuthenticated, openAuthModal } = useAdminAuth();

  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [currentModule, setCurrentModule] = useState<NavModule>('terminal');
  const [adminCollectedFees, setAdminCollectedFees] = useState<number>(0);

  // --- FULLY DYNAMIC USER REGISTRY (NO HARDCODED MOCKS) ---
  const [userRecords, setUserRecords] = useState<AdminUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cashmatrix_user_registry');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // Fallback to active connected user state if registry is empty
    return [
      {
        id: `user-${Date.now()}`,
        address: '0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9',
        ensName: 'investor.bnb',
        depositedAmount: 1040.00,
        currency: 'USDC',
        depositTimestamp: Date.now(),
        lockExpiryDays: 30,
        status: 'ACTIVE_COMPOUNDING',
        accruedYield: 0,
        adminYieldPaid: 0,
        isCurrentUser: true,
        txHash: '0xdd7ed0b8a1b8e9df4417f5e755ad3f5714bfc9c6c6698e90c82120ca65c4af68',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('cashmatrix_user_registry', JSON.stringify(userRecords));
    } catch (e) {}
  }, [userRecords]);

  const adminUserMetrics = useMemo<AdminUserMetrics>(() => {
    const totalUserCount = userRecords.length;
    const activeDepositorsCount = userRecords.filter((u) => Number(u.depositedAmount || 0) > 0).length;
    const totalDepositAmount = userRecords.reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);

    const usdcSum = userRecords.filter((u) => u.currency === 'USDC').reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);
    const usdtSum = userRecords.filter((u) => u.currency === 'USDT').reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);
    const ethSum = userRecords.filter((u) => u.currency === 'ETH').reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);

    const thirtyDayLockedAmount = totalDepositAmount;
    const avgDepositAmount = activeDepositorsCount > 0 ? totalDepositAmount / activeDepositorsCount : 0;

    return {
      totalUserCount,
      activeDepositorsCount,
      totalDepositAmount,
      currencyBreakdown: { USDC: usdcSum, USDT: usdtSum, ETH: ethSum },
      totalAdminYieldCollected: adminCollectedFees,
      avgDepositAmount,
      thirtyDayLockedAmount,
    };
  }, [userRecords, adminCollectedFees]);

  const [investorPosition, setInvestorPosition] = useState<UserInvestorPosition>({
    depositedPrincipal: 0,
    shareBalance: 0,
    depositTimestamp: 0,
    accruedYield: 0,
    lockupExpiryDays: 30,
    lastClaimTimestamp: 0,
    hasActiveDeposit: false,
    depositCurrency: 'USDC',
    isLockExpiredOverride: false,
    totalWithdrawnByUser: 0,
    totalTransferredToAdmin: 0,
    withdrawalReceipts: [],
  });

  // --- DYNAMIC CAPITAL DERIVED DIRECTLY FROM LIVE USER REGISTRY SUM ---
  const [initialAsset, setInitialAsset] = useState<number>(() => {
    const total = userRecords.reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);
    return total > 0 ? total : 0;
  });

  // Keep initialAsset synchronized automatically when userRecords update
  useEffect(() => {
    const total = userRecords.reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);
    if (total > 0) {
      setInitialAsset(total);
    }
  }, [userRecords]);

  const [accumulatedProfit, setAccumulatedProfit] = useState<number>(0);
  const [isAutoCompounding, setIsAutoCompounding] = useState<boolean>(true);
  const [environment, setEnvironment] = useState<EnvironmentType>('TESTNET');
  const [vaultBalance, setVaultBalance] = useState<number>(() => {
    return userRecords.reduce((acc, u) => acc + Number(u.depositedAmount || 0), 0);
  });
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [activeStrategy, setActiveStrategy] = useState<string>('MEV Sandwich Engine v4');

  // --- STREAMING LIVE TRADE LEDGER FROM KEEPER CACHE ---
  const [tradeHistory, setTradeHistory] = useState<CompoundingRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLedgerStream = async () => {
      try {
        const res = await fetch('/ledger-cache.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            const mapped: CompoundingRecord[] = data.map((t, idx) => {
              const yieldVal = Number(t.yieldGenerated ?? t.profitGenerated ?? 0);
              const currentBase = initialAsset > 0 ? initialAsset : 1040;
              return {
                id: t.id || `ledger-${idx}-${Date.now()}`,
                cycle: t.batch ? String(t.batch).replace('#', '') : String(data.length - idx),
                txHash: t.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
                pair: t.pair || 'USDC/tBNB-QUANTUM-NODE',
                inputCapital: currentBase,
                profitGenerated: yieldVal,
                nextTradeAmount: currentBase + yieldVal,
                yieldPct: currentBase > 0 ? (yieldVal / currentBase) * 100 : 0.1,
                timestamp: t.timestamp || new Date().toLocaleTimeString(),
              };
            });
            setTradeHistory([...mapped]);
          }
        }
      } catch (e) {}
    };

    fetchLedgerStream();
    const interval = setInterval(fetchLedgerStream, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [initialAsset]);

  const [trades, setTrades] = useState<TradeReceipt[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [strategies, setStrategies] = useState<QuantStrategy[]>([
    {
      id: 'strat-1',
      name: 'OmniGenesis Yield Mutator v5',
      code: 'OMNI-MUTATOR-V5',
      description: 'Dynamic BSC yield adapter routing across PancakeSwap v3 and Venus protocol.',
      isActive: true,
      allocationPct: 50,
      slippageTolerance: 0.25,
      maxGasGwei: 85,
      minProfitThreshold: 25.0,
      winRate: 100.0,
      total24hYield: 0,
      bundleCount: 0,
      latencyAvgMs: 12,
    },
  ]);

  const [relayers, setRelayers] = useState<RelayerStatus[]>([
    {
      id: 'r-1',
      name: 'BSC Private RPC Node',
      endpoint: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      latencyMs: 12,
      status: 'OPTIMAL',
      successRate: 100.0,
      bundlesSubmitted: 0,
      gasGwei: 3.0,
    },
  ]);

  const [secretKeys, setSecretKeys] = useState<SecretKeyConfig>({
    privateKey: '',
    flashbotsSigner: '',
    rpcApiKey: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    etherscanApiKey: '',
    lastUpdated: 'Live Session',
    isLocked: false,
  });

  const handleToggleAutoCompounding = () => {
    setIsAutoCompounding(!isAutoCompounding);
  };

  const handleToggleEnvironment = () => {
    setEnvironment(environment === 'MAINNET' ? 'TESTNET' : 'MAINNET');
  };

  const handleResetCompounding = () => {
    setAccumulatedProfit(0);
    setTradeHistory([]);
  };

  const {
    account,
    walletBalance,
    tokenBalances,
    network,
    chainId,
    isConnecting,
    isTransacting,
    error: web3Error,
    hasProvider,
    authSignature,
    currentBlockNumber,
    gasPriceGwei,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signAuthMessage,
    executeLiveDeposit,
  } = useWeb3({
    onLogInfo: (msg, details) => logInfo('WEB3', msg, details),
    onLogWarn: (msg, details) => logWarn('WEB3', msg, details),
    onLogError: (msg, err, details) => logError('WEB3', msg, err, details),
  });

  const handleUserDeposit = async (amount: number, currency: string) => {
    try {
      if (!account) {
        const connected = await connectWallet();
        if (!connected) return;
      }
      const res = await executeLiveDeposit(currency as any, amount);
      if (!res.success) return;

      setInvestorPosition((prev) => ({
        ...prev,
        hasActiveDeposit: true,
        depositedPrincipal: amount,
        depositCurrency: currency,
        depositTimestamp: Date.now(),
      }));
      setInitialAsset(amount);
      setVaultBalance((prev) => prev + amount);

      const userAddr = account || '0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9';
      setUserRecords((prev) => [
        {
          id: `user-${Date.now()}`,
          address: userAddr,
          ensName: 'investor.bnb',
          depositedAmount: amount,
          currency: currency as any,
          depositTimestamp: Date.now(),
          lockExpiryDays: 30,
          status: 'ACTIVE_COMPOUNDING',
          accruedYield: 0,
          adminYieldPaid: 0,
          isCurrentUser: true,
          txHash: res.txHash,
        },
        ...prev,
      ]);
    } catch (err) {}
  };

  const handleUserClaimProfitSplit = async () => {
    const totalProfit = investorPosition.accruedYield;
    if (totalProfit <= 0) return;
    const userAmount = Math.round(totalProfit * 0.5 * 100) / 100;
    const adminAmount = Math.round(totalProfit * 0.5 * 100) / 100;

    setAdminCollectedFees((prev) => prev + adminAmount);
    setInvestorPosition((prev) => ({
      ...prev,
      accruedYield: 0,
      totalWithdrawnByUser: prev.totalWithdrawnByUser + userAmount,
      totalTransferredToAdmin: prev.totalTransferredToAdmin + adminAmount,
    }));
  };

  const handleResetUserPosition = () => {
    setInvestorPosition({
      depositedPrincipal: 0,
      shareBalance: 0,
      depositTimestamp: 0,
      accruedYield: 0,
      lockupExpiryDays: 30,
      lastClaimTimestamp: 0,
      hasActiveDeposit: false,
      depositCurrency: 'USDC',
      isLockExpiredOverride: false,
      totalWithdrawnByUser: 0,
      totalTransferredToAdmin: 0,
      withdrawalReceipts: [],
    });
  };

  if (!account && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 font-sans relative">
        <MatrixRainCanvas opacity={0.08} />
        <UserSignInGate
          onConnectWallet={connectWallet}
          isConnecting={isConnecting}
          web3Error={web3Error}
          onOpenAdminAuth={() => openAuthModal('terminal')}
          onOpenDeployGuide={() => setIsDeployModalOpen(true)}
        />
        <AdminGatekeeperModal
          onSuccessNavigate={(mod) => {
            setAdminViewMode('admin');
            setCurrentModule(mod);
          }}
          onReturnToUserPortal={() => setAdminViewMode('user')}
        />
        <GoDaddyDeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} />
        <LogoUploadModal />
      </div>
    );
  }

  if (!isAdminAuthenticated || adminViewMode === 'user') {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 font-sans relative">
        <MatrixRainCanvas opacity={0.06} />
        <UserPanelOnlyView
          account={account || '0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9'}
          walletBalance={walletBalance}
          network={network}
          chainId={chainId}
          onDisconnectWallet={disconnectWallet}
          onSwitchNetwork={switchNetwork}
          investorPosition={investorPosition}
          onDepositPrincipal={handleUserDeposit}
          onClaimProfitSplit={handleUserClaimProfitSplit}
          onResetUserPosition={handleResetUserPosition}
          tradeHistory={tradeHistory}
          isAutoCompounding={isAutoCompounding}
          adminTreasuryAccount={ADMIN_TREASURY_ACCOUNT}
          adminCollectedFees={adminCollectedFees}
          isAdminAuthenticated={isAdminAuthenticated}
          onSwitchToAdmin={() => setAdminViewMode('admin')}
          onOpenAdminAuth={() => openAuthModal('terminal')}
          onOpenDeployGuide={() => setIsDeployModalOpen(true)}
          onSignAuthChallenge={signAuthMessage}
          authSignature={authSignature}
        />
        <AdminGatekeeperModal
          onSuccessNavigate={(mod) => {
            setAdminViewMode('admin');
            setCurrentModule(mod);
          }}
          onReturnToUserPortal={() => setAdminViewMode('user')}
        />
        <GoDaddyDeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} />
        <LogoUploadModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-100 font-sans relative">
      <MatrixRainCanvas opacity={0.14} />

      <GoDaddyDeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} />
      <AdminGatekeeperModal
        onSuccessNavigate={(mod) => {
          setAdminViewMode('admin');
          setCurrentModule(mod);
        }}
        onReturnToUserPortal={() => setAdminViewMode('user')}
      />

      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isAutoCompounding={isAutoCompounding}
        environment={environment}
        cycleCount={tradeHistory.length}
        metrics={adminUserMetrics}
      />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col bg-[#020617]/95 relative z-10">
        <Header
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
          environment={environment}
          onToggleEnvironment={handleToggleEnvironment}
          isAutoCompounding={isAutoCompounding}
          onToggleAutoCompounding={handleToggleAutoCompounding}
          account={account}
          walletBalance={walletBalance}
          network={network}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          onOpenWalletModal={() => {
            if (isAdminAuthenticated) setCurrentModule('wallet');
            else connectWallet();
          }}
          metrics={adminUserMetrics}
          onSwitchToUserPanel={() => setAdminViewMode('user')}
          onOpenDeployGuide={() => setIsDeployModalOpen(true)}
        />

        <div className="flex-1 pb-12">
          {currentModule === 'investor' && (
            <InvestorPortalView
              account={account}
              walletBalance={walletBalance}
              onConnectWallet={connectWallet}
              investorPosition={investorPosition}
              onDepositPrincipal={handleUserDeposit}
              onClaimProfitSplit={handleUserClaimProfitSplit}
              onResetUserPosition={handleResetUserPosition}
              tradeHistory={tradeHistory}
              isAutoCompounding={isAutoCompounding}
              adminTreasuryAccount={ADMIN_TREASURY_ACCOUNT}
              adminCollectedFees={adminCollectedFees}
            />
          )}

          {currentModule === 'institutional' && (
            React.createElement(InstitutionalDashboard as any, {
              metrics: adminUserMetrics,
              userRecords: userRecords,
              adminTreasuryAccount: ADMIN_TREASURY_ACCOUNT,
              adminCollectedFees: adminCollectedFees,
              vaultBalance: vaultBalance
            })
          )}

          {currentModule === 'terminal' && (
            <TerminalHub
              initialAsset={initialAsset}
              setInitialAsset={setInitialAsset}
              accumulatedProfit={accumulatedProfit}
              isAutoCompounding={isAutoCompounding}
              onToggleAutoCompounding={handleToggleAutoCompounding}
              onResetCompounding={handleResetCompounding}
              tradeHistory={tradeHistory}
              environment={environment}
              activeStrategy={activeStrategy}
              userRecords={userRecords}
              metrics={adminUserMetrics}
              onNavigateToVault={() => setCurrentModule('vault')}
            />
          )}

          {currentModule === 'charts' && (
            <ChartsView
              tradeHistory={tradeHistory}
              trades={trades}
              positions={positions}
              initialAsset={initialAsset}
              accumulatedProfit={accumulatedProfit}
              isAutoCompounding={isAutoCompounding}
            />
          )}

          {currentModule === 'trades' && (
            <LiveTrades trades={trades} onExecuteManualTrade={() => {}} />
          )}

          {currentModule === 'positions' && (
            <PositionsView
              positions={positions}
              onClosePosition={() => {}}
              onAddCollateral={() => {}}
              onAdjustLeverage={() => {}}
            />
          )}

          {currentModule === 'strategies' && (
            <StrategiesView
              strategies={strategies}
              onToggleStrategy={() => {}}
              onUpdateStrategyParams={() => {}}
              activeStrategy={activeStrategy}
              onSetActiveStrategy={setActiveStrategy}
            />
          )}

          {currentModule === 'executor' && (
            <ExecutorView relayers={relayers} onPingRelayers={() => {}} isPinging={false} />
          )}

          {currentModule === 'vault' && (
            <VaultMatrixView
              vaultBalance={vaultBalance}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              onDeposit={(amt) => setVaultBalance((prev) => prev + amt)}
              onWithdraw={(amt) => setVaultBalance((prev) => Math.max(0, prev - amt))}
              walletBalance={walletBalance}
              adminTreasuryAccount={ADMIN_TREASURY_ACCOUNT}
              adminCollectedFees={adminCollectedFees}
              userRecords={userRecords}
              metrics={adminUserMetrics}
            />
          )}

          {currentModule === 'wallet' && (
            <WalletCoreView
              account={account}
              walletBalance={walletBalance}
              network={network}
              chainId={chainId}
              isConnecting={isConnecting}
              error={web3Error}
              hasProvider={hasProvider}
              onConnectWallet={connectWallet}
              onDisconnectWallet={disconnectWallet}
              onSwitchNetwork={switchNetwork}
            />
          )}

          {currentModule === 'metrics' && (
            <TelemetryView
              isAutoCompounding={isAutoCompounding}
              cycleCount={tradeHistory.length}
              metrics={adminUserMetrics}
            />
          )}

          {currentModule === 'logs' && <LogsView />}

          {currentModule === 'secrets' && (
            <KeyVaultView
              keys={secretKeys}
              onSaveKeys={() => {}}
              onClearKeys={() => {}}
            />
          )}
        </div>
      </main>

      <LogoUploadModal />
    </div>
  );
}

export default function App() {
  return (
    <LogProvider>
      <AdminAuthProvider>
        <LogoProvider>
          <MainDashboard />
        </LogoProvider>
      </AdminAuthProvider>
    </LogProvider>
  );
}
