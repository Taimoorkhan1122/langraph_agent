/**
 * LangGraph StateGraph for the delegating agent hierarchy (US-005).
 * Nodes: classify → rag | chart | direct | hybrid → format → END.
 */

import {
  Annotation,
  StateGraph,
  START,
  END,
  type CompiledStateGraph,
} from '@langchain/langgraph';
import type { QueryClassifier } from './query-classifier';
import type { RagService } from './rag.service';
import type { ChartToolService } from './chart-tool.service';
import type {
  ClassificationLabel,
  RagResult,
  ChartResult,
  AgentError,
  AgentDataReference,
  ChartDataReference,
} from './agent.interfaces';
import { ChartToolService as DefaultChartToolService } from './chart-tool.service';

const appendReducer = <T>(left: T[], right: T | T[]): T[] =>
  left.concat(Array.isArray(right) ? right : [right]);

export const AgentStateAnnotation = Annotation.Root({
  query: Annotation<string>(),
  tenantName: Annotation<string>(),
  label: Annotation<ClassificationLabel>(),
  rag: Annotation<RagResult>(),
  chart: Annotation<ChartResult>(),
  errors: Annotation<AgentError[]>({
    reducer: appendReducer,
    default: () => [],
  }),
  data: Annotation<AgentDataReference[]>({
    reducer: appendReducer,
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;

function createBranchError(
  source: AgentError['source'],
  code: string,
  message: string,
): AgentError {
  return { source, code, message };
}

function buildDataReferences(state: AgentState): AgentDataReference[] {
  const out: AgentDataReference[] = [];
  if (state.rag?.references?.length) {
    out.push(...state.rag.references);
  }
  if (state.chart !== undefined) {
    out.push({ type: 'chart', config: state.chart } as ChartDataReference);
  }
  return out;
}

export type CreateDelegatingAgentGraphDeps = {
  classifier: QueryClassifier;
  ragService: RagService;
  chartToolService?: ChartToolService;
  log?: (message: string, ...args: unknown[]) => void;
  logError?: (message: string, err?: unknown) => void;
};

/**
 * Factory that builds the compiled LangGraph StateGraph for the delegating agent.
 * Nodes close over classifier, ragService, and chartToolService.
 */
export function createDelegatingAgentGraph(
  deps: CreateDelegatingAgentGraphDeps,
) {
  const {
    classifier,
    ragService,
    chartToolService,
    log = () => {},
    logError = () => {},
  } = deps;

  const chartService = chartToolService ?? new DefaultChartToolService();

  async function classifyNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const label = await classifier.classify(state.query);
      log(`Query classified as "${label}"`);
      return { label };
    } catch (err) {
      logError('LLM classifier failed; falling back to "direct"', err);
      return { label: 'direct' as ClassificationLabel };
    }
  }

  async function ragNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const rag = await ragService.query(
        state.query,
        state.tenantName ?? 'default',
      );
      return { rag };
    } catch (err) {
      logError('RAG service failed; returning degraded rag result', err);
      const error = createBranchError(
        'rag',
        'WEAVIATE_ERROR',
        'RAG retrieval failed',
      );
      return {
        rag: {
          answer: 'RAG retrieval is temporarily unavailable.',
          sources: [],
          references: [],
          error: { code: 'WEAVIATE_ERROR' as const, message: error.message },
        },
        errors: [error],
      };
    }
  }

  function chartNode(state: AgentState): Partial<AgentState> {
    try {
      const serialized = chartService.generateConfig({
        type: 'bar',
        title: state.query.slice(0, 120),
      });
      const chart = JSON.parse(serialized) as ChartResult;
      return { chart };
    } catch (err) {
      logError('Chart tool failed; returning degraded chart result', err);
      const error = createBranchError(
        'chart',
        'CHART_TOOL_ERROR',
        'Chart generation failed',
      );
      return { errors: [error] };
    }
  }

  function directNode(_state: AgentState): Partial<AgentState> {
    return {};
  }

  async function hybridNode(state: AgentState): Promise<Partial<AgentState>> {
    const [ragUpdate, chartUpdate] = await Promise.all([
      (async () => {
        try {
          const rag = await ragService.query(
            state.query,
            state.tenantName ?? 'default',
          );
          return { rag };
        } catch (err) {
          logError('RAG service failed; returning degraded rag result', err);
          const error = createBranchError(
            'rag',
            'WEAVIATE_ERROR',
            'RAG retrieval failed',
          );
          return {
            rag: {
              answer: 'RAG retrieval is temporarily unavailable.',
              sources: [],
              references: [],
              error: {
                code: 'WEAVIATE_ERROR' as const,
                message: error.message,
              },
            },
            errors: [error],
          };
        }
      })(),
      (async () => {
        try {
          const serialized = chartService.generateConfig({
            type: 'bar',
            title: state.query.slice(0, 120),
          });
          const chart = JSON.parse(serialized) as ChartResult;
          return { chart };
        } catch (err) {
          logError('Chart tool failed; returning degraded chart result', err);
          const error = createBranchError(
            'chart',
            'CHART_TOOL_ERROR',
            'Chart generation failed',
          );
          return { errors: [error] };
        }
      })(),
    ]);
    return {
      rag: ragUpdate.rag,
      chart: chartUpdate.chart,
      errors: [...(ragUpdate.errors ?? []), ...(chartUpdate.errors ?? [])],
    };
  }

  function formatNode(state: AgentState): Partial<AgentState> {
    const data = buildDataReferences(state);
    return { data };
  }

  const graph = new StateGraph(AgentStateAnnotation)
    .addNode('classify', classifyNode)
    .addNode('run_rag', ragNode)
    .addNode('run_chart', chartNode)
    .addNode('run_direct', directNode)
    .addNode('run_hybrid', hybridNode)
    .addNode('format', formatNode)
    .addEdge(START, 'classify')
    .addConditionalEdges('classify', (state: AgentState) => state.label, {
      rag: 'run_rag',
      chart: 'run_chart',
      direct: 'run_direct',
      hybrid: 'run_hybrid',
    })
    .addEdge('run_rag', 'format')
    .addEdge('run_chart', 'format')
    .addEdge('run_direct', 'format')
    .addEdge('run_hybrid', 'format')
    .addEdge('format', END);

  return graph.compile() as CompiledStateGraph<
    AgentState,
    Partial<AgentState>,
    string
  >;
}
