/**
 * HTTP controller for the delegating agent (EPIC-002).
 * Exposes POST /agent/stream for streamed agent responses via SSE.
 */

import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DelegatingAgentService } from './delegating-agent.service';
import { AgentQueryDto } from './dto/agent-query.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly delegatingAgent: DelegatingAgentService) {}

  /**
   * Streams agent response as Server-Sent Events.
   * Each event carries one chunk: { answer, data, isFinal }.
   */
  @Post('stream')
  async stream(
    @Body() body: AgentQueryDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.delegatingAgent.processStream({
        query: body.query,
        tenantName: body.tenantName,
      })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (
          typeof (res as unknown as { flush?: () => void }).flush === 'function'
        ) {
          (res as unknown as { flush: () => void }).flush();
        }
      }
    } catch (err) {
      res.status(500);
      res.write(
        `data: ${JSON.stringify({ error: err instanceof Error ? err.message : String(err) })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
