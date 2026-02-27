import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from './agent.controller';
import { DelegatingAgentService } from './delegating-agent.service';
import type { AgentStreamChunk } from './agent.interfaces';

describe('AgentController', () => {
  let controller: AgentController;
  let delegatingAgent: jest.Mocked<
    Pick<DelegatingAgentService, 'processStream'>
  >;

  const mockRes = () => {
    const res = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    return res as unknown as Parameters<AgentController['stream']>[1];
  };

  beforeEach(async () => {
    const processStream = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: DelegatingAgentService,
          useValue: { processStream },
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    delegatingAgent = module.get(DelegatingAgentService);
  });

  describe('POST /agent/stream', () => {
    it('sets SSE headers and streams chunks as JSON events', async () => {
      const chunk1: AgentStreamChunk = {
        answer: 'partial',
        data: [],
        isFinal: false,
      };
      const chunk2: AgentStreamChunk = {
        answer: 'final answer',
        data: [{ type: 'rag', fileId: 'f1', index: 1, pages: ['3'] }],
        isFinal: true,
      };
      (delegatingAgent.processStream as jest.Mock).mockImplementation(
        async function* () {
          await Promise.resolve();
          yield chunk1;
          yield chunk2;
        },
      );

      const res = mockRes();
      await controller.stream(
        { query: 'test query', tenantName: 'tenant-1' },
        res,
      );

      const setHeaderMock = (res as unknown as { setHeader: jest.Mock })
        .setHeader;
      const flushHeadersMock = (res as unknown as { flushHeaders: jest.Mock })
        .flushHeaders;
      const writeMock = (res as unknown as { write: jest.Mock }).write;
      const endMock = (res as unknown as { end: jest.Mock }).end;

      expect(setHeaderMock).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(setHeaderMock).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(setHeaderMock).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(flushHeadersMock).toHaveBeenCalled();
      expect(delegatingAgent.processStream as jest.Mock).toHaveBeenCalledWith({
        query: 'test query',
        tenantName: 'tenant-1',
      });
      expect(writeMock).toHaveBeenCalledTimes(2);
      expect(writeMock).toHaveBeenNthCalledWith(
        1,
        `data: ${JSON.stringify(chunk1)}\n\n`,
      );
      expect(writeMock).toHaveBeenNthCalledWith(
        2,
        `data: ${JSON.stringify(chunk2)}\n\n`,
      );
      expect(endMock).toHaveBeenCalled();
    });

    it('forwards query only when tenantName is omitted', async () => {
      (delegatingAgent.processStream as jest.Mock).mockImplementation(
        async function* () {
          await Promise.resolve();
          yield { answer: 'ok', data: [], isFinal: true };
        },
      );

      const res = mockRes();
      await controller.stream({ query: 'hello' }, res);

      expect(delegatingAgent.processStream as jest.Mock).toHaveBeenCalledWith({
        query: 'hello',
        tenantName: undefined,
      });
      expect((res as unknown as { end: jest.Mock }).end).toHaveBeenCalled();
    });

    it('sets status 500 and writes error event when processStream throws', async () => {
      (delegatingAgent.processStream as jest.Mock).mockImplementation(() => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('Agent failed')),
        }),
      }));

      const res = mockRes();
      await controller.stream({ query: 'fail', tenantName: 't' }, res);

      expect(
        (res as unknown as { status: jest.Mock }).status,
      ).toHaveBeenCalledWith(500);
      expect(
        (res as unknown as { write: jest.Mock }).write,
      ).toHaveBeenCalledWith(expect.stringContaining('"error":"Agent failed"'));
      expect((res as unknown as { end: jest.Mock }).end).toHaveBeenCalled();
    });
  });
});
