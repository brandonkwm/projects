import express from "express";
import * as runStore from "../store/runs.js";
import * as explanationStore from "../store/explanations.js";

const router = express.Router();

/**
 * Dashboard metrics: matches, mismatches, orphans (from runs); explanations total, accepted, rejected.
 * Optional: by run (runId), or rolled up (all runs, or last N days).
 */
router.get("/metrics", (req, res) => {
  try {
    const runs = runStore.listRuns();
    const explanationMetrics = explanationStore.getMetrics();

    const rollup = runs.reduce(
      (acc, run) => {
        acc.matches += run.counts?.matches ?? 0;
        acc.mismatches += run.counts?.mismatches ?? 0;
        acc.orphansA += run.counts?.orphansA ?? 0;
        acc.orphansB += run.counts?.orphansB ?? 0;
        acc.orphans += (run.counts?.orphansA ?? 0) + (run.counts?.orphansB ?? 0);
        return acc;
      },
      { matches: 0, mismatches: 0, orphansA: 0, orphansB: 0, orphans: 0 }
    );

    res.json({
      runs: {
        total: runs.length,
        matches: rollup.matches,
        mismatches: rollup.mismatches,
        orphansA: rollup.orphansA,
        orphansB: rollup.orphansB,
        orphans: rollup.orphans,
      },
      explanations: {
        total: explanationMetrics.total,
        accepted: explanationMetrics.accepted,
        rejected: explanationMetrics.rejected,
        pending: explanationMetrics.pending,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Recent runs for dashboard list.
 */
router.get("/runs", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const runs = runStore.listRuns().slice(0, limit);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
