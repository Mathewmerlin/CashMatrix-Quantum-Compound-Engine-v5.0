import { useState } from 'react';

export interface AuditFinding {
  id: string;
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'mitigated';
  remediation?: string;
}

export interface AuditReport {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  type: 'security' | 'compliance' | 'financial' | 'governance';
  status: 'passed' | 'warning' | 'failed' | 'pending';
  summary: string;
  findings: AuditFinding[];
}

interface Props {
  reports?: AuditReport[];
}

export default function AuditReportViewer({ reports = [] }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredReports = reports.filter(
    (report) =>
      (statusFilter === 'all' || report.status === statusFilter) &&
      (typeFilter === 'all' || report.type === typeFilter),
  );

  const selectedReport = reports.find((report) => report.id === selectedId);

  function exportReport(report: AuditReport) {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-${report.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const buttonClass =
    'rounded border border-cyan-700 px-3 py-2 text-sm hover:bg-slate-800';

  return (
    <section className="rounded-xl border border-cyan-900 bg-slate-950 p-6 text-slate-100">
      <h2 className="text-2xl font-bold">Audit Reports</h2>
      <p className="mt-2 text-sm text-slate-400">
        Reported results are supplied by the report source, not independently
        verified by this viewer. No compliance certification is implied.
      </p>

      <div className="my-6 flex flex-wrap gap-4">
        <label className="flex flex-col gap-2 text-sm">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded border border-slate-700 bg-slate-900 p-2"
          >
            <option value="all">All statuses</option>
            <option value="passed">Passed</option>
            <option value="warning">Warning</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Report type
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded border border-slate-700 bg-slate-900 p-2"
          >
            <option value="all">All types</option>
            <option value="security">Security</option>
            <option value="compliance">Compliance</option>
            <option value="financial">Financial</option>
            <option value="governance">Governance</option>
          </select>
        </label>
      </div>

      {reports.length === 0 ? (
        <p className="rounded border border-slate-700 p-4 text-slate-400">
          No reports supplied. Connect a real report source before displaying
          audit or compliance results.
        </p>
      ) : filteredReports.length === 0 ? (
        <p>No reports match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3">Report</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reported status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Findings</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-slate-800">
                  <td className="p-3 font-mono">{report.id}</td>
                  <td className="p-3 capitalize">{report.type}</td>
                  <td className="p-3 uppercase">{report.status}</td>
                  <td className="p-3">
                    {new Date(report.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">{report.findings.length}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => setSelectedId(report.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <section
          aria-label={`Report details: ${selectedReport.id}`}
          className="mt-6 rounded border border-cyan-800 p-4"
        >
          <h3 className="break-all text-lg font-semibold">
            {selectedReport.id}
          </h3>
          <p className="mt-3 whitespace-pre-wrap">{selectedReport.summary}</p>

          {selectedReport.findings.length === 0 ? (
            <p className="mt-4 text-slate-400">
              This report lists no findings.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {selectedReport.findings.map((finding) => (
                <li key={finding.id} className="rounded bg-slate-900 p-4">
                  <h4 className="font-semibold">{finding.category}</h4>
                  <p className="mt-1 text-sm text-amber-300">
                    {finding.severity.toUpperCase()} · {finding.status}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {finding.description}
                  </p>
                  {finding.remediation && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                      Remediation: {finding.remediation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className={buttonClass}
              onClick={() => exportReport(selectedReport)}
            >
              Export JSON
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => setSelectedId(null)}
            >
              Close details
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
