import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { DelegatingAgentService } from './agent/delegating-agent.service';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(AgentModule)
      .useModule({
        module: class MockAgentModule {},
        providers: [
          {
            provide: DelegatingAgentService,
            useValue: { process: jest.fn(), processStream: jest.fn() },
          },
        ],
        exports: [DelegatingAgentService],
      } as unknown as AgentModule)
      .compile();
  });

  it('provides AppController', () => {
    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
  });

  it('provides AppService', () => {
    expect(moduleRef.get(AppService)).toBeInstanceOf(AppService);
  });
});
