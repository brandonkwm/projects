#!/usr/bin/env node
/**
 * Job Hunt Hub — Phase 2 macro (Playwright)
 *
 * Usage:
 *   node run.js [path-to-export.json]
 *
 * If no path is given, looks for job-hunt-hub-export-*.json in the current directory.
 *
 * 1. Download export from the web app (Dashboard → "Download for macro").
 * 2. Run: cd macro && npm install && node run.js ../path/to/export.json
 * 3. Import the generated macro-results-<timestamp>.json in the web app (Dashboard → "Import macro results").
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { fillJob } from "./fill-job.js";

const JOBS_DELAY_MS = 3000;

function findExportPath(explicitPath) {
  if (explicitPath) return explicitPath;
  const cwd = process.cwd();
  try {
    const files = readdirSync(cwd);
    const match = files.find((f) => f.startsWith("job-hunt-hub-export-") && f.endsWith(".json"));
    return match ? join(cwd, match) : null;
  } catch {
    return null;
  }
}

function loadExport(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  if (!data.jobs || !Array.isArray(data.jobs)) throw new Error("Invalid export: missing jobs array");
  return data;
}

function writeResumeTemp(profile) {
  if (!profile?.resume_base64) return null;
  const base64 = profile.resume_base64.replace(/^data:.*?;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  const ext = profile.resume_filename?.match(/\.\w+$/)?.[0] || ".pdf";
  const tmpPath = join(tmpdir(), `job-hunt-hub-resume-${Date.now()}${ext}`);
  writeFileSync(tmpPath, buf);
  return tmpPath;
}

async function main() {
  const explicitPath = process.argv[2];
  const exportPath = findExportPath(explicitPath);
  if (!exportPath) {
    console.error("Usage: node run.js <path-to-export.json>");
    console.error("  Or place job-hunt-hub-export-YYYY-MM-DD.json in the current directory.");
    process.exit(1);
  }

  const exportData = loadExport(exportPath);
  const { jobs, profile, question_answers: questionAnswers } = exportData;
  const resumePath = writeResumeTemp(profile);

  console.log(`Loaded ${jobs.length} job(s) from ${exportPath}`);
  if (resumePath) console.log("Resume: temp file ready for file inputs");
  else if (profile?.resume_base64) console.log("Resume: base64 present but could not write temp file");
  else console.log("Resume: none in export");

  const results = [];
  const userDataDir = process.env.BROWSER_PROFILE ? join(process.cwd(), process.env.BROWSER_PROFILE) : undefined;
  if (userDataDir) console.log("Using persistent browser profile:", userDataDir);
  const browser = await chromium.launch({
    headless: false,
    ...(userDataDir && { userDataDir }),
  });

  try {
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`[${i + 1}/${jobs.length}] ${job.company_name} — ${job.job_title}`);
      const page = await browser.newPage();
      try {
        const { outcome, unfilled_fields, intervention_reason } = await fillJob(
          page,
          job,
          profile || {},
          questionAnswers || [],
          resumePath
        );
        results.push({
          job_id: job.id,
          job_url: job.job_url,
          outcome,
          unfilled_fields: unfilled_fields?.length ? unfilled_fields : undefined,
          intervention_reason,
          run_at: new Date().toISOString(),
        });
        console.log(`  → ${outcome}${intervention_reason ? ` (${intervention_reason})` : ""}${unfilled_fields?.length ? ` — ${unfilled_fields.join(", ")}` : ""}`);
      } catch (err) {
        console.error(`  → error: ${err.message}`);
        results.push({
          job_id: job.id,
          job_url: job.job_url,
          outcome: "needs_intervention",
          unfilled_fields: [err.message || "macro_error"],
          intervention_reason: "unknown",
          run_at: new Date().toISOString(),
        });
      } finally {
        await page.close();
      }
      if (i < jobs.length - 1) await new Promise((r) => setTimeout(r, JOBS_DELAY_MS));
    }
  } finally {
    await browser.close();
  }

  const outDir = process.cwd();
  const outName = `macro-results-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
  const outPath = join(outDir, outName);
  writeFileSync(outPath, JSON.stringify({ results }, null, 2));
  console.log(`\nResults written to ${outPath}`);
  console.log("Import this file in the web app (Dashboard → Import macro results).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
