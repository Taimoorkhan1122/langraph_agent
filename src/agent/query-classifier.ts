/**
 * LangChain-driven query classifier (EPIC-002 / US-004).
 * Classifies a user query into one of four labels using an injected LLM.
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ClassificationLabel } from './agent.interfaces';

/** The four deterministic labels the classifier may return. */
const VALID_LABELS: ReadonlySet<ClassificationLabel> = new Set([
  'chart',
  'rag',
  'direct',
  'hybrid',
]);

const CLASSIFICATION_TOOL = tool(
  ({ label }: { label: ClassificationLabel }) => label,
  {
    name: 'set_classification_label',
    description:
      'Select exactly one label for the query: chart, rag, direct, or hybrid.',
    schema: z.object({
      label: z.enum(['chart', 'rag', 'direct', 'hybrid']),
    }),
  },
);

const CLASSIFICATION_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a query router for a RAG + Chart.js system.
Classify the following user query into EXACTLY ONE of these labels:
- chart    : The user wants a chart, graph, or visualisation.
- rag      : The user wants factual information retrieved from documents.
- direct   : The user wants a direct conversational answer (no documents or charts needed).
- hybrid   : The user wants both document-based information AND a chart/visualisation.

Respond with ONLY the label word (lowercase). Do not include punctuation or explanation.`,
  ],
  ['human', '{query}'],
]);

/**
 * Classifies a query string to one of: chart | rag | direct | hybrid.
 * The underlying LLM is injected to allow mocking in tests.
 */
@Injectable()
export class QueryClassifier {
  private readonly logger = new Logger(QueryClassifier.name);

  constructor(private readonly llm: BaseChatModel) {}

  /**
   * Classifies `query` using the injected LLM.
   * Falls back to `'direct'` if the LLM returns an unexpected value.
   *
   * @param query - The raw user query string.
   * @returns A `ClassificationLabel` promise.
   */
  async classify(query: string): Promise<ClassificationLabel> {
    const modelWithBindTools = this.llm as BaseChatModel & {
      bindTools?: (tools: unknown[]) => unknown;
    };

    const model =
      typeof modelWithBindTools.bindTools === 'function'
        ? modelWithBindTools.bindTools([CLASSIFICATION_TOOL])
        : this.llm;

    const response = await CLASSIFICATION_PROMPT.pipe(model).invoke({ query });

    const toolLabel = this.extractToolLabel(response);
    if (toolLabel !== undefined) {
      return toolLabel;
    }

    const raw = this.extractText(response);
    const label = raw.trim().toLowerCase() as ClassificationLabel;

    if (VALID_LABELS.has(label)) {
      return label;
    }

    this.logger.warn(
      `LLM returned unexpected label "${raw}"; falling back to "direct"`,
    );
    return 'direct';
  }

  private extractToolLabel(response: unknown): ClassificationLabel | undefined {
    if (!response || typeof response !== 'object') {
      return undefined;
    }

    const toolCalls = (
      response as {
        tool_calls?: Array<{ args?: { label?: string } }>;
      }
    ).tool_calls;

    if (!Array.isArray(toolCalls)) {
      return undefined;
    }

    for (const call of toolCalls) {
      const label = call.args?.label?.trim().toLowerCase() as
        | ClassificationLabel
        | undefined;
      if (label !== undefined && VALID_LABELS.has(label)) {
        return label;
      }
    }

    return undefined;
  }

  private extractText(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return '';
    }

    const content = (response as { content?: unknown }).content;
    if (typeof content === 'string') {
      return content;
    }

    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (
          item &&
          typeof item === 'object' &&
          'text' in item &&
          typeof (item as { text: unknown }).text === 'string'
        ) {
          return (item as { text: string }).text;
        }

        return '';
      })
      .join(' ')
      .trim();
  }
}
