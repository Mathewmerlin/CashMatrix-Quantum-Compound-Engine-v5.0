export type NavModule =
  | 'investor'
  | 'terminal'
  | 'charts'
  | 'trades'
  | 'positions'
  | 'strategies'
  | 'executor'
  | 'vault'
  | 'wallet'
  | 'metrics'
  | 'logs'
  | 'secrets'
  | 'institutional';

export type PanelMode = 'INVESTOR' | 'MANAGER';

export type EnvironmentType = 'MAINNET' | 'TESTNET';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: 'WEB3' | 'COMPOUNDING' | 'EXECUTOR' | 'VAULT' | 'STRATEGY' | 'SYSTEM';
  message: string;
  details?: Record<string, any> | string;
  errorStack?: string;
}

export interface TradeReceipt {
  id: string;
  txHash: string;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  status: 'CONFIRMED' | 'MINED' | 'SETTLED' | 'PENDING';
  time: string;
  gasGwei: number;
}

export interface CompoundingRecord {
  id: string;
  pair: string;
  inputCapital: number;
  profitGenerated: number;
  nextTradeAmount: number;
  timestamp: string;
  txHash: string;
  yieldPct: number;
  cycle: number;
}

export interface Position {
  id: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  leverage: number;
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  marginRatio: number;
  marginCollateral: number;
  fundingRate: number;
}

export interface QuantStrategy {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  allocationPct: number;
  slippageTolerance: number;
  maxGasGwei: number;
  minProfitThreshold: number;
  winRate: number;
  total24hYield: number;
  bundleCount: number;
  latencyAvgMs: number;
}

export interface RelayerStatus {
  id: string;
  name: string;
  endpoint: string;
  latencyMs: number;
  status: 'ONLINE' | 'OPTIMAL' | 'DEGRADED';
  successRate: number;
  bundlesSubmitted: number;
  gasGwei: number;
}

export interface SecretKeyConfig {
  privateKey: string;
  flashbotsSigner: string;
  rpcApiKey: string;
  etherscanApiKey: string;
  lastUpdated: string;
  isLocked: boolean;
}

export interface WithdrawalReceipt {
  id: string;
  userAmount: number;
  adminAmount: number;
  adminAddress: string;
  timestamp: string;
  txHash: string;
  gasUsedGwei: number;
}

export interface UserInvestorPosition {
  depositedPrincipal: number;
  shareBalance: number;
  depositTimestamp: number;
  accruedYield: number;
  lockupExpiryDays: number;
  lastClaimTimestamp: number;
  hasActiveDeposit: boolean;
  depositCurrency: string;
  isLockExpiredOverride?: boolean;
  totalWithdrawnByUser: number;
  totalTransferredToAdmin: number;
  withdrawalReceipts: WithdrawalReceipt[];
}

export interface AdminUserRecord {
  id: string;
  address: string;
  ensName?: string;
  depositedAmount: number;
  currency: 'USDC' | 'ETH' | 'USDT';
  depositTimestamp: number;
  lockExpiryDays: number;
  status: 'ACTIVE_COMPOUNDING' | 'LOCK_MATURED' | 'WITHDRAWN';
  accruedYield: number;
  adminYieldPaid: number;
  isCurrentUser?: boolean;
  txHash: string;
}

export interface AdminUserMetrics {
  totalUserCount: number;
  activeDepositorsCount: number;
  totalDepositAmount: number;
  currencyBreakdown: {
    USDC: number;
    USDT: number;
    ETH: number;
  };
  totalAdminYieldCollected: number;
  avgDepositAmount: number;
  thirtyDayLockedAmount: number;
}
