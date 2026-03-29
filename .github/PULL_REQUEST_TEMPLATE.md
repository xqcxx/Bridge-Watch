## Description

<!-- Provide a clear summary of what this PR does and why.
     Focus on the "why" — the issue tracker has the "what". -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behaviour)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] CI/CD change
- [ ] Dependency update

## Related Issue

<!-- Every PR should be linked to an issue. -->

Closes #

## Changes Made

<!-- Bullet-point the key changes. Be specific enough that a reviewer
     can follow along without reading every line of diff. -->

-
-
-

## Testing

<!-- Describe how you tested your changes. -->

- [ ] Unit tests pass locally (`npm run test:unit`)
- [ ] Integration tests pass locally (`npm run test:integration`)
- [ ] New tests added for new behaviour
- [ ] Manual testing completed — describe below if relevant

**Manual test steps (if applicable):**

<!-- e.g. "Started dev environment, called GET /api/v1/assets, confirmed health_score is present." -->

## Migration Changes

<!-- Complete this section only if your PR adds or modifies database migrations. -->

- [ ] No database migrations in this PR
- [ ] New migration file generated with `npm run migrate:make`
- [ ] Migration validated with `npm run migrate:validate`
- [ ] `down()` function tested locally
- [ ] No data loss in the rollback path

## Documentation

<!-- Check every box that applies. Leave unchecked items to explain why they're N/A. -->

- [ ] No documentation changes needed
- [ ] `README.md` updated (new commands, endpoints, or setup steps)
- [ ] Relevant `docs/` file updated
- [ ] `.env.example` updated (new environment variables)
- [ ] Inline comments / JSDoc updated for changed functions
- [ ] `backend/docs/API.md` updated (new or changed endpoints)

## Checklist

- [ ] Branch is up to date with `main`
- [ ] PR title follows Conventional Commits format (`type(scope): summary`)
- [ ] Code follows project style — linters pass (`npm run lint`, `cargo clippy`)
- [ ] Build succeeds (`npm run build`, `cargo build --release`)
- [ ] No `console.log` / `println!` left in production code
- [ ] No secrets, credentials, or `.env` files committed
- [ ] Self-review completed — I have read my own diff

## CI Status

<!-- These run automatically — leave unchecked until CI completes. -->

- [ ] Backend lint, build, and tests pass
- [ ] Frontend lint, build, and tests pass
- [ ] Contract format check, Clippy, and tests pass
- [ ] Security scan passes (no new vulnerabilities)
- [ ] Docker build succeeds

## Screenshots

<!-- For UI changes, before/after screenshots are very helpful. Delete this section if not applicable. -->

## Breaking Changes

<!-- If this is a breaking change, describe the impact and migration path for existing users.
     Also include a `BREAKING CHANGE:` footer in your commit message. -->

## Additional Notes

<!-- Anything else reviewers should know: trade-offs made, follow-up issues to open,
     performance considerations, areas of uncertainty, etc. -->
