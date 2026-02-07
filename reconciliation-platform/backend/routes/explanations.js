import express from "express";
import * as store from "../store/explanations.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const filters = {};
    if (req.query.runId) filters.runId = req.query.runId;
    if (req.query.breakId) filters.breakId = req.query.breakId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.accepted === "true") filters.accepted = true;
    if (req.query.rejected === "true") filters.rejected = true;
    res.json(store.list(filters));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  const explanation = store.get(req.params.id);
  if (!explanation) return res.status(404).json({ error: "Not found" });
  res.json(explanation);
});

router.post("/", (req, res) => {
  try {
    const explanation = store.create(req.body);
    res.status(201).json(explanation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/accept", (req, res) => {
  const explanation = store.accept(req.params.id);
  if (!explanation) return res.status(404).json({ error: "Not found" });
  res.json(explanation);
});

router.post("/:id/reject", (req, res) => {
  const explanation = store.reject(req.params.id);
  if (!explanation) return res.status(404).json({ error: "Not found" });
  res.json(explanation);
});

export default router;
