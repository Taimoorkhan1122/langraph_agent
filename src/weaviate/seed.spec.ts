import {
  SAMPLE_TENANT_NAME,
  SAMPLE_DOCUMENT_ENTRIES,
  seedSampleDocuments,
  seedSampleDocumentsWithClient,
} from './seed';
import { createWeaviateClient } from './client';

const mockTenantsCreate = jest.fn();
const mockDataInsert = jest.fn();
const createWeaviateClientMock = jest.mocked(createWeaviateClient);

type SeedClientLike = {
  collections: {
    get: () => {
      tenants: { create: typeof mockTenantsCreate };
      withTenant: () => { data: { insert: typeof mockDataInsert } };
    };
  };
};

jest.mock('./client', () => {
  return {
    createWeaviateClient: jest.fn(),
    closeWeaviateClient: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Weaviate seed (US-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantsCreate.mockResolvedValue(undefined);
    mockDataInsert.mockResolvedValue('id');
    createWeaviateClientMock.mockResolvedValue({
      collections: {
        get: () => ({
          tenants: { create: mockTenantsCreate },
          withTenant: () => ({ data: { insert: mockDataInsert } }),
        }),
      },
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as Awaited<ReturnType<typeof createWeaviateClient>>);
  });

  describe('SAMPLE_DOCUMENT_ENTRIES', () => {
    it('should have at least 3 entries with fileId, question, answer, pageNumber', () => {
      expect(SAMPLE_DOCUMENT_ENTRIES.length).toBeGreaterThanOrEqual(3);
      for (const entry of SAMPLE_DOCUMENT_ENTRIES) {
        expect(typeof entry.fileId).toBe('string');
        expect(typeof entry.question).toBe('string');
        expect(typeof entry.answer).toBe('string');
        expect(Array.isArray(entry.pageNumber)).toBe(true);
        expect(entry.pageNumber.every((p) => typeof p === 'string')).toBe(true);
      }
    });

    it('should include doc-001, doc-002, doc-003 fileIds', () => {
      const fileIds = SAMPLE_DOCUMENT_ENTRIES.map((e) => e.fileId);
      expect(fileIds).toContain('doc-001');
      expect(fileIds).toContain('doc-002');
      expect(fileIds).toContain('doc-003');
    });
  });

  describe('seedSampleDocumentsWithClient', () => {
    it('should create tenant and insert all sample entries with correct payloads', async () => {
      const client = {
        collections: {
          get: () => ({
            tenants: { create: mockTenantsCreate },
            withTenant: () => ({ data: { insert: mockDataInsert } }),
          }),
        },
      } as unknown as SeedClientLike;

      await seedSampleDocumentsWithClient(
        client as unknown as Parameters<
          typeof seedSampleDocumentsWithClient
        >[0],
      );

      expect(mockTenantsCreate).toHaveBeenCalledTimes(1);
      expect(mockTenantsCreate).toHaveBeenCalledWith([
        { name: SAMPLE_TENANT_NAME, activityStatus: 'ACTIVE' },
      ]);
      expect(mockDataInsert).toHaveBeenCalledTimes(
        SAMPLE_DOCUMENT_ENTRIES.length,
      );
      for (let i = 0; i < SAMPLE_DOCUMENT_ENTRIES.length; i++) {
        expect(mockDataInsert).toHaveBeenNthCalledWith(i + 1, {
          properties: {
            fileId: SAMPLE_DOCUMENT_ENTRIES[i].fileId,
            question: SAMPLE_DOCUMENT_ENTRIES[i].question,
            answer: SAMPLE_DOCUMENT_ENTRIES[i].answer,
            pageNumber: SAMPLE_DOCUMENT_ENTRIES[i].pageNumber,
          },
        });
      }
    });
  });

  describe('seedSampleDocuments', () => {
    it('should create client, create tenant, and insert all sample entries', async () => {
      await seedSampleDocuments('http://localhost:8080');

      expect(createWeaviateClientMock).toHaveBeenCalledWith(
        'http://localhost:8080',
      );
      expect(mockTenantsCreate).toHaveBeenCalledWith([
        { name: SAMPLE_TENANT_NAME, activityStatus: 'ACTIVE' },
      ]);
      expect(mockDataInsert).toHaveBeenCalledTimes(
        SAMPLE_DOCUMENT_ENTRIES.length,
      );
      expect(mockDataInsert).toHaveBeenNthCalledWith(1, {
        properties: {
          fileId: SAMPLE_DOCUMENT_ENTRIES[0].fileId,
          question: SAMPLE_DOCUMENT_ENTRIES[0].question,
          answer: SAMPLE_DOCUMENT_ENTRIES[0].answer,
          pageNumber: SAMPLE_DOCUMENT_ENTRIES[0].pageNumber,
        },
      });
    });
  });
});
