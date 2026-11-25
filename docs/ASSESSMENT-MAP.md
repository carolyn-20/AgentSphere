# Mapping to the 15 required assessments

| # | Assessment | Repository evidence / status |
|---|---|---|
| 01 | AI SaaS frontend | `apps/web` dashboard, agent editor, knowledge, traces, usage |
| 02 | AI platform backend | Express routes and Prisma models |
| 03 | AI data architecture | `services/api/prisma/schema.prisma` |
| 04 | AI platform security | JWT/RBAC, tenant scoping, encrypted secret utility, tool allowlist |
| 05 | Python document pipeline | FastAPI validation, extraction, chunking endpoint |
| 06 | FastAPI model gateway | provider abstraction, timeout and health endpoint |
| 07 | Agent orchestration engine | bounded sequential execution, approval pause, persisted trace |
| 08 | AI provider integrations | OpenAI adapter plus deterministic mock adapter |
| 09 | Docker AI infrastructure | Dockerfiles and Compose; vector store remains an adapter extension |
| 10 | Git and prompt version governance | immutable prompt-version records and activate endpoint |
| 11 | AI CI/CD and evaluations | GitHub Actions workflow and evaluation test sample |
| 12 | AI safety and reliability testing | boundary, invalid input, provider failure and step-limit tests |
| 13 | AI API documentation | OpenAPI via FastAPI and Express route descriptions |
| 14 | AI SaaS deployment | deployment runbook and environment configuration |
| 15 | AI incident simulation | incident playbook and synthetic scenario data |

This is an implementation map, not a claim that every production acceptance test has already been independently demonstrated. Complete external credentials, deployment, load/security testing and live evidence before final submission.
