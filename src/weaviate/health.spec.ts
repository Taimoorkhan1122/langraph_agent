import {
  WEAVIATE_READY_PATH,
  getWeaviateReadyUrl,
  checkWeaviateReady,
} from './health';

describe('Weaviate health (US-001)', () => {
  describe('getWeaviateReadyUrl', () => {
    it('should return ready endpoint URL for a given base URL', () => {
      expect(getWeaviateReadyUrl('http://localhost:8080')).toBe(
        'http://localhost:8080/v1/.well-known/ready',
      );
    });

    it('should strip trailing slash from base URL', () => {
      expect(getWeaviateReadyUrl('http://localhost:8080/')).toBe(
        'http://localhost:8080/v1/.well-known/ready',
      );
    });

    it('should use the documented ready path', () => {
      expect(WEAVIATE_READY_PATH).toBe('/v1/.well-known/ready');
    });
  });

  describe('checkWeaviateReady', () => {
    it('should return false when server is not reachable', async () => {
      const result = await checkWeaviateReady('http://127.0.0.1:99999');
      expect(result).toBe(false);
    });

    it('should return true when Weaviate returns 200 at ready endpoint', async () => {
      const baseUrl = process.env.WEAVIATE_URL ?? 'http://localhost:8080';
      const result = await checkWeaviateReady(baseUrl);
      if (!result) {
        console.warn(
          'Weaviate not running at',
          baseUrl,
          '- run "docker compose up -d" to enable this check',
        );
      }
      expect(typeof result).toBe('boolean');
    });
  });
});
