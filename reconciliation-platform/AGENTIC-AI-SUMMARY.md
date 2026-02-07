# How Agentic AI Solves the Problem — Summary

**One-pager for explaining the use of agentic AI, the models, and the value add.**

---

## The problem

Reconciliation = comparing two datasets (e.g. ledger vs bank) on a **key** and several **value** fields. Outcomes: **match**, **mismatch** (break), or **orphan** (key only on one side). Operations need to know not just *that* something broke, but *why*, and to find similar cases quickly — without writing queries.

---

## How agentic AI is used to solve it

**“Agentic”** here means a single **agent** that **orchestrates** when to use rules vs language models and then **reasons in natural language** over the results.

| Step | What happens | Role of the agent / AI |
|------|----------------|-------------------------|
| **Decide** | For each key, compare value fields using **configurable rules** (exact, tolerance, mapping). | Rules engine does the **deterministic** decision (match / mismatch / orphan). The agent **chooses** which rule applies per field and can hand off to the LLM when the rule is “uncertain” or there is no rule. |
| **Explain** | For every break (and optionally matches), generate a **human-readable explanation** of why it matched or broke. | The agent calls the **LLM** with context (key, Side A/B values, which fields differ, which rule fired) and gets back a short explanation + optional **reasoning steps** (how the model got there). |
| **Answer** | User asks in plain language: “Which breaks mention rounding?” or “Similar to this one?” | The agent runs **semantic search** (keyword or embeddings) over breaks and explanations, then can use the **LLM** to **synthesise** an answer and point to relevant records. |

So the agent **does not replace** the rule engine; it **wraps** it: rules give the decision, the LLM gives the **reasoning in language** and handles **fuzzy cases** and **Q&A**.

---

## Models used (conceptual)

| Component | Model / mechanism | Purpose |
|-----------|-------------------|--------|
| **Decision** | Rules engine (deterministic) | Match / mismatch / orphan; one source of truth for the outcome. |
| **Explanation** | **LLM** (e.g. GPT-4, Claude) | Turn “rule X fired, values A vs B” into a short, audit-friendly explanation and optional step-by-step reasoning. |
| **Semantic Q&A** | **Embeddings** (optional) + **LLM** | Find relevant breaks by meaning; LLM summarises or answers in natural language. |
| **Fog of war** | **LLM** | When there’s no similar historical break, LLM still explains from context and can say “no similar case — novel; suggest review.” |

In practice: one **LLM** can do both “explain this break” and “answer this question”; the **rules engine** is logic, not a learned model.

---

## Value add from the AI

| Without AI (rules only) | With agentic AI |
|-------------------------|------------------|
| You see “mismatch” or “orphan” with no story. | You see **why** in plain language (e.g. “Rounding 0.01; likely FX”) and, where supported, **how** the model got there (reasoning steps). |
| Finding similar breaks = writing filters or SQL. | **Semantic Q&A**: ask in natural language; get an answer plus pointers to breaks. |
| New or rare breaks are opaque. | LLM explains from **context** and can flag **“no similar historical case”** (fog of war) for review. |
| Audit = “the rule said mismatch.” | Audit = **human-readable explanation** + optional reasoning trail, plus accept/reject for quality and future backtest. |

**In one line:** The AI adds **explainability**, **natural-language search and answers**, and **handling of the unknown** — while the rules engine remains the single source of truth for the **decision**.

---

## Sound bites for stakeholders

- **“Agentic”** = one agent that orchestrates rules + LLM and reasons in language over reconciliation results.
- **Rules** = the decision (match/mismatch/orphan). **LLM** = the explanation, edge cases, and Q&A.
- **Value:** Plain-language explanations, semantic Q&A, and explicit handling of “no similar past case” (fog of war), with full auditability and accept/reject for improving the system over time.
