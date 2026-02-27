# RAG Agent Task

A **LangGraph hierarchical agent** built with NestJS that routes user queries to the right tools: **RAG** (document retrieval via Weaviate), **Chart** (mock Chart.js config), **direct** (conversational), or **hybrid** (RAG + Chart in parallel). Responses are streamed over HTTP with structured references and provenance.

## What This Project Is

- **Backend API** – NestJS app exposing a single streaming endpoint: `POST /agent/stream`.
- **Delegating agent** – An LLM classifies each query into one of four labels; a LangGraph StateGraph runs the corresponding branch (RAG, chart, direct, or hybrid) and formats the result.
- **Multi-tenant RAG** – Weaviate vector DB with a `Document` collection (multi-tenancy enabled). The RAG path runs semantic search per tenant and returns an answer plus file/page references.
- **Chart tool** – Mock Chart.js config generator (bar, line, pie, doughnut) used when the user asks for a chart or when the classification is `hybrid`.
- **Streaming** – Agent responses are sent as Server-Sent Events (SSE) with chunks containing `answer`, `data` (references), and `isFinal`.

## Agent Features

| Feature | Description |
|--------|-------------|
| **Query classification** | LLM (Gemini) classifies the query into `chart`, `rag`, `direct`, or `hybrid` using an optional tool call for structured output. |
| **Routing** | LangGraph conditional edges route from the classify node to `run_rag`, `run_chart`, `run_direct`, or `run_hybrid`. |
| **RAG path** | Tenant-scoped semantic search in Weaviate (`nearText`), with fallback to `fetchObjects` when vector search is unavailable. Returns synthesised answer, sources, and references (fileId, index, pages). |
| **Chart path** | Generates a mock Chart.js config (type, data, options) for bar/line/pie/doughnut. |
| **Direct path** | No tools; used when the query needs a direct conversational answer only. |
| **Hybrid path** | Runs RAG and Chart in parallel; merges both into the final state and streamed response. |
| **Streaming** | `processStream()` yields chunks: intermediate chunk (short answer + early RAG refs), then final chunk (full answer + all refs and chart config). |
| **References** | RAG references: `{ type: 'rag', fileId, index, pages }`. Chart: `{ type: 'chart', config }`. All in the `data` array of each chunk. |

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** NestJS 11  
- **Agent:** LangGraph (StateGraph), LangChain (prompts, optional tool binding), Google Gemini  
- **Vector DB:** Weaviate (Docker), multi-tenant `Document` schema  
- **Language:** TypeScript  

## Project Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

Create a `.env` file (or set in the environment):

- `GEMINI_API_KEY` or `GOOGLE_API_KEY` – required for the query classifier (Gemini).
- `GEMINI_MODEL` (optional) – e.g. `gemini-2.5-flash` (default used in code).
- `WEAVIATE_URL` (optional) – default `http://localhost:8080`.

### 3. Weaviate (vector database)

Run Weaviate with Docker Compose:

```bash
docker compose up -d
```

- **URL:** http://localhost:8080  
- **Health:** `curl http://localhost:8080/v1/.well-known/ready` (expect HTTP 200)

Create the multi-tenant Document schema:

```bash
pnpm run schema:create
```

Seed sample documents into the `sample-tenant` tenant:

```bash
pnpm run seed
```

This inserts sample document entries and verifies they are retrievable.

### 4. Run the app

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev
```

Default HTTP port: `3000` (or as configured for NestJS).

## API

### `POST /agent/stream`

Streams the agent response as Server-Sent Events.

**Request body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | User query to classify and process. |
| `tenantName` | string | No | Tenant for RAG/hybrid; required for correct RAG results. |

**Response:** `Content-Type: text/event-stream`. Each event is a JSON line:

```json
{ "answer": "...", "data": [...], "isFinal": false }
{ "answer": "...", "data": [...], "isFinal": true }
```

- `answer` – Text answer (intermediate or final).
- `data` – Array of references: RAG refs `{ type: "rag", fileId, index, pages }` and/or chart ref `{ type: "chart", config }`.
- `isFinal` – `true` on the last chunk.

**Example:**

```bash
curl -X POST http://localhost:3000/agent/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the documents?", "tenantName": "sample-tenant"}'
```

## Run Tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# coverage
pnpm run test:cov
```

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm run schema:create` | Create Weaviate Document schema (multi-tenant). |
| `pnpm run seed` | Seed sample documents into `sample-tenant`. |
| `pnpm run smoke:agent` | Smoke test for the delegating agent. |

## Project Structure (agent & RAG)

| Area | Location |
|------|----------|
| Agent controller | `src/agent/agent.controller.ts` – `POST /agent/stream` |
| Delegating agent | `src/agent/delegating-agent.service.ts` – orchestration, streaming |
| LangGraph | `src/agent/agent.graph.ts` – StateGraph: classify → rag/chart/direct/hybrid → format |
| Query classifier | `src/agent/query-classifier.ts` – LLM classification (optional tool call) |
| RAG | `src/agent/rag.service.ts` – Weaviate semantic search + references |
| Chart tool | `src/agent/chart-tool.service.ts` – mock Chart.js config |
| Contracts | `src/agent/agent.interfaces.ts` – labels, RAG/chart results, stream chunks |
| Weaviate schema | `src/weaviate/schema.ts`, `src/weaviate/client.ts` |
| Weaviate seed | `src/weaviate/seed.ts` |

## License

MIT (or as specified in the repository).
