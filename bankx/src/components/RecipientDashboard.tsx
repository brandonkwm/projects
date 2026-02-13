import { Link } from "react-router-dom";
import { useAppState } from "../context/AppState";

/**
 * Recipient account view: focus on tokens sent to this wallet and redemptions (currency redeemed to).
 */
export function RecipientDashboard() {
  const { state } = useAppState();

  if (!state.user) return null;

  const incoming = state.user.incomingTransfers;
  const pending = incoming.filter((t) => !t.redeemed);
  const redeemTxs = state.user.transactions.filter((tx) => tx.type === "redeem");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-500">Recipient account · {state.user.accountId}</p>
        <h1 className="text-2xl font-bold text-slate-900">Recipient view</h1>
        <p className="mt-1 text-slate-600">Tokens sent to your wallet and how you redeemed them.</p>
      </div>

      <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/80 p-6">
        <p className="text-sm font-medium text-teal-800">Coins sent to your wallet</p>
        <p className="mt-1 text-2xl font-bold text-teal-900">
          {pending.length > 0 ? `${pending.length} pending` : "None pending"}
        </p>
        <p className="mt-1 text-sm text-teal-700">
          {pending.length > 0
            ? `$${pending.reduce((s, t) => s + t.amount, 0).toFixed(2)} in tokens received (not yet redeemed)`
            : "When someone sends you BankX tokens on-chain, they appear here."}
        </p>
        <Link
          to="/incoming"
          className="mt-4 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          {pending.length > 0 ? "View & redeem" : "Incoming"}
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Redeemed to fiat</h2>
        <p className="mt-1 text-sm text-slate-500">Currency you chose when redeeming received tokens.</p>
        {redeemTxs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No redemptions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {redeemTxs.slice(0, 5).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{tx.label}</span>
                <span className="font-medium text-teal-600">
                  {tx.redeemAmount != null && tx.redeemCurrency
                    ? `${tx.redeemAmount.toFixed(2)} ${tx.redeemCurrency}`
                    : `$${tx.amount.toFixed(2)} USD`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/activity" className="mt-3 block text-sm font-medium text-teal-600 hover:underline">
          View received activity →
        </Link>
      </div>
    </div>
  );
}
