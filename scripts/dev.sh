#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "1) Start analytics: cd analytics && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8000"
echo "2) Migrate & seed (once): cd backend && pnpm db:migrate && pnpm db:seed"
echo "3) From repo root: pnpm dev"
