# Specification: EPIC-004 Chart.js Tool (US-008)

## Overview
Implement a mocked Chart.js tool for the LangGraph hierarchical agent system so visualization requests can return a valid Chart.js configuration.

This track is scoped strictly to US-008 (no broader EPIC-005 integration work). The tool should be implemented in the existing NestJS + LangChain/LangGraph codebase and aligned with project workflow and NestJS best practices.

## Functional Requirements
1. Implement a Chart.js mock tool as a callable LangChain-compatible tool with a defined input schema.
2. Accepted chart types for this track: `bar`, `line`, `pie`, `doughnut`.
3. The tool must return a valid Chart.js configuration as a JSON string.
4. The returned config must include:
   - `type`
   - `data.labels`
   - `data.datasets[]` (with `label`, `data`, `backgroundColor`)
   - `options` (at minimum title/legend or equivalent basic options)
5. Include meaningful sample labels and values in mock output.
6. Register the tool so it is callable by the delegating agent layer (interface/registration level only as needed by current architecture for US-008 readiness).
7. Invalid input (unsupported type or malformed required fields) must throw structured, descriptive errors.

## Non-Functional Requirements
1. Use TypeScript type safety for input and output models.
2. Follow NestJS best practices:
   - Clear module/service boundaries
   - Constructor injection and testable design
   - Validation-oriented input handling
3. Provide robust unit tests with mocked external dependencies.
4. Keep implementation deterministic for repeatable tests.

## Acceptance Criteria
1. A Chart.js tool exists with explicit schema and supports `bar|line|pie|doughnut`.
2. Tool output is parseable JSON string and matches Chart.js configuration shape.
3. Sample mock config demonstrates realistic labels/datasets.
4. Tool is callable through the existing agent/tool registration path in codebase.
5. Invalid input returns structured errors with clear messages.
6. Unit tests validate success paths for all supported chart types.
7. Unit tests validate failure paths for invalid input.

## Out of Scope
- Parallel tool execution orchestration (US-009)
- Streaming response format changes (US-010)
- Real data transformation/analytics pipelines
- Frontend rendering implementation details
- Production chart design/theming customization

## Risks & Assumptions
- Assumes existing delegating-agent architecture can register one additional callable tool without workflow redesign.
- Assumes mock output schema compatibility with downstream consumers expecting Chart.js-compatible config.
