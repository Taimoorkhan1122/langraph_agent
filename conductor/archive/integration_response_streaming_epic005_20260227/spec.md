# Product Requirements Document: EPIC-005 Integration & Response Streaming (US-009, US-010)

## Overview
Implement EPIC-005 to integrate the existing Delegating Agent, RAG Agent, and Chart.js tool into a cohesive orchestration flow that supports:

1. Parallel tool execution for hybrid requests (US-009)
2. Structured streaming responses for frontend progressive rendering (US-010)

This track must extend the current NestJS + LangGraph/LangChain architecture without expanding scope into new tools or frontend rendering features.

## Problem Statement
Current capabilities exist in separate parts (classification, RAG retrieval, chart mock generation), but the system still needs a reliable orchestration and output contract for production-like interaction:
- Hybrid queries should run independent tools concurrently to reduce latency.
- Responses should stream partial answer text while accumulating structured `data` payloads.
- Partial failures must not collapse the full request lifecycle.

## Goals
- Enable parallel execution path when query classification is `hybrid`.
- Preserve sequential execution path when dependency ordering is required.
- Emit a stable streaming schema with incremental `answer` chunks and final aggregated `data` array.
- Maintain deterministic, testable behavior under TDD workflow.

## Non-Goals
- Implementing real Chart.js analytics/transformation logic beyond current mock tool contract.
- Creating new retrieval algorithms beyond current RAG interfaces.
- Building frontend rendering logic for streamed responses.
- Introducing new external infrastructure.

## Users & Use Cases
- **Frontend Developer:** receives stream chunks to progressively render AI response and consume final structured references/chart config.
- **System Architect / AI Engineer:** ensures hybrid queries execute efficiently with resilient aggregation.
- **End User:** asks one query and gets coherent answers even when tools partially fail.

## Functional Requirements
1. **Parallel Branch Execution (US-009)**
   - When classification is `hybrid`, invoke RAG and Chart.js paths concurrently.
   - Aggregate both results into a single final response object without data corruption.
   - If one branch fails, preserve successful branch result and include explicit partial-failure context.

2. **Sequential Path Support (US-009)**
   - Support non-hybrid flows (`rag`, `chart`, `direct`) through deterministic routing.
   - Preserve existing behavior for single-tool and direct-response paths.

3. **Streaming Contract (US-010)**
   - Stream response as incremental chunks with schema:
     - `answer: string`
     - `data: object[]`
   - Intermediate chunks may include partial `answer` while `data` remains cumulative.
   - Final chunk must include full aggregated `data` objects.

4. **Data Object Types (US-010)**
   - Support RAG references: `{ type: 'rag', fileId, index, pages, snippet? }`
   - Support chart payloads: `{ type: 'chart', config, title? }`
   - Keep shape compatible with existing consumer expectations.

5. **Error Handling & Degradation**
   - Implement structured errors for orchestration and tool failures.
   - Do not fail whole response when one parallel branch fails (unless both fail unrecoverably).
   - Expose errors in a controlled, non-sensitive way.

## Non-Functional Requirements
1. **Architecture (NestJS best practices)**
   - Maintain clear module/service boundaries and single responsibility.
   - Use constructor injection only; avoid service-locator patterns.
   - Avoid circular dependencies.

2. **Validation & Safety**
   - Validate streamed payload shape before emission.
   - Keep output serialization deterministic for testability.

3. **Performance**
   - Parallel branch execution should reduce total latency vs sequential hybrid execution under equivalent mocked conditions.

4. **Testing & Coverage**
   - Follow strict TDD Red→Green→Refactor cycles.
   - Add/extend unit tests and integration-style service tests through public interfaces.
   - Maintain project quality gates (`lint`, tests, and coverage target >80% for changed modules).

## Acceptance Criteria
1. Hybrid classification triggers concurrent RAG + Chart execution.
2. Aggregated final response contains successful outputs from both tools when both succeed.
3. If one tool fails, response still returns successful branch output plus partial-failure context.
4. Streaming output emits incremental `answer` chunks and final complete `data` array.
5. `data` includes valid RAG reference objects and/or chart config objects based on invoked tools.
6. Non-hybrid routes continue to function as expected.
7. Test suite includes failing-first tests that prove red phase before implementation.
8. Lint/tests/coverage checks pass for this track’s changes.

## Out of Scope
- UI streaming components
- Live chart rendering concerns
- New model providers or vector DB migrations
- Cross-tenant policy redesign

## Risks & Assumptions
- Assumes existing EPIC-002/003/004 service contracts are stable enough to orchestrate without breaking public interfaces.
- Assumes streaming can be delivered using async iterators or Node stream abstractions already compatible with current NestJS runtime.
- Risk: race conditions in parallel aggregation; mitigated via deterministic merge strategy and tests.
