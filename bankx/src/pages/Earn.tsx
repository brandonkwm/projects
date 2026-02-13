import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { MOCK_POOLS } from "../data/mock";

export function Earn() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  if (!state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the home page first.</p>
      </div>
    );
  }

  const tokenized = state.user.balances.tokenized;
  const pool = selectedPool ? MOCK_POOLS.find((p) => p.id === selectedPool) : null;
  const num = parseFloat(amount) || 0;
  const valid = pool && num > 0 && num <= tokenized;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !pool) return;
    dispatch({ type: "ADD_TO_POOL", amount: num, poolName: pool.name });
    setDone(true);
  }

  if (done && pool) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <div className="text-4xl text-teal-500">✓</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Added to pool</h2>
        <p className="mt-2 text-slate-600">${num.toFixed(2)} in {pool.name}</p>
        <button
          onClick={() => { setDone(false); setSelectedPool(null); setAmount(""); navigate("/dashboard"); }}
          className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earn</h1>
        <p className="mt-1 text-slate-600">Pledge tokenized fiat in liquidity pools and earn yield.</p>
      </div>

      <div className="rounded-xl bg-slate-100 p-4">
        <p className="text-sm text-slate-500">Available to pledge</p>
        <p className="text-xl font-semibold text-slate-900">${tokenized.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_POOLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPool(p.id)}
            className={`rounded-xl border-2 p-6 text-left transition ${
              selectedPool === p.id
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <h3 className="font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-2xl font-bold text-teal-600">{p.apy}% APY</p>
            <p className="mt-1 text-sm text-slate-500">{p.tvl} TVL</p>
            <p className="mt-2 text-sm text-slate-600">{p.description}</p>
          </button>
        ))}
      </div>

      {pool && (
        <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-900">Add to {pool.name}</h3>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Amount (USD)</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              max={tokenized}
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
            Add to pool
          </button>
        </form>
      )}
    </div>
  );
}
