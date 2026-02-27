/**
 * RAG Service: semantic search over Weaviate's Document collection (EPIC-002 / US-004).
 * Uses the Weaviate GraphQL nearText endpoint to retrieve document chunks for a query.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_COLLECTION_NAME } from '../weaviate/schema';
import { RagResult, RagSource } from './agent.interfaces';

/** Maximum number of documents to retrieve per query. */
const DEFAULT_LIMIT = 3;

interface WeaviateNearTextResponse {
  data?: {
    Get?: {
      Document?: Array<{
        fileId?: string;
        question?: string;
        answer?: string;
        pageNumber?: string[];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Queries Weaviate's Document collection using tenant-scoped retrieval.
 * Returns a `RagResult` with a synthesised answer, source documents,
 * and (when available) structured provenance references.
 *
 * The "answer" is assembled from retrieved documents rather than an LLM call,
 * keeping this service lightweight and independently unit-testable.
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly weaviateBaseUrl: string) {}

  /**
   * Performs a semantic search and returns a `RagResult`.
   *
  * API boundary:
  * - `query` is user-provided search text.
  * - `tenantName` identifies the isolated multi-tenant partition.
  * - callers are responsible for ensuring tenant is present.
  *
  * @param query      - The user's raw query.
  * @param tenantName - The Weaviate tenant to search within.
   * @param limit      - Maximum number of source documents to return.
   */
  async query(
    query: string,
    tenantName: string,
    limit: number = DEFAULT_LIMIT,
  ): Promise<RagResult> {
    const baseUrl = this.weaviateBaseUrl.replace(/\/$/, '');
    const graphqlQuery = {
      query: `{
        Get {
          ${DOCUMENT_COLLECTION_NAME}(
            tenant: "${tenantName}"
            nearText: { concepts: ["${query.replace(/"/g, '\\"')}"] }
            limit: ${limit}
          ) {
            fileId
            question
            answer
            pageNumber
          }
        }
      }`,
    };

    const res = await fetch(`${baseUrl}/v1/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Weaviate GraphQL query failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as WeaviateNearTextResponse;

    if (json.errors?.length) {
      throw new Error(
        `Weaviate GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`,
      );
    }

    const docs = json.data?.Get?.[DOCUMENT_COLLECTION_NAME] ?? [];

    const sources: RagSource[] = docs.map((d) => ({
      fileId: d.fileId ?? '',
      question: d.question ?? '',
      answer: d.answer ?? '',
      pageNumber: d.pageNumber ?? [],
    }));

    const answer =
      sources.length > 0
        ? sources.map((s) => s.answer).join('\n\n')
        : 'No relevant documents found.';

    this.logger.log(
      `RAG query retrieved ${sources.length} document(s) for tenant "${tenantName}"`,
    );

    return { answer, sources };
  }
}
