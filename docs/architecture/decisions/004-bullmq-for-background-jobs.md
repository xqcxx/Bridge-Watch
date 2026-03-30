# ADR-004: Use BullMQ for Background Job Processing

## Status

Accepted

## Context

Bridge Watch requires reliable background job processing for recurring tasks: fetching bridge prices every 30 seconds, computing health scores every minute, checking bridge availability, cleaning up stale data, and sending alert notifications. These jobs must be resilient to failures, support retry logic, and avoid duplicate execution.

Options considered:
1. **Simple `setInterval`** — Native Node.js timers
2. **node-cron** — Cron-based scheduling library
3. **BullMQ** — Redis-backed job queue with scheduling, retries, and concurrency control
4. **Agenda** — MongoDB-backed job scheduling
5. **AWS SQS / Cloud Pub/Sub** — Managed cloud message queues

## Decision

Use **BullMQ** with Redis as the backing store for all background job processing.

## Consequences

### Positive

- **Redis-backed durability:** Jobs survive process restarts. In-progress jobs are re-queued on worker failure.
- **Repeat jobs:** Built-in cron and interval-based repeat scheduling for recurring tasks (price fetch, health scoring, cleanup).
- **Retry with backoff:** Configurable retry counts and exponential backoff for transient failures (API timeouts, network errors).
- **Concurrency control:** Configurable worker concurrency prevents overwhelming external APIs or the database.
- **Rate limiting:** Built-in rate limiting to respect API rate limits on external data sources.
- **Job prioritization:** Alert notification jobs can be prioritized over routine data collection.
- **Observability:** Job events, completion/failure logging, and integration with monitoring.
- **Shared infrastructure:** Redis is already required for API response caching, so no additional infrastructure.

### Negative

- **Redis dependency:** BullMQ requires Redis, adding an infrastructure component (though already required for caching).
- **Complexity:** More complex than simple `setInterval` for basic scheduling needs.
- **Memory usage:** Redis stores job data in memory; high-volume job queues can consume significant memory.

### Neutral

- Job processors are organized in `src/workers/` with dedicated files per job type.
- Job definitions and scheduling configuration are in `src/jobs/`.
- Failed jobs are logged with full error context for debugging.
