"use client";

import { useEffect, useState } from "react";
import { getProfile, setProfile } from "@/lib/store";
import type { Profile } from "@/types";

const defaultProfile: Profile = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  updated_at: new Date().toISOString(),
};

export default function ProfilePage() {
  const [profile, setForm] = useState<Profile>(defaultProfile);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) setForm(p);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Profile = {
      ...profile,
      updated_at: new Date().toISOString(),
    };
    if (resumeFile) {
      const reader = new FileReader();
      reader.onload = () => {
        updated.resume_base64 = reader.result as string;
        updated.resume_filename = resumeFile.name;
        setProfile(updated);
        setSaved(true);
        setResumeFile(null);
      };
      reader.readAsDataURL(resumeFile);
    } else {
      setProfile(updated);
      setSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-800">Profile & resume</h1>
      <p className="text-sm text-stone-500">
        Stored locally. Use &quot;Download for macro&quot; on the dashboard to export for the macro.
      </p>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={profile.full_name}
            onChange={(e) => setForm({ ...profile, full_name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => setForm({ ...profile, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => setForm({ ...profile, phone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-stone-700">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={profile.location}
            onChange={(e) => setForm({ ...profile, location: e.target.value })}
            placeholder="City, Country"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Resume (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="mt-1 text-sm text-stone-600"
          />
          {profile.resume_filename && (
            <p className="mt-1 text-xs text-stone-500">
              Current: {profile.resume_filename}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Save profile
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved.</span>
          )}
        </div>
      </form>
    </div>
  );
}
