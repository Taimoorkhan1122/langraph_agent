/**
 * Document collection schema for Weaviate (US-002).
 * Multi-tenant, fields: fileId, question, answer, pageNumber.
 * @see docs/Project_User_Stories.md EPIC-001 US-002
 */

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

/**
 * Creates the Document collection in Weaviate via REST API.
 * Idempotent: returns successfully if the class already exists.
 */
export async function createDocumentSchema(baseUrl: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/schema`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(documentSchemaDefinition),
  });

  if (res.ok) {
    return;
  }

  const body = await res.text();
  let message = body;
  try {
    const json = JSON.parse(body) as { error?: { message?: string }[] };
    if (Array.isArray(json?.error) && json.error[0]?.message) {
      message = json.error[0].message;
    }
  } catch {
    // use body as message
  }

  if (res.status === 422 && body.includes('already exists')) {
    return;
  }

  throw new Error(`Weaviate schema create failed (${res.status}): ${message}`);
}
