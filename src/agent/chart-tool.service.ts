import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChartToolConfig } from './chart.types';

export const ChartType = z.enum(['bar', 'line', 'pie', 'doughnut']);

export const CHART_TOOL_INPUT_SCHEMA = z.object({
  type: ChartType,
  title: z.string().trim().min(1).max(120).optional(),
});

export type ChartToolInput = z.infer<typeof CHART_TOOL_INPUT_SCHEMA>;

export interface ChartToolError {
  code: 'INVALID_CHART_INPUT';
  message: string;
}

@Injectable()
export class ChartToolService {
  private readonly labelsByType: Readonly<Record<z.infer<typeof ChartType>, string[]>> = {
    bar: ['Q1', 'Q2', 'Q3', 'Q4'],
    line: ['Jan', 'Feb', 'Mar', 'Apr'],
    pie: ['Product A', 'Product B', 'Product C', 'Product D'],
    doughnut: ['North', 'South', 'East', 'West'],
  };

  private readonly dataByType: Readonly<Record<z.infer<typeof ChartType>, number[]>> = {
    bar: [42, 55, 38, 61],
    line: [12, 19, 7, 15],
    pie: [28, 22, 30, 20],
    doughnut: [35, 25, 18, 22],
  };

  private readonly colorsByType: Readonly<
    Record<z.infer<typeof ChartType>, string[]>
  > = {
    bar: ['#2563EB', '#0EA5E9', '#14B8A6', '#22C55E'],
    line: ['#60A5FA', '#34D399', '#FBBF24', '#F87171'],
    pie: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
    doughnut: ['#6366F1', '#06B6D4', '#84CC16', '#F97316'],
  };

  readonly tool = tool(
    (input: ChartToolInput): string => this.generateConfig(input),
    {
      name: 'generate_chart_config',
      description:
        'Generate a mocked Chart.js configuration JSON string for bar, line, pie, or doughnut charts.',
      schema: CHART_TOOL_INPUT_SCHEMA,
    },
  );

  generateConfig(input: ChartToolInput): string {
    const parsed = CHART_TOOL_INPUT_SCHEMA.safeParse(input);

    if (!parsed.success) {
      const error: ChartToolError = {
        code: 'INVALID_CHART_INPUT',
        message: parsed.error.issues.map((issue) => issue.message).join('; '),
      };
      throw Object.assign(new Error(error.message), error);
    }

    const { type, title } = parsed.data;
    const labels = this.labelsByType[type];
    const data = this.dataByType[type];
    const backgroundColor = this.colorsByType[type];

    const config: ChartToolConfig = {
      type,
      data: {
        labels: [...labels],
        datasets: [
          {
            label: title ?? `Mock ${type} chart`,
            data: [...data],
            backgroundColor: [...backgroundColor],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: title ?? `Mock ${type} chart`,
          },
        },
      },
    };

    return JSON.stringify(config);
  }
}
