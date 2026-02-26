/**
 * Stub Chart.js configuration generator (EPIC-002 / US-004).
 * Returns a valid (but empty) Chart.js v3 configuration object.
 * Real chart generation is out of scope for this track.
 */

import { ChartResult } from './agent.interfaces';

/**
 * Generates a stub Chart.js bar chart configuration.
 * Suitable for `chart` and `hybrid` classification paths.
 *
 * @param query - The original user query (used for chart title).
 * @returns A minimal `ChartResult` compatible with Chart.js v3 `ChartConfiguration`.
 */
export function generateStubChart(query: string): ChartResult {
  return {
    type: 'bar',
    data: {
      labels: ['Sample A', 'Sample B', 'Sample C'],
      datasets: [
        {
          label: `Data for: ${query.slice(0, 50)}`,
          data: [0, 0, 0],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Chart (stub – real integration pending)',
        },
      },
    },
  };
}
