"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addJob } from "@/lib/store";
import type { JobSource } from "@/types";

function deriveSource(url: string): JobSource {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("indeed.com")) return "indeed";
  return "company";
}

function tryCompanyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    const base = host.replace(/^www\./, "").split(".")[0];
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
  } catch {
    return "";
  }
}

export default function AddJobPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const source = deriveSource(url);
    addJob({
      job_url: url.trim(),
      company_name: company.trim() || tryCompanyFromUrl(url),
      job_title: title.trim() || "Job",
      source,
      status: "saved",
    });
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-800">Add job</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-stone-700">
            Job URL *
          </label>
          <input
            id="url"
            type="url"
            required
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (!company) setCompany(tryCompanyFromUrl(e.target.value));
            }}
            placeholder="https://linkedin.com/jobs/..."
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-stone-700">
            Company name
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700">
            Job title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Product Manager"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Save job
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
