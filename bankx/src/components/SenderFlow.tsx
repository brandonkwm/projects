import { REQUIRED_CONFIRMATIONS } from "../constants";

/**
 * Sender's view: end-to-end flow when both parties are same-bank customers.
 * Reflects blockchain constraints: gas, confirmations, finality.
 */
export function SenderFlow() {
  const steps = [
    { title: "Fiat (USD)", desc: "Your balance is in the bank" },
    { title: "Mint token", desc: "USD-backed ERC-20 on Ethereum" },
    { title: "You send", desc: "On-chain transfer; you pay gas. Irreversible once confirmed." },
    { title: "Confirmations", desc: `${REQUIRED_CONFIRMATIONS} blocks for safe finality (~3 min)` },
    { title: "Recipient gets token", desc: "Same bank sees on-chain balance" },
    { title: "Recipient redeems", desc: "Off-chain request → bank credits fiat (USD or e.g. SGD with FX)" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Sender&apos;s view — same-bank flow</h3>
      <p className="mt-1 text-xs text-slate-500">
        Token is USD-backed; recipient can redeem to USD or another fiat (e.g. SGD) with FX at redeem time.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              {i + 1}
            </span>
            <span className="text-sm">
              <span className="font-medium text-slate-800">{step.title}</span>
              <span className="text-slate-500"> — {step.desc}</span>
            </span>
            {i < steps.length - 1 && (
              <span className="hidden text-slate-300 sm:inline" aria-hidden>→</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
