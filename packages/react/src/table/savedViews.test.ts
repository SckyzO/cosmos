import { describe, expect, it } from 'vitest';
import {
  newViewId,
  recordToFilters,
  viewMatches,
  viewNameError,
  type ViewState,
} from './savedViews';
import type { ColumnDef, DataTableView } from './types';

const col = (key: string, extra: Partial<ColumnDef<unknown>> = {}): ColumnDef<unknown> => ({
  key,
  label: key,
  render: () => null,
  ...extra,
});
const columns = [col('name'), col('role'), col('team', { defaultHidden: true })];

const state: ViewState = {
  search: 'ada',
  filters: { role: ['Engineer', 'Ops'] },
  sort: { key: 'name', direction: 'asc' },
  columnVisibility: { name: true, role: true, team: false },
  pageSize: 10,
  density: 'default',
};
const view = (extra: Partial<DataTableView> = {}): DataTableView => ({
  id: 'v1',
  name: 'Engineers',
  ...state,
  ...extra,
});

describe('viewMatches', () => {
  it('matches the state the view was saved from', () => {
    expect(viewMatches(view(), state, columns)).toBe(true);
  });

  it.each<[string, Partial<ViewState>]>([
    ['search', { search: 'grace' }],
    ['filters', { filters: { role: ['Engineer'] } }],
    ['a filter on another column', { filters: { role: ['Engineer', 'Ops'], team: ['Core'] } }],
    ['sort key', { sort: { key: 'role', direction: 'asc' } }],
    ['sort direction', { sort: { key: 'name', direction: 'desc' } }],
    ['no sort', { sort: null }],
    ['visibility', { columnVisibility: { name: true, role: false, team: false } }],
    ['page size', { pageSize: 25 }],
    ['show all', { pageSize: 'all' }],
    ['density', { density: 'comfortable' }],
  ])('does not match after a change of %s', (_what, change) => {
    expect(viewMatches(view(), { ...state, ...change }, columns)).toBe(false);
  });

  it('ignores the order of the filter values and a column with none selected', () => {
    const current = { ...state, filters: { role: ['Ops', 'Engineer'], team: [] } };
    expect(viewMatches(view(), current, columns)).toBe(true);
  });

  it('reads a column the view leaves out as its default', () => {
    const saved = view({ columnVisibility: { name: true, role: true } });
    expect(viewMatches(saved, state, columns)).toBe(true);
    expect(
      viewMatches(
        saved,
        { ...state, columnVisibility: { name: true, role: true, team: true } },
        columns
      )
    ).toBe(false);
  });
});

describe('recordToFilters', () => {
  it('builds the sets and drops an empty column', () => {
    expect(recordToFilters({ role: ['Ops'], team: [] })).toEqual({ role: new Set(['Ops']) });
  });
});

describe('viewNameError', () => {
  const views = [view({ id: 'a', name: 'Engineers' }), view({ id: 'b', name: 'Ops' })];
  it('refuses an empty name', () => {
    expect(viewNameError('   ', views)).toMatch(/name/i);
  });
  it('refuses a name another view has, ignoring case and spaces', () => {
    expect(viewNameError(' engineers ', views)).toMatch(/already/i);
  });
  it('accepts the name of the view being renamed', () => {
    expect(viewNameError('Engineers', views, 'a')).toBeNull();
  });
  it('accepts a new name', () => {
    expect(viewNameError('Managers', views)).toBeNull();
  });
});

describe('newViewId', () => {
  it('gives an id no view has, even called twice in the same millisecond', () => {
    const first = newViewId([]);
    const second = newViewId([view({ id: first })]);
    const third = newViewId([view({ id: first }), view({ id: second })]);
    expect(new Set([first, second, third]).size).toBe(3);
  });
});
