import express from "express";
import cors from "cors";
import reconciliationTypesRouter from "./routes/reconciliation-types.js";
import runsRouter from "./routes/runs.js";
import explanationsRouter from "./routes/explanations.js";
import dashboardRouter from "./routes/dashboard.js";
import askRouter from "./routes/ask.js";
import * as runStore from "./store/runs.js";
import * as explanationStore from "./store/explanations.js";

const app = express();

// Seed demo run + explanations for dashboard (if no runs yet)
function seedDemo() {
  const runs = runStore.listRuns();
  if (runs.length > 0) return;
  const run = runStore.createRun({ reconciliationTypeId: "cash-vs-bank" });
  runStore.completeRun(run.id, {
    matches: 142,
    mismatches: 8,
    orphansA: 2,
    orphansB: 1,
  }, 8);
  const b1 = { id: "break-demo-1", key: "TXN-001", outcome: "mismatch", sideA: { amount: 100.01 }, sideB: { amount: 100.00 }, differingFields: ["amount"] };
  const b2 = { id: "break-demo-2", key: "TXN-002", outcome: "orphan_a", sideA: { amount: 50 }, sideB: null, differingFields: [] };
  const b3 = { id: "break-demo-3", key: "TXN-099", outcome: "orphan_b", sideA: null, sideB: { amount: 200, date: "2024-01-15" }, differingFields: [] };
  const b4 = { id: "break-demo-4", key: "TXN-055", outcome: "duplicate_key", sideA: [{ amount: 10 }, { amount: 12 }], sideB: { amount: 11 }, differingFields: ["amount"] };
  runStore.setBreaks(run.id, [b1, b2, b3, b4]);
  const exp1 = explanationStore.create({
    runId: run.id, breakId: b1.id, key: "TXN-001",
    text: "Amount mismatch: rounding 0.01; likely FX.",
    inputContext: { key: "TXN-001", sideA: { amount: 100.01 }, sideB: { amount: 100.00 }, differingFields: ["amount"] },
    reasoningSteps: [
      "Compared field 'amount': Side A = 100.01, Side B = 100.00.",
      "Absolute difference 0.01; outside configured tolerance 0.00 (exact match).",
      "Conclusion: mismatch likely due to rounding (e.g. FX or decimal handling).",
    ],
  });
  explanationStore.accept(exp1.id);
  const exp2 = explanationStore.create({
    runId: run.id, breakId: b2.id, key: "TXN-002",
    text: "Orphan on A: no corresponding settlement on B.",
    inputContext: { key: "TXN-002", sideA: { amount: 50 }, sideB: null, differingFields: [] },
    reasoningSteps: [
      "Key TXN-002 present on Side A only; no row with this key on Side B.",
      "Classified as orphan (A-only).",
      "Conclusion: transaction not yet settled or missing from counterparty feed.",
    ],
  });
  explanationStore.reject(exp2.id);
  const exp3 = explanationStore.create({
    runId: run.id, breakId: b1.id, key: "TXN-003",
    text: "Possible timing difference; settlement pending.",
    inputContext: { key: "TXN-003", sideA: { amount: 99.99 }, sideB: { amount: 100 }, differingFields: ["amount"] },
    reasoningSteps: [
      "Amounts differ by 0.01; within typical rounding.",
      "No other fields to compare; single-field break.",
      "Conclusion: likely timing or settlement lag.",
    ],
  });
  explanationStore.accept(exp3.id);
  const exp4 = explanationStore.create({
    runId: run.id, breakId: b3.id, key: "TXN-099",
    text: "Orphan on B: key only on Side B (bank); no corresponding ledger entry.",
    inputContext: { key: "TXN-099", sideA: null, sideB: { amount: 200, date: "2024-01-15" }, differingFields: [] },
    reasoningSteps: [
      "Key TXN-099 present on Side B only; no row on Side A.",
      "Classified as orphan (B-only).",
      "Conclusion: bank transaction not yet posted to ledger or external-only.",
    ],
  });
  explanationStore.accept(exp4.id);
  const exp5 = explanationStore.create({
    runId: run.id, breakId: b4.id, key: "TXN-055",
    text: "Duplicate key on Side A (two rows); no similar historical case — treat as novel. Possible split booking or data error.",
    inputContext: { key: "TXN-055", sideA: [{ amount: 10 }, { amount: 12 }], sideB: { amount: 11 }, differingFields: ["amount"] },
    reasoningSteps: [
      "Side A has two rows for key TXN-055; Side B has one.",
      "Break type: duplicate_key. No similar historical break in corpus.",
      "Conclusion: unknown pattern; suggest human review.",
    ],
  });
  explanationStore.accept(exp5.id);
}
seedDemo();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/api/reconciliation-types", reconciliationTypesRouter);
app.use("/api/runs", runsRouter);
app.use("/api/explanations", explanationsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ask", askRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Reconciliation platform API at http://localhost:${PORT}`);
});
