import { RagReference, RagSource } from './agent.interfaces';

/**
 * Normalizes raw page values to a deterministic string list.
 * - Converts values to strings
 * - De-duplicates
 * - Sorts numerically (fallback lexical for non-numeric values)
 */
export function normalizePages(pages: string[]): string[] {
  return Array.from(new Set(pages.map((page) => String(page)))).sort(
    (left, right) => {
      const leftNumber = Number(left);
      const rightNumber = Number(right);

      if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
        return leftNumber - rightNumber;
      }

      return left.localeCompare(right);
    },
  );
}

/**
 * Builds grouped RAG references preserving first-seen file order.
 */
export function buildRagReferences(sources: RagSource[]): RagReference[] {
  const grouped = new Map<string, Set<string>>();
  const order: string[] = [];

  for (const source of sources) {
    const fileId = source.fileId;
    if (!fileId) {
      continue;
    }

    if (!grouped.has(fileId)) {
      grouped.set(fileId, new Set());
      order.push(fileId);
    }

    for (const page of source.pageNumber ?? []) {
      grouped.get(fileId)?.add(String(page));
    }
  }

  return order.map((fileId, index) => ({
    type: 'rag',
    fileId,
    index: index + 1,
    pages: normalizePages(Array.from(grouped.get(fileId) ?? [])),
  }));
}

/**
 * Creates user-facing inline reference text.
 */
export function formatInlineReferences(references: RagReference[]): string {
  if (references.length === 0) {
    return 'no indexed pages';
  }

  return references
    .map((reference) => {
      const pagesLabel = reference.pages.length > 1 ? 'Pages' : 'Page';
      return `${reference.index}- ${pagesLabel} ${reference.pages.join(', ')}`;
    })
    .join(' and ');
}
