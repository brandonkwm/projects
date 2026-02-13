import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { SenderFlow } from "../components/SenderFlow";
import { BlockchainConstraints } from "../components/BlockchainConstraints";
import { isValidEthAddress, addressValidationHint } from "../utils/address";
import { ESTIMATED_GAS_FEE_USD } from "../constants";

type SendMode = "fiat" | "onchain";

export function Send() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<SendMode>("fiat");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txId, setTxId] = useState<string | null>(null);
  const [transferRef, setTransferRef] = useState("");
  const [fiatDone, setFiatDone] = useState(false);
  const confirmedRef = useRef(false);

  if (!state.user) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        <p>Please open an account from the home page first.</p>
      </div>
    );
  }

  const { fiat, tokenized } = state.user.balances;
  const num = parseFloat(amount) || 0;
  const recipientValidOnchain = isValidEthAddress(recipient);
  const recipientValidFiat = recipient.trim().length >= 6; // e.g. ACC-2024-1234
  const validFiat = num > 0 && num <= fiat && recipientValidFiat;
  const validOnchain = num > 0 && num <= tokenized && recipientValidOnchain;

  const pendingTx = txId ? state.user.transactions.find((t) => t.id === txId) : null;
  const isPending = pendingTx?.status === "pending";
  const isConfirmed = pendingTx?.status === "confirmed";

  useEffect(() => {
    if (!txId || confirmedRef.current) return;
    const tx = state.user?.transactions.find((t) => t.id === txId);
    if (tx?.status === "confirmed") {
      confirmedRef.current = true;
      return;
    }
    if (tx?.status === "pending") {
      const t = setTimeout(() => {
        dispatch({ type: "CONFIRM_TX", txId });
        confirmedRef.current = true;
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [txId, state.user?.transactions, dispatch]);

  function handleSubmitFiat(e: React.FormEvent) {
    e.preventDefault();
    if (!validFiat) return;
    const ref = "REF-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setTransferRef(ref);
    dispatch({
      type: "TRANSFER_FIAT",
      amount: num,
      recipientAccountId: recipient.trim(),
      transferReference: ref,
    });
    setFiatDone(true);
  }

  function handleSubmitOnchain(e: React.FormEvent) {
    e.preventDefault();
    if (!validOnchain) return;
    const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const id = crypto.randomUUID();
    setTxHash(hash);
    setTxId(id);
    dispatch({
      type: "SEND",
      amount: num,
      recipient: recipient.trim(),
      txHash: hash,
      gasFeeUsd: ESTIMATED_GAS_FEE_USD,
      txId: id,
    });
    setDone(true);
  }

  // Fiat transfer success
  if (mode === "fiat" && fiatDone) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="text-4xl text-teal-500">✓</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Transfer complete</h2>
        <p className="mt-2 text-slate-600">${num.toFixed(2)} transferred to {recipient}</p>
        <p className="mt-2 font-mono text-sm text-slate-500">Reference: {transferRef}</p>
        <p className="mt-1 text-xs text-slate-500">Account-to-account (same bank). No gas fee.</p>
        <button
          onClick={() => { setFiatDone(false); setAmount(""); setRecipient(""); setTransferRef(""); navigate("/dashboard"); }}
          className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // On-chain pending / confirmed
  if (mode === "onchain" && done && (isPending || isConfirmed)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {isPending && (
          <>
            <div className="flex items-center gap-2 text-amber-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="font-medium">Pending</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Transaction submitted</h2>
            <p className="mt-2 text-slate-600">
              Waiting for block confirmations. On Ethereum, safe finality is typically 12 blocks (~3 min).
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">{txHash}</p>
            <p className="mt-2 text-sm text-slate-500">Network fee: ~${ESTIMATED_GAS_FEE_USD.toFixed(2)} (gas)</p>
          </>
        )}
        {isConfirmed && (
          <>
            <div className="text-4xl text-teal-500">✓</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Confirmed</h2>
            <p className="mt-2 text-slate-600">${num.toFixed(2)} to {recipient}</p>
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">{txHash}</p>
            <p className="mt-1 text-xs text-slate-500">Transaction is final and cannot be reversed.</p>
            <button
              onClick={() => { setDone(false); setAmount(""); setRecipient(""); setTxId(null); confirmedRef.current = false; navigate("/dashboard"); }}
              className="mt-6 w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Send</h1>
        <p className="mt-1 text-slate-600">
          Transfer fiat (same-bank, account-to-account) or send on-chain (token; gas applies).
        </p>
      </div>

      {/* Tabs: Fiat vs On-chain */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("fiat")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "fiat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Transfer fiat (same bank)
        </button>
        <button
          type="button"
          onClick={() => setMode("onchain")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "onchain" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Send on-chain (token)
        </button>
      </div>

      {mode === "fiat" && (
        <>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Fiat balance</p>
            <p className="text-xl font-semibold text-slate-900">${fiat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-xs text-slate-500">Account-to-account. No blockchain; no gas fee.</p>
          </div>
          <form onSubmit={handleSubmitFiat} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 max-w-md">
            <div>
              <label htmlFor="fiat-recipient" className="block text-sm font-medium text-slate-700">Recipient account ID</label>
              <input
                id="fiat-recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="ACC-2024-8847"
              />
              <p className="mt-1 text-xs text-slate-500">Same-bank account (e.g. ACC-2024-XXXX).</p>
            </div>
            <div>
              <label htmlFor="fiat-amount" className="block text-sm font-medium text-slate-700">Amount (USD)</label>
              <input
                id="fiat-amount"
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
              disabled={!validFiat}
              className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Transfer
            </button>
          </form>
        </>
      )}

      {mode === "onchain" && (
        <>
          <SenderFlow />
          <BlockchainConstraints />
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Tokenized balance</p>
            <p className="text-xl font-semibold text-slate-900">${tokenized.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <form onSubmit={handleSubmitOnchain} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4 max-w-md">
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-slate-700">Recipient (Ethereum address)</label>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`mt-1 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-1 ${
                  recipient.length > 0 && !recipientValidOnchain
                    ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                    : "border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                }`}
                placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
              />
              {recipient.length > 0 && !recipientValidOnchain && (
                <p className="mt-1 text-xs text-amber-600">{addressValidationHint()}</p>
              )}
            </div>
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
            <p className="text-xs text-slate-500">Estimated network fee: ~${ESTIMATED_GAS_FEE_USD.toFixed(2)} (paid in ETH). On-chain transfers are final.</p>
            <button
              type="submit"
              disabled={!validOnchain}
              className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send on-chain
            </button>
          </form>
        </>
      )}
    </div>
  );
}
