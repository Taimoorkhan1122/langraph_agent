import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent.module';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { DelegatingAgentService } from './delegating-agent.service';
import { ChartToolService } from './chart-tool.service';

describe('AgentModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? 'test-key';
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AgentModule],
    }).compile();
  });

  it('provides QueryClassifier', () => {
    expect(moduleRef.get(QueryClassifier)).toBeInstanceOf(QueryClassifier);
  });

  it('provides RagService', () => {
    expect(moduleRef.get(RagService)).toBeInstanceOf(RagService);
  });

  it('provides ChartToolService', () => {
    expect(moduleRef.get(ChartToolService)).toBeInstanceOf(ChartToolService);
  });

  it('exports DelegatingAgentService', () => {
    expect(moduleRef.get(DelegatingAgentService)).toBeInstanceOf(
      DelegatingAgentService,
    );
  });
});
