# Product Definition

## Vision

A **LangGraph Hierarchical Agent System** integrated with a **Weaviate Vector Database** and **multi-tenancy** support. The system provides intelligent query routing, retrieval-augmented generation (RAG), and dynamic chart generation through a clear agent hierarchy.

## Goals

- **Part 1 – Vector database infrastructure:** Robust Weaviate setup with multi-tenancy: isolated data per tenant and efficient semantic search.
- **Part 2 – Hierarchical agent system:** A delegating agent that routes user queries to the right tools (RAG, Chart.js, or direct response), coordinates sub-agents, and returns responses with full data provenance.

## Target Users

- **DevOps engineers** – Run and operate Weaviate (e.g. Docker).
- **Backend developers** – Schema, tenants, and data APIs.
- **AI engineers** – Query classification, LangGraph workflows, and tool integration.
- **End users** – Ask questions and get answers with optional charts and references.

## Core Features (Epics)

| Epic | Name | Description |
|------|------|-------------|
| EPIC-001 | Vector Database Infrastructure | Weaviate in Docker, multi-tenant schema, sample data |
| EPIC-002 | Delegating Agent | Query classification and LangGraph agent hierarchy |
| EPIC-003 | RAG Agent | Vector search and answer generation with references |
| EPIC-004 | Chart.js Tool | Mock chart generation with configurable output |
| EPIC-005 | Integration & Response | Parallel tool execution and streaming response format |

## Success Criteria

- Weaviate runs in Docker with a defined multi-tenant schema and sample data.
- Delegating agent classifies queries (chart / RAG / direct / hybrid) and routes correctly.
- RAG agent queries Weaviate and returns answers with source references.
- Chart tool and RAG can run in parallel where needed.
- Responses are streamed with clear structure and provenance.

## Constraints & Principles

- **Scalability:** Multi-tenancy and isolated data per tenant.
- **Maintainability:** Clear separation between delegating agent, tools, and sub-agents.
- **Extensibility:** Add new tools and agents without breaking existing flows.
- **Agile:** User stories with acceptance criteria; implementation aligned with project docs.
