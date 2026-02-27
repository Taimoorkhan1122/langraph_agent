/**
 * Unit tests for the LangGraph delegating agent graph (US-005).
 * Verifies graph structure and direct-path final state.
 */

import { createDelegatingAgentGraph } from './agent.graph';
import type { QueryClassifier } from './query-classifier';
import type { RagService } from './rag.service';
import type { ChartToolService } from './chart-tool.service';

const makeClassifier = (label: 'chart' | 'rag' | 'direct' | 'hybrid') =>
  ({ classify: async () => label }) as unknown as QueryClassifier;

const makeRagService = () =>
  ({
    query: async () => ({
      answer: 'RAG answer',
      sources: [],
      references: [],
    }),
  }) as unknown as RagService;

const makeChartService = () =>
  ({
    generateConfig: () =>
      JSON.stringify({
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {},
      }),
  }) as unknown as ChartToolService;

describe('createDelegatingAgentGraph', () => {
  it('invokes and returns state with label for direct path', async () => {
    const graph = createDelegatingAgentGraph({
      classifier: makeClassifier('direct'),
      ragService: makeRagService(),
    });
    const result = await graph.invoke({
      query: 'hello',
      tenantName: '',
    });
    expect(result.label).toBe('direct');
    expect(result.query).toBe('hello');
    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('invokes and returns rag result for rag path', async () => {
    const ragService = makeRagService();
    const graph = createDelegatingAgentGraph({
      classifier: makeClassifier('rag'),
      ragService,
    });
    const result = await graph.invoke({
      query: 'test',
      tenantName: 'tenant-1',
    });
    expect(result.label).toBe('rag');
    expect(result.rag).toBeDefined();
    expect(result.rag?.answer).toBe('RAG answer');
    expect(result.data).toBeDefined();
  });

  it('invokes and returns chart for chart path', async () => {
    const graph = createDelegatingAgentGraph({
      classifier: makeClassifier('chart'),
      ragService: makeRagService(),
      chartToolService: makeChartService(),
    });
    const result = await graph.invoke({
      query: 'show chart',
      tenantName: '',
    });
    expect(result.label).toBe('chart');
    expect(result.chart).toBeDefined();
    expect(result.chart?.type).toBe('bar');
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toMatchObject({ type: 'chart' });
  });

  it('invokes and returns both rag and chart for hybrid path', async () => {
    const graph = createDelegatingAgentGraph({
      classifier: makeClassifier('hybrid'),
      ragService: makeRagService(),
      chartToolService: makeChartService(),
    });
    const result = await graph.invoke({
      query: 'both',
      tenantName: 't1',
    });
    expect(result.label).toBe('hybrid');
    expect(result.rag).toBeDefined();
    expect(result.chart).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeGreaterThanOrEqual(1);
  });
});
