import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LogEntry, LogLevel } from '../types';

interface LogContextType {
  logs: LogEntry[];
  addLog: (
    level: LogLevel,
    source: LogEntry['source'],
    message: string,
    details?: Record<string, any> | string,
    errorStack?: string
  ) => void;
  logInfo: (source: LogEntry['source'], message: string, details?: any) => void;
  logWarn: (source: LogEntry['source'], message: string, details?: any) => void;
  logError: (source: LogEntry['source'], message: string, err?: any, details?: any) => void;
  clearLogs: () => void;
  exportLogs: (format?: 'json' | 'txt') => void;
  triggerSimulatedError: () => void;
  unreadErrorCount: number;
  resetUnreadCount: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '16:29:45.102',
    level: 'INFO',
    source: 'SYSTEM',
    message: 'CashMatrix Quantum-Compound Engine v5.0 kernel initialized successfully.',
    details: { environment: 'MAINNET', chainId: 56, network: 'BNB Smart Chain', coreThreads: 8, heapAllocated: '2.14GB' },
  },
  {
    id: 'log-2',
    timestamp: '16:29:46.480',
    level: 'INFO',
    source: 'EXECUTOR',
    message: 'Established high-speed multiplexer connection to Flashbots Protect & Titan Relayers.',
    details: { latencyMs: 14, protocol: 'wss/devp2p' },
  },
  {
    id: 'log-3',
    timestamp: '16:29:48.012',
    level: 'INFO',
    source: 'VAULT',
    message: 'Smart Contract Vault Matrix verified on-chain. Zero re-entrancy flags.',
    details: { vaultAddress: '0x32fa692c81d830b8d7890b24982a170b13498231', tvl: 25480.0 },
  },
  {
    id: 'log-4',
    timestamp: '16:30:00.120',
    level: 'INFO',
    source: 'COMPOUNDING',
    message: 'Automated 3-second yield reinvestment loop activated. Dynamic formula active.',
    details: { baseAsset: 1000, nextTradeCapitalFormula: 'Base + Accumulated' },
  },
];

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [unreadErrorCount, setUnreadErrorCount] = useState<number>(0);

  const addLog = useCallback(
    (
      level: LogLevel,
      source: LogEntry['source'],
      message: string,
      details?: Record<string, any> | string,
      errorStack?: string
    ) => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;

      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: timeStr,
        level,
        source,
        message,
        details,
        errorStack,
      };

      // Defer state update using queueMicrotask to ensure it does not run during any component's render phase
      queueMicrotask(() => {
        setLogs((prev) => [newEntry, ...prev.slice(0, 249)]); // keep 250 records

        if (level === 'ERROR' || level === 'CRITICAL') {
          setUnreadErrorCount((count) => count + 1);
        }
      });
    },
    []
  );

  const logInfo = useCallback(
    (source: LogEntry['source'], message: string, details?: any) => {
      addLog('INFO', source, message, details);
    },
    [addLog]
  );

  const logWarn = useCallback(
    (source: LogEntry['source'], message: string, details?: any) => {
      addLog('WARN', source, message, details);
    },
    [addLog]
  );

  const logError = useCallback(
    (source: LogEntry['source'], message: string, err?: any, details?: any) => {
      const errorStack = err instanceof Error ? err.stack : typeof err === 'string' ? err : undefined;
      const extraDetails = details || (err instanceof Error ? { name: err.name, message: err.message } : err);
      addLog('ERROR', source, message, extraDetails, errorStack);
    },
    [addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    setUnreadErrorCount(0);
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadErrorCount((prev) => (prev > 0 ? 0 : prev));
  }, []);

  const exportLogs = useCallback(
    (format: 'json' | 'txt' = 'json') => {
      let content = '';
      let mimeType = 'text/plain';
      let filename = `cashmatrix_logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;

      if (format === 'json') {
        content = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
        filename += '.json';
      } else {
        content = logs
          .map(
            (l) =>
              `[${l.timestamp}] [${l.level.padEnd(8)}] [${l.source.padEnd(11)}] ${l.message}${
                l.details ? ' | Details: ' + JSON.stringify(l.details) : ''
              }${l.errorStack ? '\nStack: ' + l.errorStack : ''}`
          )
          .join('\n');
        filename += '.txt';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [logs]
  );

  const triggerSimulatedError = useCallback(() => {
    try {
      throw new Error('Simulation RPC Error: Mempool block execution timeout [CALL_EXCEPTION, code=4001]');
    } catch (err: any) {
      logError(
        'EXECUTOR',
        'Relayer broadcast rejected: Flashbots builder simulateBundle returned execution timeout.',
        err,
        {
          targetBlock: 21894312,
          bribeGwei: 1.5,
          reason: 'Mempool state reorg detected during bundle insertion',
        }
      );
    }
  }, [logError]);

  return (
    <LogContext.Provider
      value={{
        logs,
        addLog,
        logInfo,
        logWarn,
        logError,
        clearLogs,
        exportLogs,
        triggerSimulatedError,
        unreadErrorCount,
        resetUnreadCount,
      }}
    >
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
