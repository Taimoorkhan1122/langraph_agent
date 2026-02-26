import {
  DOCUMENT_COLLECTION_NAME,
  documentSchemaDefinition,
  createDocumentSchema,
} from './schema';

const originalFetch = global.fetch;

describe('Weaviate Document schema (US-002)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('documentSchemaDefinition', () => {
    it('should define Document class with multi-tenancy enabled', () => {
      expect(documentSchemaDefinition.class).toBe(DOCUMENT_COLLECTION_NAME);
      expect(documentSchemaDefinition.multiTenancyConfig).toEqual({
        enabled: true,
      });
    });

    it('should include fileId, question, answer, pageNumber with correct types', () => {
      const names = documentSchemaDefinition.properties.map((p) => p.name);
      expect(names).toEqual(
        expect.arrayContaining(['fileId', 'question', 'answer', 'pageNumber']),
      );
      expect(names).toHaveLength(4);

      const fileId = documentSchemaDefinition.properties.find(
        (p) => p.name === 'fileId',
      );
      expect(fileId?.dataType).toEqual(['string']);
      expect(fileId?.indexInverted).toBe(false);

      const question = documentSchemaDefinition.properties.find(
        (p) => p.name === 'question',
      );
      expect(question?.dataType).toEqual(['text']);
      expect(question?.indexInverted).toBe(true);

      const answer = documentSchemaDefinition.properties.find(
        (p) => p.name === 'answer',
      );
      expect(answer?.dataType).toEqual(['text']);
      expect(answer?.indexInverted).toBe(true);

      const pageNumber = documentSchemaDefinition.properties.find(
        (p) => p.name === 'pageNumber',
      );
      expect(pageNumber?.dataType).toEqual(['text[]']);
      expect(pageNumber?.indexInverted).toBe(false);
    });
  });

  describe('createDocumentSchema', () => {
    it('should POST schema to Weaviate and resolve when ok', async () => {
      const baseUrl = 'http://localhost:8080';
      let capturedBody: string | null = null;
      const fetchMock = async (url: string, init?: RequestInit) => {
        capturedBody = init?.body as string;
        return new Response(null, { status: 200 });
      };
      (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

      await createDocumentSchema(baseUrl);

      expect(capturedBody).toBeTruthy();
      const body = JSON.parse(capturedBody!);
      expect(body.class).toBe('Document');
      expect(body.multiTenancyConfig.enabled).toBe(true);
      expect(body.properties).toHaveLength(4);
    });

    it('should throw with message when response is not ok', async () => {
      (global as unknown as { fetch: typeof fetch }).fetch = async () =>
        new Response(JSON.stringify({ error: [{ message: 'Bad config' }] }), {
          status: 400,
        });

      await expect(
        createDocumentSchema('http://localhost:8080'),
      ).rejects.toThrow(/Weaviate schema create failed \(400\)/);
    });
  });
});
