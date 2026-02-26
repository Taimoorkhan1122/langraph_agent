# Product Guidelines

## Prose & Documentation

- **Clarity:** Use clear, concise language in user-facing copy and internal docs.
- **Consistency:** Keep terminology aligned with the domain (e.g. "tenant," "Delegating Agent," "RAG Agent," "tool").
- **Audience:** Docs should suit both developers (APIs, schema, flows) and operators (runbooks, env vars, health checks).

## Branding & Tone

- **Professional and technical:** Appropriate for an enterprise-ready AI/agent system.
- **Neutral and precise:** Prefer factual descriptions over marketing language in specs and APIs.

## UX Principles

- **Explicit routing:** Users get responses that match the routed path (chart, RAG, or direct) with clear provenance.
- **Streaming:** Prefer streaming responses where applicable so users see progress and partial results.
- **Errors:** Return actionable error messages and, when safe, hints (e.g. schema or tenant issues) without exposing internals.
- **Tenant isolation:** No cross-tenant data leakage; multi-tenancy is a core product requirement.

## Technical Communication

- **Acceptance criteria:** Every user story has testable acceptance criteria.
- **APIs:** REST/HTTP contracts (e.g. Weaviate, health checks) should be documented and stable.
- **Data provenance:** Answers from RAG must reference sources (e.g. fileId, pageNumber) in a consistent format.
