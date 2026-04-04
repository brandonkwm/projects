# Job Hunt Hub — Build plan

**Yes, this project is doable.** Build in phases so you get something useful quickly and can add the macro later.

---

## Phase 1: Web app (control centre) — do first

**Goal:** One place to add job links, store profile + resume, build Q&A library, and see status. No backend required for MVP.

| Deliverable | What |
|-------------|------|
| **Add jobs** | Paste job URL; optional company/title (or derive from URL). List stored in localStorage (or SQLite/Supabase later). |
| **Profile + resume** | Form: name, email, phone, location. Upload one resume (store as base64 or file in localStorage / later server). |
| **Q&A library** | List of common questions + answers (work auth, salary, notice period, "How did you hear about us?", custom). Add/edit/remove. |
| **Dashboard** | List of jobs with status (Saved, Applied, Interviewing, Rejected, Offer). Filter by status. Show macro outcome when we have it (Submitted / Needs intervention + unfilled fields). |
| **Export for macro** | Button: "Download for macro" → JSON with jobs (urls, ids), profile, resume (or path), Q&A. Macro (phase 2) reads this file. |
| **Import macro results** | Optional: upload a JSON file from the macro run → update jobs with outcome (submitted / needs_intervention) and unfilled_fields. |

**Tech:** Next.js (or Vite + React) + Tailwind. State: localStorage + JSON export/import. No auth for MVP (single user on one device).

**Outcome:** You can add 10+ job links, maintain profile + resume + Q&A, and export one file for the macro. When the macro exists, you can re-import results to see submitted vs needs intervention.

---

## Phase 2: Macro (runs on user’s machine)

**Option A — Browser extension**

- Install extension; it reads profile + resume + Q&A (from web app sync or from imported JSON).
- On a job application page: "Fill form" (from profile + Q&A), optional "Submit" / "Next."
- Report back: for current URL, mark as submitted or needs intervention + list unfilled fields. (Sync to app via import or extension backend later.)

**Option B — Local script (Playwright)**

- User exports "jobs to apply" + profile + Q&A from the web app (Phase 1).
- Run `node run-macro.js` (or similar). Script opens each job URL, fills form from profile + Q&A, submits or records unfilled fields.
- Output: JSON report (job_id/url, outcome, unfilled_fields). User imports this in the web app to update status.

Start with **Option B** for speed (one script, no store/extension review). Add Option A later if you want in-browser one-click fill.

---

## Phase 3: Polish and optional AI

- Auth (e.g. NextAuth, Clerk) so jobs/profile are per user and sync across devices.
- Persist to DB (Supabase, SQLite) instead of localStorage.
- **AI:** Optional “Suggest answer” for a question (e.g. from JD + profile) or “Draft” for "Tell us about yourself." Use local model (Ollama) or user’s API key; no server-side AI unless you opt in.

---

## Summary

| Phase | What you get |
|-------|----------------|
| **1** | Web app: add links, profile, resume, Q&A, dashboard, export for macro, import macro results. |
| **2** | Macro (extension or Playwright script) that fills and submits, reports submitted vs needs intervention. |
| **3** | Auth, DB, optional AI. |

Phase 1 is fully possible in a few days of focused work. Phase 2 is possible; form-filling is the trickiest part (different ATS layouts). Phase 3 is standard web + optional AI.
