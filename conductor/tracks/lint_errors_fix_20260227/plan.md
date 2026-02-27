# Implementation Plan: Fix ESLint Errors Without Behavior Change

## Phase 1: Baseline and Safety Net
- [ ] Task: Capture lint baseline and lock scope to error-level findings
    - [ ] Run `pnpm run lint` and record failing files/rules (errors only)
    - [ ] Record grouped findings in track notes (rules + file hotspots)
    - [ ] Confirm warning findings are deferred and out of scope
- [ ] Task: Verify existing behavior baseline before changes
    - [ ] Run `CI=true pnpm test` and store pass/fail baseline
    - [ ] Identify any flaky tests before lint refactors
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Baseline and Safety Net' (Protocol in workflow.md)

## Phase 2: Agent Module Error Cleanup
- [ ] Task: Resolve lint errors in agent tests and graph files
    - [ ] Fix `@typescript-eslint/unbound-method` in `src/agent/agent.controller.spec.ts`
    - [ ] Fix `@typescript-eslint/require-await` and `require-yield` in agent test helpers
    - [ ] Resolve `@typescript-eslint/no-unused-vars` and `@typescript-eslint/require-await` in `src/agent/agent.graph.ts` and `src/agent/agent.graph.spec.ts`
- [ ] Task: Resolve unsafe typing errors in delegating agent service
    - [ ] Remove `no-unsafe-assignment/call/member-access` violations in `src/agent/delegating-agent.service.ts`
    - [ ] Introduce narrow interfaces/type guards where required without changing behavior
- [ ] Task: Validate phase quality gates
    - [ ] Run `pnpm run lint` and confirm agent-related errors are cleared
    - [ ] Run targeted tests for `src/agent/*.spec.ts`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Agent Module Error Cleanup' (Protocol in workflow.md)

## Phase 3: Weaviate Module Error Cleanup
- [ ] Task: Resolve lint errors in weaviate spec files
    - [ ] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access` in `src/weaviate/schema.spec.ts`
    - [ ] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-require-imports` in `src/weaviate/seed.spec.ts`
    - [ ] Remove `no-explicit-any`, `no-unsafe-assignment`, `no-require-imports`, `require-await` in `src/weaviate/verify-seed.spec.ts`
- [ ] Task: Resolve remaining weaviate runtime typing errors
    - [ ] Fix `@typescript-eslint/no-unsafe-argument` in `src/weaviate/schema.ts`
- [ ] Task: Validate phase quality gates
    - [ ] Run `pnpm run lint` and confirm weaviate-related errors are cleared
    - [ ] Run targeted tests for `src/weaviate/*.spec.ts`
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Weaviate Module Error Cleanup' (Protocol in workflow.md)

## Phase 4: Final Verification and Closure
- [ ] Task: Run full project quality gates
    - [ ] Run `pnpm run lint` and confirm 0 errors
    - [ ] Run `CI=true pnpm test` and confirm passing suite
- [ ] Task: Prepare completion summary
    - [ ] Document resolved rule categories and touched files
    - [ ] Confirm warnings remain explicitly deferred
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification and Closure' (Protocol in workflow.md)
