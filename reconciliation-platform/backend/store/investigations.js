/**
 * In-memory store for deterministic investigation results.
 * Each investigation contains:
 * - steps[]: diagnostic/tool results (auditable)
 * - hypotheses[]: ranked root-cause hypotheses with evidence summaries
 */

const investigations = [];

export function create({
  runId,
  reconciliationTypeId = null,
  goal = "",
  steps = [],
  hypotheses = [],
  matchProposals = [],
}) {
  if (!runId) throw new Error("Missing runId");

  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const investigation = {
    id,
    runId,
    reconciliationTypeId,
    goal,
    status: "completed",
    createdAt: new Date().toISOString(),
    steps,
    hypotheses,
    matchProposals,
  };

  investigations.push(investigation);
  return investigation;
}

export function listByRunId(runId) {
  if (runId == null) return [];
  return investigations
    .filter((i) => i.runId === runId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function get(id) {
  return investigations.find((i) => i.id === id) ?? null;
}

function findProposal(proposalId) {
  for (const inv of investigations) {
    const p = Array.isArray(inv.matchProposals) ? inv.matchProposals.find((x) => x.id === proposalId) : null;
    if (p) return { investigation: inv, proposal: p };
  }
  return { investigation: null, proposal: null };
}

export function listProposalsByRunId(runId) {
  const invs = listByRunId(runId);
  return invs.flatMap((inv) => Array.isArray(inv.matchProposals) ? inv.matchProposals : []);
}

export function getProposal(proposalId) {
  const { proposal } = findProposal(proposalId);
  return proposal ?? null;
}

export function setProposalDecision(proposalId, decision) {
  if (!["accepted", "rejected"].includes(decision)) return null;
  const { investigation, proposal } = findProposal(proposalId);
  if (!investigation || !proposal) return null;
  if (proposal.status === "accepted" || proposal.status === "rejected") return proposal;

  proposal.status = decision;
  proposal.decidedAt = new Date().toISOString();
  return proposal;
}

