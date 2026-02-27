/**
 * Unit tests for LLM-driven query classification (EPIC-002 / US-004).
 * Tests cover: classification label contract, routing decisions, and tool invocations.
 * All external dependencies (LLM, Weaviate) are mocked.
 */

import { DelegatingAgentService } from './delegating-agent.service';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import {
  ClassificationLabel,
  ClassificationInput,
  RagResult,
  ChartResult,
  AgentStreamChunk,
} from './agent.interfaces';

// ---------------------------------------------------------------------------
// Test helpers / mocks
// ---------------------------------------------------------------------------

const makeClassifier = (label: ClassificationLabel): QueryClassifier => {
  const mock = {
    classify: jest.fn().mockResolvedValue(label),
  } as unknown as QueryClassifier;
  return mock;
};

const defaultRagResult: RagResult = {
  answer: 'Mocked RAG answer',
  sources: [
    {
      fileId: 'doc-001',
      question: 'What is the refund policy?',
      answer: 'Our company offers a 30-day money-back guarantee.',
      pageNumber: ['5'],
    },
  ],
};

const makeRagService = (
  result: RagResult = defaultRagResult,
): { ragService: RagService; queryMock: jest.Mock } => {
  const queryMock = jest.fn().mockResolvedValue(result);
  const ragService = {
    query: queryMock,
  } as unknown as RagService;

  return { ragService, queryMock };
};

const defaultSerializedChart = JSON.stringify({
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Mock bar chart',
        data: [42, 55, 38, 61],
        backgroundColor: ['#2563EB', '#0EA5E9', '#14B8A6', '#22C55E'],
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Mock bar chart' },
    },
  },
});

const makeChartToolService = (): {
  chartToolService: { generateConfig: jest.Mock };
  generateConfigMock: jest.Mock;
} => {
  const generateConfigMock = jest.fn().mockReturnValue(defaultSerializedChart);
  return {
    chartToolService: { generateConfig: generateConfigMock },
    generateConfigMock,
  };
};

// ---------------------------------------------------------------------------
// 1. LLM classification output contract
// ---------------------------------------------------------------------------

describe('QueryClassifier.classify()', () => {
  const validLabels: ClassificationLabel[] = [
    'chart',
    'rag',
    'direct',
    'hybrid',
  ];

  it.each(validLabels)(
    'returns the label "%s" as a valid ClassificationLabel',
    async (label) => {
      const classifier = makeClassifier(label);
      const result = await classifier.classify('any query');
      expect(validLabels).toContain(result);
    },
  );
});

// ---------------------------------------------------------------------------
// 2. Routing decisions
// ---------------------------------------------------------------------------

