import {
  AgentDataReference,
  AgentExecutionPlan,
  AgentStreamChunk,
  ClassificationLabel,
  ParallelBranchStatus,
} from './agent.interfaces';

export const deriveExecutionPlan = (
  label: ClassificationLabel,
): AgentExecutionPlan => {
  switch (label) {
    case 'hybrid':
      return {
        mode: 'parallel',
        requiresRag: true,
        requiresChart: true,
        reason: 'hybrid classification',
      };
    case 'rag':
      return {
        mode: 'sequential',
        requiresRag: true,
        requiresChart: false,
        reason: 'rag classification',
      };
    case 'chart':
      return {
        mode: 'sequential',
        requiresRag: false,
        requiresChart: true,
        reason: 'chart classification',
      };
    case 'direct':
    default:
      return {
        mode: 'sequential',
        requiresRag: false,
        requiresChart: false,
        reason: 'direct classification',
      };
  }
};

export const createStreamChunk = (
  answer: string,
  data: AgentDataReference[],
  isFinal: boolean,
): AgentStreamChunk => ({
  answer,
  data,
  isFinal,
});

export const mergeBranchStatuses = (
  ragStatus?: ParallelBranchStatus,
  chartStatus?: ParallelBranchStatus,
): ParallelBranchStatus[] => {
  const statuses: ParallelBranchStatus[] = [];

  if (ragStatus) {
    statuses.push(ragStatus);
  }

  if (chartStatus) {
    statuses.push(chartStatus);
  }

  return statuses;
};
