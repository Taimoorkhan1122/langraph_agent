/**
 * NestJS module for the Delegating Agent (EPIC-002 / US-004).
 * Wires together QueryClassifier, RagService, and DelegatingAgentService.
 * The LLM and Weaviate URL are provided via environment variables.
 */

import { Module } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { DelegatingAgentService } from './delegating-agent.service';
import { ChartToolService } from './chart-tool.service';

/** Token for the Weaviate base URL injection. */
export const WEAVIATE_BASE_URL = 'WEAVIATE_BASE_URL';

@Module({
  providers: [
    {
      provide: QueryClassifier,
      useFactory: () => {
        const llm = new ChatGoogleGenerativeAI({
          model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0,
        });
        return new QueryClassifier(llm);
      },
    },
    {
      provide: RagService,
      useFactory: () => {
        const url = process.env.WEAVIATE_URL ?? 'http://localhost:8080';
        return new RagService(url);
      },
    },
    ChartToolService,
    DelegatingAgentService,
  ],
  exports: [DelegatingAgentService],
})
export class AgentModule {}
