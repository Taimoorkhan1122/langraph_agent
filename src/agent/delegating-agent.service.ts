/**
 * Delegating Agent Service (EPIC-002 / US-004, US-005).
 * Uses a LangGraph StateGraph to classify, route, and run RAG/chart tools.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ClassificationInput,
  ClassificationOutput,
  AgentStreamChunk,
  AgentDataReference,
  RagReference,
  ChartDataReference,
} from './agent.interfaces';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { ChartToolService } from './chart-tool.service';
import { createStreamChunk } from './orchestration.contract';
import { createDelegatingAgentGraph } from './agent.graph';

/**
 * Orchestrates the delegating-agent pipeline via a LangGraph StateGraph:
 * classify → rag | chart | direct | hybrid → format → END.
 */
@Injectable()
export class DelegatingAgentService {
  private readonly logger = new Logger(DelegatingAgentService.name);
  private readonly graph;

  constructor(
    private readonly classifier: QueryClassifier,
    private readonly ragService: RagService,
    private readonly chartToolService?: ChartToolService,
  ) {
    this.graph = createDelegatingAgentGraph({
      classifier: this.classifier,
      ragService: this.ragService,
      chartToolService: this.chartToolService,
      log: (msg) => this.logger.log(msg),
      logError: (msg, err) => this.logger.error(msg, err),
    });
  }

  /**
   * Processes a user query end-to-end by invoking the LangGraph.
   *
   * @param input - `{ query, tenantName }` – tenantName is required for rag/hybrid paths.
   * @returns A `ClassificationOutput` with label and populated tool outputs.
   */
  async process(input: ClassificationInput): Promise<ClassificationOutput> {
    const initialState = {
      query: input.query,
      tenantName: input.tenantName ?? '',
    };
    const finalState = await this.graph.invoke(initialState);

    const output: ClassificationOutput = {
      label: finalState.label ?? 'direct',
      rag: finalState.rag,
      chart: finalState.chart,
    };
    if (finalState.data?.length) {
      output.data = finalState.data;
    }
    if (finalState.errors?.length) {
      output.errors = finalState.errors;
    }
    return output;
  }

  async *processStream(
    input: ClassificationInput,
  ): AsyncIterable<AgentStreamChunk> {
    const output = await this.process(input);
    const chunks = this.buildStreamChunks(output, input);

    for (const chunk of chunks) {
      yield chunk;
    }
  }

  private buildStreamAnswer(
    output: ClassificationOutput,
    input: ClassificationInput,
  ): string {
    if (output.rag?.answer?.trim()) {
      return output.rag.answer;
    }

    if (output.chart) {
      return 'Chart configuration prepared.';
    }

    return `Processed query: ${input.query}`;
  }

  private buildIntermediateAnswer(finalAnswer: string): string {
    if (finalAnswer.length <= 48) {
      return finalAnswer;
    }

    return `${finalAnswer.slice(0, 48).trimEnd()}...`;
  }

  private buildStreamChunks(
    output: ClassificationOutput,
    input: ClassificationInput,
  ): AgentStreamChunk[] {
    const finalAnswer = this.buildStreamAnswer(output, input);
    const normalizedData = this.normalizeStreamData(output.data ?? []);
    const earlyData = this.buildEarlyStreamData(normalizedData);

    return [
      createStreamChunk(
        this.buildIntermediateAnswer(finalAnswer),
        earlyData,
        false,
      ),
      createStreamChunk(finalAnswer, normalizedData, true),
    ];
  }

  private normalizeStreamData(
    data: AgentDataReference[],
  ): AgentDataReference[] {
    return data.filter(
      (item) => this.isRagReference(item) || this.isChartDataReference(item),
    );
  }

  private buildEarlyStreamData(
    data: AgentDataReference[],
  ): AgentDataReference[] {
    return data.filter((item) => this.isRagReference(item));
  }

  private isRagReference(item: AgentDataReference): item is RagReference {
    return item.type === 'rag';
  }

  private isChartDataReference(
    item: AgentDataReference,
  ): item is ChartDataReference {
    return item.type === 'chart';
  }
}
