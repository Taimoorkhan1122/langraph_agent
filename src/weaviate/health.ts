/**
 * Weaviate health check (US-001). Ready endpoint per Weaviate docs.
 * @see https://docs.weaviate.io/weaviate/api/rest/ready
 */
export const WEAVIATE_READY_PATH = '/v1/.well-known/ready';

/**
 * Builds the full URL for the Weaviate ready (health) endpoint.
 */
export function getWeaviateReadyUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${WEAVIATE_READY_PATH}`;
}

/**
 * Returns true if Weaviate is ready (HTTP 200 at ready endpoint). Resolves to false on error or non-200.
 */
export async function checkWeaviateReady(baseUrl: string): Promise<boolean> {
  try {
    const url = getWeaviateReadyUrl(baseUrl);
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}
