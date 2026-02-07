# Reconciliation Platform with Agentic AI — Brainstorm & Approach

**Audience:** Financial services PM expanding portfolio; showcase depth of AI usage.  
**Core idea:** Reconciliation = comparison of two datasets with a common key and multiple comparable value fields, powered by agentic AI for matching, reasoning, and operations.

---

## 1. Reconciliation Model (Refined)

| Concept | Definition |
|--------|-------------|
| **Key** | Common identifier across both datasets (e.g. `transaction_id`, `account_id`, `settlement_ref`). Used to align rows. |
| **Value(s)** | One or more fields to compare per key (e.g. amount, currency, date, counterparty, status). |
| **Match** | For a given key, all configured value fields agree (exact or rule-based) across the two sides. |
| **Mismatch / Break** | One or more value fields differ, or key exists only on one side (orphan). |

**Dataset roles (typical in finance):**
- **Side A** — e.g. internal ledger, front-office, bank statement.
- **Side B** — e.g. counterparty statement, clearing house, regulatory report.

So we have: **Key + [Value₁, Value₂, …]** on each side, and we compare value-by-value.

---

## 2. Architecture — Option C (Selected)

**Hybrid: reconciliation engine + ops-portal later.**

- **Reconciliation engine (API)** — Owns matching, configurable rules, LLM reasoning, and semantic search. No UI required for Phase 1; API-first.
- **Ops-portal (later)** — Consumes the engine for case creation, notifications, and UI when we add that back.

**Phase 1 scope:** Build the agentic AI engine only (orchestration, rules, reasoning, semantic search). Notifications and full ops-portal integration are out of scope until the AI showcase is solid.

---

## 2a. Normalization vs Data Engineering — Who Does What?

Normalization (de-dup, delimit, standardize formats, merge/split columns) is **inherently data-engineering heavy**. The reconciliation platform should not try to own that entirely; it should define a **clear boundary**.

| Responsibility | Owner | Rationale |
|----------------|--------|-----------|
| **Heavy normalization** (de-dup, delimit, column splits/merges, joins to reference data, cleansing pipelines) | **Data engineering / upstream** | Requires pipelines, lineage, and domain knowledge. Keeps reconciliation engine focused on *compare + reason*. |
| **Contract at the boundary** | **Reconciliation engine** | Engine *expects* datasets that are already keyed and value-shaped: one row per key (or explicit multi-row policy), and field names/types known. Input can be CSV/JSON from a pipeline or from an API that DE owns. |
| **Light, configurable normalization** (optional, in-engine) | **Reconciliation engine** | Only what's needed to make *comparison* fair: trim, case, decimal places, date format, null handling. Configurable per field (e.g. "normalize amount to 2 decimals"). No de-dup or structural changes. |
| **AI-assisted suggestions** | **Agent** | LLM can *suggest* normalization or de-dup rules by inspecting sample data (e.g. "Side B has comma decimals; suggest normalizing to period") or "Duplicate keys on A — suggest keep-latest-by-date." Engine doesn't run DE pipelines; it outputs recommendations for DE or for config. |

**Practical split:**
- **Upstream:** Data engineering produces "reconciliation-ready" datasets (one logical row per key, deduplicated, delimited, and optionally standardized). They can expose these via file drop, API, or warehouse view.
- **Engine:** Accepts those datasets; optionally applies **light normalization** (trim, case, format) per reconciliation-type config; then runs align → compare → reason. If input has duplicates or wrong shape, engine can *detect and report* (e.g. "Duplicate keys on Side A: 12") and optionally let the agent *suggest* a resolution for DE to implement upstream.
- **No heavy DE inside the engine:** No built-in ETL, de-dup pipelines, or delimiter parsing beyond what's needed to read CSV/JSON and map columns to key + value set. That keeps the showcase about **agentic matching and reasoning**, not data plumbing.

---

## 3. Agentic AI — What “Agentic” Means Here

The **agent** is the component that decides *how* to match, when to use rules vs LLM, and how to explain results.

**Core loop (conceptual):**
1. **Ingest** — Two datasets (e.g. CSV/JSON/API); apply *light* normalization only (see §2a). Expect key + value set per side.
2. **Align** — Join on key; detect orphans (key only on A or only on B).
3. **Compare** — For each key, compare each value field (exact, tolerance, or rule).
4. **Classify** — Match / Mismatch / Orphan (A-only, B-only).
5. **Reason** — For mismatches (and optionally matches), call LLM to explain *why* (see below).
6. **Persist & index** — Store results and explanations; index for semantic search. (Notifications deferred.)

