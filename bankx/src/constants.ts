/** Ethereum-style: ~12 blocks for safe finality */
export const REQUIRED_CONFIRMATIONS = 12;

/** Simulated network fee (USD equivalent of gas). In production this would come from gas price × gas limit. */
export const ESTIMATED_GAS_FEE_USD = 1.25;

/** Token uses 6 decimals on-chain (common for stablecoins). Display amounts are in human units. */
export const TOKEN_DECIMALS = 6;

/** Currencies available for redemption (prototype). */
export const REDEEM_CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
] as const;

export type RedeemCurrencyCode = (typeof REDEEM_CURRENCIES)[number]["code"];
