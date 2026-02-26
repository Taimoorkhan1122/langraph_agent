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
} from './agent.interfaces';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { generateStubChart } from './stub-chart';

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
  ) {}

  /**
   * Processes a user query end-to-end.
   *
   * @param input - `{ query, tenantName }` – tenantName is required for rag/hybrid paths.
   * @returns A `ClassificationOutput` with label and populated tool outputs.
   */
  async process(input: ClassificationInput): Promise<ClassificationOutput> {
    const { query, tenantName } = input;

    // ----- 1. Classify -------------------------------------------------------
    let label: ClassificationLabel;
    try {
      label = await this.classifier.classify(query);
      this.logger.log(`Query classified as "${label}"`);
    } catch (err) {
      this.logger.error('LLM classifier failed; falling back to "direct"', err);
      return { label: 'direct' };
    }

    const output: ClassificationOutput = { label };

    // ----- 2. RAG tool (rag / hybrid) ----------------------------------------
    if (label === 'rag' || label === 'hybrid') {
      try {
        output.rag = await this.ragService.query(
          query,
          tenantName ?? 'default',
        );
      } catch (err) {
        this.logger.error('RAG service failed; omitting rag result', err);
        // label is still accurate; rag payload is omitted (safe degradation)
      }
    }

    // ----- 3. Stub chart (chart / hybrid) ------------------------------------
    if (label === 'chart' || label === 'hybrid') {
      output.chart = generateStubChart(query);
    }

    return output;
  }
}
