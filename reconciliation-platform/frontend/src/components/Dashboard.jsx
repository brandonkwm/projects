import React, { useEffect, useState } from 'react';
import { dashboard as dashboardApi } from '../api';

export default function Dashboard({ onOpenRun }) {
  const [metrics, setMetrics] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [m, r] = await Promise.all([dashboardApi.metrics(), dashboardApi.runs(10)]);
        if (!cancelled) {
          setMetrics(m);
          setRecentRuns(r);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!metrics) return null;

  const { runs: runMetrics, explanations: expMetrics } = metrics;

  return (
    <div className="space-y-8">
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
