import { useAppState } from "../context/AppState";
import { useViewMode } from "../context/ViewModeContext";

const typeLabels: Record<string, string> = {
  tokenize: "Tokenize",
  send: "Send",
  receive: "Receive",
  add_to_pool: "Add to pool",
  withdraw_from_pool: "Withdraw",
  redeem: "Redeem",
  fiat_transfer: "Fiat transfer",
};

/** Recipient view: coins sent to this wallet + redeemed to which currency */
function ReceivedActivity() {
  const { state } = useAppState();
  if (!state.user) return null;

  const incoming = state.user.incomingTransfers;
  const redeemTxs = state.user.transactions.filter((tx) => tx.type === "redeem");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Received activity</h1>
        <p className="mt-1 text-slate-600">Recipient view — coins sent to your wallet and currency you redeemed to.</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          Coins sent to your wallet
        </div>
        <ul className="divide-y divide-slate-200">
          {incoming.length === 0 ? (
            <li className="px-4 py-6 text-center text-slate-500">No incoming transfers yet.</li>
          ) : (
            incoming.map((inc) => (
              <li key={inc.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">Token received</p>
                    <p className="text-sm text-slate-500">${inc.amount.toFixed(2)} from {inc.from}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400 break-all">{inc.txHash}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(inc.timestamp).toLocaleString()}</p>
                    {inc.redeemed ? (
                      <span className="mt-2 inline-block rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">Redeemed</span>
                    ) : (
                      <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Pending redeem</span>
                    )}
                  </div>
                  <span className="shrink-0 font-medium text-teal-600">+${inc.amount.toFixed(2)}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          Redeemed to fiat (currency chosen)
        </div>
        <ul className="divide-y divide-slate-200">
          {redeemTxs.length === 0 ? (
            <li className="px-4 py-6 text-center text-slate-500">No redemptions yet.</li>
          ) : (
            redeemTxs.map((tx) => (
              <li key={tx.id} className="flex items-start justify-between gap-4 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-900">Redeemed</p>
                  <p className="text-sm text-slate-500">{tx.label}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <span className="shrink-0 font-medium text-teal-600">
                  {tx.redeemAmount != null && tx.redeemCurrency
                    ? `${tx.redeemAmount.toFixed(2)} ${tx.redeemCurrency}`
                    : `$${tx.amount.toFixed(2)} USD`}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function Activity() {
  const { state } = useAppState();
  const { viewMode } = useViewMode();

  if (!state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the home page first.</p>
      </div>
    );
  }

  if (viewMode === "recipient") {
    return <ReceivedActivity />;
  }

  const txs = state.user.transactions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
        <p className="mt-1 text-slate-600">All movements — like a transaction explorer for this account.</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {txs.length === 0 ? (
            <li className="px-4 py-8 text-center text-slate-500">No activity yet.</li>
          ) : (
            txs.map((tx) => (
              <li key={tx.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {typeLabels[tx.type] ?? tx.type}
                      {tx.status === "pending" && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Pending</span>
                      )}
                      {tx.status === "confirmed" && (
                        <span className="ml-2 rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">Confirmed</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{tx.label}</p>
                    {/* Explorer-style details for on-chain send */}
                    {tx.type === "send" && (
                      <div className="mt-2 rounded border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
                        {tx.txHash && (
                          <p className="font-mono text-slate-600 break-all">Tx: {tx.txHash}</p>
                        )}
                        {tx.blockConfirmations != null && (
                          <p className="text-slate-500">Confirmations: {tx.blockConfirmations}</p>
                        )}
                        {tx.gasFeeUsd != null && (
                          <p className="text-slate-500">Gas (est.): ~${tx.gasFeeUsd.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                    {/* Fiat transfer: show reference instead of tx hash */}
                    {tx.type === "fiat_transfer" && tx.transferReference && (
                      <p className="mt-1 font-mono text-xs text-slate-500">Ref: {tx.transferReference}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={tx.type === "send" || tx.type === "fiat_transfer" ? "text-red-600" : "text-teal-600"}>
                      {tx.type === "send" || tx.type === "fiat_transfer" ? "-" : "+"}
                      {tx.redeemAmount != null && tx.redeemCurrency
                        ? `${tx.redeemAmount.toFixed(2)} ${tx.redeemCurrency}`
                        : `$${tx.amount.toFixed(2)}`}
                    </span>
                    {tx.type !== "redeem" && <span className="text-slate-500 ml-1">{tx.currency}</span>}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
