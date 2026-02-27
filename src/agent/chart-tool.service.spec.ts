import { z } from 'zod';
import {
  CHART_TOOL_INPUT_SCHEMA,
  ChartToolService,
  ChartType,
} from './chart-tool.service';

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

    const parsed = JSON.parse(output) as {
      type: string;
      data: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          backgroundColor: string[];
        }>;
      };
      options: Record<string, unknown>;
    };

    expect(parsed.type).toBe('bar');
    expect(Array.isArray(parsed.data.labels)).toBe(true);
    expect(Array.isArray(parsed.data.datasets)).toBe(true);
    expect(typeof parsed.options).toBe('object');
  });
});
