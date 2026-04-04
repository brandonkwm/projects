# Job Hunt Hub — Product spec

**Problem:** Laid-off job seekers are exhausted by repeatedly uploading resumes and filling forms across many company career pages and job boards. They want one place to manage applications and, where possible, reduce repetitive data entry.

**Goal:** An aggregator for job searching that lets users add jobs (by link or company), track application status, store one master resume, and—where feasible—assist with auto-filling application forms.

---

## Why not do it from “the cloud”? And why a macro on the user’s machine works

| Run where | Can we fill forms? | Can we click Submit? |
|-----------|--------------------|----------------------|
| **Our server / web portal** | ❌ No — we’d have to log into LinkedIn, Workday, etc. from our backend. Anti-bot, ToS, and session handling make this fragile and risky. |
| **User’s computer / laptop (macro)** | ✅ Yes — extension or local script runs in their browser/OS, uses their login session, their IP. We’re just automating *their* actions. |

So: **we can do a macro**, and it should run on the **user’s machine**. That could be:

1. **Browser extension** — Content script on the page they’re on: “Fill form” and optionally “Click Next” / “Submit” (user triggers it, stays in control).
2. **Local automation script** — e.g. Playwright or Puppeteer on their laptop: they run it, it opens a browser, goes to a list of job URLs (from our app), fills and submits using their stored profile/resume. All execution is local; no our-server-hits-their-sites.

The web portal stays the **control centre** (add jobs, store resume, see status). The **macro** (extension or local script) is what actually does the repetitive filling — and optionally submitting — on their device.

---

## What’s feasible vs. not

| Idea | Feasibility | Approach |
|------|-------------|----------|
| **One dashboard for all applications** | ✅ Yes | Web app: add job links, track status, store resume. |
| **Choose company / input JD links** | ✅ Yes | User pastes job URLs; we normalize, scrape title/company where possible, and track. |
| **Show status (saved, applied, rejected, etc.)** | ✅ Yes | User (or later: email parsing) updates status; we display in one list. |
| **Auto-fill on company websites** | ✅ Yes (on user’s machine) | Browser extension or local macro: fill known fields (name, email, resume) on the page they’re on. |
| **Auto-submit / “apply for me”** | ✅ Yes (on user’s machine) | Same macro/extension can click Next/Submit. User runs it on their laptop; their session, their responsibility. Not from our server. |
| **Fully automated “apply to all” from our portal (server-side)** | ❌ No | Would require our backend logging into each site; fragile, ToS issues, anti-bot. |

So the product is:

1. **Web app (Job Hunt Hub):** Aggregator + application tracker + one place for resume and profile.
2. **Macro on the user’s machine:** Either a **browser extension** (“Fill form” / “Submit” on the current page) or a **local script** (e.g. Playwright) that they run — it reads job URLs + profile from our app (or a local export), opens each URL, fills and submits. All automation runs on their computer. After each run the macro reports: **successfully submitted** vs **needs intervention** (fields that need the user to fill). The web app shows this status per job.

---

## End-to-end flow

1. **User adds links** in the web app (job URLs from LinkedIn, Indeed, company sites, etc.).
2. **User has profile + resume + common Q&A** stored in the app (see below).
3. **User runs the macro locally** (extension or script). Macro gets the list of job URLs (and profile, resume, Q&A) from the app or an export.
4. For each job URL, the macro fills what it can from profile/resume/Q&A, submits if complete, or records **which fields couldn't be filled**.
5. **Macro reports back** (export/import or extension sync): per job, either **Submitted** or **Needs intervention** + list of missing/unfilled fields.
6. **Web app shows status** per job: Successfully submitted | Needs intervention (e.g. "Add: current salary, work authorization"). User can open the link, fill the rest, then mark as applied.

---

## Macro outcome: submitted vs needs intervention

