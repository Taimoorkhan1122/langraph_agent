import { Test, TestingModule } from '@nestjs/testing';
import { AgentModule } from './agent.module';
import { QueryClassifier } from './query-classifier';
import { RagService } from './rag.service';
import { DelegatingAgentService } from './delegating-agent.service';

describe('AgentModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? 'test-key';
    moduleRef = await Test.createTestingModule({
      imports: [AgentModule],
    }).compile();
  });

  it('provides QueryClassifier', () => {
    expect(moduleRef.get(QueryClassifier)).toBeInstanceOf(QueryClassifier);
  });

  it('provides RagService', () => {
    expect(moduleRef.get(RagService)).toBeInstanceOf(RagService);
  });

  it('exports DelegatingAgentService', () => {
    expect(moduleRef.get(DelegatingAgentService)).toBeInstanceOf(
      DelegatingAgentService,
    );
  });
});
