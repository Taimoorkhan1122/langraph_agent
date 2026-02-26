import {
  SAMPLE_TENANT_NAME,
  SAMPLE_DOCUMENT_ENTRIES,
  seedSampleDocuments,
  type DocumentEntry,
} from './seed';

const originalFetch = global.fetch;

describe('Weaviate seed (US-003)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
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

  describe('seedSampleDocuments', () => {
    it('should create tenant and insert all sample entries', async () => {
      const calls: { url: string; method: string; body?: string }[] = [];
      global.fetch = async (url: string, init?: RequestInit) => {
        calls.push({
          url,
          method: init?.method ?? 'GET',
          body: init?.body as string,
        });
        return new Response(null, { status: 200 });
      };

      await seedSampleDocuments('http://localhost:8080');

      const tenantCall = calls.find(
        (c) => c.url.includes('/tenants') && c.method === 'POST',
      );
      expect(tenantCall).toBeDefined();

      const objectCalls = calls.filter(
        (c) => c.url.includes('/v1/objects') && c.method === 'POST',
      );
      expect(objectCalls.length).toBe(SAMPLE_DOCUMENT_ENTRIES.length);

      const firstBody = JSON.parse(objectCalls[0]!.body!);
      expect(firstBody.class).toBe('Document');
      expect(firstBody.properties).toMatchObject({
        fileId: expect.any(String),
        question: expect.any(String),
        answer: expect.any(String),
        pageNumber: expect.any(Array),
      });
    });
  });
});
