/**
 * Surfaces real blockchain constraints so the prototype reflects how the rail actually works.
 */
import { REQUIRED_CONFIRMATIONS, ESTIMATED_GAS_FEE_USD, TOKEN_DECIMALS } from "../constants";

export function BlockchainConstraints() {
  const items = [
    {
      title: "Finality",
      desc: `Transactions are irreversible. Once confirmed on-chain, there are no chargebacks or reversals. Safe finality typically requires ${REQUIRED_CONFIRMATIONS} block confirmations (e.g. ~3 min on Ethereum).`,
    },
    {
      title: "Network fee (gas)",
      desc: `Every on-chain transaction pays gas in the chain's native token (e.g. ETH). Estimated fee shown in USD equivalent (~$${ESTIMATED_GAS_FEE_USD}); actual cost varies with network congestion.`,
    },
    {
      title: "Address format",
      desc: "On-chain transfers use wallet addresses (0x + 40 hex characters). Sending to a wrong address cannot be undone.",
    },
    {
      title: "Token standard",
      desc: `BankX token is ERC-20 compatible. On-chain amounts use ${TOKEN_DECIMALS} decimals; the app shows human-readable units.`,
    },
    {
      title: "Redeem is off-chain",
      desc: "Redeeming token → fiat is a request to the bank. The bank verifies your on-chain balance (or burn), then credits your account. FX for other currencies is applied at redeem time.",
    },
  ];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-amber-900">Blockchain constraints (Ethereum)</h3>
      <p className="mt-1 text-xs text-amber-800/90">
        This prototype obeys how the rail actually works: finality, gas, addresses, and redeem flow.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="font-medium text-amber-900 shrink-0">{item.title}:</span>
            <span className="text-amber-800/90">{item.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
