/**
 * Delegating Agent Service (EPIC-002 / US-004).
 * Accepts a user query, classifies it with the LLM, and routes to the
 * appropriate tool(s): RAG service, stub chart generator, or direct answer.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ClassificationInput,
  ClassificationOutput,
  ClassificationLabel,
  ChartResult,
} from './agent.interfaces';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { ChartToolService } from './chart-tool.service';

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
    const output: ClassificationOutput = {
      label: await this.classify(input.query),
    };

    let ragResult: Partial<ClassificationOutput> = {};
    let chartResult: Partial<ClassificationOutput> = {};

    if (output.label === 'hybrid') {
      [ragResult, chartResult] = await Promise.all([
        this.runRag(input),
        this.runChart(input),
      ]);
    } else if (output.label === 'rag') {
      ragResult = await this.runRag(input);
    } else if (output.label === 'chart') {
      chartResult = await this.runChart(input);
    }

    output.rag = ragResult.rag;
    output.chart = chartResult.chart;

    const combinedErrors = [...(ragResult.errors ?? []), ...(chartResult.errors ?? [])];

    const data: NonNullable<ClassificationOutput['data']> = [];

    if (output.rag?.references?.length) {
      data.push(...output.rag.references);
    }

    if (output.chart !== undefined) {
      data.push({ type: 'chart', config: output.chart });
    }

    if (data.length > 0) {
      output.data = data;
    }

    if (combinedErrors.length) {
      output.errors = combinedErrors;
    }

    return output;
  }

  private async classify(query: string): Promise<ClassificationLabel> {
    try {
      const label = await this.classifier.classify(query);
      this.logger.log(`Query classified as "${label}"`);
      return label;
    } catch (err) {
      this.logger.error('LLM classifier failed; falling back to "direct"', err);
      return 'direct';
    }
  }

  private async runRag(
    input: ClassificationInput,
  ): Promise<Partial<ClassificationOutput>> {
    try {
      const rag = await this.ragService.query(input.query, input.tenantName ?? 'default');
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

  private async runChart(
    input: ClassificationInput,
  ): Promise<Partial<ClassificationOutput>> {
    try {
      const service = this.chartToolService ?? new ChartToolService();
      const serialized = service.generateConfig({
        type: 'bar',
        title: input.query.slice(0, 120),
      });
      const chart = JSON.parse(serialized) as ChartResult;

      return { chart };
    } catch (err) {
      this.logger.error(
        'Chart tool failed; returning degraded chart result',
        err,
      );
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
