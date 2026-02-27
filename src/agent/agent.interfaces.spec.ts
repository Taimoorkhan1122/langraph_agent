import {
  AgentDataReference,
  AgentError,
  ChartDataReference,
  ChartToolConfig,
  ClassificationOutput,
  RagReference,
  RagResult,
} from './agent.interfaces';

describe('agent.interfaces contracts', () => {
  it('supports rag and chart references inside data array', () => {
    const ragReference: RagReference = {
      type: 'rag',
      fileId: 'doc-1',
      index: 1,
      pages: ['2', '3'],
    };

    const chartReference: ChartDataReference = {
      type: 'chart',
      config: {
        type: 'bar',
        data: {
          labels: ['A'],
          datasets: [{ label: 'value', data: [1] }],
        },
        options: {},
      },
    };

    const refs: AgentDataReference[] = [ragReference, chartReference];

    expect(refs).toHaveLength(2);
    expect(refs[0].type).toBe('rag');
    expect(refs[1].type).toBe('chart');
  });

  it('supports stable error envelope in classification output', () => {
    const ragResult: RagResult = {
      answer: 'fallback',
      sources: [],
      references: [],
      error: {
        code: 'WEAVIATE_ERROR',
        message: 'RAG retrieval failed',
      },
    };

    const error: AgentError = {
      source: 'rag',
      code: 'WEAVIATE_ERROR',
      message: 'RAG retrieval failed',
    };

    const output: ClassificationOutput = {
      label: 'rag',
      rag: ragResult,
      data: [],
      errors: [error],
    };

    expect(output.errors?.[0].source).toBe('rag');
    expect(output.rag?.error?.code).toBe('WEAVIATE_ERROR');
  });

  it('supports strict chart configuration typing with backgroundColor arrays', () => {
    const config: ChartToolConfig = {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb'],
        datasets: [
          {
            label: 'Revenue',
            data: [10, 20],
            backgroundColor: ['#60A5FA', '#34D399'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Revenue by Month' },
        },
      },
    };

    expect(config.data.datasets[0].backgroundColor).toHaveLength(2);
  });
});