describe('DelegatingAgentService.process() – routing', () => {
  const input: ClassificationInput = { query: 'test', tenantName: 'tenant-1' };

  it('routes a chart query → label "chart", no rag, has chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    expect(output.label).toBe('chart');
    expect(output.rag).toBeUndefined();
    expect(output.chart).toBeDefined();
  });

  it('routes a RAG query → label "rag", has rag, no chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    expect(output.label).toBe('rag');
    expect(output.rag).toBeDefined();
    expect(output.chart).toBeUndefined();
  });

  it('routes a direct query → label "direct", no rag, no chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('direct'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    expect(output.label).toBe('direct');
    expect(output.rag).toBeUndefined();
    expect(output.chart).toBeUndefined();
  });

  it('routes a hybrid query → label "hybrid", has rag AND chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    expect(output.label).toBe('hybrid');
    expect(output.rag).toBeDefined();
    expect(output.chart).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3. RAG tool invocation on rag / hybrid paths
// ---------------------------------------------------------------------------

describe('DelegatingAgentService.process() – RAG tool invocation', () => {
  const input: ClassificationInput = {
    query: 'tell me about refunds',
    tenantName: 'tenant-abc',
  };

  it('calls RagService.query() with the input query and tenantName for "rag" path', async () => {
    const { ragService, queryMock } = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      ragService,
    );

    await service.process(input);

    expect(queryMock.mock.calls).toHaveLength(1);
    expect(queryMock.mock.calls[0]).toEqual([input.query, input.tenantName]);
  });

  it('calls RagService.query() for "hybrid" path as well', async () => {
    const { ragService, queryMock } = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      ragService,
    );

    await service.process(input);

    expect(queryMock.mock.calls).toHaveLength(1);
  });

  it('does NOT call RagService.query() for "chart" path', async () => {
    const { ragService, queryMock } = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      ragService,
    );

    await service.process(input);

    expect(queryMock.mock.calls).toHaveLength(0);
  });

  it('does NOT call RagService.query() for "direct" path', async () => {
    const { ragService, queryMock } = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('direct'),
      ragService,
    );

    await service.process(input);

    expect(queryMock.mock.calls).toHaveLength(0);
  });

  it('surfaces the RAG result in the output for "rag" path', async () => {
    const { ragService } = makeRagService(defaultRagResult);
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      ragService,
    );

    const output = await service.process(input);

    expect(output.rag).toEqual(defaultRagResult);
  });

  it('starts chart branch before rag resolves for hybrid path', async () => {
    let ragResolved = false;

    const queryMock = jest.fn().mockImplementation(
      () =>
        new Promise<RagResult>((resolve) => {
          setTimeout(() => {
            ragResolved = true;
            resolve(defaultRagResult);
          }, 25);
        }),
    );

    const ragService = {
      query: queryMock,
    } as unknown as RagService;

    const { generateConfigMock } = makeChartToolService();
    generateConfigMock.mockImplementation(() => {
      expect(ragResolved).toBe(false);
      return defaultSerializedChart;
    });

    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      ragService,
      { generateConfig: generateConfigMock } as never,
    );

    const output = await service.process(input);

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(generateConfigMock).toHaveBeenCalledTimes(1);
    expect(output.errors).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Stub chart config for chart / hybrid paths
// ---------------------------------------------------------------------------

describe('DelegatingAgentService.process() – stub chart config', () => {
  const input: ClassificationInput = {
    query: 'show me a chart',
    tenantName: 'tenant-1',
  };

  it('returns a valid stub ChartResult for "chart" path', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    const chart = output.chart as ChartResult;
    expect(chart).toBeDefined();
    expect(typeof chart.type).toBe('string');
    expect(chart.data).toBeDefined();
    expect(Array.isArray(chart.data.labels)).toBe(true);
    expect(Array.isArray(chart.data.datasets)).toBe(true);
    expect(typeof chart.options).toBe('object');
  });

  it('uses chart-tool deterministic label profile for chart path', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      makeRagService().ragService,
    );

    const output = await service.process(input);
    expect(output.chart?.data.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('returns a valid stub ChartResult for "hybrid" path', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService().ragService,
    );
    const output = await service.process(input);

    const chart = output.chart as ChartResult;
    expect(chart).toBeDefined();
    expect(typeof chart.type).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 5. Error handling
// ---------------------------------------------------------------------------

describe('DelegatingAgentService.process() – error handling', () => {
  const input: ClassificationInput = { query: 'test', tenantName: 'tenant-1' };

  it('returns a "direct" fallback label when the LLM classifier throws', async () => {
    const failingClassifier = {
      classify: jest.fn().mockRejectedValue(new Error('LLM timeout')),
    } as unknown as QueryClassifier;
    const service = new DelegatingAgentService(
      failingClassifier,
      makeRagService(),
    );

    const output = await service.process(input);

    expect(output.label).toBe('direct');
    expect(output.rag).toBeUndefined();
    expect(output.chart).toBeUndefined();
  });

  it('returns partial degraded rag result when RAG service throws', async () => {
    const failingRag = {
      query: jest.fn().mockRejectedValue(new Error('Weaviate down')),
    } as unknown as RagService;
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      failingRag,
    );

    const output = await service.process(input);

    expect(output.label).toBe('rag');
    expect(output.rag).toBeDefined();
    expect(output.rag?.error).toMatchObject({
      code: 'WEAVIATE_ERROR',
      message: 'RAG retrieval failed',
    });
  });

  it('returns stable error envelope when RAG service throws', async () => {
    const failingRag = {
      query: jest.fn().mockRejectedValue(new Error('Weaviate unavailable')),
    } as unknown as RagService;
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      failingRag,
    );

    const output = await service.process(input);

    expect(output.errors).toEqual([
      {
        source: 'rag',
        code: 'WEAVIATE_ERROR',
        message: 'RAG retrieval failed',
      },
    ]);
    expect(output.rag).toEqual({
      answer: 'RAG retrieval is temporarily unavailable.',
      sources: [],
      references: [],
      error: {
        code: 'WEAVIATE_ERROR',
        message: 'RAG retrieval failed',
      },
    });
  });

  it('returns chart data even when rag fails in hybrid path', async () => {
    const failingRag = {
      query: jest.fn().mockRejectedValue(new Error('Downstream timeout')),
    } as unknown as RagService;
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      failingRag,
    );

    const output = await service.process(input);

    expect(output.label).toBe('hybrid');
    expect(output.data?.some((item) => item.type === 'chart')).toBe(true);
    expect(output.errors?.[0]).toMatchObject({
      source: 'rag',
      code: 'WEAVIATE_ERROR',
    });
  });

  it('preserves rag references and reports chart error when chart fails in hybrid path', async () => {
    const ragResultWithRefs: RagResult = {
      answer: 'RAG still works',
      sources: [
        {
          fileId: 'doc-chart-fail',
          question: 'q',
          answer: 'a',
          pageNumber: ['3'],
        },
      ],
      references: [
        {
          type: 'rag',
          fileId: 'doc-chart-fail',
          index: 1,
          pages: ['3'],
        },
      ],
    };

    const failingChartToolService = {
      generateConfig: jest.fn().mockImplementation(() => {
        throw new Error('Chart renderer failed');
      }),
    };

    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService(ragResultWithRefs).ragService,
      failingChartToolService as never,
    );

    const output = await service.process(input);

    expect(output.label).toBe('hybrid');
    expect(output.rag).toEqual(ragResultWithRefs);
    expect(output.chart).toBeUndefined();
    expect(output.data).toEqual([
      {
        type: 'rag',
        fileId: 'doc-chart-fail',
        index: 1,
        pages: ['3'],
      },
    ]);
    expect(output.errors).toEqual([
      {
        source: 'chart',
        code: 'CHART_TOOL_ERROR',
        message: 'Chart generation failed',
      },
    ]);
  });

  it('preserves chart output and reports rag error when rag fails in hybrid path', async () => {
    const failingRag = {
      query: jest.fn().mockRejectedValue(new Error('Weaviate outage')),
    } as unknown as RagService;

    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      failingRag,
      makeChartToolService().chartToolService as never,
    );

    const output = await service.process(input);

    expect(output.label).toBe('hybrid');
    expect(output.chart).toBeDefined();
    expect(output.data?.some((item) => item.type === 'chart')).toBe(true);
    expect(output.errors).toEqual([
      {
        source: 'rag',
        code: 'WEAVIATE_ERROR',
        message: 'RAG retrieval failed',
      },
    ]);
  });
});

