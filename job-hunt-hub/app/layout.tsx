import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Hunt Hub",
  description: "One place to track job applications and run the apply macro",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-stone-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <a href="/" className="text-lg font-semibold text-stone-800">
              Job Hunt Hub
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-stone-600 hover:text-stone-900">
                Dashboard
              </a>
              <a href="/add" className="text-stone-600 hover:text-stone-900">
                Add job
              </a>
              <a href="/profile" className="text-stone-600 hover:text-stone-900">
                Profile & resume
              </a>
              <a href="/qa" className="text-stone-600 hover:text-stone-900">
                Q&A
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
