# Implementation Plan: Fix ESLint Errors Without Behavior Change

## Phase 1: Baseline and Safety Net
- [x] Task: Capture lint baseline and lock scope to error-level findings
    - [x] Run `pnpm run lint` and record failing files/rules (errors only)
    - [x] Record grouped findings in track notes (rules + file hotspots)
    - [x] Confirm warning findings are deferred and out of scope
- [x] Task: Verify existing behavior baseline before changes
    - [x] Run `CI=true pnpm test` and store pass/fail baseline
    - [x] Identify any flaky tests before lint refactors
- [x] Task: Conductor - User Manual Verification 'Phase 1: Baseline and Safety Net' (Protocol in workflow.md)

## Phase 2: Agent Module Error Cleanup
- [x] Task: Resolve lint errors in agent tests and graph files
    - [x] Fix `@typescript-eslint/unbound-method` in `src/agent/agent.controller.spec.ts`
    - [x] Fix `@typescript-eslint/require-await` and `require-yield` in agent test helpers
    - [x] Resolve `@typescript-eslint/no-unused-vars` and `@typescript-eslint/require-await` in `src/agent/agent.graph.ts` and `src/agent/agent.graph.spec.ts`
- [x] Task: Resolve unsafe typing errors in delegating agent service
    - [x] Remove `no-unsafe-assignment/call/member-access` violations in `src/agent/delegating-agent.service.ts`
    - [x] Introduce narrow interfaces/type guards where required without changing behavior
- [x] Task: Validate phase quality gates
    - [x] Run `pnpm run lint` and confirm agent-related errors are cleared
    - [x] Run targeted tests for `src/agent/*.spec.ts`
- [x] Task: Conductor - User Manual Verification 'Phase 2: Agent Module Error Cleanup' (Protocol in workflow.md)

## Phase 3: Weaviate Module Error Cleanup
- [x] Task: Resolve lint errors in weaviate spec files
    - [x] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access` in `src/weaviate/schema.spec.ts`
    - [x] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-require-imports` in `src/weaviate/seed.spec.ts`
    - [x] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-require-imports`, `require-await` in `src/weaviate/verify-seed.spec.ts`
- [x] Task: Resolve remaining weaviate runtime typing errors
    - [x] Evaluate `@typescript-eslint/no-unsafe-argument` in `src/weaviate/schema.ts` and defer as warning-level (out of scope)
- [x] Task: Validate phase quality gates
    - [x] Run `pnpm run lint` and confirm weaviate-related errors are cleared
    - [x] Run targeted tests for `src/weaviate/*.spec.ts`
- [x] Task: Conductor - User Manual Verification 'Phase 3: Weaviate Module Error Cleanup' (Protocol in workflow.md)

## Phase 4: Final Verification and Closure
- [x] Task: Run full project quality gates
    - [x] Run `pnpm run lint` and confirm 0 errors
    - [x] Run `CI=true pnpm test` and confirm passing suite
- [x] Task: Prepare completion summary
    - [x] Document resolved rule categories and touched files
    - [x] Confirm warnings remain explicitly deferred
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Verification and Closure' (Protocol in workflow.md)
