import type { IncomingTransfer, Pool, Transaction, User } from "../types";

export const MOCK_POOLS: Pool[] = [
  {
    id: "usd-stable",
    name: "USD Stable",
    apy: 4.2,
    tvl: "$2.4M",
    description: "Tokenized USD. Low risk, stable yield.",
  },
  {
    id: "global-liquidity",
    name: "Global Liquidity",
    apy: 5.8,
    tvl: "$8.1M",
    description: "Cross-border liquidity pool. Higher yield.",
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "tokenize",
    amount: 500,
    currency: "USD",
    label: "Tokenized to BankX",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    txHash: "0x7a3f...9e2b",
  },
  {
    id: "2",
    type: "send",
    amount: 100,
    currency: "USD",
    label: "Sent to 0x4b2c...1d",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    txHash: "0x9e1a...4c7d",
    recipient: "0x4b2c...1d",
  },
  {
    id: "3",
    type: "add_to_pool",
    amount: 200,
    currency: "USD",
    label: "Added to USD Stable",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    poolName: "USD Stable",
  },
];

export const MOCK_INCOMING: IncomingTransfer[] = [
  {
    id: "inc-1",
    from: "0x8f2a...3c1e",
    amount: 150,
    currency: "USD",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    txHash: "0x1b4e...7a9c",
    redeemed: false,
  },
];

export const INITIAL_USER: User = {
  name: "Alex",
  accountId: "ACC-2024-8847",
  balances: {
    fiat: 12500,
    tokenized: 200,
  },
  transactions: MOCK_TRANSACTIONS,
  incomingTransfers: MOCK_INCOMING,
};
