import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";

export function Landing() {
  const { state } = useAppState();
  const navigate = useNavigate();

  if (state.isOnboarded && state.user) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-slate-600">You’re already signed in as {state.user.name}.</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block rounded-xl bg-teal-600 px-6 py-3 font-medium text-white hover:bg-teal-700"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Your balance.
          <br />
          <span className="text-teal-600">Programmable.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Tokenize your fiat and use blockchain as a payment rail. Send instantly or earn yield in liquidity pools.
        </p>
      </section>

      <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Open your account</h2>
        <p className="mt-1 text-sm text-slate-500">Concept prototype — no real money.</p>
        <OpenAccountForm
          onSuccess={() => navigate("/dashboard")}
        />
      </section>

      <section className="grid gap-6 sm:grid-cols-3 text-center">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-2xl font-bold text-teal-600">Tokenize</div>
          <p className="mt-2 text-sm text-slate-600">Turn fiat into on-chain tokens in one tap.</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-2xl font-bold text-teal-600">Send</div>
          <p className="mt-2 text-sm text-slate-600">Instant transfers on the blockchain rail.</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-2xl font-bold text-teal-600">Earn</div>
          <p className="mt-2 text-sm text-slate-600">Pledge tokenized fiat in liquidity pools.</p>
        </div>
      </section>
    </div>
  );
}

function OpenAccountForm({ onSuccess }: { onSuccess: () => void }) {
  const { dispatch } = useAppState();
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      dispatch({ type: "ONBOARD", name: name.trim() });
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
      >
        Open account
      </button>
    </form>
  );
}
