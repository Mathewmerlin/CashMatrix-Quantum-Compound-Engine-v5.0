import React, { useState } from 'react';
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Search,
  Filter,
  Download,
  Trash2,
  Play,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useLogs } from '../../context/LogContext';
import { LogEntry, LogLevel } from '../../types';

export const LogsView: React.FC = () => {
  const { logs, clearLogs, exportLogs, triggerSimulatedError, resetUnreadCount } = useLogs();
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    resetUnreadCount();
  }, [resetUnreadCount]);

  const copyLog = (log: LogEntry) => {
    const text = JSON.stringify(log, null, 2);
    navigator.clipboard?.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (filterSource !== 'ALL' && log.source !== filterSource) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchSource = log.source.toLowerCase().includes(q);
      const matchTime = log.timestamp.includes(q);
      const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      return matchMsg || matchSource || matchTime || matchDetails;
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;
  const infoCount = logs.filter((l) => l.level === 'INFO').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            System Audit & Error Logging Hub
          </h2>
          <p className="text-xs text-slate-400">
            Real-time trace logs, RPC exceptions, Web3 transaction errors, and invariant assertions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerSimulatedError}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors"
            title="Trigger an RPC diagnostic probe to test log capture"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Test Diagnostic Probe</span>
          </button>

          <button
            onClick={() => exportLogs('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => exportLogs('txt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export TXT</span>
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs transition-colors"
            title="Clear all stored logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-slate-400 block font-sans text-xs mb-1">Total Captured Events</span>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
          <span className="text-[11px] text-slate-500">Persistent memory buffer</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 backdrop-blur-md">
          <span className="text-rose-400 block font-sans text-xs mb-1">Errors & Exceptions</span>
          <div className="text-2xl font-bold text-rose-400">{errorCount}</div>
          <span className="text-[11px] text-slate-500">Auto try-catch isolated</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-md">
          <span className="text-amber-400 block font-sans text-xs mb-1">Warnings & Latency Drift</span>
          <div className="text-2xl font-bold text-amber-400">{warnCount}</div>
          <span className="text-[11px] text-slate-500">Slippage & retry alerts</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <span className="text-cyan-400 block font-sans text-xs mb-1">Informational Audit Logs</span>
          <div className="text-2xl font-bold text-cyan-400">{infoCount}</div>
          <span className="text-[11px] text-slate-500">Execution loop pulses</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search log messages, parameters, stacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 text-[11px]">Level:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 text-[11px]">Source:</span>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs"
            >
              <option value="ALL">ALL SOURCES</option>
              <option value="COMPOUNDING">COMPOUNDING</option>
              <option value="WEB3">WEB3</option>
              <option value="EXECUTOR">EXECUTOR</option>
              <option value="VAULT">VAULT</option>
              <option value="STRATEGY">STRATEGY</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-sans">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">No logs found matching your filters.</p>
              <p className="text-xs text-slate-500 mt-1">System events and errors will appear here automatically.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isError = log.level === 'ERROR' || log.level === 'CRITICAL';
              const isWarn = log.level === 'WARN';

              return (
                <div
                  key={log.id}
                  className={`transition-colors ${
                    isError
                      ? 'bg-rose-950/20 hover:bg-rose-950/30'
                      : isWarn
                      ? 'bg-amber-950/15 hover:bg-amber-950/25'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex items-start gap-3 cursor-pointer select-none"
                  >
                    {/* Expand icon */}
                    <button className="text-slate-500 hover:text-slate-300 mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Level Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        isError
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : isWarn
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                      }`}
                    >
                      {log.level}
                    </span>

                    {/* Source Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800 shrink-0">
                      {log.source}
                    </span>

                    {/* Timestamp */}
                    <span className="text-slate-500 text-[11px] shrink-0">
                      {log.timestamp}
                    </span>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`truncate font-medium ${
                          isError ? 'text-rose-200' : isWarn ? 'text-amber-200' : 'text-slate-200'
                        }`}
                      >
                        {log.message}
                      </p>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLog(log);
                      }}
                      className="text-slate-500 hover:text-slate-300 shrink-0 ml-2"
                      title="Copy Log JSON"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded JSON & Stack View */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 space-y-3 bg-slate-950/60 border-t border-slate-800/40">
                      {log.details && (
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1 font-sans font-semibold">
                            Payload Context / Parameters:
                          </span>
                          <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.errorStack && (
                        <div>
                          <span className="text-[10px] text-rose-400 block mb-1 font-sans font-semibold">
                            Stack Trace:
                          </span>
                          <pre className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-[11px] text-rose-300 overflow-x-auto whitespace-pre-wrap">
                            {log.errorStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
