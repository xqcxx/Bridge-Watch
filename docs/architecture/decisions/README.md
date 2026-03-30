# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Stellar Bridge Watch. ADRs document significant architectural decisions, their context, and rationale.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./001-fastify-over-express.md) | Use Fastify over Express.js | Accepted | 2024 |
| [ADR-002](./002-timescaledb-for-time-series.md) | Use TimescaleDB for time-series data | Accepted | 2024 |
| [ADR-003](./003-zustand-over-redux.md) | Use Zustand over Redux for frontend state | Accepted | 2024 |
| [ADR-004](./004-bullmq-for-background-jobs.md) | Use BullMQ for background job processing | Accepted | 2024 |
| [ADR-005](./005-soroban-smart-contracts.md) | Use Soroban for on-chain components | Accepted | 2024 |
| [ADR-006](./006-monorepo-structure.md) | Monorepo structure with workspace packages | Accepted | 2024 |

## ADR Format

Each ADR follows this template:

```markdown
# ADR-NNN: Title

## Status
Accepted | Proposed | Deprecated | Superseded

## Context
What is the issue or requirement that motivates this decision?

## Decision
What is the proposed solution or approach?

## Consequences
What are the trade-offs and implications of this decision?
```
