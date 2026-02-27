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
  AgentError,
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

    const { ragResult, chartResult } = await this.executeByLabel(
      output.label,
      input,
    );

    output.rag = ragResult.rag;
    output.chart = chartResult.chart;

    const combinedErrors = this.mergeErrors(ragResult, chartResult);

    const data = this.buildDataReferences(output);

    if (data.length > 0) {
      output.data = data;
    }

    if (combinedErrors.length) {
      output.errors = combinedErrors;
    }

    return output;
  }

  private async executeByLabel(
    label: ClassificationLabel,
    input: ClassificationInput,
  ): Promise<{
    ragResult: Partial<ClassificationOutput>;
    chartResult: Partial<ClassificationOutput>;
  }> {
    let ragResult: Partial<ClassificationOutput> = {};
    let chartResult: Partial<ClassificationOutput> = {};

    if (label === 'hybrid') {
      [ragResult, chartResult] = await Promise.all([
        this.runRag(input),
        this.runChart(input),
      ]);
    } else if (label === 'rag') {
      ragResult = await this.runRag(input);
    } else if (label === 'chart') {
      chartResult = await this.runChart(input);
    }

    return { ragResult, chartResult };
  }

  private buildDataReferences(
    output: ClassificationOutput,
  ): NonNullable<ClassificationOutput['data']> {
    const data: NonNullable<ClassificationOutput['data']> = [];

    if (output.rag?.references?.length) {
      data.push(...output.rag.references);
    }

    if (output.chart !== undefined) {
      data.push({ type: 'chart', config: output.chart });
    }

    return data;
  }

  private mergeErrors(
    ragResult: Partial<ClassificationOutput>,
    chartResult: Partial<ClassificationOutput>,
  ): NonNullable<ClassificationOutput['errors']> {
    return [...(ragResult.errors ?? []), ...(chartResult.errors ?? [])];
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
      const rag = await this.ragService.query(
        input.query,
        input.tenantName ?? 'default',
      );
      return { rag };
    } catch (err) {
      this.logger.error(
        'RAG service failed; returning degraded rag result',
        err,
      );
      const error = this.createBranchError(
        'rag',
        'WEAVIATE_ERROR',
        'RAG retrieval failed',
      );

      return {
        rag: {
          answer: 'RAG retrieval is temporarily unavailable.',
          sources: [],
          references: [],
          error: {
            code: error.code,
            message: error.message,
          },
        },
        errors: [error],
      };
    }
  }

  private runChart(
    input: ClassificationInput,
  ): Partial<ClassificationOutput> {
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
      const error = this.createBranchError(
        'chart',
        'CHART_TOOL_ERROR',
        'Chart generation failed',
      );

      return {
        errors: [error],
      };
    }
  }

  private createBranchError<Code extends AgentError['code']>(
    source: AgentError['source'],
    code: Code,
    message: AgentError['message'],
  ): AgentError & { code: Code } {
    return {
      source,
      code,
      message,
    };
  }
}
