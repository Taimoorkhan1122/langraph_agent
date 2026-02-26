/**
 * Sample document entries for Weaviate (US-003).
 * Creates tenant and inserts ≥3 document entries per project docs.
 */

import { DOCUMENT_COLLECTION_NAME } from './schema';

/** Tenant name for sample data (4–64 chars, alphanumeric, underscore, hyphen). */
export const SAMPLE_TENANT_NAME = 'sample-tenant';

/** One document entry for the Document collection. */
export interface DocumentEntry {
  fileId: string;
  question: string;
  answer: string;
  pageNumber: string[];
}

/** Sample entries from docs/Project_User_Stories.md US-003. */
export const SAMPLE_DOCUMENT_ENTRIES: DocumentEntry[] = [
  {
    fileId: 'doc-001',
    question: 'What is the company refund policy?',
    answer:
      'Our company offers a 30-day money-back guarantee on all products...',
    pageNumber: ['5', '6'],
  },
  {
    fileId: 'doc-002',
    question: 'How do I reset my password?',
    answer:
      'To reset your password, click on the "Forgot Password" link...',
    pageNumber: ['12'],
  },
  {
    fileId: 'doc-003',
    question: 'What are the API rate limits?',
    answer:
      'The API allows 1000 requests per minute per tenant...',
    pageNumber: ['3', '4', '8'],
  },
];

/**
 * Ensures the tenant exists by adding it to the Document class (REST).
 * Idempotent: 422 "already exists" is treated as success.
 */
async function ensureTenant(baseUrl: string, tenantName: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/schema/${DOCUMENT_COLLECTION_NAME}/tenants`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { name: tenantName, activityStatus: 'ACTIVE' },
    ]),
  });

  if (res.ok) return;

  const text = await res.text();
  if (res.status === 422 && text.includes('already exists')) return;

  throw new Error(`Weaviate tenant create failed (${res.status}): ${text}`);
}

/**
 * Inserts one object into the Document collection for the given tenant.
 */
async function insertOne(
  baseUrl: string,
  tenant: string,
  entry: DocumentEntry,
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/objects`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      class: DOCUMENT_COLLECTION_NAME,
      tenant,
      properties: {
        fileId: entry.fileId,
        question: entry.question,
        answer: entry.answer,
        pageNumber: entry.pageNumber,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weaviate object insert failed (${res.status}): ${text}`);
  }
}

/**
 * Creates the sample tenant and inserts all sample document entries.
 * Idempotent: safe to run multiple times (duplicate objects may be created if run repeatedly; for strict idempotency run against a fresh DB or clear tenant first).
 */
export async function seedSampleDocuments(
  baseUrl: string,
  tenantName: string = SAMPLE_TENANT_NAME,
): Promise<void> {
  await ensureTenant(baseUrl, tenantName);
  for (const entry of SAMPLE_DOCUMENT_ENTRIES) {
    await insertOne(baseUrl, tenantName, entry);
  }
}
