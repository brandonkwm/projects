# IRAS myTax Portal — Payment Plan Adjustment Feature

A clickable React prototype demonstrating a new digital self-service feature for the IRAS (Inland Revenue Authority of Singapore) myTax Portal: the ability for taxpayers to request a reduction in their monthly income tax instalments when facing unexpected hardship.

## Background

Singapore taxpayers who pay income tax via GIRO can spread payments across 12 monthly instalments. However, when life circumstances change suddenly — retrenchment, medical emergency, severe debt — the only current option is to call IRAS directly. This involves long queue times (100+ callers at peak) and a complex verbal process that is difficult to navigate under stress.

This prototype proposes a digital journey to solve that.

---

## Features

### Portal Shell (existing pages, mirrored for context)
- **Overview** — Tax summary for YA 2025, quick action tiles, payment due reminder
- **Payment Plan** — Full GIRO instalment schedule with paid/current/upcoming status, progress bar, remaining balance

### New Feature: Request Payment Plan Adjustment (3-step wizard)

**Step 1 — Review & Update**
- Displays current plan (remaining balance, monthly amount, months left)
- Input field for new monthly instalment amount
- Live calculation showing deferred amount as user types
- Reason dropdown (Retrenchment, Reduced income, Medical, Debt, Other)
- File upload for supporting documents (drag & drop, PDF/JPG/PNG)
- Built-in guardrails with inline validation (see below)

**Step 2 — Review Changes**
- Full request summary table
- Visual deferral diagram showing:
  - YA 2025 bar: paid months (navy) vs adjusted months (orange)
  - Arrow showing deferred amount carrying over
  - YA 2026 bar: assumed base tax (teal) + carry-over (amber), proportional to dollar amounts
  - Combined monthly instalment estimate for next window
- Declaration checkbox

**Step 3 — Acknowledgement**
- Auto-generated reference number (e.g. `PPA-WVQBCS-2026`)
- Request summary
- "What Happens Next" timeline (review → inbox notification → updated GIRO)
- Save as PDF / Back to Overview

---

## Guardrails (Abuse Prevention)

| # | Guardrail | Implementation |
|---|-----------|----------------|
| 1 | **Minimum floor** | Instalment cannot drop below $50/month |
| 2 | **Max deferral cap** | Cannot defer more than 60% of remaining balance per window |
| 3 | **Combined effective floor** | Floor of 1 & 2 enforced — whichever is higher |
| 4 | **Mandatory document for large reductions** | Reductions >50% of current instalment require document upload |
| 5 | **1 adjustment per window** | UI surfaces this as a policy rule; backend would enforce |
| 6 | **Minimum months elapsed** | Adjustment only available from month 3 of the cycle |
| 7 | **Pending request lock** | Cannot submit while a prior request is under review |
| 8 | **Audit flag** (system-level) | Requests >40% reduction without document flagged for IRAS review |
| 9 | **Compounding deferral cap** (system-level) | If prior window deferral is outstanding, cap drops to 30% |

---

## Tech Stack

- **React 18** with React Router v6
- **Vite** (build tool)
- **Tailwind CSS v3** (utility-first styling)
- No backend — all state is client-side mock data

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5174` in your browser.

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx            # IRAS-style header (logo, user bar, nav)
│   ├── Layout.jsx            # Page wrapper with header + footer
│   └── StepIndicator.jsx     # Wizard step progress component
├── pages/
│   ├── Overview.jsx          # Dashboard / landing page
│   ├── PaymentPlan.jsx       # Current GIRO plan view
│   ├── AdjustmentWizard.jsx  # Wizard shell + state management
│   └── steps/
│       ├── Step1Input.jsx    # Input + guardrail validation
│       ├── Step2Review.jsx   # Deferral visualisation + summary
│       └── Step3Confirm.jsx  # Acknowledgement + reference number
```

---

## Design Decisions

- **UI matches IRAS portal conventions** — navy/teal/orange colour palette, header layout, step indicator pattern, breadcrumb navigation, and typography all mirror the live myTax Portal.
- **Deferral visualisation is the core UX** — proportional bar charts make the financial impact of the decision immediately legible, including the overlap effect on the next assessment window.
- **Guardrails surface inline** — limits are explained upfront in a summary box and enforced with contextual error messages, not just rejected silently.
- **Document upload shifts processing time** — the UI explicitly communicates that applications without supporting documents take longer, nudging users toward compliance without making it compulsory for small reductions.

---

## Disclaimer

This is a **portfolio/concept prototype** — not affiliated with or endorsed by IRAS. It is intended to demonstrate UX thinking and digital journey design for government self-service contexts in Singapore.
