import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type { User, Transaction } from "../types";
import { INITIAL_USER } from "../data/mock";
import { REQUIRED_CONFIRMATIONS } from "../constants";

type AppState = {
  user: User | null;
  isOnboarded: boolean;
};

type Action =
  | { type: "ONBOARD"; name: string }
  | { type: "TOKENIZE"; amount: number }
  | { type: "SEND"; amount: number; recipient: string; txHash: string; gasFeeUsd: number; txId: string }
  | { type: "CONFIRM_TX"; txId: string }
  | { type: "ADD_TO_POOL"; amount: number; poolName: string }
  | { type: "REDEEM"; incomingId: string; toCurrency: string; redeemAmount: number }
  | { type: "TRANSFER_FIAT"; amount: number; recipientAccountId: string; transferReference: string }
  | { type: "RESET" };

const defaultState: AppState = {
  user: null,
  isOnboarded: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ONBOARD": {
      return {
        ...state,
        user: {
          ...INITIAL_USER,
          name: action.name,
          balances: { fiat: 12500, tokenized: 200 },
          transactions: INITIAL_USER.transactions,
          incomingTransfers: [...INITIAL_USER.incomingTransfers],
        },
        isOnboarded: true,
      };
    }
    case "TOKENIZE": {
      if (!state.user) return state;
      const { fiat, tokenized } = state.user.balances;
      if (action.amount > fiat) return state;
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        type: "tokenize",
        amount: action.amount,
        currency: "USD",
        label: "Tokenized to BankX",
        timestamp: new Date().toISOString(),
        txHash: "0x" + Math.random().toString(16).slice(2, 10) + "...",
      };
      return {
        ...state,
        user: {
          ...state.user,
          balances: {
            fiat: fiat - action.amount,
            tokenized: tokenized + action.amount,
          },
          transactions: [newTx, ...state.user.transactions],
        },
      };
    }
    case "SEND": {
      if (!state.user) return state;
      const { tokenized } = state.user.balances;
      if (action.amount > tokenized) return state;
      const newTx: Transaction = {
        id: action.txId,
        type: "send",
        amount: action.amount,
        currency: "USD",
        label: `Sent to ${action.recipient}`,
        timestamp: new Date().toISOString(),
        txHash: action.txHash,
        recipient: action.recipient,
        status: "pending",
        blockConfirmations: 0,
        gasFeeUsd: action.gasFeeUsd,
      };
      return {
        ...state,
        user: {
          ...state.user,
          balances: {
            ...state.user.balances,
            tokenized: tokenized - action.amount,
          },
          transactions: [newTx, ...state.user.transactions],
        },
      };
    }
    case "CONFIRM_TX": {
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          transactions: state.user.transactions.map((tx) =>
            tx.id === action.txId && tx.status === "pending"
              ? { ...tx, status: "confirmed" as const, blockConfirmations: REQUIRED_CONFIRMATIONS as number }
              : tx
          ),
        },
      };
    }
    case "ADD_TO_POOL": {
      if (!state.user) return state;
      const { tokenized } = state.user.balances;
      if (action.amount > tokenized) return state;
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        type: "add_to_pool",
        amount: action.amount,
        currency: "USD",
        label: `Added to ${action.poolName}`,
        timestamp: new Date().toISOString(),
        poolName: action.poolName,
      };
      return {
        ...state,
        user: {
          ...state.user,
          balances: {
            ...state.user.balances,
            tokenized: tokenized - action.amount,
          },
          transactions: [newTx, ...state.user.transactions],
        },
      };
    }
    case "REDEEM": {
      if (!state.user) return state;
      const inc = state.user.incomingTransfers.find((t) => t.id === action.incomingId && !t.redeemed);
      if (!inc) return state;
      const creditFiat = inc.amount; // credit USD equivalent into fiat balance
      const isOtherCcy = action.toCurrency !== "USD";
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        type: "redeem",
        amount: inc.amount,
        currency: inc.currency,
        label: isOtherCcy
          ? `Redeemed $${inc.amount.toFixed(2)} as ${action.redeemAmount.toFixed(2)} ${action.toCurrency}`
          : `Redeemed to USD`,
        timestamp: new Date().toISOString(),
        redeemCurrency: action.toCurrency,
        redeemAmount: isOtherCcy ? action.redeemAmount : undefined,
      };
      return {
        ...state,
        user: {
          ...state.user,
          balances: {
            ...state.user.balances,
            fiat: state.user.balances.fiat + creditFiat,
          },
          transactions: [newTx, ...state.user.transactions],
          incomingTransfers: state.user.incomingTransfers.map((t) =>
            t.id === action.incomingId ? { ...t, redeemed: true } : t
          ),
        },
      };
    }
    case "TRANSFER_FIAT": {
      if (!state.user) return state;
      const { fiat } = state.user.balances;
      if (action.amount <= 0 || action.amount > fiat) return state;
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        type: "fiat_transfer",
        amount: action.amount,
        currency: "USD",
        label: `Transferred to ${action.recipientAccountId}`,
        timestamp: new Date().toISOString(),
        recipient: action.recipientAccountId,
        transferReference: action.transferReference,
      };
      return {
        ...state,
        user: {
          ...state.user,
          balances: {
            ...state.user.balances,
            fiat: fiat - action.amount,
          },
          transactions: [newTx, ...state.user.transactions],
        },
      };
    }
    case "RESET":
      return defaultState;
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
