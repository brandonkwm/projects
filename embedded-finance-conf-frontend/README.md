# Embedded Finance Configurator (EmbedFlow)

## Problem statement 
Partners struggle to understand what an embedded card / wallet / BNPL integration would look like, and which options are possible. Due to this opacity, discovery happens via sales decks, endless calls, and custom PoCs due to the need to align on strategy, APIs, and risk.

Currently, fintechs lack self-serve configurators that expose trade-offs upfront: speed vs compliance depth, cost vs coverage, or scalability vs customization. 

## Solution
A **partner-facing configurator** for embedded finance: helps SaaS platforms, marketplaces, and gig apps select, configure, and understand the right combo of modular products (virtual cards, wallets, payouts) with clear KYC, geos, and funding options.

The configurator uses a **top-to-bottom flow** with clearly numbered steps:

1. **Category** — Embedded Payments, Embedded Lending & Credit, Embedded Investment, Embedded Insurance
2. **Sub-category** — e.g. for Payments: Credit card payments, Bank account linkages; for Lending: BNPL, Working capital, Consumer loans; etc.
3. **Schemes** (when Payments + Bank account linkages) — EDDA (SG), NPP (AU), FPS (UK), SEPA (EU), ACH (US)
4. **Geos** — US, EU, UK, SG, AU
5. **Compliance depth** — No KYC, Light KYC, Full KYC (with short explanations)
6. **Funding rails** — ACH, SEPA, Stablecoins
7. **Generated spec summary** — API endpoints, cost estimate, time-to-launch, rationale

The **Generated spec summary** updates live with:

- Suggested API endpoints
- Cost estimate (setup + monthly)
- Time-to-launch range
- Short rationale for the configuration

Actions: **PDF spec** and **API docs** (UI only in this prototype).

### Partner vs Service provider view

- **Partner view**: Partners select category, sub-category, schemes, geos, compliance, and funding; the generated spec shows a **configurable** cost estimate (no hardcoded formula).
- **Service provider view**: Switch via the header toggle. Providers can:
  - Add or remove **sub-categories** per category
  - Add or remove **payment schemes** (e.g. EDDA, NPP) under Bank account linkages
  - Manage **geos** and **funding** options
  - Configure **cost estimate rules**: base setup/monthly, per-geo and per-scheme add-ons, KYC multipliers. The partner-facing spec uses these values so cost is not hardcoded.

### AI Configurator Assistant (Partner view)

- **Talk to AI** opens a chat panel. Partners can describe what they need in natural language (e.g. “Payments with EDDA in Singapore and SEPA in EU, full KYC”). A demo AI parses the message and updates the configurator (category, sub-category, schemes, geos, compliance, funding). The form and generated spec update immediately.

### Dashboard

- Use the sidebar to open **Dashboard** for performance metrics of the partner's embedded finance setup (demo data):
  - **Welcome/Overview card**: Quick stats from the current config (e.g. category + sub-category, go-live, est. revenue). Default overview if nothing configured yet.
  - **Performance metrics**: Active users, cards issued, volume processed and tx count, funding inflows (ACH/SEPA), auth success and dispute rates.
  - **Recent activity feed**: Timeline (e.g. new card issued, payout batch completed).
  - **Alerts**: e.g. "Low ACH balance—top up?" and "Compliance review due".
- **Specs** and **Integrate** show placeholder copy.

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

## Deploy

### Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. **Root Directory:** `embedded-finance-conf-frontend` (if the app lives in that subfolder).
4. **Build Command:** `npm run build` · **Output Directory:** `dist`.
5. Deploy. The live URL will be something like `https://embedded-finance-conf-frontend-xxx.vercel.app`.

### Netlify

1. Push the repo to GitHub.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → connect GitHub and select the repo.
3. **Base directory:** `embedded-finance-conf-frontend` (if applicable).
4. **Build command:** `npm run build` · **Publish directory:** `dist`.
5. Deploy. Use the generated URL (e.g. `https://your-site.netlify.app`) in your portfolio.

### Optional: project at repo root

If this frontend is the only content of the repo (no parent `projects/` folder), leave **Root Directory** / **Base directory** empty; Vercel and Netlify will use `package.json` and publish `dist` after `npm run build`.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** for styling (dark theme, responsive grid)

## Portfolio note

This is a **clickable prototype** for discovery and planning—no real API or PDF generation. Use it to demonstrate product thinking (problem → guided flow → transparent spec) and basic front-end implementation.
