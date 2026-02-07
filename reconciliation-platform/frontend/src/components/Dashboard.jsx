import React, { useEffect, useState } from 'react';
import { dashboard as dashboardApi, reconciliationTypes as typesApi, compare as compareApi } from '../api';

export default function Dashboard({ onOpenRun }) {
  const [metrics, setMetrics] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sideAFile, setSideAFile] = useState(null);
  const [sideBFile, setSideBFile] = useState(null);
  const [compareTypeId, setCompareTypeId] = useState('cash-vs-bank');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, r, t] = await Promise.all([
        dashboardApi.metrics(),
        dashboardApi.runs(10),
        typesApi.list().catch(() => []),
      ]);
      setMetrics(m);
      setRecentRuns(r);
      setTypes(t);
      if (t.length && !t.some((x) => x.id === compareTypeId)) setCompareTypeId(t[0].id);
    } catch (e) {
      const msg = e.message || String(e);
      const isBackendDown = /fetch|network|connection refused|ECONNREFUSED|failed to fetch/i.test(msg) || e.name === 'TypeError';
      setError(isBackendDown
        ? 'Backend not reachable. Start it in another terminal: cd reconciliation-platform/backend && npm run dev'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCompare = async () => {
    if (!sideAFile || !sideBFile) {
      setCompareError('Please select both Side A and Side B files.');
      return;
    }
    setCompareLoading(true);
    setCompareError(null);
    try {
      const formData = new FormData();
      formData.append('sideA', sideAFile);
      formData.append('sideB', sideBFile);
      formData.append('reconciliationTypeId', compareTypeId);
      const result = await compareApi.run(formData);
      await load();
      if (result?.run?.id && onOpenRun) onOpenRun(result.run.id);
    } catch (e) {
      setCompareError(e.message);
    } finally {
      setCompareLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <p className="font-medium">Error: {error}</p>
        <p className="mt-2 text-sm">Make sure the backend is running on port 3002 (e.g. <code className="bg-amber-100 px-1 rounded">cd backend && npm run dev</code>).</p>
      </div>
    );
  }
  if (!metrics) return null;

  const { runs: runMetrics, explanations: expMetrics } = metrics;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-3">Upload & compare</h3>
        <p className="text-sm text-slate-600 mb-3">Upload two files (CSV or JSON) with a common key column. Sample files: <code className="text-xs bg-slate-100 px-1">sample-data/side-a.csv</code>, <code className="text-xs bg-slate-100 px-1">sample-data/side-b.json</code>.</p>
        <div className="flex flex-wrap gap-4 items-end">
          <label className="block">
            <span className="text-sm text-slate-600">Side A</span>
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => setSideAFile(e.target.files?.[0] || null)} className="mt-1 block text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Side B</span>
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => setSideBFile(e.target.files?.[0] || null)} className="mt-1 block text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Reconciliation type</span>
            <select value={compareTypeId} onChange={(e) => setCompareTypeId(e.target.value)} className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm">
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={handleCompare} disabled={compareLoading} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm">
            {compareLoading ? 'Comparing…' : 'Compare'}
          </button>
        </div>
        {compareError && <p className="mt-2 text-sm text-red-600">{compareError}</p>}
      </div>

      <h2 className="text-xl font-semibold text-slate-800">Agentic AI metrics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Matches" value={runMetrics.matches} subtitle="Keys fully aligned" />
        <MetricCard title="Mismatches" value={runMetrics.mismatches} subtitle="Breaks" />
        <MetricCard title="Orphans (A)" value={runMetrics.orphansA} subtitle="Key only on Side A" />
        <MetricCard title="Orphans (B)" value={runMetrics.orphansB} subtitle="Key only on Side B" />
      </div>

      <div>
        <h3 className="text-lg font-medium text-slate-700 mb-3">Explanations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total" value={expMetrics.total} subtitle="LLM explanations" />
          <MetricCard title="Accepted" value={expMetrics.accepted} subtitle="Marked correct / useful" className="border-green-200 bg-green-50" />
          <MetricCard title="Rejected" value={expMetrics.rejected} subtitle="For future backtest" className="border-amber-200 bg-amber-50" />
          <MetricCard title="Pending" value={expMetrics.pending} subtitle="Not yet reviewed" />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Rejected explanations can be used later for AI backtest (retrain / prompt-tune).
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-slate-700 mb-3">Recent runs</h3>
        <p className="text-sm text-slate-500 mb-2">Click a run to open mismatches, orphans, LLM explanations, and Semantic Q&A.</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          {recentRuns.length === 0 ? (
            <div className="p-4 text-slate-500">No runs yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium">Run ID</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Matches</th>
                  <th className="text-right p-3 font-medium">Mismatches</th>
                  <th className="text-right p-3 font-medium">Orphans</th>
                  <th className="text-left p-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => onOpenRun?.(run.id)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="p-3 font-mono text-xs">{run.id}</td>
                    <td className="p-3">{run.reconciliationTypeId || '—'}</td>
                    <td className="p-3 text-right">{run.counts?.matches ?? 0}</td>
                    <td className="p-3 text-right">{run.counts?.mismatches ?? 0}</td>
                    <td className="p-3 text-right">{(run.counts?.orphansA ?? 0) + (run.counts?.orphansB ?? 0)}</td>
                    <td className="p-3 text-slate-600">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="text-2xl font-semibold text-slate-800">{value ?? 0}</div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
    </div>
  );
}
