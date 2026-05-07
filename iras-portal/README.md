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

| # | Guardrail | Detail |
|---|-----------|--------|
| 1 | **Minimum floor** | Instalment cannot drop below 10% of current monthly (e.g. $50 on a $500 plan) |
| 2 | **Mandatory supporting document** | Required for all requests regardless of reduction amount |
| 3 | **Compounding deferral cap** | If a deferred balance from a prior window is still outstanding, further deferral this window is capped at 50% of that outstanding amount — prevents year-on-year debt snowball. See example below. |
| 4 | **Pending request lock** | Cannot submit a new request while a prior one is under review |

### Compounding Deferral Cap — Example

Say you are in **YA 2025** and reduce your payments, deferring **$2,300** to the following year.

In **YA 2026**, you are assessed again and find yourself still struggling. Without a compounding cap, you could defer again in full — and again in YA 2027 — stacking an ever-growing liability that becomes difficult for both the taxpayer and IRAS to manage.

The guardrail applies: **maximum additional deferral in YA 2026 is capped at 50% of the $2,300 already outstanding = $1,150**. So if your YA 2026 remaining balance is $3,000, you must pay at least $3,000 − $1,150 = **$1,850 this window** (≈ $154/month minimum), not just the base $50 floor.

The effective minimum therefore tightens with every window of outstanding debt, ensuring meaningful repayment progress while still offering genuine relief to someone in prolonged hardship. In this prototype the rule is surfaced as a policy statement; a real backend would calculate the cap dynamically from the user's deferred balance history.

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
- **Document upload is mandatory** — required for all requests to ensure accountability, with clear inline messaging explaining why it is needed.

---

## Disclaimer

This is a **portfolio/concept prototype** — not affiliated with or endorsed by IRAS. It is intended to demonstrate UX thinking and digital journey design for government self-service contexts in Singapore.
