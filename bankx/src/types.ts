export type TransactionType =
  | "tokenize"
  | "send"
  | "receive"
  | "add_to_pool"
  | "withdraw_from_pool"
  | "redeem"
  | "fiat_transfer";

/** On-chain tx: pending until enough block confirmations (e.g. 12 on Ethereum) */
export type OnChainTxStatus = "pending" | "confirmed";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  label: string;
  timestamp: string;
  txHash?: string;
  recipient?: string;
  poolName?: string;
  redeemCurrency?: string;
  redeemAmount?: number;
  /** For send/receive: blockchain finality */
  status?: OnChainTxStatus;
  blockConfirmations?: number;
  /** Network gas fee (e.g. paid in ETH, shown in USD equivalent) */
  gasFeeUsd?: number;
  /** For fiat_transfer: internal reference (no on-chain tx) */
  transferReference?: string;
}

/** Received on-chain; not yet redeemed to fiat */
export interface IncomingTransfer {
  id: string;
  from: string;
  amount: number;
  currency: string;
  timestamp: string;
  txHash: string;
  redeemed: boolean;
}

export interface Pool {
  id: string;
  name: string;
  apy: number;
  tvl: string;
  description: string;
}

export interface Balances {
  fiat: number;
  tokenized: number;
}

export interface User {
  name: string;
  accountId: string;
  balances: Balances;
  transactions: Transaction[];
  incomingTransfers: IncomingTransfer[];
}
