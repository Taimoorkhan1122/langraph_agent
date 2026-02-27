# Implementation Plan: EPIC-005 Integration & Response Streaming (US-009, US-010)

## Phase 1: Contracts, Boundaries, and Test Design [checkpoint: c30dbed]
- [x] Task: Define orchestration and streaming contracts for EPIC-005 (9d43c4b)
    - [x] Define/confirm state fields required for parallel execution and aggregation
    - [x] Define streaming chunk contract (`answer`, `data`) and finalization behavior
    - [x] Define partial-failure contract for single-branch parallel failures
- [x] Task: Identify service/module boundaries using NestJS best practices (c2d44ff)
    - [x] Ensure constructor-injected dependencies only
    - [x] Ensure responsibilities are split between classifier/orchestrator/stream formatter
    - [x] Confirm no circular dependency introduction in agent module wiring
- [x] Task: Design vertical-slice TDD scenarios before coding (7cd5b92)
    - [x] List behavior-first tests for hybrid parallel success path
    - [x] List behavior-first tests for partial-failure path
    - [x] List behavior-first tests for streaming progressive emission + final data chunk
- [x] Task: Conductor - User Manual Verification 'Phase 1: Contracts, Boundaries, and Test Design' (Protocol in workflow.md) (c30dbed)

## Phase 2: TDD Vertical Slice A - Parallel Hybrid Execution (US-009)
- [x] Task: Red - write failing test for hybrid query triggering concurrent tool calls (669191c)
    - [x] Assert both tool interfaces are invoked for `hybrid` classification
    - [x] Assert orchestration does not execute strictly sequentially in hybrid path
- [x] Task: Green - implement minimal parallel execution orchestration for hybrid path (669191c)
    - [x] Implement concurrent invocation and await-join behavior
    - [x] Aggregate successful results into one response structure
- [x] Task: Refactor - improve orchestration readability without changing behavior (c408598)
    - [x] Extract merge helper(s) behind clear interface
    - [x] Keep tests green after each small refactor step
- [x] Task: Red - write failing test for hybrid single-branch failure handling
    - [x] Simulate chart failure with rag success
    - [x] Simulate rag failure with chart success
- [x] Task: Green - implement partial-failure tolerant aggregation
    - [x] Preserve successful branch data
    - [x] Emit controlled error context for failed branch
- [ ] Task: Refactor - harden error paths and remove duplication
    - [ ] Consolidate branch error mapping
    - [ ] Re-run targeted tests to confirm no behavior regressions
- [ ] Task: Conductor - User Manual Verification 'Phase 2: TDD Vertical Slice A - Parallel Hybrid Execution (US-009)' (Protocol in workflow.md)

## Phase 3: TDD Vertical Slice B - Streaming Response Format (US-010)
- [ ] Task: Red - write failing tests for progressive streaming chunks
    - [ ] Assert intermediate chunks emit partial `answer`
    - [ ] Assert final chunk includes complete `data` array
- [ ] Task: Green - implement minimal streaming formatter/emitter
    - [ ] Implement async iterator or stream emission path through public interface
    - [ ] Ensure schema compliance for each emitted chunk
- [ ] Task: Refactor - simplify streaming flow while preserving contract
    - [ ] Extract chunk-builder utilities
    - [ ] Keep deterministic emission order for tests
- [ ] Task: Red - write failing tests for data object typing and accumulation
    - [ ] Validate rag references object shape in `data`
    - [ ] Validate chart config object shape in `data`
- [ ] Task: Green - implement data accumulation and finalization logic
    - [ ] Merge outputs from parallel/single flows into final `data`
    - [ ] Enforce safe serialization boundaries
- [ ] Task: Refactor - remove duplication and improve naming in formatter
    - [ ] Centralize schema guards/validators
    - [ ] Re-run focused tests after refactor
- [ ] Task: Conductor - User Manual Verification 'Phase 3: TDD Vertical Slice B - Streaming Response Format (US-010)' (Protocol in workflow.md)

## Phase 4: Integration Quality Gates and Documentation
- [ ] Task: Add/adjust integration-style tests through public service entry points
    - [ ] Verify non-hybrid routes (`direct`, `rag`, `chart`) are not regressed
    - [ ] Verify hybrid + streaming full flow end-to-end at service layer
- [ ] Task: Execute project quality gates
    - [ ] Run `pnpm run lint`
    - [ ] Run `CI=true pnpm test`
    - [ ] Run `CI=true pnpm run test:cov`
- [ ] Task: Document any stack/workflow deviations before implementation changes if needed
    - [ ] Update `conductor/tech-stack.md` only if design changes require it
    - [ ] Update relevant docs if public behavior/contract changed
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration Quality Gates and Documentation' (Protocol in workflow.md)
