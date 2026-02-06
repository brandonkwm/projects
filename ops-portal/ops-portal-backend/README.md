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

Storage is in-memory (resets on restart). Replace the `store/*` modules with DB or file persistence when ready.