- **Successfully submitted** — Macro filled required fields and clicked Submit. Job marked "Applied" in the dashboard.
- **Needs intervention** — Macro couldn't complete. The macro reports an **intervention_reason** so the user knows what to do:
  - **captcha** — Page has a CAPTCHA. User sees: "CAPTCHA — solve it in the browser, then submit."
  - **login_required** — Page is a login gate (e.g. HR portal). User sees: "Log in first — open the link, sign in, then re-run macro."
  - **multi_step** — Multi-step application form. User sees: "Multi-step form — complete remaining steps in the browser."
  - **unfilled_fields** — Some fields couldn't be matched or filled. App shows the list so the user can complete them manually.
  - **submit_not_found** — No submit button was found. User completes and submits manually.
  - **unknown** — Other (e.g. macro error). User opens the link and finishes manually.
- The web app displays the reason and any **unfilled_fields** per job so the user knows exactly why and what to do.

---

## Login / HR portal credentials

Many job links require the user to be logged in (LinkedIn, Workday, company career portals). Two approaches:

### Recommended: persistent browser profile (no stored passwords)

- The macro uses a **persistent browser profile** (e.g. Playwright `userDataDir`). The user logs in once in that browser (e.g. to LinkedIn, Workday) and closes it. On the next macro run, the same profile is reused, so they're still logged in. **We never store credentials**; the browser’s cookies/session do the work.
- Implementation: macro launches Chromium with a fixed `userDataDir` (e.g. `./macro-browser-profile`). User runs the macro, gets a login-required result for a site, opens the link in the same browser (or we keep the browser open after the run), logs in manually, then re-runs the macro for remaining jobs. Alternatively the macro can open the first job and pause: "Log in if needed, then press Enter to continue."

### Optional (future): store site credentials in the app

- Some users may want the macro to **fill login forms** (e.g. site URL + username + password) so the macro can log in before navigating to the application. That would require storing credentials in the app (e.g. per-site username/password).
- **Security:** Passwords are sensitive. If we store them at all:
  - **Local only** — e.g. in the web app’s localStorage or in a local file the macro reads. No server storage.
  - **Clear warning** — "Stored in this browser/device only; not encrypted. Don’t use on shared computers."
  - **Optional later:** Use the OS keychain (e.g. keytar) or encrypt with a user passphrase so we never store plaintext passwords. For MVP, the **persistent profile** approach is safer and avoids handling passwords at all.
- The macro would then, before visiting a job URL, check if we have credentials for that host, navigate to the login page, fill and submit, then continue to the job URL. This is a later enhancement; Phase 2 relies on "log in once in the macro’s browser" so the user knows exactly where credentials live (their browser profile).

---

## Commonly asked questions & answers (Q&A library)

Many forms ask the same questions (salary expectations, work authorization, "How did you hear about us?", etc.). We support:

