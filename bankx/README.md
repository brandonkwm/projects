# BankX — Clickable prototype

Concept digital banking webapp: **tokenize fiat → use blockchain as a payment rail and pledge in liquidity pools.**

Portfolio prototype (no real money, no real blockchain). Built with React, TypeScript, Vite, Tailwind CSS, and React Router.

---

## Context & problem

**Problem:** Even with modern platforms (e.g. Wise), cross-border transfers often still take **1–3 business days** for funds to arrive. Settlement depends on correspondent banks and local clearing systems, so speed and predictability are limited.

**Opportunity:** A bank that plugs into the **Ethereum network** can issue a fiat-backed token, let customers send it on-chain, and **convert the token back to fiat** when the recipient redeems. The blockchain becomes the settlement layer; the bank provides mint/redeem and custody. Funds can be available as soon as the recipient’s bank sees the on-chain transfer and credits the account — without waiting for legacy correspondent or local clearing cycles.

**Same-bank network:** When sender and recipient are both customers of the **same bank (or same network)** that supports this rail:

- **Cross-border and cross-currency transfer can be effectively instantaneous** after block confirmations (~minutes), instead of days.
- There is **no need to integrate with local payment rails** (e.g. PromptPay, DuitNow, QRIS) for the core transfer. The movement of value happens on-chain; the bank only needs to credit the recipient’s account in the chosen currency (with FX at redeem time if needed). Local rails can still be used for funding or withdrawal at the edges, but the “international leg” is the blockchain.

This prototype illustrates that flow: tokenize → send on-chain → recipient redeems to fiat (same or different currency), with a **sender view** and **recipient view** to show both sides of the same rail.

---

## Run locally

```bash
cd bankx
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Sender’s view & same-bank flow

When both sender and recipient are customers of the same bank (e.g. on Ethereum):

1. **Fiat (USD)** → bank holds the balance.
2. **Mint token** → USD-backed token; fiat backs the token 1:1.
3. **Sender sends token** → on-chain transfer.
4. **Recipient receives token** → same bank, instant.
5. **Recipient redeems** → back to fiat. **Limitation / feature:** the token is backed by one fiat (e.g. USD). Recipient can:
   - Redeem to **same currency** (USD → USD), or
   - **Redeem to another fiat** (e.g. SGD): the bank applies FX at redeem time and credits the recipient in SGD. So “send in USD, withdraw in SGD” is possible without the token itself being multi-currency — FX happens at the redeem step.

The **Send** page has two options: **Transfer fiat** (same-bank, account-to-account; no gas) and **Send on-chain** (token; gas applies). **Incoming** lets you redeem received tokens and choose credit currency (USD, SGD, EUR, GBP) with **live FX rates** from [Frankfurter](https://www.frankfurter.dev/).

## Blockchain constraints (reflected in the prototype)

The app obeys how the rail actually works:

- **Finality** — On-chain transactions are irreversible. No chargebacks. Safe finality requires a number of block confirmations (e.g. 12 on Ethereum, ~3 min). Send shows **Pending** then **Confirmed**.
- **Gas** — Every on-chain tx pays a network fee (gas) in the chain’s native token (e.g. ETH). Send shows an estimated fee in USD; Activity shows it per send.
- **Addresses** — On-chain transfers use wallet addresses (0x + 40 hex chars). Send validates this format and warns that sending to a wrong address cannot be undone.
- **Token standard** — BankX token is ERC-20; on-chain amounts use a fixed number of decimals (e.g. 6); the UI shows human-readable units.
- **Redeem is off-chain** — Redeeming token → fiat is a request to the bank. The bank verifies on-chain balance (or burn), then credits the account. FX for other currencies is applied at redeem time.

See the **Blockchain constraints** callout on the Send page and **Activity** (status + gas) for how this is surfaced in the UI.

## Demo flow (for interviews / portfolio)

1. **Landing** — Read value prop; click **Open account** and enter a name.
2. **Dashboard** — Total balance (fiat + tokenized), quick actions (Tokenize, Send, **Incoming**, Earn), recent activity.
3. **Tokenize** — Convert fiat to BankX tokens (e.g. $500).
4. **Send** — **Transfer fiat**: same-bank account ID (e.g. ACC-2024-8847), amount from fiat; no gas. **Send on-chain**: Ethereum address (0x + 40 hex), estimated gas; submit → Pending → Confirmed. On-chain transfers are final.
5. **Incoming** — Pending received transfers (one seeded). Click **Redeem to fiat**, choose currency from dropdown (USD, SGD, EUR, GBP); **FX rate is fetched from the web** (Frankfurter API). You’ll see “1 USD = X.XX SGD” and the amount you’ll receive.
6. **Earn** — Add tokenized balance to a liquidity pool.
7. **Activity** — **Explorer-style** for this account: each on-chain send shows tx hash, confirmations, and **gas fee**; fiat transfers show a **transfer reference**. Redeems show amount in chosen currency.

Use **Reset demo** on the dashboard to clear state and start again.

## Tech stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (v4)
- **React Router** v6
- In-memory state (reducer + context); no backend

## Project structure

- `src/pages/` — Landing, Dashboard, Tokenize, Send, **Incoming** (receive & redeem), Earn, Activity
- `src/components/SenderFlow.tsx` — Sender’s-view flow (includes confirmations and finality)
- `src/components/BlockchainConstraints.tsx` — Surfaces finality, gas, addresses, decimals, redeem
- `src/context/AppState.tsx` — State and actions (tokenize, send with **pending → confirm**, add to pool, redeem)
- `src/constants.ts` — Confirmations, gas estimate, token decimals, **REDEEM_CURRENCIES** (USD, SGD, EUR, GBP)
- `src/api/fx.ts` — Fetch FX rates from Frankfurter (free, no key)
- `src/hooks/useExchangeRates.ts` — Hook for redemption modal
- `src/utils/address.ts` — Ethereum address validation (0x + 40 hex)
- `src/types.ts` — Transaction **status**, **gasFeeUsd**, **transferReference**; **fiat_transfer**; redeem with **redeemAmount**

## Possible next steps

- Persist state in `localStorage` so refresh keeps the demo state
- Add a “Withdraw from pool” flow
- Responsive/mobile-first polish and PWA manifest for “app” feel
- Optional: connect to a testnet (e.g. Sepolia) for real tx hashes in the UI
