# Security Testing Pipeline

This repository uses a multi-layered automated security pipeline in GitHub Actions.

## Security controls

- Dependency review for pull requests
- NPM dependency audit (backend/frontend)
- Cargo dependency audit (contracts)
- SAST with Semgrep
- CodeQL static analysis
- Filesystem/container vulnerability scan (Trivy)
- Secret scanning (Gitleaks)
- License compliance checks across JS and Rust dependencies

## Severity classification

- Critical/High: release-blocking
- Medium: triage required in active sprint
- Low: backlog hardening

## Vulnerability reporting

- SARIF reports are uploaded to GitHub Security tab
- Workflow summary includes scan statuses and remediation guidance
- `security-dashboard` artifact publishes a copyable markdown dashboard

## Auto-remediation workflow

1. Run `npm audit fix` for safe patch updates.
2. Patch Rust crates and rerun `cargo audit`.
3. Rotate any exposed secrets and invalidate compromised credentials.
4. Fix taint/code-flow findings from Semgrep/CodeQL before release.

## Local validation commands

```bash
# JavaScript dependency scanning
cd backend && npm audit --audit-level=moderate
cd ../frontend && npm audit --audit-level=moderate

# Rust dependency scanning
cd ../contracts && cargo audit

# Secret scan
# Requires gitleaks installed locally
cd .. && gitleaks detect --source .
```
