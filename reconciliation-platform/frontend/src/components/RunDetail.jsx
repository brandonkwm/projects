import React, { useEffect, useState } from 'react';
import { runs as runsApi, explanations as explanationsApi, ask as askApi } from '../api';

export default function RunDetail({ runId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState('');
  const [askResult, setAskResult] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [expandedBreakId, setExpandedBreakId] = useState(null);
  const [expandedExpId, setExpandedExpId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const full = await runsApi.getFull(runId);
        if (!cancelled) setData(full);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [runId]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAskLoading(true);
    setAskResult(null);
    try {
      const result = await askApi.post({ question: question.trim(), runId });
      setAskResult(result);
    } catch (e) {
      setAskResult({ answer: `Error: ${e.message}`, matches: [] });
    } finally {
      setAskLoading(false);
    }
  };

  const handleAcceptReject = async (explanationId, action) => {
    try {
      if (action === 'accept') await explanationsApi.accept(explanationId);
      else await explanationsApi.reject(explanationId);
      const full = await runsApi.getFull(runId);
      setData(full);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="text-slate-500">Loading run…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data) return null;

  const { run, breaks: breakList, explanations: explanationList, datasets: runDatasets } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 font-medium"
        >
          ← Back to dashboard
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Run summary</h2>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <span><strong>Run ID:</strong> <code className="text-xs">{run.id}</code></span>
          <span><strong>Type:</strong> {run.reconciliationTypeId || '—'}</span>
          <span><strong>Matches:</strong> {run.counts?.matches ?? 0}</span>
          <span><strong>Mismatches:</strong> {run.counts?.mismatches ?? 0}</span>
          <span><strong>Orphans:</strong> {(run.counts?.orphansA ?? 0) + (run.counts?.orphansB ?? 0)}</span>
        </div>
        {run.completedAt && (
          <p className="mt-2 text-slate-500 text-sm">Completed {new Date(run.completedAt).toLocaleString()}</p>
        )}
      </div>

      {/* View underlying datasets */}
      {runDatasets && (runDatasets.sideA?.length > 0 || runDatasets.sideB?.length > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
          <h3 className="font-semibold text-slate-800 p-4 border-b border-slate-200">Underlying datasets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Side A</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      {runDatasets.sideA[0] && Object.keys(runDatasets.sideA[0]).map((k) => (
                        <th key={k} className="p-2 text-left font-medium">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runDatasets.sideA.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="p-2">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Side B</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      {runDatasets.sideB[0] && Object.keys(runDatasets.sideB[0]).map((k) => (
                        <th key={k} className="p-2 text-left font-medium">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runDatasets.sideB.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="p-2">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Q&A */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-2">Semantic Q&A</h3>
        <p className="text-sm text-slate-600 mb-3">Ask about this run in plain language (e.g. &quot;rounding&quot;, &quot;orphan&quot;, &quot;amount mismatch&quot;).</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. Which breaks mention rounding?"
            className="flex-1 min-w-[200px] rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={askLoading}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm"
          >
            {askLoading ? 'Asking…' : 'Ask'}
          </button>
        </div>
        {askResult && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-1">Answer</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{askResult.answer}</p>
            {askResult.matches?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Matching explanations ({askResult.matches.length})</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {askResult.matches.slice(0, 5).map((m) => (
                    <li key={m.id}><span className="font-mono text-slate-600">{m.key}</span>: {m.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mismatches & orphans */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <h3 className="font-semibold text-slate-800 p-4 border-b border-slate-200">Mismatches & orphan records</h3>
        {breakList.length === 0 ? (
          <div className="p-4 text-slate-500 text-sm">No breaks in this run.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {breakList.map((b) => (
              <li key={b.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedBreakId(expandedBreakId === b.id ? null : b.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <span className="font-mono text-sm font-medium">{b.key}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${breakTypeClass(b.outcome)}`}>
                    {breakTypeLabel(b.outcome)}
                  </span>
                </button>
                {expandedBreakId === b.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-600">Side A</p>
                        <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32">{JSON.stringify(b.sideA ?? null, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Side B</p>
                        <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32">{JSON.stringify(b.sideB ?? null, null, 2)}</pre>
                      </div>
                    </div>
                    {b.differingFields?.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">Differing fields: {b.differingFields.join(', ')}</p>
                    )}
                    {/* Explanations for this break */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-600 mb-2">LLM explanations</p>
                      {explanationList.filter((e) => e.breakId === b.id).length === 0 ? (
                        <p className="text-xs text-slate-500">No explanation for this break.</p>
                      ) : (
                        <ul className="space-y-3">
                          {explanationList.filter((e) => e.breakId === b.id).map((exp) => (
                            <ExplanationCard
                              key={exp.id}
                              explanation={exp}
                              expanded={expandedExpId === exp.id}
                              onToggle={() => setExpandedExpId(expandedExpId === exp.id ? null : exp.id)}
                              onAccept={() => handleAcceptReject(exp.id, 'accept')}
                              onReject={() => handleAcceptReject(exp.id, 'reject')}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function breakTypeLabel(outcome) {
  const labels = { mismatch: 'Mismatch', orphan_a: 'Orphan (A)', orphan_b: 'Orphan (B)', duplicate_key: 'Duplicate key', timing_drift: 'Timing drift' };
  return labels[outcome] || outcome || 'Break';
}

function breakTypeClass(outcome) {
  if (outcome === 'mismatch') return 'bg-amber-100 text-amber-800';
  if (outcome === 'orphan_a' || outcome === 'orphan_b') return 'bg-slate-200 text-slate-700';
  if (outcome === 'duplicate_key') return 'bg-rose-100 text-rose-800';
  if (outcome === 'timing_drift') return 'bg-sky-100 text-sky-800';
  return 'bg-slate-200 text-slate-700';
}

function ExplanationCard({ explanation, expanded, onToggle, onAccept, onReject }) {
  const steps = explanation.reasoningSteps || [];
  const inputContext = explanation.inputContext || {};

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50"
      >
        <span className="text-sm text-slate-700 line-clamp-1">{explanation.text}</span>
        <span className={`text-xs px-2 py-0.5 rounded ml-2 shrink-0 ${
          explanation.status === 'accepted' ? 'bg-green-100 text-green-800' :
          explanation.status === 'rejected' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
        }`}>
          {explanation.status}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50/50 space-y-4">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">How the LLM arrived at this explanation</h4>
          {/* Visual flow: Input context → Reasoning steps → Output */}
          <div className="flex flex-col gap-3">
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">1. Input to LLM</p>
              <div className="text-xs font-mono text-slate-700 space-y-1">
                <p><strong>Key:</strong> {inputContext.key ?? explanation.key}</p>
                {inputContext.sideA != null && <p><strong>Side A:</strong> {JSON.stringify(inputContext.sideA)}</p>}
                {inputContext.sideB != null && <p><strong>Side B:</strong> {JSON.stringify(inputContext.sideB)}</p>}
                {inputContext.differingFields?.length > 0 && <p><strong>Differing fields:</strong> {inputContext.differingFields.join(', ')}</p>}
              </div>
            </div>
            {steps.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="border-t border-slate-300 flex-1" />
                  <span className="text-xs">reasoning</span>
                  <span className="border-t border-slate-300 flex-1" />
                </div>
                {steps.map((step, i) => (
                  <div key={i} className="rounded border border-slate-200 bg-white p-3 flex gap-3">
                    <span className="text-slate-400 font-mono text-xs shrink-0">{i + 2}.</span>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="border-t border-slate-300 flex-1" />
                  <span className="text-xs">output</span>
                  <span className="border-t border-slate-300 flex-1" />
                </div>
              </>
            )}
            <div className="rounded border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-xs font-medium text-indigo-700 mb-1">Final explanation</p>
              <p className="text-sm text-slate-800">{explanation.text}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onAccept}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
