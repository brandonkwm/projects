# Reconciliation Platform — Agentic AI

Reconciliation engine: compare two datasets (key + value fields) via **file upload** (CSV or JSON), configurable rules, and **deterministic explanations** from the diff (no guessing). Dashboard metrics, Semantic Q&A, and run detail with underlying datasets.

## Scope

- **Upload & compare:** Users upload two files (Side A + Side B, CSV or JSON). Backend parses, aligns by key, compares value fields using the selected reconciliation type’s rules, and creates a run with breaks and **deterministic** explanations (describes the diff; no hardcoded “FX” or LLM guessing).
- **Backend:** Reconciliation types, runs, breaks, explanations (accept/reject), dashboard metrics, `POST /api/compare` (multipart: sideA, sideB, reconciliationTypeId).
- **Frontend:** Dashboard with **Upload & compare** (two file inputs + type), metrics, recent runs; run detail with underlying datasets (uploaded rows), breaks, and explanations.
- **Sample data:** `sample-data/side-a.csv` and `sample-data/side-b.json` for testing.

## Run locally

**Prerequisites:** Node.js 18+

You need **both** the backend and the frontend running. The dashboard will show an error if the backend is not running.

1. **Backend** (Terminal 1) — must be running first
   ```bash
   cd reconciliation-platform/backend
   npm install
   npm run dev
   ```
   API: http://localhost:3002

2. **Frontend** (Terminal 2)
   ```bash
   cd reconciliation-platform/frontend
   npm install
   npm run dev
   ```
   App: http://localhost:5174 (proxies `/api` to backend)

3. **First run:** On the Dashboard, upload **Side A** = `sample-data/side-a.csv`, **Side B** = `sample-data/side-b.json`, choose reconciliation type “Cash vs Bank”, click **Compare**. You’ll be taken to the run detail with matches/breaks and explanations derived from the actual comparison.

## API

- `POST /api/compare` — **Multipart:** `sideA` (file), `sideB` (file), `reconciliationTypeId` (string). Parses CSV/JSON, runs comparison, creates run + breaks + deterministic explanations. Returns `{ run, summary }`.
- `GET/POST/PUT/DELETE /api/reconciliation-types` — Rules config.
- `GET /api/runs`, `GET /api/runs/:id/full` — Runs and full run (with uploaded datasets if from compare).
- `GET /api/dashboard/metrics`, `GET /api/dashboard/runs` — Metrics and recent runs.

## Next steps

- Optional: call a real LLM with break context to add natural-language explanation on top of the deterministic one.
- Semantic search (embeddings) + LLM synthesis for “Ask”.
- Backtest on rejected explanations.
