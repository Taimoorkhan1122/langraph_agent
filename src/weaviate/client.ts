/**
 * Weaviate JavaScript client helper for Part 1 (schema, seed, verify).
 * Parses baseUrl and returns a connected weaviate-client instance.
 */

import {
  connectToLocal,
  connectToCustom,
  type WeaviateClient,
} from 'weaviate-client';

export type { WeaviateClient };

/**
 * Parses a Weaviate base URL (e.g. http://localhost:8080) into host and port.
 * Strips trailing slashes and path; uses 8080 if port is missing.
 */
export function parseWeaviateUrl(baseUrl: string): {
  host: string;
  port: number;
  secure: boolean;
} {
  const normalized = baseUrl.replace(/\/$/, '').trim();
  let url: URL;
  try {
    url = new URL(
      normalized.startsWith('http') ? normalized : `http://${normalized}`,
    );
  } catch {
    throw new Error(`Invalid Weaviate URL: ${baseUrl}`);
  }
  const port = url.port ? parseInt(url.port, 10) : 8080;
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid port in Weaviate URL: ${baseUrl}`);
  }
  return {
    host: url.hostname || 'localhost',
    port,
    secure: url.protocol === 'https:',
  };
}

/**
 * Creates and connects a Weaviate client using the official weaviate-client.
 * Use for schema create, seed, and verify. Call close() when done.
 *
 * @param baseUrl - e.g. http://localhost:8080
 */
export async function createWeaviateClient(
  baseUrl: string,
): Promise<WeaviateClient> {
  const { host, port, secure } = parseWeaviateUrl(baseUrl);

  if (host === 'localhost' && !secure) {
    return connectToLocal({ host, port });
  }

  return connectToCustom({
    httpHost: host,
    httpPort: port,
    httpSecure: secure,
    grpcHost: host,
    grpcPort: port === 8080 ? 50051 : port + 1,
    grpcSecure: secure,
  });
}

/**
 * Closes the Weaviate client connection.
 */
export async function closeWeaviateClient(
  client: WeaviateClient,
): Promise<void> {
  await client.close();
}
