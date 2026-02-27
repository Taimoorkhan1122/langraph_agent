# EPIC-003 RAG Agent (US-006, US-007)

## Overview
Implement the RAG Agent for the LangGraph Hierarchical Agent System so it can retrieve relevant tenant-scoped document entries from Weaviate and generate user answers with verifiable references.

This track covers:
- US-006: Vector database query implementation
- US-007: Answer generation with grouped file/page references

## Goals
- Retrieve relevant `Document` records from Weaviate under a required tenant context.
- Support dual retrieval mode:
  - Primary: semantic retrieval (`nearText` or hybrid) when available.
  - Fallback: `fetchObjects` when embedding/search capability is unavailable.
- Generate a concise answer with natural inline references.
- Return structured reference objects for frontend rendering/provenance.

## Functional Requirements
1. **Tenant-scoped retrieval**
   - RAG entrypoint must require tenant id as input.
   - If tenant id is missing, return a typed validation error response.

2. **Weaviate query strategy**
   - Attempt semantic query (`nearText`/hybrid) where supported by runtime/config.
   - If semantic query is not available or fails with capability/config constraints, fallback to `fetchObjects` for the same tenant.
   - Retrieval output must include `fileId`, `question`, `answer`, `pageNumber`.

3. **Answer construction**
   - Build answer text from retrieved context.
   - Include natural inline references in the answer using grouped page citations.

4. **Reference structuring**
   - Assign sequential reference index by retrieval order per unique `fileId` (1..N).
   - Group and de-duplicate page numbers per `fileId`.
   - Return structured references as data objects compatible with integration schema.

5. **Error handling and fallbacks**
   - Handle: missing tenant id, Weaviate unavailable, empty retrieval result.
   - Return safe fallback answer text and empty/partial reference list when appropriate.

## API/Data Contract (RAG output)
- `answer: string`
- `references: Array<{ type: 'rag'; fileId: string; index: number; pages: string[]; snippet?: string }>`

## Non-Functional Requirements
- **Primary NFR:** Correctness & traceability.
- Deterministic reference grouping and index assignment for identical retrieval order.
- Keep implementation testable via dependency boundaries and mocks (Weaviate + LLM).
- Preserve TypeScript type safety and existing lint/test standards.

## Acceptance Criteria
1. RAG requires tenant input and rejects missing tenant with a clear error result.
2. RAG performs semantic retrieval when available and falls back to object fetch when unavailable.
3. Retrieved records include all required properties from `Document` schema.
4. Generated answer includes natural inline references.
5. Structured references are returned with grouped pages and sequential per-file indices.
6. Empty retrieval returns a safe no-result response with no invalid references.
7. Unit tests cover success path, semantic fallback path, missing-tenant validation, and empty-result handling.

## Out of Scope
- Re-ranking or advanced retrieval tuning beyond nearText/hybrid + fallback.
- UI rendering changes for references/charts.
- Parallel chart execution and streaming transport (handled in EPIC-005).
- New schema fields or Weaviate class redesign (handled by infrastructure tracks).

## Dependencies
- EPIC-001 completed (Weaviate schema + sample data).
- EPIC-002 delegating agent available to call RAG tool.

## Risks & Assumptions
- Assumes Weaviate tenant and `Document` class exist.
- Semantic mode availability may vary by local environment; fallback path is required.
- LLM response variability is constrained by deterministic reference post-processing.
