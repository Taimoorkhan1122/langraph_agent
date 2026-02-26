# Track Specification: EPIC-002 Delegating Agent (US-004)

## Overview
Implement query classification for the Delegating Agent (EPIC-002 / US-004) as a NestJS service capability. The classification uses an LLM-driven approach (LangChain + configured LLM) to route queries into categories: chart, rag, direct, or hybrid. The service should invoke the real RAG tool when required and return a stubbed chart output for chart or hybrid classifications. No HTTP endpoint is added in this track.

## Functional Requirements
1. Provide a Delegating Agent service method that accepts a user query and returns a classification result plus any tool outputs required for that classification.
2. Implement LLM-driven classification using LangChain with a clear prompt schema and deterministic output labels: chart, rag, direct, hybrid.
3. For rag or hybrid classifications, call the real RAG tool/service and include its response in the returned result.
4. For chart or hybrid classifications, return a stubbed Chart.js configuration object (no real chart tool integration yet).
5. Expose a typed result object suitable for later controller integration (service-only for now).

## Non-Functional Requirements
1. Follow TDD (red-green-refactor) with Jest tests that verify behavior through public service methods.
2. Use type-safe interfaces for classification input/output.
3. Provide error handling for LLM failures and RAG errors with safe fallback responses.
4. Keep logging concise and avoid sensitive data in logs.

## Acceptance Criteria
1. A Delegating Agent service exists with a method that returns classification and any tool outputs.
2. The LLM classifier reliably returns one of: chart, rag, direct, hybrid.
3. Rag or hybrid paths invoke the real RAG tool and surface its output.
4. Chart or hybrid paths return a valid stub Chart.js configuration payload.
5. Unit tests cover classification routing for all four categories using TDD-friendly, behavior-based assertions.

## Out of Scope
- HTTP controller routes.
- Real Chart.js tool integration.
- Streaming response format or parallel execution.
