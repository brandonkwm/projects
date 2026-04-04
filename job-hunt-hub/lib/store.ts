"use client";

import type { Job, Profile, QuestionAnswer, MacroRunResult } from "@/types";

const JOBS_KEY = "job-hunt-hub-jobs";
const PROFILE_KEY = "job-hunt-hub-profile";
const QA_KEY = "job-hunt-hub-qa";

function safeJsonParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getJobs(): Job[] {
  return safeJsonParse<Job[]>(JOBS_KEY, []);
}

export function setJobs(jobs: Job[]) {
  safeSet(JOBS_KEY, jobs);
}

export function addJob(job: Omit<Job, "id" | "created_at" | "updated_at">): Job {
  const jobs = getJobs();
  const now = new Date().toISOString();
  const newJob: Job = {
    ...job,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  setJobs([...jobs, newJob]);
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>) {
  const jobs = getJobs().map((j) =>
    j.id === id ? { ...j, ...updates, updated_at: new Date().toISOString() } : j
  );
  setJobs(jobs);
}

export function deleteJob(id: string) {
  setJobs(getJobs().filter((j) => j.id !== id));
}

export function applyMacroResults(results: MacroRunResult[]) {
  const jobs = getJobs();
  const byId = new Map(jobs.map((j) => [j.id, j]));
  for (const r of results) {
    const job = byId.get(r.job_id);
    if (job) {
      job.macro_outcome = r.outcome;
      job.unfilled_fields = r.unfilled_fields;
      job.intervention_reason = r.intervention_reason;
      job.updated_at = r.run_at;
      if (r.outcome === "submitted") job.status = "applied";
    }
  }
  setJobs(Array.from(byId.values()));
}

export function getProfile(): Profile | null {
  return safeJsonParse<Profile | null>(PROFILE_KEY, null);
}

export function setProfile(profile: Profile) {
  safeSet(PROFILE_KEY, { ...profile, updated_at: new Date().toISOString() });
}

export function getQuestionAnswers(): QuestionAnswer[] {
  return safeJsonParse<QuestionAnswer[]>(QA_KEY, []);
}

export function setQuestionAnswers(qa: QuestionAnswer[]) {
  safeSet(QA_KEY, qa);
}

export function addQuestionAnswer(q: string, a: string, key?: string): QuestionAnswer {
  const list = getQuestionAnswers();
  const now = new Date().toISOString();
  const newOne: QuestionAnswer = {
    id: crypto.randomUUID(),
    question_text: q,
    answer_text: a,
    key: key ?? undefined,
    created_at: now,
  };
  setQuestionAnswers([...list, newOne]);
  return newOne;
}

export function updateQuestionAnswer(id: string, updates: Partial<QuestionAnswer>) {
  const list = getQuestionAnswers().map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  setQuestionAnswers(list);
}

export function deleteQuestionAnswer(id: string) {
  setQuestionAnswers(getQuestionAnswers().filter((q) => q.id !== id));
}
