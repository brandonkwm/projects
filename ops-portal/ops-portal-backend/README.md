# Ops Portal Backend

API for workflows, case templates, communication templates, and case instances.

## Run

```bash
npm install
npm run dev
```

Runs at `http://localhost:3001` by default. Set `PORT` to override.

## Endpoints

- `GET/POST /api/workflows` — list, create
- `GET/PUT/DELETE /api/workflows/:id` — get, update, delete

- `GET/POST /api/case-templates` — list, create
- `GET/PUT/DELETE /api/case-templates/:id` — get, update, delete

- `GET/POST /api/communication-templates` — list, create
- `GET/PUT/DELETE /api/communication-templates/:id` — get, update, delete

- `GET/POST /api/cases` — list (optional `?status=open|completed`), create
- `GET/PATCH /api/cases/:id` — get, update
- `POST /api/cases/:id/complete` — body: `{ "fields": { ... } }`

- `GET /api/health` — health check

### AI (`/api/ai`)

Requires environment variables (create `.env` in this folder; do not commit real keys):

- `GEMINI_API_KEY` — for Gemini Flash workflow generation.
- `ANTHROPIC_API_KEY` — for Claude Haiku / Opus workflow generation.

Endpoints:

- `GET /api/ai/models` — list available model keys for the UI.
- `POST /api/ai/workflow-from-description` — body includes `description` (required), optional `objective` and `context` (plain text, aligned with workflow `aiProfile`), optional `caseTemplates` and `communicationTemplates`, and `model` (`gemini-flash` | `claude-haiku` | `claude-opus`). Returns workflow JSON (`name`, `description`, `definition`).

The frontend workflow editor sends `objective` and `context` from the **Agentic AI intent** fields when generating workflows so the LLM respects the same intent stored on save.

Storage is in-memory (resets on restart). Replace the `store/*` modules with DB or file persistence when ready.

## Screenshots

### API health and endpoints

![Backend health and endpoint testing](./screenshots/api-health-endpoints.png)

### Workflow API example

![Workflow API create and list example](./screenshots/workflow-api.png)

### Case API example

![Case API update and complete example](./screenshots/case-api.png)
