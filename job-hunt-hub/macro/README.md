# Job Hunt Hub — Macro (Phase 2)

Local Playwright script that reads your Job Hunt Hub export, opens each job URL, fills the application form from your profile + Q&A, and optionally submits. It writes a **results file** you can import back into the web app.

## Prerequisites

- Node.js 18+
- Export file from the web app (Dashboard → **Download for macro**)

## Setup

```bash
cd macro
npm install
npx playwright install chromium
```

(`npx playwright install chromium` downloads the Chromium browser used by the script.)

## Usage

1. In the **web app**, add jobs, set profile + resume, add Q&A. Click **Download for macro** and save the JSON (e.g. to your Desktop or into the `macro` folder).

2. From the `macro` folder:

   ```bash
   node run.js path/to/job-hunt-hub-export-2025-02-28.json
   ```

   Or put the export file in the `macro` folder and run:

   ```bash
   node run.js
   ```

   The script will look for a file named `job-hunt-hub-export-*.json` in the current directory.

3. A **browser window** will open. For each job it will:
   - Open the job URL
   - Fill inputs that match your profile (name, email, phone, location) and Q&A
   - Attach your resume to file inputs when possible
   - Try to click Submit/Apply

4. When it’s done, a file **`macro-results-<timestamp>.json`** is written in the `macro` folder.

5. In the **web app**, go to Dashboard → **Import macro results** and upload that file. The app will update each job with:
   - **Submitted** or **Needs intervention**
   - Unfilled fields (when it couldn’t match or submit)

## What it does

- **Field matching:** Uses label, name, id, placeholder and your profile + Q&A to fill text inputs, selects, and textareas.
- **Resume:** If your export includes a resume (PDF), it’s written to a temp file and attached to file inputs that look like “resume”, “CV”, “upload”, etc.
- **Submit:** Looks for submit buttons (`type="submit"`, or button text “Submit”/“Apply”) and clicks one. Many ATS use multi-step flows or CAPTCHA; in those cases the script reports **Needs intervention** and you can complete the rest manually.

## Limitations

- Every job site is different. The macro uses heuristics; some fields won’t match and some forms need manual steps (e.g. multi-page, CAPTCHA, custom questions).
- Run from your own machine; you’re responsible for your use of the script and for the sites you apply to.
- A short delay is used between jobs to avoid hammering servers.

## Why did it stop? (intervention reasons)

When the macro reports **Needs intervention**, it also reports a **reason** so you know what to do. After you import results in the web app, you'll see one of:

| Reason | What to do |
|--------|------------|
| **CAPTCHA** | The page has a CAPTCHA. Open the job link, solve it, and submit. |
| **Log in first** | The page is a login gate (e.g. HR portal). Log in once in the macro's browser (see "Logging in" below), then re-run the macro. |
| **Multi-step form** | Complete the remaining steps in the browser. |
| **Complete these fields** | Some fields couldn't be filled. The app shows the list; fill them manually. |
| **Submit button not found** | Complete and submit manually. |
| **Unknown** | Open the link and finish manually. |

## Logging in to HR portals (no stored passwords)

Many links require you to be logged in (LinkedIn, Workday, company career sites). **We don't store your login credentials.** Use a **persistent browser profile** so you log in once and the macro reuses that session:

1. Create a folder for the profile, e.g. `macro-browser-profile` inside the `macro` folder.
2. Run the macro with that profile:
   - Windows: `set BROWSER_PROFILE=macro-browser-profile && node run.js path/to/export.json`
   - macOS/Linux: `BROWSER_PROFILE=macro-browser-profile node run.js path/to/export.json`
3. The first time you may get **Log in first** for some sites. When the run finishes, logins are saved in the profile folder. Next time you run with the same `BROWSER_PROFILE`, you'll already be logged in.
4. To add a new site: run the macro; when the browser opens, open a new tab, go to the site, log in. On the next run with the same profile, that login will still be there.

Credentials stay in the browser profile on your machine; the app and macro never see or store your passwords.

## Output format

The results file has this shape (same as the web app’s import expects):

```json
{
  "results": [
    {
      "job_id": "uuid-from-export",
      "job_url": "https://...",
      "outcome": "submitted",
      "run_at": "2025-02-28T12:00:00.000Z"
    },
    {
      "job_id": "...",
      "outcome": "needs_intervention",
      "unfilled_fields": ["current salary", "file: Resume"],
      "intervention_reason": "captcha",
      "run_at": "..."
    }
  ]
}
```

Import this in the web app to see which applications were submitted and which need you to fill a few more fields.
