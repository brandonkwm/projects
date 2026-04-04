/**
 * In-memory store for reconciliation runs and breaks.
 * Run has: reconciliationTypeId, counts (matches, mismatches, orphansA, orphansB), explanationCount.
 * Break has: runId, key, sideA, sideB, outcome, differingFields.
 */

const runs = [];
const breaksByRunId = new Map();
const datasetsByRunId = new Map();

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

export function setDatasets(runId, sideA, sideB) {
  datasetsByRunId.set(runId, { sideA: sideA || [], sideB: sideB || [] });
}

export function getDatasets(runId) {
  return datasetsByRunId.get(runId) || null;
}

function clampNonNegative(n) {
  return n != null && Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function updateBreak(runId, breakId, patch) {
  const list = breaksByRunId.get(runId) ?? [];
  const i = list.findIndex((b) => b.id === breakId);
  if (i === -1) return null;
  const next = { ...list[i], ...(typeof patch === "function" ? patch(list[i]) : patch) };
  list[i] = next;
  breaksByRunId.set(runId, list);
  return next;
}

/**
 * Immediately reclassify an orphan break as a resolved match.
 * - Decrements the relevant orphan counter
 * - Increments matches
 * - Fills the missing-side row (sideA or sideB) from the proposal candidate row
 */
export function resolveOrphanBreakAsMatch(runId, breakId, { candidateRow }) {
  const run = runs.find((r) => r.id === runId);
  if (!run) return null;

  const list = breaksByRunId.get(runId) ?? [];
  const br = list.find((b) => b.id === breakId);
  if (!br) return null;

  if (br.outcome !== "orphan_a" && br.outcome !== "orphan_b") return null;
  if (!candidateRow) return null;

  const originalOutcome = br.outcome;

  if (originalOutcome === "orphan_a") {
    // Fill missing Side B
    br.sideB = candidateRow;
    br.outcome = "resolved_match";
    br.differingFields = [];
    run.counts.orphansA = clampNonNegative(run.counts.orphansA - 1);
  } else if (originalOutcome === "orphan_b") {
    // Fill missing Side A
    br.sideA = candidateRow;
    br.outcome = "resolved_match";
    br.differingFields = [];
    run.counts.orphansB = clampNonNegative(run.counts.orphansB - 1);
  }

  run.counts.matches = clampNonNegative(run.counts.matches + 1);
  breaksByRunId.set(runId, list);
  return br;
}
