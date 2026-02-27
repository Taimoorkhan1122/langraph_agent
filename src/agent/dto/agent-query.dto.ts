/**
 * Request body for the agent streaming endpoint.
 */

export class AgentQueryDto {
  /** The user query to classify and process. */
  query!: string;
  /** Optional tenant name for RAG/hybrid paths. */
  tenantName?: string;
}
