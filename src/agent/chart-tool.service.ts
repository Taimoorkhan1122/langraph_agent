import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const ChartType = z.enum(['bar', 'line', 'pie', 'doughnut']);

export const CHART_TOOL_INPUT_SCHEMA = z.object({
  type: ChartType,
  title: z.string().trim().min(1).max(120).optional(),
});

export type ChartToolInput = z.infer<typeof CHART_TOOL_INPUT_SCHEMA>;

export interface ChartToolDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
}

export interface ChartToolConfig {
  type: z.infer<typeof ChartType>;
  data: {
    labels: string[];
    datasets: ChartToolDataset[];
  };
  options: {
    responsive: boolean;
    plugins: {
      legend: { position: 'top' | 'bottom' | 'left' | 'right' };
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface ChartToolError {
  code: 'INVALID_CHART_INPUT';
  message: string;
}

@Injectable()
export class ChartToolService {
  private readonly defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr'];
  private readonly defaultData = [12, 19, 7, 15];
  private readonly defaultColors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171'];

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

    const config: ChartToolConfig = {
      type,
      data: {
        labels: [...this.defaultLabels],
        datasets: [
          {
            label: title ?? `Mock ${type} chart`,
            data: [...this.defaultData],
            backgroundColor: [...this.defaultColors],
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
