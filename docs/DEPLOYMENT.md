# Deployment runbook

1. Provision a private network, managed PostgreSQL and Redis, object storage, and a VM/container platform.
2. Store secrets in a managed secret manager. Never deploy `.env.example` values.
3. Build immutable images and deploy behind a TLS reverse proxy.
4. Restrict database and Redis ingress to application services only.
5. Run Prisma migrations as a one-off release job; take a backup first.
6. Configure health checks, structured logs, request IDs, metrics, alerts and error reporting.
7. Enable automated encrypted backups and test restore procedures.
8. Run API, processor, browser, tenant-isolation and failure-path tests before promotion.
9. Configure quotas and cost alerts at provider and application layers.
10. Roll back using the previous immutable image and a compatible migration plan.

No live cloud resources or domain are provisioned by this source package.
