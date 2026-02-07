# Design clarifications: source of truth, rules vs LLM, fog of war

## 1. Source of truth

We need to indicate a **source of truth** (which side is authoritative) so the LLM can frame how to match and explain.

- **Config:** Per reconciliation type (or per run), set e.g. `sourceOfTruth: "A" | "B"`. Example: Side A = internal ledger (truth), Side B = bank statement.
- **Use:** Pass into the LLM prompt so explanations are framed correctly: e.g. "Ledger (source of truth) shows 100.00; bank shows 100.01 — likely bank rounding." The LLM can then describe which side deviates from truth and what "correct" means.

## 2. Rules vs LLM — why use an LLM when a decision engine could decide?

| | Decision engine (rules) | LLM |
|---|-------------------------|-----|
| **Role** | Does the **deterministic** comparison (e.g. amount with tolerance 0.01 → match/mismatch). | Does **not** replace the rule for the outcome. |
| **Value** | Fast, auditable, consistent. One source of truth for the decision. | **Explainability** — Rule says "mismatch"; LLM says *why* in natural language ("Rounding 0.01; likely FX."). **Fuzzy cases** — When rule is "uncertain" or there is no rule (free text, names), LLM suggests and explains. **Semantic Q&A** — "Find breaks about rounding," summarisation. |

**Summary:** Rules = the **decision**. LLM = **explanation**, edge cases, and Q&A. A decision engine alone is sufficient for the outcome; the LLM adds reasoning in language and handling the unknown.

When a rule is configured (e.g. amount, tolerance) and the rule is broken (amounts mismatch), the **rule** decides "mismatch." The **LLM** is told "Rule X fired: amount outside tolerance" and then explains in human terms why that might be (rounding, timing, etc.). So the LLM knows which rule was applied and can reference it in the explanation.

## 3. No historical case for a break (fog of war)

When there is no similar past break:

- **LLM can still explain from context:** Key, Side A/B values, differing fields, rule that fired. It can say e.g. "Amounts differ by 0.02. No similar historical break found — treat as novel; possible data error or new scenario."
- **Surface uncertainty:** Return `confidence: low` or `pattern: unknown` so the UI can flag for human review.
- **Explicit "fog of war":** Include in the explanation text something like "No similar historical case" so the unknown is visible, not hidden.

## 4. More break types and viewing underlying datasets

- **Break types:** Support more outcome types: `mismatch`, `orphan_a`, `orphan_b`, `duplicate_key` (key repeated on one side), `timing_drift`, etc.
- **View underlying datasets:** On run detail, show a few lines of the raw Side A and Side B datasets that were compared (mock or real) so users can see the input data alongside breaks and explanations.
