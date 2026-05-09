# Architecture (v0)

## Flow

1. **Frontend** calls **Express** REST API.
2. **Express** reads/writes **SQLite** (default) via Drizzle ORM; optional **PostgreSQL** when `DATABASE_URL` uses `postgres`.
3. **Express** calls **analytics** (FastAPI) for metric formulas over normalized inputs.
4. **Memo preview** merges **Handlebars-style** placeholders in `memos/templates/` with opportunity data.
5. **AI assist** returns deterministic stubs without an API key; with `OPENAI_API_KEY`, uses chat completions with JSON-shaped instructions.

## Parallel development boundaries

- `packages/types` — contract for API payloads (imported by frontend and backend).
- `frontend/` — no direct DB access.
- `analytics/` — stateless HTTP; no database.
- `backend/` — owns persistence and orchestration.
