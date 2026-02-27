import {
  fetchDocumentObjects,
  fetchDocumentObjectsWithClient,
  verifySampleData,
  type DocumentObject,
} from './verify-seed';

function makeIterator<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
    },
  };
}

jest.mock('./client', () => {
  const actual = jest.requireActual<typeof import('./client')>('./client');
  return {
    ...actual,
    createWeaviateClient: jest.fn(),
  };
});

describe('Weaviate verify-seed (US-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDocumentObjectsWithClient', () => {
    it('should return properties array from client iterator', async () => {
      const props: DocumentObject[] = [
        {
          fileId: 'doc-001',
          question: 'Q?',
          answer: 'A',
          pageNumber: ['1'],
        },
      ];
      const client = {
        collections: {
          get: () => ({
            withTenant: () => ({
              iterator: () =>
                makeIterator(props.map((p) => ({ properties: p }))),
            }),
          }),
        },
      } as any;

      const result = await fetchDocumentObjectsWithClient(
        client,
        'sample-tenant',
        10,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(props[0]);
    });
  });

  describe('fetchDocumentObjects', () => {
    it('should create client, fetch via iterator, and return properties array', async () => {
      const props: DocumentObject[] = [
        {
          fileId: 'doc-001',
          question: 'Q?',
          answer: 'A',
          pageNumber: ['1'],
        },
      ];
      const { createWeaviateClient } = require('./client');
      (createWeaviateClient as jest.Mock).mockResolvedValue({
        collections: {
          get: () => ({
            withTenant: () => ({
              iterator: () =>
                makeIterator(props.map((p) => ({ properties: p }))),
            }),
          }),
        },
        close: jest.fn().mockResolvedValue(undefined),
      });

      const result = await fetchDocumentObjects('http://localhost:8080');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(props[0]);
      expect(createWeaviateClient).toHaveBeenCalledWith(
        'http://localhost:8080',
      );
    });
  });

  describe('verifySampleData', () => {
    it('should resolve when at least minCount objects have required fields', async () => {
      const three: DocumentObject[] = [
        { fileId: 'a', question: 'q', answer: 'a', pageNumber: [] },
        { fileId: 'b', question: 'q', answer: 'a', pageNumber: [] },
        { fileId: 'c', question: 'q', answer: 'a', pageNumber: [] },
      ];
      const { createWeaviateClient } = require('./client');
      (createWeaviateClient as jest.Mock).mockResolvedValue({
        collections: {
          get: () => ({
            withTenant: () => ({
              iterator: () =>
                makeIterator(three.map((p) => ({ properties: p }))),
            }),
          }),
        },
        close: jest.fn().mockResolvedValue(undefined),
      });

      const ok = await verifySampleData(
        'http://localhost:8080',
        'sample-tenant',
        3,
      );
      expect(ok).toBe(true);
    });

    it('should throw when count is below minCount', async () => {
      const one = [
        {
          properties: {
            fileId: 'x',
            question: 'q',
            answer: 'a',
            pageNumber: [],
          },
        },
      ];
      const { createWeaviateClient } = require('./client');
      (createWeaviateClient as jest.Mock).mockResolvedValue({
        collections: {
          get: () => ({
            withTenant: () => ({
              iterator: () => makeIterator(one),
            }),
          }),
        },
        close: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        verifySampleData('http://localhost:8080', 'sample-tenant', 3),
      ).rejects.toThrow(/Expected at least 3 document entries, got 1/);
    });

    it('should throw when object missing required field', async () => {
      const one = [
        {
          properties: { fileId: 'a', question: 'q', answer: 'a' },
        },
      ];
      const { createWeaviateClient } = require('./client');
      (createWeaviateClient as jest.Mock).mockResolvedValue({
        collections: {
          get: () => ({
            withTenant: () => ({
              iterator: () => makeIterator(one),
            }),
          }),
        },
        close: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        verifySampleData('http://localhost:8080', 'sample-tenant', 1),
      ).rejects.toThrow(/missing required field/);
    });
  });
});
