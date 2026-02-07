# Reconciliation Platform — Agentic AI

Reconciliation engine with agentic AI: compare two datasets (key + value fields), configurable systematic rules, LLM explanations (match/mismatch), and dashboard metrics (matches, mismatches, orphans; explanations accepted/rejected for future backtest).

## Scope

- **Backend (API):** Reconciliation types (rules config), runs, breaks, explanations (with accept/reject), dashboard metrics.
- **Frontend:** Dashboard (metrics + recent runs), Rules config UI (reconciliation types, key field, value fields with rule types: exact, numeric tolerance, date tolerance, normalize-then-compare, mapping).
- **Data:** In-memory store (no DB). Seed run + explanations on first start for demo.

## Run locally

**Prerequisites:** Node.js 18+

1. **Backend**
   ```bash
   cd reconciliation-platform/backend
   npm install
   npm run dev
   ```
   API: http://localhost:3002

2. **Frontend** (separate terminal)
   ```bash
   cd reconciliation-platform/frontend
   npm install
   npm run dev
   ```
   App: http://localhost:5174 (proxies `/api` to backend)

## API

- `GET/POST/PUT/DELETE /api/reconciliation-types` — List, create, update, delete reconciliation types (key + value fields + rule types).
- `GET/POST /api/runs` — List runs, create run.
- `GET /api/runs/:id`, `GET /api/runs/:id/breaks` — Run detail and breaks.
- `GET/POST /api/explanations`, `POST /api/explanations/:id/accept`, `POST /api/explanations/:id/reject` — Explanations and accept/reject.
- `GET /api/dashboard/metrics` — Aggregated counts: matches, mismatches, orphans, explanations (total, accepted, rejected, pending).
- `GET /api/dashboard/runs?limit=10` — Recent runs.

## Next steps (from brainstorm)

- Wire run reconciliation to real matching + LLM (ingest two datasets, align, compare with rules, generate explanations).
- Semantic search over breaks/explanations; “Ask” natural language.
- Backtest on rejected explanations (retrain / prompt-tune).
