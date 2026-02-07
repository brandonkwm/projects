import express from "express";
import * as runStore from "../store/runs.js";
import * as explanationStore from "../store/explanations.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    res.json(runStore.listRuns());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  const run = runStore.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json(run);
});

/** Run with full details: run + breaks + explanations + mock datasets (for run detail view). */
router.get("/:id/full", (req, res) => {
  const run = runStore.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Not found" });
  const breaks = runStore.listBreaks(req.params.id);
  const explanations = explanationStore.list({ runId: req.params.id });
  const datasets = getMockDatasets(req.params.id);
  res.json({ run, breaks, explanations, datasets });
});

function getMockDatasets(runId) {
  return {
    sideA: [
      { transaction_id: "TXN-001", amount: 100.01, date: "2024-01-10", counterparty: "Acme" },
      { transaction_id: "TXN-002", amount: 50, date: "2024-01-11", counterparty: "Beta" },
      { transaction_id: "TXN-003", amount: 99.99, date: "2024-01-12", counterparty: "Gamma" },
    ],
    sideB: [
      { transaction_id: "TXN-001", amount: 100.0, date: "2024-01-10", counterparty: "Acme" },
      { transaction_id: "TXN-003", amount: 100, date: "2024-01-12", counterparty: "Gamma" },
      { transaction_id: "TXN-099", amount: 200, date: "2024-01-15", counterparty: "Other" },
    ],
  };
}

router.post("/", (req, res) => {
  try {
    const run = runStore.createRun(req.body);
    res.status(201).json(run);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id/breaks", (req, res) => {
  const run = runStore.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json(runStore.listBreaks(req.params.id));
});

export default router;
