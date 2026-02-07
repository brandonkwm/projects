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

/** Run with full details: run + breaks + explanations + datasets (uploaded data if from compare). */
router.get("/:id/full", (req, res) => {
  const run = runStore.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Not found" });
  const breaks = runStore.listBreaks(req.params.id);
  const explanations = explanationStore.list({ runId: req.params.id });
  const datasets = runStore.getDatasets(req.params.id);
  res.json({ run, breaks, explanations, datasets });
});

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
