import {
  fetchDocumentObjects,
  verifySampleData,
  type DocumentObject,
} from './verify-seed';

const originalFetch = global.fetch;

describe('Weaviate verify-seed (US-003)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchDocumentObjects', () => {
    it('should return properties array from GET objects response', async () => {
      const props: DocumentObject[] = [
        {
          fileId: 'doc-001',
          question: 'Q?',
          answer: 'A',
          pageNumber: ['1'],
        },
      ];
      global.fetch = async () =>
        new Response(
          JSON.stringify({ objects: props.map((p) => ({ properties: p })) }),
        );

      const result = await fetchDocumentObjects('http://localhost:8080');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(props[0]);
    });
  });

  describe('verifySampleData', () => {
    it('should resolve when at least minCount objects have required fields', async () => {
      const three: DocumentObject[] = [
        { fileId: 'a', question: 'q', answer: 'a', pageNumber: [] },
        { fileId: 'b', question: 'q', answer: 'a', pageNumber: [] },
        { fileId: 'c', question: 'q', answer: 'a', pageNumber: [] },
      ];
      global.fetch = async () =>
        new Response(
          JSON.stringify({ objects: three.map((p) => ({ properties: p })) }),
        );

      const ok = await verifySampleData(
        'http://localhost:8080',
        'sample-tenant',
        3,
      );
      expect(ok).toBe(true);
    });

    it('should throw when count is below minCount', async () => {
      global.fetch = async () =>
        new Response(
          JSON.stringify({
            objects: [
              {
                properties: {
                  fileId: 'x',
                  question: 'q',
                  answer: 'a',
                  pageNumber: [],
                },
              },
            ],
          }),
        );

      await expect(
        verifySampleData('http://localhost:8080', 'sample-tenant', 3),
      ).rejects.toThrow(/Expected at least 3 document entries, got 1/);
    });

    it('should throw when object missing required field', async () => {
      global.fetch = async () =>
        new Response(
          JSON.stringify({
            objects: [
              { properties: { fileId: 'a', question: 'q', answer: 'a' } },
            ],
          }),
        );

      await expect(
        verifySampleData('http://localhost:8080', 'sample-tenant', 1),
      ).rejects.toThrow(/missing required field/);
    });
  });
});
