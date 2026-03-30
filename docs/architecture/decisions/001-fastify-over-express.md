# ADR-001: Use Fastify over Express.js

## Status

Accepted

## Context

The Bridge Watch backend requires a Node.js HTTP framework that handles high-frequency API requests for monitoring data, supports JSON schema validation natively, and provides good performance for serializing large JSON responses containing time-series data.

Express.js is the most widely used Node.js framework, but Fastify offers significant performance advantages and built-in features that align with our needs.

## Decision

Use **Fastify** as the backend HTTP framework instead of Express.js.

## Consequences

### Positive

- **Performance:** Fastify's JSON serialization is significantly faster than Express, critical for endpoints returning large time-series datasets.
- **Schema validation:** Built-in JSON Schema validation eliminates the need for additional validation libraries and provides automatic request/response validation.
- **TypeScript support:** First-class TypeScript support with comprehensive type definitions.
- **Plugin system:** Encapsulated plugin architecture promotes clean separation of concerns.
- **Logging:** Built-in Pino integration provides structured JSON logging out of the box.

### Negative

- **Ecosystem size:** Smaller middleware ecosystem compared to Express. Some Express middleware requires adaptation.
- **Learning curve:** Developers familiar with Express need to learn Fastify's plugin-based architecture.
- **Community resources:** Fewer tutorials, Stack Overflow answers, and community resources compared to Express.

### Neutral

- Migration from Express is straightforward if ever needed, as both frameworks use similar request/response patterns.
