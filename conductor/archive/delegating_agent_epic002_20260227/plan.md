# Implementation Plan: EPIC-002 Delegating Agent (US-004)

## Phase 1: Design and Interfaces
- [x] Task: Review existing agent/service structure and decide module placement
    - [x] Locate current services related to RAG and tools
    - [x] Identify public service entry point for delegating agent
- [x] Task: Define type-safe interfaces for classification input/output
    - [x] Define classification labels (chart, rag, direct, hybrid)
    - [x] Define tool result payload shapes (rag result, stub chart config)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Design and Interfaces' (Protocol in workflow.md) [checkpoint: 9636f23]

## Phase 2: LLM Classification (TDD)
- [x] Task: Write failing test for LLM classification output contract
    - [x] Assert classifier returns one of the four labels
- [x] Task: Implement LLM classifier with LangChain prompt
    - [x] Add prompt template and parsing
    - [x] Return deterministic label string
- [x] Task: Write failing tests for classification routing decisions
    - [x] Chart query -> chart
    - [x] RAG query -> rag
    - [x] Direct query -> direct
    - [x] Hybrid query -> hybrid
- [x] Task: Implement routing logic to map query to label
- [x] Task: Refactor and stabilize classifier module
- [x] Task: Conductor - User Manual Verification 'Phase 2: LLM Classification (TDD)' (Protocol in workflow.md) [checkpoint: 9636f23]

## Phase 3: Tool Invocation (TDD)
- [x] Task: Write failing test for rag path invoking real RAG tool
- [x] Task: Implement rag path invoking real RAG tool
- [x] Task: Write failing test for chart path returning stub chart config
- [x] Task: Implement stub chart config generator
- [x] Task: Write failing test for hybrid path combining rag + stub chart
- [x] Task: Implement hybrid aggregation logic
- [x] Task: Refactor service orchestration and error handling
- [x] Task: Conductor - User Manual Verification 'Phase 3: Tool Invocation (TDD)' (Protocol in workflow.md) [checkpoint: 9636f23]

## Phase 4: Quality Gates and Coverage
- [x] Task: Run unit tests and ensure green status [f3979ad]
- [x] Task: Verify coverage meets >80% requirement [f3979ad]
- [x] Task: Lint and format checks (non-interactive) [f3979ad]
- [x] Task: Update docs if public interfaces changed [9636f23]
- [x] Task: Conductor - User Manual Verification 'Phase 4: Quality Gates and Coverage' (Protocol in workflow.md) [checkpoint: 9636f23]

## Phase: Review Fixes
- [x] Task: Apply review suggestions [cb85731]

