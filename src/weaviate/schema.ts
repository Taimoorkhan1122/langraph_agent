/**
 * Document collection schema for Weaviate (US-002).
 * Multi-tenant, fields: fileId, question, answer, pageNumber.
 * @see docs/Project_User_Stories.md EPIC-001 US-002
 */

import {
  createWeaviateClient,
  closeWeaviateClient,
  type WeaviateClient,
} from './client';

export const DOCUMENT_COLLECTION_NAME = 'Document';

/** Schema definition for the Document collection (multi-tenant, US-002). */
export const documentSchemaDefinition = {
  class: DOCUMENT_COLLECTION_NAME,
  multiTenancyConfig: { enabled: true },
  properties: [
    {
      name: 'fileId',
      dataType: ['string'],
      description: 'Unique identifier for each source file',
      indexInverted: false,
    },
    {
      name: 'question',
      dataType: ['text'],
      description: 'The question being asked (vectorized)',
      indexInverted: true,
    },
    {
      name: 'answer',
      dataType: ['text'],
      description: 'The answer to the question (vectorized)',
      indexInverted: true,
    },
    {
      name: 'pageNumber',
      dataType: ['text[]'],
      description: 'Page numbers where answer was derived',
      indexInverted: false,
    },
  ],
} as const;

export type DocumentSchemaDefinition = typeof documentSchemaDefinition;

/** Property config for weaviate-client collections.create. */
const documentCollectionConfig = {
  name: DOCUMENT_COLLECTION_NAME,
  multiTenancy: { enabled: true },
  properties: [
    {
      name: 'fileId',
      dataType: 'string',
      description: 'Unique identifier for each source file',
      indexInverted: false,
    },
    {
      name: 'question',
      dataType: 'text',
      description: 'The question being asked (vectorized)',
      indexInverted: true,
    },
    {
      name: 'answer',
      dataType: 'text',
      description: 'The answer to the question (vectorized)',
      indexInverted: true,
    },
    {
      name: 'pageNumber',
      dataType: 'text[]',
      description: 'Page numbers where answer was derived',
      indexInverted: false,
    },
  ],
} as const;

/**
 * Creates the Document collection using the Weaviate JavaScript client.
 * Idempotent: returns successfully if the collection already exists.
 */
export async function createDocumentSchemaWithClient(
  client: WeaviateClient,
): Promise<void> {
  try {
    const exists = await client.collections.exists(DOCUMENT_COLLECTION_NAME);
    if (exists) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await client.collections.create(documentCollectionConfig as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already exists') || message.includes('Conflict')) {
      return;
    }
    throw new Error(`Weaviate schema create failed: ${message}`);
  }
}

/**
 * Creates the Document collection in Weaviate (via weaviate-client).
 * Idempotent: returns successfully if the collection already exists.
 */
export async function createDocumentSchema(baseUrl: string): Promise<void> {
  const client = await createWeaviateClient(baseUrl);
  try {
    await createDocumentSchemaWithClient(client);
  } finally {
    await closeWeaviateClient(client);
  }
}
