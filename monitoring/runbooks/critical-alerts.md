# Monitoring Runbooks

## BackendDown

1. Confirm backend container or process status.
2. Verify `/health` and `/metrics` endpoints are reachable.
3. Check recent deploys and roll back if needed.
4. Inspect backend logs in Grafana Loki for crash loops and startup errors.
5. Resolve and verify `up{job="bridge-watch-backend"} == 1`.

## UptimeProbeFailed

1. Open target endpoint manually from inside and outside the cluster/network.
2. Validate DNS and ingress routing configuration.
3. Check TLS configuration if HTTPS endpoint is probed.
4. Confirm blackbox exporter is healthy and targets are correct.

## HighHTTPErrorRate

1. Identify failing routes from `http_requests_total`.
2. Correlate with recent traces and logs.
3. Check dependency health (database, external providers).
4. Mitigate with rollback or feature flag if regression is recent.

## HighP95Latency

1. Break down latency by route and dependency.
2. Confirm database latency and queue pressure.
3. Check CPU and memory saturation.
4. Scale backend workers or tune slow dependency calls.

## BridgeHealthLow

1. Identify affected bridge from labels.
2. Check verification failures and reason tags.
3. Review upstream provider status and circuit breaker activity.
4. Escalate to bridge on-call if degradation persists.

## HighCPUUsage

1. Identify noisy process/container.
2. Compare with request rate and job throughput.
3. Reduce burst workload or scale horizontally.
4. Profile CPU hotspots if sustained.

## HighMemoryUsage

1. Inspect process RSS and heap growth over time.
2. Review GC pressure and large in-memory queues.
3. Restart unhealthy pods/containers if leaking.
4. Create follow-up issue with heap profile evidence.
