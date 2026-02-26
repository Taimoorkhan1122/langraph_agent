/**
 * LangChain-driven query classifier (EPIC-002 / US-004).
 * Classifies a user query into one of four labels using an injected LLM.
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ClassificationLabel } from './agent.interfaces';

/** The four deterministic labels the classifier may return. */
const VALID_LABELS: ReadonlySet<ClassificationLabel> = new Set([
  'chart',
  'rag',
  'direct',
  'hybrid',
]);

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
    const chain = CLASSIFICATION_PROMPT.pipe(this.llm).pipe(
      new StringOutputParser(),
    );

    const raw = await chain.invoke({ query });
    const label = raw.trim().toLowerCase() as ClassificationLabel;

    if (VALID_LABELS.has(label)) {
      return label;
    }

    this.logger.warn(
      `LLM returned unexpected label "${raw}"; falling back to "direct"`,
    );
    return 'direct';
  }
}