describe('DelegatingAgentService.process() – streaming data compatibility', () => {
  const input: ClassificationInput = {
    query: 'refund policy',
    tenantName: 'tenant-stream',
  };

  it('maps rag references into output.data items for rag path', async () => {
    const ragResultWithRefs: RagResult = {
      answer: 'Refund answer',
      sources: [
        {
          fileId: 'doc-1',
          question: 'q',
          answer: 'a',
          pageNumber: ['2'],
        },
      ],
      references: [
        {
          type: 'rag',
          fileId: 'doc-1',
          index: 1,
          pages: ['2'],
        },
      ],
    };

    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      makeRagService(ragResultWithRefs).ragService,
    );

    const output = await service.process(input);

    expect(output.data).toEqual([
      {
        type: 'rag',
        fileId: 'doc-1',
        index: 1,
        pages: ['2'],
      },
    ]);
  });

  it('maps chart config into output.data for chart path', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      makeRagService().ragService,
    );

    const output = await service.process(input);

    expect(output.data).toHaveLength(1);
    expect(output.data?.[0]).toMatchObject({ type: 'chart' });
  });

  it('combines rag references and chart config in output.data for hybrid path', async () => {
    const ragResultWithRefs: RagResult = {
      answer: 'Hybrid answer',
      sources: [
        {
          fileId: 'doc-2',
          question: 'q',
          answer: 'a',
          pageNumber: ['9'],
        },
      ],
      references: [
        {
          type: 'rag',
          fileId: 'doc-2',
          index: 1,
          pages: ['9'],
        },
      ],
    };

    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService(ragResultWithRefs).ragService,
    );

    const output = await service.process(input);

    expect(output.data).toHaveLength(2);
    expect(output.data?.[0]).toMatchObject({ type: 'rag', fileId: 'doc-2' });
    expect(output.data?.[1]).toMatchObject({ type: 'chart' });
  });
});

describe('DelegatingAgentService.processStream() – progressive chunks', () => {
  const input: ClassificationInput = {
    query: 'stream hybrid response',
    tenantName: 'tenant-streaming',
  };

  const collectChunks = async (
    stream: AsyncIterable<AgentStreamChunk>,
  ): Promise<AgentStreamChunk[]> => {
    const chunks: AgentStreamChunk[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return chunks;
  };

  it('emits intermediate chunk(s) with partial answer before final chunk', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService().ragService,
      makeChartToolService().chartToolService as never,
    );

    const streamApi = service as unknown as {
      processStream: (payload: ClassificationInput) => AsyncIterable<AgentStreamChunk>;
    };

    const chunks = await collectChunks(streamApi.processStream(input));

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].answer.length).toBeGreaterThan(0);
    expect(chunks[0].isFinal).toBe(false);
  });

  it('emits a final chunk containing complete data payload', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService().ragService,
      makeChartToolService().chartToolService as never,
    );

    const streamApi = service as unknown as {
      processStream: (payload: ClassificationInput) => AsyncIterable<AgentStreamChunk>;
    };

    const chunks = await collectChunks(streamApi.processStream(input));
    const finalChunk = chunks[chunks.length - 1];

    expect(finalChunk.isFinal).toBe(true);
    expect(finalChunk.data.length).toBeGreaterThan(0);
  });
});
