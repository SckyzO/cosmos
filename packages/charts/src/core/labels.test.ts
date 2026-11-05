import { describe, expect, it } from 'vitest';
import { englishChartLabels } from './labels';
import { definedLabels } from './labelsContext';

describe('englishChartLabels', () => {
  const { chart, calendarChart, treemapChart, worldMap } = englishChartLabels;

  it('writes the texts every chart frame writes', () => {
    expect(chart.empty).toBe('No data');
    expect(chart.loading('CPU usage')).toBe('CPU usage, loading');
    expect(chart.gaugeName('Cluster load', '67%')).toBe('Cluster load: 67%');
  });

  it('names a cell with its row when it has one', () => {
    expect(chart.cellName('web-01', 'Mon', '12')).toBe('web-01, Mon: 12');
    expect(chart.cellName('', 'Monday 6 January', '3')).toBe('Monday 6 January: 3');
  });

  it('names a calendar year and a treemap tile with their group when there is one', () => {
    expect(calendarChart.yearName('Commits', 2025)).toBe('Commits, 2025');
    expect(treemapChart.tile('api', '12', 'Backend')).toBe('Backend, api: 12');
    expect(treemapChart.tile('api', '12', undefined)).toBe('api: 12');
  });

  it('counts the markers and the routes of a map in the plural', () => {
    expect(worldMap.markerCount(1)).toBe('1 marker');
    expect(worldMap.markerCount(12)).toBe('12 markers');
    expect(worldMap.routeCount(1)).toBe('1 route');
    expect(worldMap.routeCount(8)).toBe('8 routes');
  });
});

describe('definedLabels', () => {
  it('drops the keys set to undefined, so they keep the default', () => {
    expect(definedLabels({ empty: undefined, gauge: 'Jauge' })).toEqual({ gauge: 'Jauge' });
  });

  it('keeps an empty string, which draws nothing', () => {
    expect(definedLabels({ empty: '' })).toEqual({ empty: '' });
  });

  it('is empty for no labels', () => {
    expect(definedLabels(undefined)).toEqual({});
  });
});
