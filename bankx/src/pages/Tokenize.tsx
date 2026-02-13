import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";

export function Tokenize() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  if (!state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the home page first.</p>
      </div>
    );
  }

  const fiat = state.user.balances.fiat;
  const num = parseFloat(amount) || 0;
  const valid = num > 0 && num <= fiat;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    dispatch({ type: "TOKENIZE", amount: num });
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <div className="text-4xl text-teal-500">✓</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Tokenized</h2>
        <p className="mt-2 text-slate-600">${num.toFixed(2)} converted to BankX tokens.</p>
        <button
          onClick={() => { setDone(false); setAmount(""); navigate("/dashboard"); }}
          className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tokenize fiat</h1>
        <p className="mt-1 text-slate-600">Convert bank balance to BankX tokens for sending or earning.</p>
      </div>

      <div className="rounded-xl bg-slate-100 p-4">
        <p className="text-sm text-slate-500">Available fiat</p>
        <p className="text-xl font-semibold text-slate-900">${fiat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            max={fiat}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="0.00"
          />
        </div>
        <button
          type="submit"
          disabled={!valid}
          className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tokenize
        </button>
      </form>
    </div>
  );
}
