# When the Queue Hits 100: Why Government Portals Need a Self-Service Rethink

*A personal experience, and a prototype that could fix it.*

---

Earlier this year, I was retrenched.

Beyond the obvious stress of job-hunting, there was a quieter, more administrative kind of stress: my income tax instalments were still running. $500 a month, autopilot, non-negotiable. With no salary coming in, I needed to reduce that amount — ideally to something I could actually afford while I got back on my feet.

I knew IRAS had a process for this. What I didn't know was that I'd spend the better part of two days trying to access it.

**Over 100 people in the call queue.** Twice.

When I finally got through, the officer was helpful — genuinely so. But the process itself was opaque: verbal confirmation of numbers, explanation of how deferral works, back-and-forth on what documentation was needed. Fifteen minutes of cognitive load when I was already running low on capacity.

I remember thinking: *this should not require a phone call in 2025.*

---

## The Problem with "Call to Request"

Singapore has done remarkable work digitising government services. SingPass, myInfo, CorpPass — the infrastructure is world-class. But there are pockets where the digital journey stops short and defers to the call centre.

Payment plan adjustments for income tax are one of those pockets.

The gap isn't just about convenience. When someone is retrenched or dealing with a medical crisis, cognitive load is at its peak and patience is at its lowest. A phone queue with 100 people in it isn't just frustrating — it's a barrier to accessing a legitimate entitlement.

---

## What I Built

As both a form of catharsis and a portfolio exercise, I built a clickable prototype of what a self-service payment plan adjustment feature might look like inside the IRAS myTax Portal.

The core user journey is a 3-step wizard:

**Step 1: Customise your plan**
The user inputs a new monthly instalment they can afford. As they type, the system instantly calculates how much will be deferred — live, in plain English. They select a reason (retrenchment, medical, debt, etc.) and optionally upload supporting documents.

**Step 2: Understand the impact**
This is the part I care most about. A visual deferral diagram shows — in proportional bars — what happens across both assessment windows:
- What you've already paid (navy)
- What you'll pay at the new rate (orange)
- The deferred amount carrying over into next year (amber overlay on the YA 2026 bar)
- Your estimated combined monthly instalment for next year

The goal is to make the financial trade-off *visible* before committing. Not a wall of text, not a disclaimer buried in fine print — a picture that shows: if you pay $100/month now, your next year's instalment will be approximately $X.

**Step 3: Acknowledge and confirm**
A reference number, a summary, a clear "what happens next" timeline. Done in under 3 minutes.

---

## Guardrails: Designing for Trust, Not Just Convenience

Any self-service system that touches tax administration has to anticipate abuse. I thought carefully about guardrails — not as restrictions, but as design elements that build institutional trust:

- **Minimum floor ($50/month)** — prevents near-zero gaming while still being meaningful for genuine hardship cases
- **60% deferral cap** — limits how much of the remaining balance can be pushed to next year in a single request
- **Document requirement for large reductions** — reductions above 50% of the current instalment require a supporting document; this isn't a hard block, but it shifts the burden of proof
- **One adjustment per window** — prevents iterative reduction abuse
- **Compounding deferral logic** — if you've already deferred from the prior window, your cap for this window tightens automatically
- **Audit flagging** — large reductions without documents don't get rejected, but they get queued for manual review

The key design principle here: *friction should be proportionate to risk*. A small reduction with a document should be near-instant. A large reduction without evidence should still be possible — hardship doesn't always come with paperwork — but it should take longer to process.

---

## What This Reflects About Digital Government

I'm not criticising IRAS. Their officers are knowledgeable, the eventual outcome was smooth, and the policy itself is thoughtful. The issue is the *channel* — the fact that this particular journey has no digital alternative.

The broader lesson is that self-service digital journeys need to be designed for the *worst* versions of the user's emotional and cognitive state, not the average. A taxpayer requesting a payment adjustment is, almost by definition, in a stressful situation. Every click they don't have to make is load they don't have to carry.

The best government digital services I've seen — whether in Singapore or elsewhere — share this instinct: that the interface is not neutral. It either compounds the user's burden or absorbs it.

---

## The Prototype

The prototype was built in React + Tailwind, matching the visual language of the IRAS myTax Portal as closely as possible — same colour palette, same header structure, same step indicator pattern — so it reads as a real extension of an existing system rather than a greenfield concept.

The code is open-sourced on GitHub. It's not a finished product — it's a design argument, made in code.

If you work in govtech, digital services, or UX in the public sector, I'd love to hear your thoughts. And if you've had a similar experience navigating a government process that should exist online but doesn't — I suspect you're not alone.

---

*Built with React, Vite, and Tailwind CSS. Concept prototype — not affiliated with IRAS.*
