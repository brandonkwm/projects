# Embedded Finance Configurator (EmbedFlow)

A **partner-facing configurator** for embedded finance: helps SaaS platforms, marketplaces, and gig apps select, configure, and understand the right combo of modular products (virtual cards, wallets, payouts) with clear KYC, geos, and funding options.

## Problem

Embedded finance providers (e.g. Stripe Issuing, Marqeta, Unit) offer modular products, but partners struggle to:

- Select and combine the right products
- Understand compliance (full vs light vs no KYC)
- Choose funding rails (ACH, SEPA, stablecoins) and supported geos
- Get a clear spec and cost/timeline to share with technical and compliance teams

## Solution

This prototype guides partners through:

1. **Business type** — Marketplace, SaaS Platform, or Gig Economy (tailors recommendations)
2. **Products** — Virtual Cards, Wallets, Payouts (multi-select)
3. **Geos** — US, EU, SG
4. **Funding rails** — ACH, SEPA, Stablecoins
5. **Compliance depth** — No KYC, Light KYC, Full KYC (with short explanations)

The **Generated spec summary** updates live with:

- Suggested API endpoints
- Cost estimate (setup + monthly)
- Time-to-launch range
- Short rationale for the configuration

Actions: **PDF spec** and **API docs** (UI only in this prototype).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** for styling (dark theme, responsive grid)

## Portfolio note

This is a **clickable prototype** for discovery and planning—no real API or PDF generation. Use it to demonstrate product thinking (problem → guided flow → transparent spec) and basic front-end implementation.
