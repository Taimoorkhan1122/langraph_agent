/**
 * Sample document entries for Weaviate (US-003).
 * Uses the Weaviate JavaScript client to create tenant and insert ≥3 document entries.
 */

import { DOCUMENT_COLLECTION_NAME } from './schema';
import {
  createWeaviateClient,
  closeWeaviateClient,
  type WeaviateClient,
} from './client';

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
    answer: 'To reset your password, click on the "Forgot Password" link...',
    pageNumber: ['12'],
  },
  {
    fileId: 'doc-003',
    question: 'What are the API rate limits?',
    answer: 'The API allows 1000 requests per minute per tenant...',
    pageNumber: ['3', '4', '8'],
  },
];

/**
 * Ensures the tenant exists using the Weaviate client.
 * Idempotent: treats "already exists" as success.
 */
async function ensureTenantWithClient(
  client: WeaviateClient,
  tenantName: string,
): Promise<void> {
  const collection = client.collections.get(DOCUMENT_COLLECTION_NAME);
  try {
    await collection.tenants.create([
      { name: tenantName, activityStatus: 'ACTIVE' },
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('already exists') ||
      message.includes('Conflict') ||
      message.includes('422')
    ) {
      return;
    }
    throw new Error(`Weaviate tenant create failed: ${message}`);
  }
}

/**
 * Inserts one document entry into the Document collection for the given tenant using the client.
 */
async function insertOneWithClient(
  client: WeaviateClient,
  tenantName: string,
  entry: DocumentEntry,
): Promise<void> {
  const collection = client.collections.get(DOCUMENT_COLLECTION_NAME);
  const tenantCollection = collection.withTenant(tenantName);
  await tenantCollection.data.insert({
    properties: {
      fileId: entry.fileId,
      question: entry.question,
      answer: entry.answer,
      pageNumber: entry.pageNumber,
    },
  });
}

/**
 * Creates the sample tenant and inserts all sample document entries using the Weaviate client.
 * Idempotent: safe to run multiple times (duplicate objects may be created if run repeatedly).
 */
export async function seedSampleDocumentsWithClient(
  client: WeaviateClient,
  tenantName: string = SAMPLE_TENANT_NAME,
): Promise<void> {
  await ensureTenantWithClient(client, tenantName);
  for (const entry of SAMPLE_DOCUMENT_ENTRIES) {
    await insertOneWithClient(client, tenantName, entry);
  }
}

/**
 * Creates the sample tenant and inserts all sample document entries (via weaviate-client).
 * Idempotent: safe to run multiple times (duplicate objects may be created if run repeatedly).
 */
export async function seedSampleDocuments(
  baseUrl: string,
  tenantName: string = SAMPLE_TENANT_NAME,
): Promise<void> {
  const client = await createWeaviateClient(baseUrl);
  try {
    await seedSampleDocumentsWithClient(client, tenantName);
  } finally {
    await closeWeaviateClient(client);
  }
}
