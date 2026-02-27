import {
  deriveExecutionPlan,
  createStreamChunk,
  mergeBranchStatuses,
} from './orchestration.contract';

describe('orchestration.contract', () => {
  it('derives a parallel plan for hybrid classification', () => {
    const plan = deriveExecutionPlan('hybrid');

    expect(plan.mode).toBe('parallel');
    expect(plan.requiresRag).toBe(true);
    expect(plan.requiresChart).toBe(true);
  });

  it('derives a sequential plan for direct classification', () => {
    const plan = deriveExecutionPlan('direct');

    expect(plan.mode).toBe('sequential');
    expect(plan.requiresRag).toBe(false);
    expect(plan.requiresChart).toBe(false);
  });

  it('creates progressive and final stream chunks with stable shape', () => {
    const progressive = createStreamChunk('partial', [], false);
    const final = createStreamChunk(
      'final',
      [{ type: 'rag', fileId: 'doc-1', index: 1, pages: ['2'] }],
      true,
    );

    expect(progressive.answer).toBe('partial');
    expect(progressive.isFinal).toBe(false);
    expect(final.isFinal).toBe(true);
    expect(final.data).toHaveLength(1);
  });

  it('merges branch statuses and keeps failure metadata for partial failures', () => {
    const statuses = mergeBranchStatuses(
      { branch: 'rag', status: 'success' },
      {
        branch: 'chart',
        status: 'failed',
        errorCode: 'CHART_TOOL_ERROR',
        errorMessage: 'Chart generation failed',
      },
    );

    expect(statuses).toHaveLength(2);
    expect(statuses[1]).toMatchObject({
      branch: 'chart',
      status: 'failed',
      errorCode: 'CHART_TOOL_ERROR',
    });
  });
});
