/**
 * Delegating Agent Service (EPIC-002 / US-004).
 * Accepts a user query, classifies it with the LLM, and routes to the
 * appropriate tool(s): RAG service, stub chart generator, or direct answer.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import {
  ClassificationInput,
  ClassificationOutput,
  ClassificationLabel,
  ChartResult,
} from './agent.interfaces';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { ChartToolService } from './chart-tool.service';

const DelegatingAgentState = Annotation.Root({
  query: Annotation<string>,
  tenantName: Annotation<string | undefined>,
  label: Annotation<ClassificationLabel | undefined>,
  rag: Annotation<ClassificationOutput['rag'] | undefined>,
  chart: Annotation<ClassificationOutput['chart'] | undefined>,
  errors: Annotation<ClassificationOutput['errors'] | undefined>,
});

type DelegatingAgentStateType = typeof DelegatingAgentState.State;

/**
 * Orchestrates the full delegating-agent pipeline:
 * classify → route → collect tool outputs → return typed result.
 */
@Injectable()
export class DelegatingAgentService {
  private readonly logger = new Logger(DelegatingAgentService.name);

  constructor(
    private readonly classifier: QueryClassifier,
    private readonly ragService: RagService,
    private readonly chartToolService?: ChartToolService,
  ) {}

  /**
   * Processes a user query end-to-end.
   *
   * @param input - `{ query, tenantName }` – tenantName is required for rag/hybrid paths.
   * @returns A `ClassificationOutput` with label and populated tool outputs.
   */
  async process(input: ClassificationInput): Promise<ClassificationOutput> {
    const graph = new StateGraph(DelegatingAgentState)
      .addNode('classify', (state: DelegatingAgentStateType) =>
        this.classifyNode(state),
      )
      .addNode('runRag', (state: DelegatingAgentStateType) =>
        this.runRagNode(state),
      )
      .addNode('runChart', (state: DelegatingAgentStateType) =>
        this.runChartNode(state),
      )
      .addEdge(START, 'classify')
      .addEdge('classify', 'runRag')
      .addEdge('runRag', 'runChart')
      .addEdge('runChart', END)
      .compile();

    const state = await graph.invoke({
      query: input.query,
      tenantName: input.tenantName,
    });

    const output: ClassificationOutput = {
      label: state.label ?? 'direct',
    };

    if (state.rag !== undefined) {
      output.rag = state.rag;
    }

    if (state.chart !== undefined) {
      output.chart = state.chart;
    }

    const data: NonNullable<ClassificationOutput['data']> = [];

    if (state.rag?.references?.length) {
      data.push(...state.rag.references);
    }

    if (state.chart !== undefined) {
      data.push({ type: 'chart', config: state.chart });
    }

    if (data.length > 0) {
      output.data = data;
    }

    if (state.errors?.length) {
      output.errors = state.errors;
    }

    return output;
  }

  private async classifyNode(
    state: DelegatingAgentStateType,
  ): Promise<Partial<DelegatingAgentStateType>> {
    try {
      const label = await this.classifier.classify(state.query);
      this.logger.log(`Query classified as "${label}"`);
      return { label };
    } catch (err) {
      this.logger.error('LLM classifier failed; falling back to "direct"', err);
      return { label: 'direct' };
    }
  }

  private async runRagNode(
    state: DelegatingAgentStateType,
  ): Promise<Partial<DelegatingAgentStateType>> {
    if (state.label !== 'rag' && state.label !== 'hybrid') {
      return {};
    }

    try {
      const rag = await this.ragService.query(
        state.query,
        state.tenantName ?? 'default',
      );
      return { rag };
    } catch (err) {
      this.logger.error(
        'RAG service failed; returning degraded rag result',
        err,
      );
      return {
        rag: {
          answer: 'RAG retrieval is temporarily unavailable.',
          sources: [],
          references: [],
          error: {
            code: 'WEAVIATE_ERROR',
            message: 'RAG retrieval failed',
          },
        },
        errors: [
          {
            source: 'rag',
            code: 'WEAVIATE_ERROR',
            message: 'RAG retrieval failed',
          },
        ],
      };
    }
  }

  private runChartNode(
    state: DelegatingAgentStateType,
  ): Partial<DelegatingAgentStateType> {
    if (state.label !== 'chart' && state.label !== 'hybrid') {
      return {};
    }

    try {
      const service = this.chartToolService ?? new ChartToolService();
      const serialized = service.generateConfig({
        type: 'bar',
        title: state.query.slice(0, 120),
      });
      const chart = JSON.parse(serialized) as ChartResult;

      return { chart };
    } catch (err) {
      this.logger.error('Chart tool failed; returning degraded chart result', err);
      return {
        errors: [
          {
            source: 'chart',
            code: 'CHART_TOOL_ERROR',
            message: 'Chart generation failed',
          },
        ],
      };
    }
  }
}
