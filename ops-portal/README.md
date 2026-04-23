# Problem statement #
1. operations is always seen as a by-product of what automation cannot achieve either due to bandwidth constraints or many edge cases.
2. low code/no code platforms are expensive - and most of the time use their own proprietary language to protect their IP

# Thought process #
1. the platform should have the base building blocks and digital product managers/owners should seek to build out base building blocks instead of engaging dev work to re-create multiple different workflows e.g. base building blocks like = send notifications / call a HTTP API - hence, allowing the users themselves or product owners to self maintain the platform without any coding i.e. a citizen developer
2. think of this as an operations-as-a-service model where because the existing backend is unable to handle edge cases, it is now handed off to another platform with flexible logic e.g. handling the 5% while the main BE service handles the 95% - this would allow quicker time to market for product launches

## Context ##
This is an MVP of what could be an internal operations platform where there is a backend server that will allow different microservices to call HTTP API endpoint to pass in JSON payload and the frontend is where the magic happens - users are able to edit the workflows / create new workflows

## How to use ##

### Launch the application

**Prerequisites:** Node.js (v18+ recommended) and npm.

1. **Clone or download the repo** and open a terminal in the project root (`ops-portal`).

2. **Start the backend** (optional; frontend works with localStorage if the backend is not running):
   ```bash
   cd ops-portal-backend
   npm install
   npm run dev
   ```
   Backend runs at **http://localhost:3001** by default. Set `PORT` to override.

3. **Start the frontend** (in a second terminal):
   ```bash
   cd ops-portal-frontend
   npm install
   npm run dev
   ```
   Frontend runs at **http://localhost:5173** (Vite default). Open this URL in your browser.

4. Use the app: configure **Workflows**, **Case templates**, and **Communication templates**, then work on cases under **Case work**. Data is stored in the browser (localStorage) unless you wire the frontend to the backend API.

## Agentic AI features

These help workflows stay aligned with business intent and speed up design.

### Workflow objective and context

In the **Workflows** builder, open **AI Generate**. Besides the plain-English workflow description, you can set:

- **Objective** — what this workflow is meant to achieve (business outcome).
- **Context** — why this workflow exists (constraints, background, audit or SLA pressure).

Those values are saved on the workflow as `aiProfile.objective` and `aiProfile.context` so any AI-assisted steps inside the process can use the same intent when reasoning about incoming cases or payloads.

### Generate workflow from text

With the backend running and API keys configured (see `ops-portal-backend/README.md`), use **AI Generate** to describe a process in natural language. The service returns a structured workflow (nodes and edges) you can refine on the canvas. The model picker supports Gemini Flash and Claude models; generation calls include objective and context when you provide them.

## Knowledge miner (planned direction)

A **knowledge miner** would turn closed-case history into reusable insights: recurring failure patterns, effective remediation paths, and automation candidates—with human review before anything is promoted into live workflows.

**Building blocks to aim for:** structured timelines and outcomes on case completion, a small **knowledge** store (patterns + recommendations + audit), a batch or on-close **mining** job, and an **Insights** UI to approve or reject suggestions. Objective and context on each workflow would ground summaries so recommendations match why the workflow exists, not only what failed most often.

**One-liner from repo root (two terminals):**
- Terminal 1: `cd ops-portal-backend && npm install && npm run dev`
- Terminal 2: `cd ops-portal-frontend && npm install && npm run dev`

Note: vibe coded using cursor AI

## Screenshots

### Workflows builder

![Ops Portal workflows builder](./screenshots/workflows-builder.png)

### Case templates

![Case templates management](./screenshots/case-templates.png)

### Communication templates

![Communication templates management](./screenshots/communication-templates.png)

### Case work

![Case work queue and case handling](./screenshots/case-work.png)