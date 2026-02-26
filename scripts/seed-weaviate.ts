/**
 * Seeds Weaviate with sample document entries (US-003).
 * Run: pnpm run seed
 * Requires Weaviate running and Document schema created (pnpm run schema:create first).
 */
import { seedSampleDocuments } from '../src/weaviate/seed';
import { verifySampleData } from '../src/weaviate/verify-seed';

const baseUrl = process.env.WEAVIATE_URL ?? 'http://localhost:8080';

async function main() {
  await seedSampleDocuments(baseUrl);
  await verifySampleData(baseUrl);
  console.log('Sample documents seeded and verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
