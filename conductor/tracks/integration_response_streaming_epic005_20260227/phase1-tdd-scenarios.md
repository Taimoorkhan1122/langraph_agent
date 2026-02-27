# Phase 1 Vertical-Slice TDD Scenarios: EPIC-005

## Slice A: Hybrid Parallel Success Path (US-009)

### Red
- Given classification `hybrid`, assert both RAG and Chart branches are invoked.
- Assert orchestration result contains both branch payloads in final `data`.
- Assert execution plan mode is `parallel`.

### Green
- Implement minimal concurrent branch invocation and join logic.
- Keep aggregation deterministic (`rag` references first, chart payload second).

### Refactor
- Extract branch invocation helpers.
- Keep behavior assertions unchanged.

## Slice B: Hybrid Partial-Failure Path (US-009)

### Red
- Simulate chart failure with rag success; assert response still contains rag data and stable error envelope.
- Simulate rag failure with chart success; assert chart payload still present and stable error envelope.

### Green
- Implement branch-level error isolation.
- Merge branch statuses with `success`/`failed` metadata.

### Refactor
- Consolidate error mapping to one helper.
- Preserve error codes and messages expected by tests.

## Slice C: Progressive Streaming Contract (US-010)

### Red
- Assert progressive chunks emit partial `answer` with stable shape.
- Assert final chunk sets `isFinal=true` and includes full cumulative `data`.

### Green
- Implement minimal stream chunk emitter (`answer`, `data`, `isFinal`).
- Ensure final chunk contains complete accumulated references.

### Refactor
- Extract chunk factory and accumulation helper.
- Preserve deterministic emission ordering.

## Slice D: Non-Hybrid Regression Guard

### Red
- Assert existing `direct`, `rag`, and `chart` paths retain behavior.

### Green
- Ensure EPIC-005 changes do not alter non-hybrid routing semantics.

### Refactor
- Remove duplication in route assertions while retaining route-specific expectations.
