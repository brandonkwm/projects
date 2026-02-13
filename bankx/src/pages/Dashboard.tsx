import { Link } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { useViewMode } from "../context/ViewModeContext";
import { RecipientDashboard } from "../components/RecipientDashboard";

function ResetDemo() {
  const { dispatch } = useAppState();
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "RESET" })}
      className="text-xs text-slate-400 hover:text-slate-600"
    >
      Reset demo
    </button>
  );
}

export function Dashboard() {
  const { state } = useAppState();
  const { viewMode } = useViewMode();

  if (!state.isOnboarded || !state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the <Link to="/" className="underline">home page</Link> first.</p>
      </div>
    );
  }

  if (viewMode === "recipient") {
    return <RecipientDashboard />;
  }

  const { user } = state;
  const total = user.balances.fiat + user.balances.tokenized;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-500">Account · {user.accountId}</p>
        <h1 className="text-2xl font-bold text-slate-900">Hi, {user.name}</h1>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <p className="text-slate-400">Total balance</p>
        <p className="mt-1 text-3xl font-bold">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-sm text-slate-400">Fiat (bank)</p>
            <p className="text-lg font-semibold">${user.balances.fiat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Tokenized (BankX)</p>
            <p className="text-lg font-semibold text-teal-300">${user.balances.tokenized.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/tokenize"
          className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
        >
          <span className="text-2xl">🪙</span>
          <span className="mt-2 font-medium text-slate-900">Tokenize</span>
          <span className="mt-1 text-sm text-slate-500">Fiat → BankX</span>
        </Link>
        <Link
          to="/send"
          className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
        >
          <span className="text-2xl">↗</span>
          <span className="mt-2 font-medium text-slate-900">Send</span>
          <span className="mt-1 text-sm text-slate-500">On-chain transfer</span>
        </Link>
        <Link
          to="/incoming"
          className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
        >
          <span className="text-2xl">↓</span>
          <span className="mt-2 font-medium text-slate-900">Incoming</span>
          <span className="mt-1 text-sm text-slate-500">Receive & redeem</span>
          {state.user.incomingTransfers.some((t) => !t.redeemed) && (
            <span className="mt-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              {state.user.incomingTransfers.filter((t) => !t.redeemed).length} pending
            </span>
          )}
        </Link>
        <Link
          to="/earn"
          className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
        >
          <span className="text-2xl">📈</span>
          <span className="mt-2 font-medium text-slate-900">Earn</span>
          <span className="mt-1 text-sm text-slate-500">Liquidity pools</span>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Recent activity</h2>
        <ul className="mt-3 space-y-2">
          {user.transactions.slice(0, 5).map((tx) => (
            <li key={tx.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{tx.label}</span>
              <span className="font-medium">
                {tx.type === "send" ? "-" : "+"}${tx.amount.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/activity" className="mt-3 block text-sm font-medium text-teal-600 hover:underline">
          View all activity →
        </Link>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <ResetDemo />
        </div>
      </div>
    </div>
  );
}
