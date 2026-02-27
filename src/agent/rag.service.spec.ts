/**
 * Unit tests for RagService (EPIC-002 / US-004).
 * All Weaviate network calls are mocked via global.fetch override.
 */

import { RagService } from './rag.service';
import { DOCUMENT_COLLECTION_NAME } from '../weaviate/schema';

const BASE_URL = 'http://localhost:8080';
const TENANT = 'test-tenant';
const QUERY = 'What is the refund policy?';

/** Build a minimal successful Weaviate GraphQL response. */
const makeWeaviateResponse = (docs: unknown[]) => ({
  data: {
    Get: {
      [DOCUMENT_COLLECTION_NAME]: docs,
    },
  },
});

const makeFetchObjectsResponse = (docs: Array<Record<string, unknown>>) => ({
  objects: docs.map((properties) => ({ properties })),
});

const originalFetch = global.fetch;

describe('RagService', () => {
  let service: RagService;

  beforeEach(() => {
    service = new RagService(BASE_URL);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('query() – success path', () => {
    it('returns a RagResult with answer and sources', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            makeWeaviateResponse([
              {
                fileId: 'doc-001',
                question: 'What is the refund policy?',
                answer: '30-day money-back guarantee.',
                pageNumber: ['5', '6'],
              },
            ]),
          ),
      });

      const result = await service.query(QUERY, TENANT);

      expect(result.answer).toContain('30-day money-back guarantee');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].fileId).toBe('doc-001');
      expect(result.sources[0].pageNumber).toEqual(['5', '6']);
    });

    it('sends a POST to the /v1/graphql endpoint', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeWeaviateResponse([])),
      });
      global.fetch = mockFetch;

      await service.query(QUERY, TENANT);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/v1/graphql`);
      expect(options.method).toBe('POST');
    });

    it('includes the tenant name in the GraphQL query body', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeWeaviateResponse([])),
      });
      global.fetch = mockFetch;

      await service.query(QUERY, TENANT);

      const body = JSON.parse(
        (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { query: string };
      expect(body.query).toContain(TENANT);
    });

    it('returns a fallback answer when no documents are found', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeWeaviateResponse([])),
      });

      const result = await service.query(QUERY, TENANT);

      expect(result.answer).toBe('No relevant documents found.');
      expect(result.sources).toHaveLength(0);
    });

    it('concatenates answers from multiple sources', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            makeWeaviateResponse([
              {
                fileId: 'd1',
                question: 'q1',
                answer: 'Answer one.',
                pageNumber: [],
              },
              {
                fileId: 'd2',
                question: 'q2',
                answer: 'Answer two.',
                pageNumber: [],
              },
            ]),
          ),
      });

      const result = await service.query(QUERY, TENANT);

      expect(result.answer).toContain('Answer one.');
      expect(result.answer).toContain('Answer two.');
      expect(result.sources).toHaveLength(2);
    });

    it('trims trailing slash from the base URL', async () => {
      const serviceWithSlash = new RagService(`${BASE_URL}/`);
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeWeaviateResponse([])),
      });
      global.fetch = mockFetch;

      await serviceWithSlash.query(QUERY, TENANT);

      const [url] = mockFetch.mock.calls[0] as [string, unknown];
      expect(url).toBe(`${BASE_URL}/v1/graphql`);
    });
  });

  describe('query() – error paths', () => {
    it('fails with TENANT_REQUIRED semantics when tenantName is missing', async () => {
      await expect(
        service.query(QUERY, undefined as unknown as string),
      ).rejects.toThrow(/tenant/i);
    });

    it('attempts semantic retrieval first via GraphQL nearText', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeWeaviateResponse([])),
      });
      global.fetch = mockFetch;

      await service.query(QUERY, TENANT);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/v1/graphql`);
    });

    it('falls back to fetchObjects-style endpoint when semantic retrieval is unavailable', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              errors: [{ message: 'nearText is unavailable for this class' }],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              makeFetchObjectsResponse([
                {
                  fileId: 'doc-xyz',
                  question: QUERY,
                  answer: 'Fallback answer.',
                  pageNumber: ['3'],
                },
              ]),
            ),
        });
      global.fetch = mockFetch;

      const result = await service.query(QUERY, TENANT);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [fallbackUrl] = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(fallbackUrl).toContain('/v1/objects');
      expect(result.sources[0].fileId).toBe('doc-xyz');
      expect(result.answer).toContain('Fallback answer.');
    });

    it('throws when Weaviate returns a non-OK HTTP status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service unavailable'),
      });

      await expect(service.query(QUERY, TENANT)).rejects.toThrow(
        /Weaviate GraphQL query failed/,
      );
    });

    it('throws when the GraphQL response contains errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ errors: [{ message: 'field not found' }] }),
      });

      await expect(service.query(QUERY, TENANT)).rejects.toThrow(
        /Weaviate GraphQL errors/,
      );
    });
  });
});
