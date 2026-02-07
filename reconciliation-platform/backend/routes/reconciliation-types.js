import express from "express";
import * as store from "../store/reconciliation-types.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    res.json(store.list());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  const type = store.get(req.params.id);
  if (!type) return res.status(404).json({ error: "Not found" });
  res.json(type);
});

router.post("/", (req, res) => {
  try {
    const type = store.create(req.body);
    res.status(201).json(type);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const type = store.update(req.params.id, req.body);
  if (!type) return res.status(404).json({ error: "Not found" });
  res.json(type);
});

router.delete("/:id", (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

export default router;
