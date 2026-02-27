/**
 * NestJS module for the Delegating Agent (EPIC-002 / US-004).
 * Wires together QueryClassifier, RagService, and DelegatingAgentService.
 * LLM API key and Weaviate URL are injected via ConfigService.
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentController } from './agent.controller';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { DelegatingAgentService } from './delegating-agent.service';
import { ChartToolService } from './chart-tool.service';

/** Token for the Weaviate base URL injection. */
export const WEAVIATE_BASE_URL = 'WEAVIATE_BASE_URL';

@Module({
  controllers: [AgentController],
  providers: [
    {
      provide: QueryClassifier,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const llm = new ChatGoogleGenerativeAI({
          model: config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash',
          apiKey: config.get<string>('GEMINI_API_KEY'),
          temperature: 0,
        });
        return new QueryClassifier(llm);
      },
    },
    {
      provide: RagService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url =
          config.get<string>('WEAVIATE_URL') ?? 'http://localhost:8080';
        return new RagService(url);
      },
    },
    ChartToolService,
    DelegatingAgentService,
  ],
  exports: [DelegatingAgentService],
})
export class AgentModule {}
