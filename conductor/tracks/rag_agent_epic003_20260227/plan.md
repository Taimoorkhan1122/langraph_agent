# Implementation Plan — EPIC-003 RAG Agent (US-006, US-007)

## Phase 1: Tenant-Scoped Retrieval Foundation [checkpoint: 2a73fc2]
- [x] Task: Define RAG input/output contracts and tenant validation behavior (7b309d7)
    - [ ] Add/confirm TypeScript interfaces for RAG request, retrieval result, and error result
    - [ ] Define required tenant input contract and missing-tenant error shape
    - [ ] Document function-level API boundaries for retrieval and answer generation
- [x] Task: Write failing tests for tenant validation and retrieval orchestration (Red) (6e839bf)
    - [ ] Add unit tests for missing tenant id failure path
    - [ ] Add unit tests for semantic retrieval path selection
    - [ ] Add unit tests for semantic-to-fetch fallback behavior
    - [ ] Run tests and confirm failures for new scenarios
- [x] Task: Implement retrieval orchestration to pass tests (Green) (476bb17)
    - [ ] Implement tenant presence validation in RAG service entrypoint
    - [ ] Implement semantic query attempt (`nearText`/hybrid) when available
    - [ ] Implement fallback to `fetchObjects` on capability/config failure
    - [ ] Ensure returned records include `fileId`, `question`, `answer`, `pageNumber`
    - [ ] Re-run targeted tests and confirm pass
- [x] Task: Refactor retrieval code and tests for clarity (afde552)
    - [ ] Remove duplication and isolate query strategy decision logic
    - [ ] Improve mocks/fixtures for Weaviate client behavior
    - [ ] Re-run tests after refactor
- [x] Task: Conductor - User Manual Verification 'Phase 1: Tenant-Scoped Retrieval Foundation' (Protocol in workflow.md) (2a73fc2)

## Phase 2: Answer Generation and Reference Provenance
- [x] Task: Write failing tests for answer composition and reference formatting (Red) (a141b84)
    - [ ] Add unit tests for grouping pages by `fileId`
    - [ ] Add unit tests for deterministic sequential index assignment
    - [ ] Add unit tests for de-duplicated/sorted page handling
    - [ ] Add unit tests for empty retrieval safe-response behavior
    - [ ] Run tests and confirm failures for new formatting paths
- [x] Task: Implement answer + structured reference generation (Green) (0d3c99b)
    - [ ] Implement contextual answer construction from retrieved entries
    - [ ] Implement inline natural reference phrasing in answer text
    - [ ] Implement structured `references` output with `{ type:'rag', fileId, index, pages, snippet? }`
    - [ ] Implement empty-result fallback answer with empty references
    - [ ] Re-run targeted tests and confirm pass
- [x] Task: Refactor reference formatter for determinism and maintainability (46cd9b2)
    - [ ] Extract pure formatter utilities for grouping/indexing logic
    - [ ] Normalize page token handling (string conversion, dedupe)
    - [ ] Re-run tests after refactor
- [~] Task: Conductor - User Manual Verification 'Phase 2: Answer Generation and Reference Provenance' (Protocol in workflow.md)

## Phase 3: Integration Hardening, Quality Gates, and Documentation
- [ ] Task: Integrate RAG output contract with delegating-agent/tool boundary
    - [ ] Ensure delegating agent can consume `answer` and `references`
    - [ ] Confirm compatibility with EPIC-005 streaming data shape expectations
    - [ ] Add/update adapter mapping tests at boundary layer
- [ ] Task: Implement robust error handling paths
    - [ ] Add explicit handling for Weaviate connection failures
    - [ ] Add partial-result handling where safe to return degraded output
    - [ ] Validate stable error response format for upstream caller
- [ ] Task: Execute quality gates
    - [ ] Run `pnpm run lint` and fix relevant issues in touched files
    - [ ] Run `CI=true pnpm test` for full suite confidence
    - [ ] Run `CI=true pnpm run test:cov` and ensure new/changed modules meet coverage target
- [ ] Task: Update project documentation for EPIC-003 behavior
    - [ ] Update relevant docs/readme sections describing tenant requirement and fallback logic
    - [ ] Document reference output structure and examples
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration Hardening, Quality Gates, and Documentation' (Protocol in workflow.md)

## Completion Criteria
- [ ] US-006 and US-007 acceptance criteria are satisfied with passing automated tests.
- [ ] RAG retrieval is tenant-scoped with semantic-first fallback behavior.
- [ ] Output includes both answer text (with natural references) and structured provenance objects.
- [ ] Lint, tests, and coverage checks pass for touched scope.
