import {
  SAMPLE_TENANT_NAME,
  SAMPLE_DOCUMENT_ENTRIES,
  seedSampleDocuments,
  seedSampleDocumentsWithClient,
  type DocumentEntry,
} from './seed';

const mockTenantsCreate = jest.fn();
const mockDataInsert = jest.fn();

jest.mock('./client', () => {
  const actual = jest.requireActual<typeof import('./client')>('./client');
  return {
    ...actual,
    createWeaviateClient: jest.fn(() =>
      Promise.resolve({
        collections: {
          get: () => ({
            tenants: { create: mockTenantsCreate },
            withTenant: () => ({ data: { insert: mockDataInsert } }),
          }),
        },
        close: jest.fn().mockResolvedValue(undefined),
      }),
    ),
  };
});

describe('Weaviate seed (US-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantsCreate.mockResolvedValue(undefined);
    mockDataInsert.mockResolvedValue('id');
  });

  describe('SAMPLE_DOCUMENT_ENTRIES', () => {
    it('should have at least 3 entries with fileId, question, answer, pageNumber', () => {
      expect(SAMPLE_DOCUMENT_ENTRIES.length).toBeGreaterThanOrEqual(3);
      for (const entry of SAMPLE_DOCUMENT_ENTRIES) {
        expect(entry).toMatchObject({
          fileId: expect.any(String),
          question: expect.any(String),
          answer: expect.any(String),
          pageNumber: expect.any(Array),
        });
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
      } as any;

      await seedSampleDocumentsWithClient(client);

      expect(mockTenantsCreate).toHaveBeenCalledTimes(1);
      expect(mockTenantsCreate).toHaveBeenCalledWith([
        { name: SAMPLE_TENANT_NAME, activityStatus: 'ACTIVE' },
      ]);
      expect(mockDataInsert).toHaveBeenCalledTimes(
        SAMPLE_DOCUMENT_ENTRIES.length,
      );
      for (let i = 0; i < SAMPLE_DOCUMENT_ENTRIES.length; i++) {
        const call = mockDataInsert.mock.calls[i][0];
        expect(call.properties).toMatchObject({
          fileId: SAMPLE_DOCUMENT_ENTRIES[i].fileId,
          question: SAMPLE_DOCUMENT_ENTRIES[i].question,
          answer: SAMPLE_DOCUMENT_ENTRIES[i].answer,
          pageNumber: SAMPLE_DOCUMENT_ENTRIES[i].pageNumber,
        });
      }
    });
  });

  describe('seedSampleDocuments', () => {
    it('should create client, create tenant, and insert all sample entries', async () => {
      const { createWeaviateClient } = require('./client');
      await seedSampleDocuments('http://localhost:8080');

      expect(createWeaviateClient).toHaveBeenCalledWith(
        'http://localhost:8080',
      );
      expect(mockTenantsCreate).toHaveBeenCalledWith([
        { name: SAMPLE_TENANT_NAME, activityStatus: 'ACTIVE' },
      ]);
      expect(mockDataInsert).toHaveBeenCalledTimes(
        SAMPLE_DOCUMENT_ENTRIES.length,
      );

      const firstCall = mockDataInsert.mock.calls[0][0];
      expect(firstCall.properties).toMatchObject({
        fileId: expect.any(String),
        question: expect.any(String),
        answer: expect.any(String),
        pageNumber: expect.any(Array),
      });
    });
  });
});
