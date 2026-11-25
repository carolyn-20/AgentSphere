# Incident simulation and response

## Token-cost spike
1. Identify tenant/model/agent from usage records and execution IDs.
2. Apply a tenant quota clamp; pause offending agent.
3. Inspect prompt version, step count, retries and model response sizes.
4. Add regression test for budget enforcement and bounded steps.

## Cross-tenant retrieval
1. Stop retrieval endpoint and preserve logs.
2. Reproduce with two synthetic tenants and known canary documents.
3. Verify every document/chunk query is scoped by tenant.
4. Add negative integration test; rotate any exposed credentials and assess notification duties.

## Provider outage / runaway loop
1. Switch provider adapter to mock/fallback or disable model execution.
2. Check timeout/retry metrics and ensure non-idempotent tools were not replayed.
3. Enforce max steps and wall-clock deadline.
4. Record root cause, corrective action, regression test and owner.
