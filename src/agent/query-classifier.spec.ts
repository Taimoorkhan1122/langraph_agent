/**
 * Unit tests for QueryClassifier (EPIC-002 / US-004).
 * Tests the real classify() LangChain chain with an injected fake LLM.
 */

import { FakeListChatModel } from '@langchain/core/utils/testing';
import { QueryClassifier } from './query-classifier';
import { ClassificationLabel } from './agent.interfaces';

/** Helper: build a classifier backed by a FakeListChatModel that returns `responses` in order. */
const makeClassifier = (...responses: string[]) =>
  new QueryClassifier(new FakeListChatModel({ responses }));

describe('QueryClassifier', () => {
  describe('classify() – valid labels', () => {
    const cases: Array<[string, ClassificationLabel]> = [
      ['chart', 'chart'],
      ['rag', 'rag'],
      ['direct', 'direct'],
      ['hybrid', 'hybrid'],
    ];

    it.each(cases)(
      'returns "%s" when the LLM outputs "%s"',
      async (llmOutput, expectedLabel) => {
        const classifier = makeClassifier(llmOutput);
        const result = await classifier.classify('any query');
        expect(result).toBe(expectedLabel);
      },
    );
  });

  describe('classify() – whitespace / casing normalisation', () => {
    it('trims leading/trailing whitespace from LLM response', async () => {
      const classifier = makeClassifier('  rag  ');
      expect(await classifier.classify('query')).toBe('rag');
    });

    it('lowercases the LLM response', async () => {
      const classifier = makeClassifier('CHART');
      expect(await classifier.classify('query')).toBe('chart');
    });
  });

  describe('classify() – unknown label fallback', () => {
    it('returns "direct" when LLM returns an unexpected value', async () => {
      const classifier = makeClassifier('unknown_label');
      expect(await classifier.classify('query')).toBe('direct');
    });

    it('returns "direct" when LLM returns an empty string', async () => {
      const classifier = makeClassifier('');
      expect(await classifier.classify('query')).toBe('direct');
    });
  });
});
