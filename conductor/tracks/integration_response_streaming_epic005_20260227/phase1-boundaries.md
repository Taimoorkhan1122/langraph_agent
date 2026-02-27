# Phase 1 Boundaries: EPIC-005

## Target Module Boundaries (NestJS)

- `AgentModule` remains the composition root for orchestrator + tools.
- `DelegatingAgentService` is the single orchestration entry point.
- `RagService` remains retrieval-focused (Weaviate interactions and RAG references only).
- `ChartToolService` remains chart-config generation only.
- `orchestration.contract.ts` provides pure orchestration contract helpers and contains no Nest dependencies.

## Dependency Injection Rules

- Constructor injection only across all services.
- No direct `new` for service classes inside orchestration paths.
- Keep `ChartToolService` required and injected to eliminate fallback instantiation.

## Responsibility Split for EPIC-005

- `QueryClassifier`: classification only.
- `DelegatingAgentService`: route selection, parallel orchestration, aggregation.
- `orchestration.contract.ts`: execution-plan derivation, branch-status merge, stream chunk shape helpers.
- `RagService` / `ChartToolService`: branch execution only.

## Circular Dependency Check

Current graph remains acyclic:

- `AgentModule` -> `DelegatingAgentService`
- `DelegatingAgentService` -> `QueryClassifier`, `RagService`, `ChartToolService`
- `RagService` and `ChartToolService` do not import `DelegatingAgentService`

No additional module imports are required for Phase 1.
