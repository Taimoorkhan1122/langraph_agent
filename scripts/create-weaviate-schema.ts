/**
 * Creates the Document collection schema in Weaviate (US-002).
 * Run: pnpm run schema:create
 * Requires Weaviate at WEAVIATE_URL (default http://localhost:8080).
 */
import { createDocumentSchema } from '../src/weaviate/schema';

const baseUrl = process.env.WEAVIATE_URL ?? 'http://localhost:8080';

createDocumentSchema(baseUrl)
  .then(() => {
    console.log('Document schema created (or already exists).');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
