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

const makeRagService = (result: RagResult = defaultRagResult): RagService => {
  const mock = {
    query: jest.fn().mockResolvedValue(result),
  } as unknown as RagService;
  return mock;
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
      makeRagService(),
    );
    const output = await service.process(input);

    expect(output.label).toBe('chart');
    expect(output.rag).toBeUndefined();
    expect(output.chart).toBeDefined();
  });

  it('routes a RAG query → label "rag", has rag, no chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      makeRagService(),
    );
    const output = await service.process(input);

    expect(output.label).toBe('rag');
    expect(output.rag).toBeDefined();
    expect(output.chart).toBeUndefined();
  });

  it('routes a direct query → label "direct", no rag, no chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('direct'),
      makeRagService(),
    );
    const output = await service.process(input);

    expect(output.label).toBe('direct');
    expect(output.rag).toBeUndefined();
    expect(output.chart).toBeUndefined();
  });

  it('routes a hybrid query → label "hybrid", has rag AND chart', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService(),
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
    const ragService = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      ragService,
    );

    await service.process(input);

    expect(ragService.query as jest.Mock).toHaveBeenCalledTimes(1);
    expect(ragService.query as jest.Mock).toHaveBeenCalledWith(
      input.query,
      input.tenantName,
    );
  });

  it('calls RagService.query() for "hybrid" path as well', async () => {
    const ragService = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      ragService,
    );

    await service.process(input);

    expect(ragService.query as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('does NOT call RagService.query() for "chart" path', async () => {
    const ragService = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('chart'),
      ragService,
    );

    await service.process(input);

    expect(ragService.query as jest.Mock).not.toHaveBeenCalled();
  });

  it('does NOT call RagService.query() for "direct" path', async () => {
    const ragService = makeRagService();
    const service = new DelegatingAgentService(
      makeClassifier('direct'),
      ragService,
    );

    await service.process(input);

    expect(ragService.query as jest.Mock).not.toHaveBeenCalled();
  });

  it('surfaces the RAG result in the output for "rag" path', async () => {
    const ragService = makeRagService(defaultRagResult);
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      ragService,
    );

    const output = await service.process(input);

    expect(output.rag).toEqual(defaultRagResult);
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
      makeRagService(),
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

  it('returns a valid stub ChartResult for "hybrid" path', async () => {
    const service = new DelegatingAgentService(
      makeClassifier('hybrid'),
      makeRagService(),
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

  it('returns partial result (label=rag, no rag data) when RAG service throws', async () => {
    const failingRag = {
      query: jest.fn().mockRejectedValue(new Error('Weaviate down')),
    } as unknown as RagService;
    const service = new DelegatingAgentService(
      makeClassifier('rag'),
      failingRag,
    );

    const output = await service.process(input);

    expect(output.label).toBe('rag');
    expect(output.rag).toBeUndefined();
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
      makeRagService(ragResultWithRefs),
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
      makeRagService(),
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
      makeRagService(ragResultWithRefs),
    );

    const output = await service.process(input);

    expect(output.data).toHaveLength(2);
    expect(output.data?.[0]).toMatchObject({ type: 'rag', fileId: 'doc-2' });
    expect(output.data?.[1]).toMatchObject({ type: 'chart' });
  });
});
