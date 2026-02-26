/**
 * Type-safe interfaces for the Delegating Agent (EPIC-002 / US-004).
 * Covers classification input/output, RAG results, and stub chart configs.
 */

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

/** Result returned by the RAG tool/service. */
export interface RagResult {
  /** Synthesised answer generated from retrieved documents. */
  answer: string;
  /** Raw source documents used to produce the answer. */
  sources: RagSource[];
}

/**
 * Stub Chart.js configuration object returned for chart / hybrid paths.
 * Shape mirrors Chart.js v3 `ChartConfiguration` at a minimal level.
 */
export interface ChartResult {
  type: string;
  data: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
  options: Record<string, unknown>;
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
}
