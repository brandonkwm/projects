export type JobStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offer";

export type MacroOutcome = "submitted" | "needs_intervention";

export type JobSource = "linkedin" | "indeed" | "company" | "other";

export interface Job {
  id: string;
  job_url: string;
  company_name: string;
  job_title: string;
  source: JobSource;
  status: JobStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  /** Set when user runs macro and reports back */
  macro_outcome?: MacroOutcome;
  unfilled_fields?: string[];
  /** Why the macro stopped (for needs_intervention). User sees this in the app. */
  intervention_reason?: InterventionReason;
}

/** Reason macro could not complete — so user knows what to do (e.g. solve CAPTCHA, log in). */
export type InterventionReason =
  | "captcha"
  | "login_required"
  | "multi_step"
  | "unfilled_fields"
  | "submit_not_found"
  | "unknown";

export interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  resume_base64?: string;
  resume_filename?: string;
  updated_at: string;
}

export interface QuestionAnswer {
  id: string;
  question_text: string;
  answer_text: string;
  /** Optional normalized key for macro matching */
  key?: string;
  created_at: string;
}

/** Payload exported for the macro (extension or Playwright script) */
export interface MacroExport {
  version: number;
  exported_at: string;
  jobs: Pick<Job, "id" | "job_url" | "company_name" | "job_title">[];
  profile: Profile;
  question_answers: QuestionAnswer[];
}

/** Result from macro run — user can import to update job status */
export interface MacroRunResult {
  job_id: string;
  job_url?: string;
  outcome: MacroOutcome;
  unfilled_fields?: string[];
  /** Why we stopped (for needs_intervention). Shown in the app so user knows what to do. */
  intervention_reason?: InterventionReason;
  run_at: string;
}

export interface MacroImportPayload {
  results: MacroRunResult[];
}
