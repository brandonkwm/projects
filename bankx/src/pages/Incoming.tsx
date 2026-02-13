import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { useViewMode } from "../context/ViewModeContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { REDEEM_CURRENCIES } from "../constants";
import type { IncomingTransfer } from "../types";

export function Incoming() {
  const { state, dispatch } = useAppState();
  const { viewMode } = useViewMode();
  const navigate = useNavigate();
  const { rates, loading: ratesLoading, error: ratesError } = useExchangeRates();
  const [redeemModal, setRedeemModal] = useState<IncomingTransfer | null>(null);
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [done, setDone] = useState(false);
  const [redeemedAmount, setRedeemedAmount] = useState<{ amount: number; currency: string } | null>(null);

  if (!state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the home page first.</p>
      </div>
    );
  }

  const pending = state.user.incomingTransfers.filter((t) => !t.redeemed);
  const rate = rates && toCurrency in rates ? rates[toCurrency] : 1;
  const redeemAmount = redeemModal ? redeemModal.amount * rate : 0;

  function handleRedeem(inc: IncomingTransfer) {
    setRedeemModal(inc);
    setToCurrency("USD");
    setDone(false);
    setRedeemedAmount(null);
  }

  function confirmRedeem() {
    if (!redeemModal) return;
    const amount = redeemModal.amount * rate;
    dispatch({
      type: "REDEEM",
      incomingId: redeemModal.id,
      toCurrency,
      redeemAmount: amount,
    });
    setRedeemedAmount({ amount, currency: toCurrency });
    setDone(true);
  }

  function closeModal() {
    setRedeemModal(null);
    setRedeemedAmount(null);
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6">
      {viewMode === "recipient" && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
          <strong>Recipient account view</strong> — These are tokens sent to your wallet. Redeem to credit your account in your chosen currency.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Incoming</h1>
        <p className="mt-1 text-slate-600">
          Token transfers you&apos;ve received on-chain. Redeem is an off-chain request: the bank verifies your balance, then credits your account (USD or another currency with live FX).
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No pending incoming transfers. When someone sends you BankX tokens, they appear here for you to redeem.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((inc) => (
            <li
              key={inc.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  ${inc.amount.toFixed(2)} {inc.currency}
                </p>
                <p className="text-sm text-slate-500">From {inc.from}</p>
                <p className="font-mono text-xs text-slate-400">{inc.txHash}</p>
                <p className="text-xs text-slate-400">{new Date(inc.timestamp).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRedeem(inc)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Redeem to fiat
              </button>
            </li>
          ))}
        </ul>
      )}

      {redeemModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done && redeemedAmount ? (
              <>
                <div className="text-4xl text-teal-500">✓</div>
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Redeemed</h2>
                <p className="mt-2 text-slate-600">
                  Credited {redeemedAmount.amount.toFixed(2)} {redeemedAmount.currency} to your account
                  {redeemedAmount.currency !== "USD" && " (FX applied)."}
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Redeem to fiat</h2>
                <p className="mt-1 text-slate-600">
                  ${redeemModal.amount.toFixed(2)} USD-backed token. Choose credit currency:
                </p>
                {ratesError && (
                  <p className="mt-2 text-sm text-amber-600">Rates unavailable ({ratesError}). Using fallback.</p>
                )}
                <div className="mt-4">
                  <label htmlFor="redeem-ccy" className="block text-sm font-medium text-slate-700">
                    Credit currency
                  </label>
                  <select
                    id="redeem-ccy"
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    disabled={ratesLoading}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-70"
                  >
                    {REDEEM_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  {ratesLoading ? (
                    <span className="text-slate-500">Loading rate…</span>
                  ) : (
                    <>
                      <p className="text-slate-600">
                        1 USD = {rate.toFixed(4)} {toCurrency}
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        You&apos;ll receive {redeemAmount.toFixed(2)} {toCurrency}
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRedeemModal(null)}
                    className="flex-1 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRedeem}
                    className="flex-1 rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
                  >
                    Redeem
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
