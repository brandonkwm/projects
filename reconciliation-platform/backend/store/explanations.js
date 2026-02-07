/**
 * In-memory store for LLM explanations.
 * status: 'pending' | 'accepted' | 'rejected'
 * Dashboard metrics: total, accepted, rejected; future backtest on rejected.
 */

const explanations = [];

export function list(filters = {}) {
  let list = [...explanations];
  if (filters.runId != null) list = list.filter((e) => e.runId === filters.runId);
  if (filters.breakId != null) list = list.filter((e) => e.breakId === filters.breakId);
  if (filters.status != null) list = list.filter((e) => e.status === filters.status);
  if (filters.accepted === true) list = list.filter((e) => e.status === "accepted");
  if (filters.rejected === true) list = list.filter((e) => e.status === "rejected");
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function get(id) {
  return explanations.find((e) => e.id === id) ?? null;
}

export function create(body) {
  const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const explanation = {
    id,
    runId: body.runId,
    breakId: body.breakId,
    key: body.key,
    text: body.text ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
    // How the LLM arrived at the explain: input sent to model + reasoning steps
    inputContext: body.inputContext ?? null, // { key, sideA, sideB, differingFields }
    reasoningSteps: body.reasoningSteps ?? null, // string[] e.g. ["Compared amount...", "Conclusion: ..."]
  };
  explanations.push(explanation);
  return explanation;
}

export function setStatus(id, status) {
  const e = explanations.find((x) => x.id === id);
  if (!e || !["accepted", "rejected", "pending"].includes(status)) return null;
  e.status = status;
  e.updatedAt = new Date().toISOString();
  return e;
}

export function accept(id) {
  return setStatus(id, "accepted");
}

export function reject(id) {
  return setStatus(id, "rejected");
}

/**
 * Dashboard metrics: counts for explanations by status.
 */
export function getMetrics() {
  const total = explanations.length;
  const accepted = explanations.filter((e) => e.status === "accepted").length;
  const rejected = explanations.filter((e) => e.status === "rejected").length;
  const pending = explanations.filter((e) => e.status === "pending").length;
  return { total, accepted, rejected, pending };
}

/**
 * Semantic Q&A: keyword search over explanation text and key.
 * Returns matching explanations + snippet; for MVP no embeddings.
 * runId optional to scope to one run.
 */
export function searchByQuestion(question, runId = null) {
  const q = (question || "").toLowerCase().trim();
  if (!q) return [];
  let list = [...explanations];
  if (runId != null) list = list.filter((e) => e.runId === runId);
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = list.map((e) => {
    const searchable = [e.text, e.key, JSON.stringify(e.inputContext || {})].join(" ").toLowerCase();
    const matchCount = terms.filter((t) => searchable.includes(t)).length;
    return { explanation: e, matchCount, terms };
  });
  return scored
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((s) => ({ ...s.explanation, snippet: s.explanation.text }));
}
