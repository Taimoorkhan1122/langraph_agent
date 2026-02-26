# Implementation Plan: EPIC-002 Delegating Agent (US-004)

## Phase 1: Design and Interfaces
- [ ] Task: Review existing agent/service structure and decide module placement
    - [ ] Locate current services related to RAG and tools
    - [ ] Identify public service entry point for delegating agent
- [ ] Task: Define type-safe interfaces for classification input/output
    - [ ] Define classification labels (chart, rag, direct, hybrid)
    - [ ] Define tool result payload shapes (rag result, stub chart config)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Design and Interfaces' (Protocol in workflow.md)

## Phase 2: LLM Classification (TDD)
- [ ] Task: Write failing test for LLM classification output contract
    - [ ] Assert classifier returns one of the four labels
- [ ] Task: Implement LLM classifier with LangChain prompt
    - [ ] Add prompt template and parsing
    - [ ] Return deterministic label string
- [ ] Task: Write failing tests for classification routing decisions
    - [ ] Chart query -> chart
    - [ ] RAG query -> rag
    - [ ] Direct query -> direct
    - [ ] Hybrid query -> hybrid
- [ ] Task: Implement routing logic to map query to label
- [ ] Task: Refactor and stabilize classifier module
- [ ] Task: Conductor - User Manual Verification 'Phase 2: LLM Classification (TDD)' (Protocol in workflow.md)

## Phase 3: Tool Invocation (TDD)
- [ ] Task: Write failing test for rag path invoking real RAG tool
- [ ] Task: Implement rag path invoking real RAG tool
- [ ] Task: Write failing test for chart path returning stub chart config
- [ ] Task: Implement stub chart config generator
- [ ] Task: Write failing test for hybrid path combining rag + stub chart
- [ ] Task: Implement hybrid aggregation logic
- [ ] Task: Refactor service orchestration and error handling
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Tool Invocation (TDD)' (Protocol in workflow.md)

## Phase 4: Quality Gates and Coverage
- [ ] Task: Run unit tests and ensure green status
- [ ] Task: Verify coverage meets >80% requirement
- [ ] Task: Lint and format checks (non-interactive)
- [ ] Task: Update docs if public interfaces changed
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Quality Gates and Coverage' (Protocol in workflow.md)
