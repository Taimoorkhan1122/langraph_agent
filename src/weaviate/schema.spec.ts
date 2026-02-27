import {
  DOCUMENT_COLLECTION_NAME,
  documentSchemaDefinition,
  createDocumentSchema,
  createDocumentSchemaWithClient,
} from './schema';
import { createWeaviateClient } from './client';

const mockExists = jest.fn();
const mockCreate = jest.fn();
const mockClose = jest.fn();
const createWeaviateClientMock = jest.mocked(createWeaviateClient);

type SchemaClientLike = {
  collections: {
    exists: typeof mockExists;
    create: typeof mockCreate;
  };
};

type DocumentCollectionConfig = {
  name: string;
  multiTenancy: { enabled: boolean };
  properties: unknown[];
};

jest.mock('./client', () => {
  const actual = jest.requireActual<typeof import('./client')>('./client');
  return {
    ...actual,
    createWeaviateClient: jest.fn(() =>
      Promise.resolve({
        collections: { exists: mockExists, create: mockCreate },
        close: mockClose,
      }),
    ),
  };
});

describe('Weaviate Document schema (US-002)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExists.mockResolvedValue(false);
    mockCreate.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
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

  describe('createDocumentSchemaWithClient', () => {
    it('should call collections.create with Document name and multiTenancy when collection does not exist', async () => {
      mockExists.mockResolvedValue(false);
      const client = {
        collections: { exists: mockExists, create: mockCreate },
      } as unknown as SchemaClientLike;

      await createDocumentSchemaWithClient(
        client as unknown as Parameters<
          typeof createDocumentSchemaWithClient
        >[0],
      );

      expect(mockExists).toHaveBeenCalledWith('Document');
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const [config] = mockCreate.mock.calls[0] as [DocumentCollectionConfig];
      expect(config.name).toBe('Document');
      expect(config.multiTenancy).toEqual({ enabled: true });
      expect(config.properties).toHaveLength(4);
    });

    it('should not call create when collection already exists', async () => {
      mockExists.mockResolvedValue(true);
      const client = {
        collections: { exists: mockExists, create: mockCreate },
      } as unknown as SchemaClientLike;

      await createDocumentSchemaWithClient(
        client as unknown as Parameters<
          typeof createDocumentSchemaWithClient
        >[0],
      );

      expect(mockExists).toHaveBeenCalledWith('Document');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should treat already-exists error from create as success', async () => {
      mockExists.mockResolvedValue(false);
      mockCreate.mockRejectedValue(new Error('collection already exists'));
      const client = {
        collections: { exists: mockExists, create: mockCreate },
      } as unknown as SchemaClientLike;

      await expect(
        createDocumentSchemaWithClient(
          client as unknown as Parameters<
            typeof createDocumentSchemaWithClient
          >[0],
        ),
      ).resolves.toBeUndefined();
    });

    it('should throw when create fails with other error', async () => {
      mockExists.mockResolvedValue(false);
      mockCreate.mockRejectedValue(new Error('Bad config'));
      const client = {
        collections: { exists: mockExists, create: mockCreate },
      } as unknown as SchemaClientLike;

      await expect(
        createDocumentSchemaWithClient(
          client as unknown as Parameters<
            typeof createDocumentSchemaWithClient
          >[0],
        ),
      ).rejects.toThrow(/Weaviate schema create failed/);
    });
  });

  describe('createDocumentSchema', () => {
    it('should create client, call createDocumentSchemaWithClient, and close', async () => {
      await createDocumentSchema('http://localhost:8080');

      expect(createWeaviateClientMock).toHaveBeenCalledWith(
        'http://localhost:8080',
      );
      expect(mockCreate).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
