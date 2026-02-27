import {
  buildRagReferences,
  formatInlineReferences,
  normalizePages,
} from './rag-reference';

describe('rag-reference utils', () => {
  describe('normalizePages', () => {
    it('deduplicates and sorts numeric pages', () => {
      expect(normalizePages(['7', '3', '7', '5'])).toEqual(['3', '5', '7']);
    });

    it('supports non-numeric values with lexical fallback', () => {
      expect(normalizePages(['B', 'A', '10'])).toEqual(['10', 'A', 'B']);
    });
  });

  describe('buildRagReferences', () => {
    it('groups by fileId and preserves first-seen order with sequential indices', () => {
      const refs = buildRagReferences([
        {
          fileId: 'doc-2',
          question: 'q1',
          answer: 'a1',
          pageNumber: ['2'],
        },
        {
          fileId: 'doc-1',
          question: 'q2',
          answer: 'a2',
          pageNumber: ['8', '4'],
        },
        {
          fileId: 'doc-2',
          question: 'q3',
          answer: 'a3',
          pageNumber: ['3'],
        },
      ]);

      expect(refs).toEqual([
        { type: 'rag', fileId: 'doc-2', index: 1, pages: ['2', '3'] },
        { type: 'rag', fileId: 'doc-1', index: 2, pages: ['4', '8'] },
      ]);
    });
  });

  describe('formatInlineReferences', () => {
    it('returns readable inline format for multiple references', () => {
      const inline = formatInlineReferences([
        { type: 'rag', fileId: 'doc-1', index: 1, pages: ['3', '5'] },
        { type: 'rag', fileId: 'doc-2', index: 2, pages: ['9'] },
      ]);

      expect(inline).toBe('1- Pages 3, 5 and 2- Page 9');
    });

    it('returns fallback phrase for empty references', () => {
      expect(formatInlineReferences([])).toBe('no indexed pages');
    });
  });
});
