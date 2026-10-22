import React from 'react';
import SecurityDashboard from '../SecurityDashboard';
import EmergencyPause from '../EmergencyPause';
import GovernancePortal from '../GovernancePortal';
import KeeperBotDashboard from '../KeeperBotDashboard';
import VaultAnalytics from '../VaultAnalytics';
import MultiSigPanel from '../MultiSigPanel';
import AuditReportViewer from '../AuditReportViewer';

export const InstitutionalDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">
            Institutional Command Center
          </h1>
          <p className="mt-2 text-slate-400">
            Multi-signature governance, security monitoring, and protocol controls
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Overview - Full Width Priority */}
          <div className="lg:col-span-2">
            <SecurityDashboard />
          </div>

          {/* Emergency Controls */}
          <EmergencyPause />

          {/* Governance */}
          <GovernancePortal />

          {/* Keeper Status */}
          <KeeperBotDashboard />

          {/* Vault Metrics */}
          <VaultAnalytics />

          {/* MultiSig */}
          <MultiSigPanel />

          {/* Audit Reports */}
          <AuditReportViewer />
        </div>
      </div>
    </div>
  );
};
