# ADR-006: Monorepo Structure with Workspace Packages

## Status

Accepted

## Context

Bridge Watch consists of three major components: a Node.js/TypeScript backend, a React/TypeScript frontend, and Rust/Soroban smart contracts. These components share configuration, documentation, and CI/CD pipelines. The team needed to decide how to organize the source code.

Options considered:
1. **Separate repositories** — One repo per component (backend, frontend, contracts)
2. **Monorepo with npm workspaces** — Single repository using npm/yarn/pnpm workspaces
3. **Monorepo with Nx/Turborepo** — Single repository with a dedicated monorepo build tool
4. **Simple monorepo with directories** — Single repository with top-level directories and a root `package.json`

## Decision

Use a **simple monorepo** with top-level directories (`backend/`, `frontend/`, `contracts/`) coordinated by a **root `package.json`** with workspace-style scripts and a **Makefile** for cross-component commands.

## Consequences

### Positive

- **Single source of truth:** All code, documentation, and CI/CD configuration lives in one repository.
- **Atomic changes:** Cross-component changes (e.g., API contract updates) are a single commit and PR.
- **Shared CI/CD:** GitHub Actions workflows test all components together with consistent triggers.
- **Shared documentation:** The `docs/` directory covers the entire system, not just one component.
- **Simple tooling:** No monorepo-specific tool (Nx, Turborepo, Lerna) to learn and maintain — just npm scripts and Make targets.
- **Docker Compose:** A single `docker-compose.yml` at the root orchestrates all services for local development.

### Negative

- **No dependency graph:** Without Nx/Turborepo, there's no automatic task graph for incremental builds or affected-only testing.
- **CI runs all checks:** Every PR triggers checks for all components, even if only one changed (mitigated by path filters in GitHub Actions).
- **Mixed toolchains:** Developers may need Node.js, Rust, and Docker installed locally, increasing onboarding complexity.

### Neutral

- Each component has its own `package.json` (backend, frontend) or `Cargo.toml` (contracts) for dependency management.
- The root `Makefile` provides convenience targets: `make dev`, `make test`, `make build`, `make docker-up`.
- Docker Compose provides a zero-config development environment that abstracts away the multi-toolchain complexity.
- Path-based CI triggers partially mitigate unnecessary CI runs (e.g., `backend/**` triggers only backend checks).
