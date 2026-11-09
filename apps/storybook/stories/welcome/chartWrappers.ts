// The chart wrappers @sckyzo/cosmos-charts exports, counted from its sources: a new wrapper counts
// once it is exported, with no list to update.
import chartsIndex from '../../../../packages/charts/src/index.ts?raw';
import { chartWrappersOf } from './catalog';

export const CHART_WRAPPERS = chartWrappersOf(chartsIndex).length;
