/**
 * In-memory store for reconciliation runs and breaks.
 * Run has: reconciliationTypeId, counts (matches, mismatches, orphansA, orphansB), explanationCount.
 * Break has: runId, key, sideA, sideB, outcome, differingFields.
 */

const runs = [];
const breaksByRunId = new Map();

export function listRuns() {
  return [...runs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export function getRun(id) {
  return runs.find((r) => r.id === id) ?? null;
}

export function createRun(body) {
  const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const run = {
    id,
    reconciliationTypeId: body.reconciliationTypeId ?? null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    counts: {
      matches: 0,
      mismatches: 0,
      orphansA: 0,
      orphansB: 0,
    },
    explanationCount: 0,
  };
  runs.push(run);
  return run;
}

export function completeRun(id, counts, explanationCount) {
  const run = runs.find((r) => r.id === id);
  if (!run) return null;
  run.completedAt = new Date().toISOString();
  run.counts = counts ?? run.counts;
  run.explanationCount = explanationCount ?? run.explanationCount;
  return run;
}

export function listBreaks(runId) {
  return breaksByRunId.get(runId) ?? [];
}

export function addBreak(runId, breakRecord) {
  const list = breaksByRunId.get(runId) ?? [];
  list.push({ id: `break-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, runId, ...breakRecord });
  breaksByRunId.set(runId, list);
  return list[list.length - 1];
}

export function setBreaks(runId, breakList) {
  breaksByRunId.set(runId, breakList);
}
