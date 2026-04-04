import express from "express";
import * as runStore from "../store/runs.js";
import * as typeStore from "../store/reconciliation-types.js";
import * as investigationsStore from "../store/investigations.js";
import { runInvestigation } from "../lib/investigateAgent.js";

const router = express.Router();

/**
 * POST /api/investigate
 * Body: { runId, goal? }
 *
 * Stub-first: deterministic investigate loop (no external LLM calls yet).
 */
router.post("/", (req, res) => {
  try {
    const { runId, goal = "Investigate reconciliation breaks" } = req.body || {};
    if (!runId) return res.status(400).json({ error: "Missing runId" });

    const run = runStore.getRun(runId);
    if (!run) return res.status(404).json({ error: "Run not found" });

    const configType = typeStore.get(run.reconciliationTypeId) || {};
    const keyField = configType?.keyField || "transaction_id";
    const valueFields =
      Array.isArray(configType?.valueFields) && configType.valueFields.length ? configType.valueFields : [];

    const breaks = runStore.listBreaks(runId);
    const datasets = runStore.getDatasets(runId);
    const sideA = datasets?.sideA || [];
    const sideB = datasets?.sideB || [];

    const daysBack = 7;
    const cutoffMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const historyRuns = runStore
      .listRuns()
      .filter((r) => r.id !== runId && r.reconciliationTypeId === run.reconciliationTypeId)
      .filter((r) => new Date(r.startedAt).getTime() >= cutoffMs)
      .map((r) => {
        const hd = runStore.getDatasets(r.id);
        if (!hd) return null;
        return {
          runId: r.id,
          startedAt: r.startedAt,
          sideA: hd.sideA || [],
          sideB: hd.sideB || [],
        };
      })
      .filter(Boolean);

    const inv = runInvestigation({
      runId,
      reconciliationTypeId: run.reconciliationTypeId,
      config: { keyField, valueFields },
      breaks,
      sideARows: sideA,
      sideBRows: sideB,
      historyRuns,
      goal,
    });

    const stored = investigationsStore.create({
      runId,
      reconciliationTypeId: run.reconciliationTypeId,
      goal,
      steps: inv.steps,
      hypotheses: inv.hypotheses,
      matchProposals: inv.matchProposals || [],
    });

    res.status(201).json(stored);
  } catch (err) {
    res.status(500).json({ error: err.message || "Investigation failed" });
  }
});

/**
 * GET /api/investigate?runId=...
 */
router.get("/", (req, res) => {
  try {
    const { runId } = req.query || {};
    if (!runId) return res.status(400).json({ error: "Missing runId query parameter" });
    res.json(investigationsStore.listByRunId(runId));
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch investigations" });
  }
});

export default router;