- **Library of question → answer** stored in the user's profile. Macro uses it to fill matching fields (by label/placeholder).
- **Curated list of frequent questions** in the app so the user pre-fills once (work authorization, salary range, notice period, LinkedIn, portfolio). User can add custom Q&A pairs.
- **AI use cases (optional):**
  - **Suggest an answer** for a new question (e.g. "Why do you want to join [Company]?") using JD + user profile.
  - **Match new form questions** to existing Q&A ("Years of experience in X" → user's "Years of experience" answer).
  - **Draft short answers** for "Tell us about yourself" or "Additional comments" from resume + JD.
- Data stays user-controlled; AI can run locally (e.g. Ollama) or via user-configured API so nothing is sent to our server unless they opt in.

---

## Core features (MVP)

### 1. Job aggregator & tracker (web app)

- **Add jobs**
  - Paste **job URL** (LinkedIn, Indeed, company career page, etc.).
  - Optional: **search or pick company** (e.g. from a list or later from integrated job feeds).
- **Normalize & store**
  - Extract or let user edit: company name, job title, job URL, source (e.g. LinkedIn, Indeed, company site).
  - Store in our DB (or local storage for a first version).
- **Resume & profile**
  - **One place to upload/store resume** (and optionally a short “profile” blob: name, email, phone, location) used for the extension and for quick copy-paste.
- **Status**
  - Per job: **Saved | Applied | Interviewing | Rejected | Offer** (or similar).
  - **Macro run outcome** (when user ran the macro): **Successfully submitted** | **Needs intervention** — and when the latter, show which fields/steps still need user input. User updates status; extension/script can report back after a run.
- **Dashboard**
  - List/cards of jobs with filters (e.g. by status, source, company).
  - Clear indication: which applications were **successfully submitted** by the macro vs **need intervention** (with list of unfilled fields).
  - Clear "Applied" count and next suggested actions (e.g. "Follow up on 3 applications from last week").
- **Common Q&A**
  - User builds a library of **commonly asked questions → answers** (salary, work auth, notice period, "How did you hear about us?", etc.). Macro uses this to fill matching form fields. Optional: AI to suggest answers for new questions or draft from resume + JD.

### 2. Macro on user’s machine (phase 2): extension or local script

- **Option A — Browser extension**
  - User installs extension; it has access to **stored profile + resume + Q&A** (synced from web app or entered in extension).
  - On a job application page: "Fill form" fills common fields from profile + Q&A; optional "Submit" or "Next" for multi-page flows.
  - **Reports back** to the app (or local state): for each job, **submitted** or **needs intervention** + list of unfilled fields. All runs in their browser, their session.

- **Option B — Local automation script**
  - User exports "jobs to apply" (and profile, resume, Q&A) from the app and runs a script (e.g. Node + Playwright) on their laptop.
  - Script opens each URL, fills from profile/resume/Q&A, submits (or pauses for user to confirm). **Outputs a report**: which jobs were submitted, which need intervention and which fields are missing. User can re-import this into the app to update status.
- Either way: **macro = on their computer**; web app shows which applications were successfully submitted and which require the user to intervene.

---

## Tech stack (suggested)

- **Web app:** Next.js (or Vite + React) + Tailwind. Auth later (e.g. NextAuth or Clerk) so “my jobs” and resume are per user.
- **Data:** Start with SQLite or Supabase (Postgres) for jobs and profile; or even localStorage + JSON export for a no-backend MVP.
- **Extension / macro:** Manifest V3 Chrome extension, or a local Playwright/Puppeteer script the user runs. Both read profile, resume, and **Q&A library** (from app or local export) and run **on the user’s machine**. Macro reports back: submitted vs needs intervention + unfilled fields so the app can show status.

---

## Data model (minimal)

- **User** (when auth added): id, email, created_at.
- **Profile:** user_id, full_name, email, phone, location, resume_file_url or base64, resume_updated_at.
- **Job:** id, user_id, source (e.g. "linkedin" | "indeed" | "company"), company_name, job_title, job_url, status (saved | applied | interviewing | rejected | offer), created_at, updated_at, notes.
- **MacroRunResult** (per job, per macro run): job_id, outcome (submitted | needs_intervention), unfilled_fields, **intervention_reason** (captcha | login_required | multi_step | unfilled_fields | submit_not_found | unknown), run_at.
- **QuestionAnswer:** user_id, question_text (or normalized key), answer_text, created_at. Used by macro to fill form fields that match the question (by label/placeholder). Curated "common questions" can have suggested keys (e.g. work_authorization, salary_expectation, how_heard_about_us).

---

## Out of scope (for now)

- Automatically scraping job listings from all boards (we can add 1–2 integrations later, e.g. LinkedIn or Indeed APIs if available).
- Submitting applications **from our server** on behalf of the user (we don’t do that).
- Parsing email to infer status (possible later).

---

## Success criteria

- User can add 10 job links in one place and see status at a glance.
- User has one stored resume, profile, and a **Q&A library** (common questions + answers) to use from the app and macro.
- After running the macro, the app shows which applications were **successfully submitted** and which **need intervention** (with list of fields to fill).
- User can filter and update status without opening each job site again.
- Optional: AI suggests or drafts answers for new questions using resume + JD.
