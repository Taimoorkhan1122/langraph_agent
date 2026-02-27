import { z } from 'zod';
import {
  CHART_TOOL_INPUT_SCHEMA,
  ChartToolService,
  ChartType,
} from './chart-tool.service';

type ParsedChartConfig = {
  type: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
  options: {
    responsive?: boolean;
    plugins?: {
      title?: { display: boolean; text: string };
    };
  };
};

const parseChartConfig = (raw: string): ParsedChartConfig =>
  JSON.parse(raw) as ParsedChartConfig;

describe('ChartToolService contracts', () => {
  let service: ChartToolService;

  beforeEach(() => {
    service = new ChartToolService();
  });

  it.each(['bar', 'line', 'pie', 'doughnut'] as const)(
    'accepts chart type %s in input schema',
    (type) => {
      const result = CHART_TOOL_INPUT_SCHEMA.safeParse({
        type,
        title: 'Sales by month',
      });

      expect(result.success).toBe(true);
    },
  );

  it('rejects unsupported chart type in input schema', () => {
    const result = CHART_TOOL_INPUT_SCHEMA.safeParse({
      type: 'scatter',
      title: 'Unsupported chart',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(z.ZodError);
    }
  });

  it('returns a serialized chart config JSON string', async () => {
    const output = await service.generateConfig({
      type: ChartType.enum.bar,
      title: 'Quarterly Revenue',
    });

    expect(typeof output).toBe('string');

    const parsed = parseChartConfig(output);

    expect(parsed.type).toBe('bar');
    expect(Array.isArray(parsed.data.labels)).toBe(true);
    expect(Array.isArray(parsed.data.datasets)).toBe(true);
    expect(typeof parsed.options).toBe('object');
  });

  it.each(['bar', 'line', 'pie', 'doughnut'] as const)(
    'generates valid JSON config for %s chart type',
    async (type) => {
      const output = await service.generateConfig({
        type,
        title: `${type} title`,
      });

      const parsed = parseChartConfig(output);

      expect(parsed.type).toBe(type);
      expect(parsed.data.labels.length).toBeGreaterThan(0);
      expect(parsed.data.datasets[0].data.length).toBeGreaterThan(0);
      expect(parsed.data.datasets[0].backgroundColor.length).toBeGreaterThan(0);
      expect(parsed.options.responsive).toBe(true);
      expect(parsed.options.plugins?.title?.text).toBe(`${type} title`);
    },
  );

  it('uses deterministic, type-specific labels and values for bar charts', () => {
    const output = service.generateConfig({ type: 'bar', title: 'bar title' });
    const parsed = parseChartConfig(output);

    expect(parsed.data.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(parsed.data.datasets[0].data).toEqual([42, 55, 38, 61]);
  });

  it('uses deterministic, type-specific labels and values for pie charts', () => {
    const output = service.generateConfig({ type: 'pie', title: 'pie title' });
    const parsed = parseChartConfig(output);

    expect(parsed.data.labels).toEqual([
      'Product A',
      'Product B',
      'Product C',
      'Product D',
    ]);
    expect(parsed.data.datasets[0].data).toEqual([28, 22, 30, 20]);
  });
});
