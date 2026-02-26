/**
 * Verifies sample document entries are present in Weaviate (US-003).
 */

import { DOCUMENT_COLLECTION_NAME } from './schema';
import { SAMPLE_TENANT_NAME } from './seed';

export interface DocumentObject {
  fileId?: string;
  question?: string;
  answer?: string;
  pageNumber?: string[];
}

/**
 * Fetches objects from the Document collection for the given tenant.
 * Returns array of properties (and optional vector) per object.
 */
export async function fetchDocumentObjects(
  baseUrl: string,
  tenant: string = SAMPLE_TENANT_NAME,
  limit = 10,
): Promise<DocumentObject[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/objects?class=${DOCUMENT_COLLECTION_NAME}&tenant=${encodeURIComponent(tenant)}&limit=${limit}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weaviate objects get failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { objects?: { properties?: DocumentObject }[] };
  const objects = json?.objects ?? [];
  return objects.map((o) => o.properties ?? {});
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
        throw new Error(
          `Object ${i} missing required field "${key}"`,
        );
      }
    }
    if (!Array.isArray(props.pageNumber)) {
      throw new Error(`Object ${i} pageNumber must be an array`);
    }
  }

  return true;
}
