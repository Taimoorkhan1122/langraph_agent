import { DelegatingAgentService } from '../src/agent/delegating-agent.service';
import { QueryClassifier } from '../src/agent/query-classifier';
import { RagService } from '../src/agent/rag.service';
import {
  ClassificationInput,
  ClassificationLabel,
  RagResult,
} from '../src/agent/agent.interfaces';

const createClassifier = (label: ClassificationLabel): QueryClassifier => {
  return {
    classify: () => Promise.resolve(label),
  } as unknown as QueryClassifier;
};

const createRagService = (
  result?: RagResult,
  shouldFail = false,
): RagService => {
  return {
    query: () => {
      if (shouldFail) {
        return Promise.reject(new Error('Simulated RAG failure'));
      }

      const ragPayload: RagResult = result ?? {
        answer: 'RAG answer',
        sources: [
          {
            fileId: 'doc-1',
            question: 'q',
            answer: 'a',
            pageNumber: ['1'],
          },
        ],
        references: [
          {
            type: 'rag',
            fileId: 'doc-1',
            index: 1,
            pages: ['1'],
          },
        ],
      };

      return Promise.resolve(ragPayload);
    },
  } as unknown as RagService;
};

const createChartTool = (
  shouldFail = false,
): { generateConfig: (input: { type: string; title: string }) => string } => ({
  generateConfig: () => {
    if (shouldFail) {
      throw new Error('Simulated chart failure');
    }

    return JSON.stringify({
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2'],
        datasets: [
          {
            label: 'Mock',
            data: [1, 2],
            backgroundColor: ['#2563EB', '#0EA5E9'],
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
  },
});

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async (): Promise<void> => {
  const input: ClassificationInput = {
    query: 'show refund trend',
    tenantName: 'tenant-smoke',
  };

  const hybridSuccess = new DelegatingAgentService(
    createClassifier('hybrid'),
    createRagService(),
    createChartTool() as never,
  );

  const hybridSuccessResult = await hybridSuccess.process(input);
  assert(
    hybridSuccessResult.label === 'hybrid',
    'Expected hybrid label for success case',
  );
  assert(
    Boolean(hybridSuccessResult.rag),
    'Expected rag payload in hybrid success case',
  );
  assert(
    Boolean(hybridSuccessResult.chart),
    'Expected chart payload in hybrid success case',
  );
  assert(
    (hybridSuccessResult.errors ?? []).length === 0,
    'Expected no errors in hybrid success case',
  );

  const chartFails = new DelegatingAgentService(
    createClassifier('hybrid'),
    createRagService(),
    createChartTool(true) as never,
  );

  const chartFailsResult = await chartFails.process(input);
  assert(
    Boolean(chartFailsResult.rag),
    'Expected rag payload when chart fails',
  );
  assert(
    !chartFailsResult.chart,
    'Expected chart to be undefined when chart fails',
  );
  assert(
    chartFailsResult.errors?.[0]?.source === 'chart',
    'Expected chart error source when chart fails',
  );

  const ragFails = new DelegatingAgentService(
    createClassifier('hybrid'),
    createRagService(undefined, true),
    createChartTool() as never,
  );

  const ragFailsResult = await ragFails.process(input);
  assert(
    Boolean(ragFailsResult.chart),
    'Expected chart payload when rag fails',
  );
  assert(
    ragFailsResult.errors?.[0]?.source === 'rag',
    'Expected rag error source when rag fails',
  );

  console.log(
    '✅ smoke:agent passed (hybrid success + partial-failure scenarios)',
  );
};

run().catch((error: unknown) => {
  console.error('❌ smoke:agent failed');
  console.error(error);
  process.exit(1);
});
