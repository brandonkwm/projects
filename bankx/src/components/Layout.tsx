import { Link, useLocation, Outlet } from "react-router-dom";
import { ViewModeProvider, useViewMode } from "../context/ViewModeContext";

const nav = [
  { to: "/", label: "Home" },
  { to: "/tokenize", label: "Tokenize" },
  { to: "/send", label: "Send" },
  { to: "/incoming", label: "Incoming" },
  { to: "/earn", label: "Earn" },
  { to: "/activity", label: "Activity" },
];

function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      <button
        type="button"
        onClick={() => setViewMode("sender")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          viewMode === "sender" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Sender
      </button>
      <button
        type="button"
        onClick={() => setViewMode("recipient")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          viewMode === "recipient" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Recipient
      </button>
    </div>
  );
}

function LayoutInner() {
  const location = useLocation();
  const { viewMode } = useViewMode();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
          <Link to="/" className="text-xl font-bold text-teal-700">
            BankX
          </Link>
          <div className="flex items-center gap-3">
            <ViewToggle />
            <nav className="flex gap-1">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? "bg-teal-100 text-teal-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        {viewMode === "recipient" && (
          <div className="border-t border-amber-200 bg-amber-50/90 px-4 py-1.5 text-center text-sm text-amber-800">
            Viewing as <strong>recipient</strong> — incoming tokens and redemptions to your wallet
          </div>
        )}
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <ViewModeProvider>
      <LayoutInner />
    </ViewModeProvider>
  );
}
