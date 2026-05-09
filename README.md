# CreditKit

**Private Corporate Credit & Infrastructure Credit Research Platform**

CreditKit is a research-focused platform that simulates institutional credit analyst and private market investment workflows. It combines financial analysis, data engineering, AI-assisted research, risk assessment, portfolio monitoring, and investment memo generation.

## Objectives

- Evaluate private credit opportunities and infrastructure investments
- Bottom-up credit analysis with structured metrics
- Portfolio monitoring and concentration views
- Institutional-style investment memos (Markdown export; PDF planned)
- Optional AI assistant for explanations and drafting (OpenAI when configured)

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Docker) or SQLite (local demo) |
| Analytics | Python (FastAPI), pandas, numpy |
| AI | OpenAI API (optional) |
| Ops | Docker Compose, GitHub Actions |

## Repository layout

```
CreditKit/
├── packages/types/    # Shared TypeScript types / API contract
├── frontend/          # Vite + React app
├── backend/           # Express API
├── analytics/         # Python metrics service
├── ai/                # Notes + re-exports (OpenAI used from backend)
├── memos/             # Markdown memo templates
├── data/              # Seed JSON for opportunities
├── scripts/           # Dev helpers
├── tests/             # Cross-package smoke tests
└── docs/              # Architecture notes
```

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Python** 3.11+
- **Docker** (optional, for Postgres + one-command dev)

## Environment variables

Create `backend/.env` from `backend/.env.example` and `frontend/.env` from `frontend/.env.example` (Vite reads `VITE_API_URL`):

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | `postgresql://...` or `file:./dev.db` for SQLite |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:5173`) |
| `ANALYTICS_URL` | Python service URL (e.g. `http://127.0.0.1:8000`) |
| `OPENAI_API_KEY` | Optional; enables AI assist features |

## Local development

### Option A: Docker Compose (Postgres + API + analytics + frontend via scripts)

```bash
pnpm install
docker compose up -d postgres
pnpm --filter @creditkit/backend db:migrate
pnpm --filter @creditkit/backend db:seed
# Terminal 1: analytics
cd analytics && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8000
# Terminal 2: backend
pnpm --filter @creditkit/backend dev
# Terminal 3: frontend
pnpm --filter @creditkit/frontend dev
```

### Option B: SQLite demo (no Docker)

Set `DATABASE_URL=file:./dev.db` in `backend/.env`, then migrate and seed as above.

## Scripts (root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run backend + frontend concurrently (analytics separate) |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint workspaces |
| `pnpm test` | Run tests |

## API (v0)

- `GET /health` — Liveness
- `GET /api/opportunities` — List credit & infrastructure opportunities
- `GET /api/opportunities/:id` — Detail + metrics
- `GET /api/portfolio/summary` — Exposure and monitoring aggregates
- `POST /api/memos/preview` — Render memo Markdown from template + data
- `POST /api/analytics/metrics` — Proxy to Python analytics service
- `POST /api/ai/assist` — AI assist (stub or OpenAI)

## Example use cases

**Corporate credit:** Assess additional leverage using EBITDA trends, free cash flow, debt obligations, and industry cyclicality.

**Infrastructure credit:** Evaluate renewable or contracted assets using DSCR, revenue stability, rate exposure, and long-term cash flows.

## Deployment notes

- **Frontend:** Static build suitable for Vercel or any static host; set `VITE_API_URL` to the public API URL.
- **Backend + Postgres:** Railway, Fly.io, Render, or similar; set `DATABASE_URL` and run migrations on deploy.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Uday Tyagi**  
Computer Science @ Western University  
Focused on AI systems, financial technology, and analytical platform development.
