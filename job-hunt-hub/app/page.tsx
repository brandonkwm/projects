"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobs, updateJob } from "@/lib/store";
import type { Job, JobStatus, InterventionReason } from "@/types";

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  rejected: "Rejected",
  offer: "Offer",
};

const INTERVENTION_LABELS: Record<InterventionReason, string> = {
  captcha: "CAPTCHA — solve it in the browser, then submit",
  login_required: "Log in first — open the link, sign in, then re-run macro",
  multi_step: "Multi-step form — complete remaining steps in the browser",
  unfilled_fields: "Complete these fields in the browser",
  submit_not_found: "Submit button not found — complete and submit manually",
  unknown: "Could not complete — open link and finish manually",
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  useEffect(() => {
    setJobs(getJobs());
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
  const appliedCount = jobs.filter((j) => j.status === "applied").length;
  const needsIntervention = jobs.filter(
    (j) => j.macro_outcome === "needs_intervention"
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-800">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-stone-500">Total jobs</p>
          <p className="text-2xl font-semibold">{jobs.length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-stone-500">Applied</p>
          <p className="text-2xl font-semibold text-green-700">{appliedCount}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-stone-500">Need intervention</p>
          <p className="text-2xl font-semibold text-amber-700">{needsIntervention}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "saved", "applied", "interviewing", "rejected", "offer"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === f
                  ? "bg-stone-800 text-white"
                  : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </button>
          )
        )}
      </div>

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-500">
            No jobs yet. <Link href="/add" className="text-stone-700 underline">Add a job</Link> to get started.
          </li>
        ) : (
          filtered.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-800">{job.job_title}</p>
                <p className="text-sm text-stone-500">{job.company_name}</p>
                {job.macro_outcome && (
                  <p className="mt-1 text-xs">
                    Macro:{" "}
                    <span
                      className={
                        job.macro_outcome === "submitted"
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    >
                      {job.macro_outcome === "submitted"
                        ? "Submitted"
                        : "Needs intervention"}
                      {job.intervention_reason && (
                        <span className="block mt-0.5 text-stone-500">
                          {INTERVENTION_LABELS[job.intervention_reason] ?? job.intervention_reason}
                        </span>
                      )}
                      {job.unfilled_fields?.length ? (
                        <span className="block mt-0.5">
                          {job.unfilled_fields.join(", ")}
                        </span>
                      ) : null}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={job.status}
                  onChange={(e) => {
                    updateJob(job.id, { status: e.target.value as JobStatus });
                    setJobs(getJobs());
                  }}
                  className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700"
                >
                  {(Object.entries(STATUS_LABELS) as [JobStatus, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open
                </a>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-wrap gap-4 border-t border-stone-200 pt-6">
        <Link
          href="/add"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Add job
        </Link>
        <ExportButton />
        <ImportMacroResultsButton onImport={() => setJobs(getJobs())} />
      </div>
    </div>
  );
}

function ExportButton() {
  const handleExport = () => {
    const { getJobs, getProfile, getQuestionAnswers } = require("@/lib/store");
    const jobs = getJobs();
    const profile = getProfile();
    const qa = getQuestionAnswers();
    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      jobs: jobs.map((j: Job) => ({
        id: j.id,
        job_url: j.job_url,
        company_name: j.company_name,
        job_title: j.job_title,
      })),
      profile: profile ?? { full_name: "", email: "", phone: "", location: "", updated_at: "" },
      question_answers: qa,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-hunt-hub-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={handleExport}
      className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      Download for macro
    </button>
  );
}

function ImportMacroResultsButton({ onImport }: { onImport: () => void }) {
  const [key, setKey] = useState(0);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const results = data.results ?? data;
        if (Array.isArray(results) && results.length > 0) {
          const { applyMacroResults } = require("@/lib/store");
          applyMacroResults(results);
          onImport();
        }
      } catch (_) {}
      setKey((k) => k + 1);
    };
    reader.readAsText(file);
  };
  return (
    <label className="cursor-pointer rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
      Import macro results
      <input
        key={key}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
    </label>
  );
}
