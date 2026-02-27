/**
 * Verifies sample document entries are present in Weaviate (US-003).
 * Uses weaviate-client when given a client; otherwise uses baseUrl with client internally.
 */

import { DOCUMENT_COLLECTION_NAME } from './schema';
import { SAMPLE_TENANT_NAME } from './seed';
import { createWeaviateClient, closeWeaviateClient, type WeaviateClient } from './client';

export interface DocumentObject {
  fileId?: string;
  question?: string;
  answer?: string;
  pageNumber?: string[];
}

/**
 * Fetches objects from the Document collection for the given tenant using the Weaviate client.
 */
export async function fetchDocumentObjectsWithClient(
  client: WeaviateClient,
  tenant: string = SAMPLE_TENANT_NAME,
  limit = 10,
): Promise<DocumentObject[]> {
  const collection = client.collections.get(DOCUMENT_COLLECTION_NAME).withTenant(tenant);
  const results: DocumentObject[] = [];
  for await (const obj of collection.iterator()) {
    const props = (obj as { properties?: DocumentObject }).properties ?? {};
    results.push(props);
    if (results.length >= limit) break;
  }
  return results;
}

/**
 * Fetches objects from the Document collection for the given tenant.
 * Uses weaviate-client (creates and closes a client when given baseUrl).
 */
export async function fetchDocumentObjects(
  baseUrl: string,
  tenant: string = SAMPLE_TENANT_NAME,
  limit = 10,
): Promise<DocumentObject[]> {
  const client = await createWeaviateClient(baseUrl);
  try {
    return await fetchDocumentObjectsWithClient(client, tenant, limit);
  } finally {
    await closeWeaviateClient(client);
  }
}

/**
 * Verifies that at least minCount document entries exist for the tenant and have required fields.
 * Resolves to true if valid, throws with message otherwise.
 */
export async function verifySampleData(
  baseUrl: string,
  tenant: string = SAMPLE_TENANT_NAME,
  minCount = 3,
): Promise<boolean> {
  const objects = await fetchDocumentObjects(baseUrl, tenant, minCount + 5);

  if (objects.length < minCount) {
    throw new Error(
      `Expected at least ${minCount} document entries, got ${objects.length}`,
    );
  }

  const required = ['fileId', 'question', 'answer', 'pageNumber'];
  for (let i = 0; i < objects.length; i++) {
    const props = objects[i];
    for (const key of required) {
      if (!(key in props)) {
        throw new Error(`Object ${i} missing required field "${key}"`);
      }
    }
    if (!Array.isArray(props.pageNumber)) {
      throw new Error(`Object ${i} pageNumber must be an array`);
    }
  }

  return true;
}
