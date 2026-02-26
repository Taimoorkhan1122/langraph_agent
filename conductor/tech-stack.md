# Technology Stack

This document describes the **existing** technology stack for the LangGraph Hierarchical Agent System (brownfield).

## Runtime & Language

| Component | Choice | Purpose |
|-----------|--------|---------|
| Runtime | Node.js | Primary runtime for the application |
| Language | TypeScript | Type-safe application and API code |
| Package manager | pnpm | Dependency and script execution |

## Backend Framework

| Component | Choice | Purpose |
|-----------|--------|---------|
| Framework | NestJS 11 | Server-side structure, modules, controllers, services |
| HTTP | Express (NestJS default) | REST API and HTTP handling |

## Vector Database & AI

| Component | Choice | Purpose |
|-----------|--------|---------|
| Vector DB | Weaviate | Semantic search, vector storage, multi-tenancy |
| Weaviate client | Weaviate JS Client | Official client for Weaviate from Node.js |
| Agent framework | LangGraph | Agent hierarchy and workflow orchestration |
| LLM abstraction | LangChain | LLM communication and tool integration |
| LLM | Google Gemini / Local LLM | Reasoning and response generation |
| Chart tool | Chart.js (or equivalent) | Mock chart generation (per project docs) |

## Infrastructure & Tooling

| Component | Choice | Purpose |
|-----------|--------|---------|
| Containers | Docker | Weaviate deployment (e.g. docker-compose) |
| Testing | Jest | Unit and e2e tests |
| Linting | ESLint (TypeScript) | Code quality and style |
| Formatting | Prettier | Consistent code format |
| Build | Nest CLI / tsc | Compilation and production build |

## Architecture Summary

- **Monorepo-style app:** Single NestJS application in `src/`, with `docs/` for requirements.
- **Layers:** API (NestJS) → Agent layer (LangGraph/LangChain) → Weaviate (and optional Chart tool).
- **Multi-tenancy:** Implemented at Weaviate schema/tenant level; app must pass tenant context through the stack.

## Development Commands

- **Setup:** `pnpm install`
- **Run (dev):** `pnpm run start:dev`
- **Run (prod):** `pnpm run start:prod`
- **Test:** `pnpm run test` (unit), `pnpm run test:e2e` (e2e), `pnpm run test:cov` (coverage)
- **Lint:** `pnpm run lint`
- **Format:** `pnpm run format`

Any change to this stack (new runtime, framework, or major library) must be reflected here with a short, dated note before implementation.
