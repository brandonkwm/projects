import express from "express";
import multer from "multer";
import * as runStore from "../store/runs.js";
import * as explanationStore from "../store/explanations.js";
import * as typeStore from "../store/reconciliation-types.js";
import { parseToRows } from "../lib/parseFiles.js";
import { compare as runCompare, explainBreak } from "../lib/compare.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const router = express.Router();

/**
 * POST /api/compare
 * Body: multipart/form-data with sideA (file), sideB (file), reconciliationTypeId (string).
 * Parses both files (CSV or JSON), runs comparison, creates run + breaks + deterministic explanations.
 */
router.post("/", upload.fields([{ name: "sideA", maxCount: 1 }, { name: "sideB", maxCount: 1 }]), (req, res) => {
  try {
    const files = req.files || {};
    const sideAFile = files.sideA?.[0];
    const sideBFile = files.sideB?.[0];
    const reconciliationTypeId = req.body?.reconciliationTypeId?.trim() || "cash-vs-bank";

    if (!sideAFile || !sideBFile) {
      return res.status(400).json({ error: "Missing sideA or sideB file. Upload two files." });
    }

    const config = typeStore.get(reconciliationTypeId);
    const keyField = config?.keyField || "transaction_id";
    const valueFields = config?.valueFields || [{ name: "amount", ruleType: "numeric_tolerance", params: { tolerance: 0.01 } }];

    const sideARows = parseToRows(sideAFile.buffer, sideAFile.mimetype, sideAFile.originalname);
    const sideBRows = parseToRows(sideBFile.buffer, sideBFile.mimetype, sideBFile.originalname);

    if (sideARows.length === 0) return res.status(400).json({ error: "Side A file has no rows." });
    if (sideBRows.length === 0) return res.status(400).json({ error: "Side B file has no rows." });

    const { matches, breaks } = runCompare(sideARows, sideBRows, { keyField, valueFields });

    const run = runStore.createRun({ reconciliationTypeId });
    runStore.completeRun(run.id, {
      matches: matches.length,
      mismatches: breaks.filter((b) => b.outcome === "mismatch").length,
      orphansA: breaks.filter((b) => b.outcome === "orphan_a").length,
      orphansB: breaks.filter((b) => b.outcome === "orphan_b").length,
    }, breaks.length);

    const breakIds = breaks.map((b, i) => ({
      ...b,
      id: `break-${run.id}-${i}-${Math.random().toString(36).slice(2, 9)}`,
    }));
    runStore.setBreaks(run.id, breakIds);
    runStore.setDatasets(run.id, sideARows, sideBRows);

    for (const b of breakIds) {
      const { text, reasoningSteps, inputContext } = explainBreak(b, valueFields);
      const exp = explanationStore.create({
        runId: run.id,
        breakId: b.id,
        key: b.key,
        text,
        inputContext,
        reasoningSteps,
      });
    }

    res.status(201).json({
      run,
      summary: {
        matches: matches.length,
        breaks: breaks.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Compare failed." });
  }
});

export default router;
