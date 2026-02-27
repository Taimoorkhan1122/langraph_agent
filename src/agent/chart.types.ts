export type ChartTypeLiteral = 'bar' | 'line' | 'pie' | 'doughnut';

export interface ChartToolDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
}

export interface ChartToolConfig {
  type: ChartTypeLiteral;
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
