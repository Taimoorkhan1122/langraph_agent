# Specification: Fix ESLint Errors Without Behavior Change

## Overview
This track addresses current ESLint **errors only** in the NestJS codebase, with emphasis on the largest failing clusters in `src/agent/*` and `src/weaviate/*`. The objective is to remove lint-blocking issues while preserving runtime behavior, API contracts, and existing orchestration outputs.

## Current Lint Baseline (2026-02-27)
- Total findings: 87
- Errors: 80
- Warnings: 7 (out of scope for this track)

Top error groups:
- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/unbound-method`
- `@typescript-eslint/require-await`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-require-imports`
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-unsafe-call`
- `require-yield`

## Functional Requirements
1. Resolve all ESLint **errors** currently reported by `pnpm run lint`.
2. Keep external behavior unchanged:
   - No API contract changes (request/response shape, status behavior).
   - No semantic changes in delegating/routing decisions.
   - No changes to expected outputs of existing tests beyond formatting/type safety.
3. Use type-safe replacements for `any`-driven unsafe access where required by lint.
4. Refactor tests safely to satisfy method-binding and async/generator lint constraints.
5. Keep warning-level findings untouched unless they must be changed as part of an error fix.

## Non-Functional Requirements
1. Preserve maintainability and readability; avoid broad rewrites.
2. Keep edits minimal and localized to lint-failing files.
3. Follow existing TypeScript/NestJS patterns in this repository.

## Acceptance Criteria
1. `pnpm run lint` completes with **0 errors**.
2. `CI=true pnpm test` passes.
3. Existing behavior is preserved as evidenced by unchanged test expectations and passing suite.
4. Track artifacts document scope as “errors-only” and explicitly defer warnings.

## Out of Scope
- Resolving warning-only findings.
- New features, architecture changes, or API redesign.
- Performance tuning unrelated to lint fixes.
- Dependency upgrades unless strictly required to unblock lint (not expected).
