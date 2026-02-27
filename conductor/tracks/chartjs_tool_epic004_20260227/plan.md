# Implementation Plan: EPIC-004 Chart.js Tool (US-008)

## Phase 1: Tool Contract & Scaffolding [checkpoint: 002514d]
- [x] Task: Define Chart.js tool input/output contracts (7bac554)
    - [ ] Define chart input schema supporting `bar`, `line`, `pie`, `doughnut`
    - [ ] Define output contract as serialized Chart.js config JSON string
    - [ ] Define structured error model for invalid input
- [x] Task: Prepare NestJS module wiring for tool instantiation (aac3275)
    - [ ] Add provider registration in agent/tool module
    - [ ] Ensure constructor-based DI and export where needed
    - [ ] Verify no circular dependencies are introduced
- [x] Task: Add/align shared types for chart config payload (60ebb3a)
    - [ ] Add strict TypeScript interfaces/types for config shape
    - [ ] Reuse existing agent/tool interfaces where appropriate
- [x] Task: Conductor - User Manual Verification 'Phase 1: Tool Contract & Scaffolding' (Protocol in workflow.md) (002514d)

## Phase 2: TDD - Mock Configuration Generator [checkpoint: 7ce7d80]
- [x] Task: Write failing unit tests for valid chart generation (Red) (917b4c6)
    - [ ] Add tests for `bar` output shape and required fields
    - [ ] Add tests for `line` output shape and required fields
    - [ ] Add tests for `pie` and `doughnut` output shape and required fields
    - [ ] Run targeted tests and confirm failures
- [x] Task: Implement mock chart configuration generator (Green) (1174f87)
    - [ ] Implement deterministic label and dataset generation
    - [ ] Ensure output is serialized JSON string
    - [ ] Ensure config parseability and compatibility with Chart.js structure
- [x] Task: Refactor implementation and tests safely (5162afa)
    - [ ] Remove duplication in config builders
    - [ ] Preserve deterministic outputs and public behavior
    - [ ] Re-run tests to confirm pass state
- [x] Task: Conductor - User Manual Verification 'Phase 2: TDD - Mock Configuration Generator' (Protocol in workflow.md) (7ce7d80)

## Phase 3: TDD - Validation, Registration & Quality Gates
- [ ] Task: Write failing tests for invalid input and registration behavior (Red)
    - [ ] Test unsupported chart type error
    - [ ] Test malformed payload error handling
    - [ ] Test tool callable registration path in delegating agent context
    - [ ] Run targeted tests and confirm failures
- [ ] Task: Implement structured validation and error handling (Green)
    - [ ] Return descriptive structured errors for invalid inputs
    - [ ] Keep successful path unchanged for valid payloads
    - [ ] Ensure registration path stays callable
- [ ] Task: Execute quality gates and stabilize
    - [ ] Run `pnpm run lint`
    - [ ] Run `CI=true pnpm test`
    - [ ] Run `CI=true pnpm run test:cov` and confirm coverage target for changed modules
- [ ] Task: Update docs where needed
    - [ ] Update relevant conductor/docs references for EPIC-004 track
- [ ] Task: Conductor - User Manual Verification 'Phase 3: TDD - Validation, Registration & Quality Gates' (Protocol in workflow.md)