**Where the “agent” shows up:**
- **Orchestration:** Chooses between rule-based comparison vs “ask LLM” for fuzzy or complex fields (e.g. free-text descriptions, names).
- **Reasoning:** For every break (and optionally a sample of matches), the LLM produces a short explanation (e.g. “Amount mismatch: rounding difference 0.01; likely FX rounding.”).
- **Routing:** Optional “should we auto-close this break?” — agent suggests yes/no and why; human or rule can confirm.
- **Search:** User asks in natural language; agent uses semantic search + LLM to return relevant breaks, rules, or past reconciliations.

So “agentic” = **orchestration + reasoning + optional routing + semantic Q&A**.

---

## 4. LLM Reasoning — Why Match / Why Mismatch

**Goals:**
- Explain **why** a row is a match (e.g. “All amounts and dates align; counterparty name normalized.”).
- Explain **why** a row is a mismatch (e.g. “Side A amount 100.00 vs Side B 100.01; likely rounding.”).

**Design choices:**

| Aspect | Options |
|--------|--------|
| **When to reason** | Only on mismatches (cheaper); or sample of matches + all mismatches (better for audits). |
| **Input to LLM** | Key, Side A values, Side B values, which field(s) differ, rule that fired (if any). |
| **Output** | Short paragraph or structured (e.g. `reason`, `confidence`, `suggested_action`). |
| **Caching** | Same (key, diff) pattern → reuse explanation to save cost and keep consistency. |

**Prompt shape (conceptual):**  
“You are a reconciliation analyst. Key: {key}. Side A: {values}. Side B: {values}. Mismatch on: {fields}. Rule applied: {rule}. In 1–2 sentences, explain why this is a match/mismatch and, if mismatch, what the cause likely is.”

This gives you **audit trail + showcase**: “Our platform doesn’t just flag breaks; it explains them in plain language.”

---

## 5. Configurable Rules Engine

Rules determine **how** each value field is compared (before or instead of pure LLM).

**Rule types (examples):**
- **Exact** — A.value === B.value.
- **Numeric tolerance** — e.g. `|A - B| <= 0.01` or `<= 0.1%`.
- **Date tolerance** — same day, or within N business days.
- **Normalize then compare** — trim, uppercase, remove punctuation; then exact.
- **Allowlist / mapping** — e.g. status “Pending” on A = “P” on B.
- **Custom expression** — e.g. small DSL or safe eval: “A.amount + A.fee === B.gross”.

**Configuration (aligned with your citizen-developer angle):**
- **Per reconciliation type** (e.g. “Cash vs Bank”): select key field and which value fields to compare.
- **Per value field:** select rule type and parameters (tolerance, mapping table, etc.).
- **Priority:** Rule first; if rule says “mismatch” or “uncertain,” optionally pass to LLM for explanation or fuzzy override.

**Storage:** DB table or JSON config per “reconciliation type”; **Rules Config UI** in the reconciliation app to edit rules without code (systematic rules configured via UI).

---

## 5a. Rules Config UI (in scope)

- **UI to configure systematic rules** — No code required: define reconciliation types (e.g. Cash vs Bank), select key field, add value fields to compare, and per field choose rule type (exact, numeric tolerance, date tolerance, normalize-then-compare, mapping) and parameters.
- **Reconciliation type** — Name, key field, list of value fields; each value field has rule type + params (e.g. tolerance 0.01, date window 1 day).
- **Persistence** — Rules stored via API; engine uses them at run time. Versioning (later).

---

## 5b. Dashboard & Agentic AI Metrics (in scope)

**Dashboard** to track the outcomes of the agentic AI:

| Metric | Description |
|--------|--------------|
| **Matches** | Count of keys where all value fields agreed (rule or LLM). |
| **Mismatches (breaks)** | Count of keys where one or more value fields differed. |
| **Orphans** | Count of keys only on Side A or only on Side B (A-only, B-only). |
| **Explanations** | Total LLM explanations generated. |
| **Explanations — Accepted** | User (or rule) marked the explanation as accepted (correct / useful). |
| **Explanations — Rejected** | User marked the explanation as rejected (wrong / not useful). |

**Why split accepted vs rejected:** Enables quality tracking and, in future, **AI backtest on rejected explanations** — e.g. retrain or prompt-tune using rejected examples so the model improves over time. Dashboard should expose counts and, where useful, lists of rejected explanations for review and backtest input.

