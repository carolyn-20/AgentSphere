# AgentSphere
Multi-tenant AI agent, knowledge and workflow automation platform.

## Status
This repository is a runnable starter implementation covering the core architecture and assessment areas. Provider credentials, production deployment, managed vector database, billing and external integrations require configuration and operational review. Do not represent the included local/mock adapters as production integrations.

## Architecture
- `apps/web`: Next.js App Router + TypeScript + Tailwind dashboard.
- `services/api`: Express REST API, Prisma/PostgreSQL, JWT auth, tenant-scoped resources, audit/usage records.
- `services/processor`: FastAPI document-processing and model-gateway boundary.
- `infra`: Docker Compose for PostgreSQL, Redis, API, processor and web.
- `docs`: architecture, security model, assessment mapping and runbook.

## Quick start
1. Install Docker Desktop, Node.js 20+, and Python 3.11 for the processor.
2. Copy `.env.example` to `.env` and change all secrets.
3. Run `docker compose up --build`.
4. Web: http://localhost:3000
5. API health: http://localhost:4000/health
6. Processor health: http://localhost:8000/health
7. API OpenAPI: http://localhost:8000/docs

For local development outside Docker:
- API: `cd services/api && npm install && npx prisma generate && npx prisma migrate dev && npm run dev`
- Web: `cd apps/web && npm install && npm run dev`
- Processor: use Python 3.11, then run `cd services/processor && python -m pip install -r requirements.txt && python -m uvicorn app.main:app --reload --port 8000`

The processor's pinned `pydantic-core` dependency does not currently build with Python 3.15. On Windows, run these commands from the repository root to ensure the processor uses Python 3.11, even if another environment is already active:

```cmd
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services\processor\requirements.txt
cd services\processor
..\..\.venv\Scripts\python.exe -m pytest
```

## Demo authentication
The API includes a development seed script. Run `cd services/api && npm run seed`.
It creates a demo tenant and owner user. Set `SEED_EMAIL` and `SEED_PASSWORD` in `.env`.
Never enable demo seeding in production.

## Tests
- API: `cd services/api && npm test`
- Processor: `cd services/processor && python -m pytest`
- Web: `cd apps/web && npm test`

## Important
- Replace development secrets before use.
- Configure an actual model provider using `OPENAI_API_KEY` or implement another adapter.
- The local embedding/retrieval implementation is deliberately basic; use a production vector store and evaluate retrieval quality before deployment.
- Billing is a simulation, not payment processing.
- Review `docs/SECURITY.md`, `docs/ASSESSMENT-MAP.md` and `docs/DEPLOYMENT.md`.
