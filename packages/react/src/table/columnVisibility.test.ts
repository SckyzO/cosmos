import { describe, expect, it } from 'vitest';
import { canToggleColumn, resolveColumnVisibility } from './columnVisibility';
import type { ColumnDef } from './types';

const col = (key: string, extra: Partial<ColumnDef<unknown>> = {}): ColumnDef<unknown> => ({
  key,
  label: key,
  render: () => null,
  ...extra,
});

const columns = [
  col('name', { hideable: false }),
  col('email'),
  col('role', { defaultHidden: true }),
];
const keys = (visible: ColumnDef<unknown>[]) => visible.map((c) => c.key);

describe('resolveColumnVisibility', () => {
  it('follows defaultHidden for a column with no entry', () => {
    const { visible, shown } = resolveColumnVisibility(columns, {});
    expect(keys(visible)).toEqual(['name', 'email']);
    expect(shown).toEqual({ name: true, email: true, role: false });
  });

  it('lets an entry override defaultHidden, both ways', () => {
    const { visible } = resolveColumnVisibility(columns, { email: false, role: true });
    expect(keys(visible)).toEqual(['name', 'role']);
  });

  it('keeps a hideable: false column shown whatever the entry says', () => {
    const { visible } = resolveColumnVisibility(columns, { name: false });
    expect(keys(visible)).toContain('name');
  });

  it('shows every column when the entries would hide them all', () => {
    const cols = [col('a'), col('b')];
    const { visible, shown } = resolveColumnVisibility(cols, { a: false, b: false });
    expect(keys(visible)).toEqual(['a', 'b']);
    expect(shown).toEqual({ a: true, b: true });
  });
});

describe('canToggleColumn', () => {
  it('refuses a hideable: false column', () => {
    const { shown } = resolveColumnVisibility(columns, {});
    expect(canToggleColumn(columns, shown, 'name')).toBe(false);
  });

  it('refuses to hide the last shown column, and allows showing a hidden one', () => {
    const cols = [col('a'), col('b', { defaultHidden: true })];
    const { shown } = resolveColumnVisibility(cols, {});
    expect(canToggleColumn(cols, shown, 'a')).toBe(false);
    expect(canToggleColumn(cols, shown, 'b')).toBe(true);
  });

  it('allows hiding a column while another stays shown', () => {
    const { shown } = resolveColumnVisibility(columns, {});
    expect(canToggleColumn(columns, shown, 'email')).toBe(true);
  });

  it('refuses an unknown key', () => {
    const { shown } = resolveColumnVisibility(columns, {});
    expect(canToggleColumn(columns, shown, 'nope')).toBe(false);
  });
});
