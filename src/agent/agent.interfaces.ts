/**
 * Type-safe interfaces for the Delegating Agent (EPIC-002 / US-004).
 * Covers classification input/output, RAG results, and stub chart configs.
 */

import { ChartToolConfig } from './chart.types';

/** The four deterministic classification labels the LLM classifier returns. */
export type ClassificationLabel = 'chart' | 'rag' | 'direct' | 'hybrid';

/**
 * Input accepted by the delegating agent.
 * `tenantName` is required when making Weaviate queries via the RAG tool.
 */
export interface ClassificationInput {
  /** The raw user query to classify and route. */
  query: string;
  /** Weaviate tenant context; required for rag and hybrid paths. */
  tenantName?: string;
}

/** A single source document surfaced by the RAG tool. */
export interface RagSource {
  fileId: string;
  question: string;
  answer: string;
  pageNumber: string[];
}

/** Input contract for tenant-scoped RAG queries. */
export interface RagRequest {
  /** End-user query text to retrieve and answer from knowledge base. */
  query: string;
  /** Required tenant context for strict multi-tenant isolation. */
  tenantName: string;
  /** Optional retrieval limit override. */
  limit?: number;
}

/** Structured reference item returned by RAG for provenance. */
export interface RagReference {
  type: 'rag';
  fileId: string;
  index: number;
  pages: string[];
  snippet?: string;
}

/** Typed error envelope for expected RAG validation/runtime failures. */
export interface RagErrorResult {
  code: 'TENANT_REQUIRED' | 'WEAVIATE_ERROR' | 'EMPTY_RESULT';
  message: string;
}

/** Canonical RAG output contract used at tool/service boundary. */
export interface RagOutput {
  answer: string;
  references: RagReference[];
}

/** Result returned by the RAG tool/service. */
export interface RagResult {
  /** Synthesised answer generated from retrieved documents. */
  answer: string;
  /** Raw source documents used to produce the answer. */
  sources: RagSource[];
  /** Structured provenance references for frontend consumption. */
  references?: RagReference[];
  /** Optional typed error information for degraded responses. */
  error?: RagErrorResult;
}

/**
 * Stub Chart.js configuration object returned for chart / hybrid paths.
 * Shape mirrors Chart.js v3 `ChartConfiguration` at a minimal level.
 */
export interface ChartResult {
  type: ChartToolConfig['type'];
  data: ChartToolConfig['data'];
  options: ChartToolConfig['options'];
}

export type { ChartToolConfig };

/** Streaming-compatible chart data payload. */
export interface ChartDataReference {
  type: 'chart';
  config: ChartResult;
  title?: string;
}

/** Heterogeneous data references for response streaming. */
export type AgentDataReference = RagReference | ChartDataReference;

/** Stable error payload surfaced to upstream callers. */
export interface AgentError {
  source: 'classifier' | 'rag' | 'chart';
  code: string;
  message: string;
}

/**
 * The final output of the DelegatingAgentService.
 * Always contains `label`; `rag` and `chart` are populated according to routing.
 */
export interface ClassificationOutput {
  /** Classification decision made by the LLM. */
  label: ClassificationLabel;
  /** Populated for `rag` and `hybrid` classifications. */
  rag?: RagResult;
  /** Populated for `chart` and `hybrid` classifications. */
  chart?: ChartResult;
  /** Streaming-compatible data references (rag refs and/or chart config). */
  data?: AgentDataReference[];
  /** Stable error envelope for degraded/partial responses. */
  errors?: AgentError[];
}
