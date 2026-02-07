import express from "express";
import * as explanationStore from "../store/explanations.js";
import * as runStore from "../store/runs.js";

const router = express.Router();

/**
 * Semantic Q&A: ask a natural language question, optionally scoped to a run.
 * Returns: { answer, matches } where matches are explanations (with snippet) and answer is a short summary.
 * MVP: keyword search over explanation text and keys; answer is synthesized from match count and snippets.
 */
router.post("/", (req, res) => {
  try {
    const { question, runId } = req.body || {};
    const matches = explanationStore.searchByQuestion(question || "", runId || null);

    let answer;
    if (matches.length === 0) {
      answer = "No breaks or explanations match your question. Try different keywords (e.g. amount, rounding, orphan, mismatch).";
    } else {
      const snippetList = matches.slice(0, 5).map((m) => `• ${m.key}: ${m.text}`).join("\n");
      answer = `Found ${matches.length} matching explanation(s):\n\n${snippetList}`;
      if (matches.length > 5) answer += `\n\n... and ${matches.length - 5} more.`;
    }

    res.json({ question: question || "", runId: runId || null, answer, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
