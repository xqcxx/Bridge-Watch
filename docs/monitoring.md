# Monitoring and Alerting Guide

Issue scope: build a production-ready baseline for monitoring, alerting, logs, tracing, uptime, and runbooks.

## What is included

- Prometheus scrape and alert rules
- Grafana dashboard provisioning
- Alertmanager routing by severity/team
- Log aggregation with Loki/Promtail
- Tracing backend with Tempo
- Uptime probing with Blackbox Exporter
- Host resource metrics with Node Exporter
- Runbook links embedded in alert annotations

## Local validation workflow

1. Start stack:
   - `cd monitoring && docker compose up -d`
2. Start backend application.
3. Confirm Prometheus targets are healthy.
4. Open Grafana and verify `Bridge Watch Observability Overview` dashboard.
5. Validate uptime probes (`probe_success`).
6. Trigger a synthetic alert and verify Alertmanager route.

## Required environment and secret setup

- Replace Slack webhook placeholders in `monitoring/alertmanager.yml`.
- Replace PagerDuty integration key placeholder.
- For production, store integration values in secret manager and template at deploy time.

## Operational notes

- Alert rules include `runbook_url` annotations for incident response.
- Current scrape target uses `host.docker.internal:3001` for local development.
- For containerized backend deployment, switch target to service DNS name.