**Dashboard scope:** Per run and/or rolled up (e.g. last 7 days, by reconciliation type). Charts or tables: match/mismatch/orphan counts; explanation total vs accepted vs rejected.

---

## 6. Notifications *(deferred)*

Out of Phase 1 scope. When reintroduced: triggers (run complete, break threshold), channels (email, Slack, ops-portal cases), integration via ops-portal APIs.

---

## 7. Semantic Search — What to Search and Why

**Use cases:**
- “Find breaks where the explanation mentions rounding.”
- “Show me reconciliations where we had amount mismatches last month.”
- “What rules do we have for FX?”
- “Similar break to this one in the past.”

**What to index (embeddings + metadata):**
- **Break records:** key, side A/B values, which fields differed, LLM explanation text.
- **Reconciliation runs:** config name, date, summary (match/break counts), maybe summary reason.
- **Rules:** rule name, description, field, expression (if safe to index).

**Flow:** User query → embedding → vector search over the above → optional LLM “synthesis” to return a direct answer (agentic Q&A). This showcases “AI that helps you find and learn from past reconciliations.”

---

## 8. Data Flow (End-to-End)

```
[Dataset A] + [Dataset B]
       ↓
  Ingest & normalize (key + values)
       ↓
  Align by key (inner + left/right outer for orphans)
       ↓
  For each key: apply rules per value field → Match / Mismatch / Uncertain
       ↓
  For Mismatches (and optional Matches): LLM reason (with caching)
       ↓
  Persist: results, explanations, run metadata
       ↓
  Index for semantic search (breaks, runs, rules)
       ↓
  API: break list, filters, drill-down, Ask (semantic search + LLM). Notifications / ops-portal deferred.
```

---

## 9. Phase 1 (MVP) — Agentic AI First

**In scope (showcase depth of AI):**
- Two datasets (e.g. CSV/JSON), one key, 2–3 value fields. Input is *reconciliation-ready* (upstream/DE owns heavy normalization; engine does light normalization only per §2a).
- Configurable rules: exact, numeric tolerance, optional light normalize-then-compare.
- Agentic orchestration: rules first; optional LLM for fuzzy/complex fields; LLM explains every mismatch (and optionally a sample of matches).
- Semantic search: index break explanations and runs; Ask (natural language query → vector search + LLM synthesis).
- API + UI: run reconciliation, get breaks, get explanation, search; **Rules Config UI**; **Dashboard** (match/mismatch/orphan counts; explanations accepted vs rejected; future: backtest on rejected).

**In scope (UI):** Rules Config UI (configure reconciliation types and systematic rules); Dashboard (metrics: matches / mismatches / orphans; explanations total, accepted, rejected).

**Out of scope for Phase 1:** Notifications, case creation, ops-portal integration.

**Later (Phase 2+):**
- More rule types, rule UI, versioning.
- Agent suggests auto-close or escalate with reasoning.
- Notifications + full integration with ops-portal (cases, workflows, communication templates).
- More data sources (DB, APIs, cloud storage); dashboards; reconciliation types as first-class config.

---

## 10. Tech Stack (Suggestions)

- **Backend:** Node/TypeScript or Python (good for LLM SDKs and async).
- **LLM:** OpenAI / Azure OpenAI / Anthropic; reasoning as structured or plain-text completion.
- **Vector DB:** For semantic search (e.g. Pinecone, Weaviate, pgvector, or in-memory for MVP).
- **Rules:** JSON config or simple DSL; interpreter in backend.
- **Storage:** Postgres (or similar) for runs, breaks, keys, values, explanations. (Notifications deferred.)
- **API:** REST or tRPC for “run reconciliation,” “get breaks,” “search,” “get explanation.”

---

## 11. One-Pager for “Depth of AI” Story (Phase 1)

- **Agentic:** One agent orchestrates rules vs LLM, explains every break, and powers semantic Q&A over breaks and rules.
- **Reasoning:** LLM explains why match/mismatch in plain language; cache for cost and consistency.
- **Configurable:** Rules engine (exact, tolerance, light normalize, mapping) so the same engine works across many reconciliation types.
- **Boundary-aware:** Heavy normalization stays with data engineering; engine does light normalization and can suggest or report issues. **API-first:** No notifications in Phase 1; ops-portal integration when ready.
- **Discoverable:** Semantic search over breaks and rules so users can find and learn from past reconciliations without writing queries.

If you want, next step can be: (1) a minimal data model (tables/entities), or (2) a short API spec (endpoints and payloads), or (3) a single “reconciliation type” example (e.g. cash vs bank) with sample rules and prompts.
