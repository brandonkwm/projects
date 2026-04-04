# Job Hunt Hub

One place to add job links, store profile + resume, build a Q&A library for application forms, and (after running the macro) see which applications were submitted vs need intervention.

## Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 (this repo)

- **Dashboard** — List jobs, filter by status, see macro outcome (submitted / needs intervention). Export data for the macro; import macro results to update status.
- **Add job** — Paste job URL; optional company/title.
- **Profile & resume** — Name, email, phone, location; upload one PDF resume (stored in localStorage).
- **Q&A** — Common questions + answers (work auth, salary, notice period, etc.). Macro will use these to fill forms.

Data is stored in **localStorage** (no backend). Use **Download for macro** to get a JSON file the macro can read. Use **Import macro results** to upload the macro’s output and update job status.

## Phase 2 (macro)

See [macro/README.md](macro/README.md). From the web app, use **Download for macro**, then run:

```bash
cd macro
npm install
npx playwright install chromium
node run.js path/to/your-export.json
```

Upload the generated `macro-results-<timestamp>.json` in the app via **Import macro results**.

## Docs

- [PRODUCT-SPEC.md](docs/PRODUCT-SPEC.md) — Product spec and data model.
- [BUILD-PLAN.md](docs/BUILD-PLAN.md) — Phased build plan.
