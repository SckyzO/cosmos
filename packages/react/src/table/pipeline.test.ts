import { afterEach, describe, expect, it, vi } from 'vitest';
import { columnFilterValues, filterRows, filtersToRecord, searchRows, sortRows } from './pipeline';
import type { ColumnDef } from './types';

type Person = {
  id: number;
  name: string;
  role: string;
  team: string;
  age: number | null;
  email: string;
};

const person = (id: number, name: string, role: string, team: string, age: number | null) => ({
  id,
  name,
  role,
  team,
  age,
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
});

const ada = person(1, 'Ada Lovelace', 'Engineer', 'Core', 36);
const grace = person(2, 'Grace Hopper', 'Admiral', 'Navy', 85);
const linus = person(3, 'Linus Torvalds', 'Engineer', 'Kernel', 54);
const margaret = person(4, 'Margaret Hamilton', 'Director', 'Core', 88);
const people = [ada, grace, linus, margaret];

const render = (p: Person) => p.name;

const columns: ColumnDef<Person>[] = [
  // Searched on its own text, not on its filter value.
  { key: 'name', label: 'Name', render, sortValue: (p) => p.name, searchValue: (p) => p.email },
  {
    key: 'role',
    label: 'Role',
    render,
    filterable: true,
    filterValue: (p) => p.role,
    sortValue: (p) => p.role,
  },
  { key: 'team', label: 'Team', render, filterable: true, filterValue: (p) => p.team },
  { key: 'age', label: 'Age', render, sortValue: (p) => p.age },
  // Neither searched, filtered nor sorted.
  { key: 'actions', label: '', render },
];

const ids = (rows: Person[]) => rows.map((p) => p.id);

describe('columnFilterValues', () => {
  it('has an entry for each filterable column and no other', () => {
    expect(Object.keys(columnFilterValues(people, columns)).sort()).toEqual(['role', 'team']);
  });

  it('lists the values present, unique and sorted', () => {
    const values = columnFilterValues(people, columns);
    expect(values.role).toEqual(['Admiral', 'Director', 'Engineer']);
    expect(values.team).toEqual(['Core', 'Kernel', 'Navy']);
  });

  it('leaves out empty values', () => {
    const rows = [ada, { ...grace, role: '' }];
    expect(columnFilterValues(rows, columns).role).toEqual(['Engineer']);
  });

  it('follows the rows it is given, so a filtered-out value disappears', () => {
    expect(columnFilterValues([ada, linus], columns).team).toEqual(['Core', 'Kernel']);
  });

  it('gives no values for no rows, and for a filterable column without filterValue', () => {
    expect(columnFilterValues([], columns)).toEqual({ role: [], team: [] });
    const bare: ColumnDef<Person>[] = [{ key: 'role', label: 'Role', render, filterable: true }];
    expect(columnFilterValues(people, bare)).toEqual({ role: [] });
  });

  it('offers filterOptions as given, in place of the values of the rows', () => {
    const withOptions: ColumnDef<Person>[] = [
      { ...columns[1], filterOptions: ['Director', 'Admiral', 'Intern'] },
      columns[2],
    ];
    const values = columnFilterValues([ada], withOptions);
    // Their own order, not sorted, and a value no row has.
    expect(values.role).toEqual(['Director', 'Admiral', 'Intern']);
    // A column without them still reads the rows.
    expect(values.team).toEqual(['Core']);
  });

  it('offers filterOptions with no rows at all, as a server page can be empty', () => {
    const withOptions: ColumnDef<Person>[] = [{ ...columns[1], filterOptions: ['Engineer'] }];
    expect(columnFilterValues([], withOptions)).toEqual({ role: ['Engineer'] });
  });

  it('ignores filterOptions on a column that is not filterable', () => {
    const off: ColumnDef<Person>[] = [{ ...columns[1], filterable: false, filterOptions: ['x'] }];
    expect(columnFilterValues(people, off)).toEqual({});
  });
});

describe('searchRows', () => {
  it('returns every row for an empty or blank search', () => {
    expect(searchRows(people, columns, '')).toEqual(people);
    expect(searchRows(people, columns, '   ')).toEqual(people);
  });

  it('matches a substring, ignoring case', () => {
    expect(ids(searchRows(people, columns, 'GRACE'))).toEqual([2]);
    expect(ids(searchRows(people, columns, 'amilt'))).toEqual([4]);
  });

  it('ignores the spaces around the search', () => {
    expect(ids(searchRows(people, columns, '  grace  '))).toEqual([2]);
  });

  it('matches in any searchable column', () => {
    expect(ids(searchRows(people, columns, 'engineer'))).toEqual([1, 3]);
    expect(ids(searchRows(people, columns, 'kernel'))).toEqual([3]);
  });

  it('reads searchValue before filterValue', () => {
    const both: ColumnDef<Person>[] = [
      {
        key: 'role',
        label: 'Role',
        render,
        filterValue: (p) => p.role,
        searchValue: (p) => p.name,
      },
    ];
    expect(ids(searchRows(people, both, 'ada'))).toEqual([1]);
    expect(searchRows(people, both, 'engineer')).toEqual([]);
  });

  it('falls back to filterValue for a column without searchValue', () => {
    const filterOnly: ColumnDef<Person>[] = [
      { key: 'role', label: 'Role', render, filterValue: (p) => p.role },
    ];
    expect(ids(searchRows(people, filterOnly, 'director'))).toEqual([4]);
  });

  it('never matches through a column with neither', () => {
    const none: ColumnDef<Person>[] = [{ key: 'actions', label: '', render }];
    expect(searchRows(people, none, 'a')).toEqual([]);
  });

  it('returns no row when nothing matches', () => {
    expect(searchRows(people, columns, 'zzz')).toEqual([]);
  });

  it('does not touch the rows it is given', () => {
    const rows = [...people];
    searchRows(rows, columns, 'ada');
    expect(rows).toEqual(people);
  });
});

describe('filterRows', () => {
  const only = (key: string, ...values: string[]) => ({ [key]: new Set(values) });

  it('returns every row when there is no filter', () => {
    expect(filterRows(people, columns, {})).toEqual(people);
  });

  it('filters nothing for a column with an empty selection', () => {
    expect(filterRows(people, columns, { role: new Set<string>() })).toEqual(people);
  });

  it('keeps the rows whose value is selected', () => {
    expect(ids(filterRows(people, columns, only('role', 'Engineer')))).toEqual([1, 3]);
  });

  it('keeps a row matching any of the selected values of a column', () => {
    expect(ids(filterRows(people, columns, only('role', 'Admiral', 'Director')))).toEqual([2, 4]);
  });

  it('keeps a row only if it matches every column that has a selection', () => {
    const filters = { ...only('role', 'Engineer', 'Director'), ...only('team', 'Core') };
    expect(ids(filterRows(people, columns, filters))).toEqual([1, 4]);
  });

  it('returns no row when the selections exclude them all', () => {
    const filters = { ...only('role', 'Admiral'), ...only('team', 'Core') };
    expect(filterRows(people, columns, filters)).toEqual([]);
  });

  it('keeps the order of the rows', () => {
    expect(
      ids(filterRows([margaret, ada, linus], columns, only('team', 'Core', 'Kernel')))
    ).toEqual([4, 1, 3]);
  });

  it('ignores a selection for a column that does not exist', () => {
    expect(filterRows(people, columns, only('nope', 'x'))).toEqual(people);
  });

  it('does not touch the rows it is given', () => {
    const rows = [...people];
    filterRows(rows, columns, only('role', 'Engineer'));
    expect(rows).toEqual(people);
  });
});

describe('sortRows', () => {
  it('keeps the rows as they are without a sort key', () => {
    expect(ids(sortRows(people, columns, null, 'asc'))).toEqual([1, 2, 3, 4]);
    expect(ids(sortRows(people, columns, null, 'desc'))).toEqual([1, 2, 3, 4]);
  });

  it('keeps the rows as they are for an unknown column or one without sortValue', () => {
    expect(ids(sortRows(people, columns, 'nope', 'desc'))).toEqual([1, 2, 3, 4]);
    expect(ids(sortRows(people, columns, 'team', 'desc'))).toEqual([1, 2, 3, 4]);
  });

  it('sorts strings ascending and descending', () => {
    expect(ids(sortRows(people, columns, 'name', 'asc'))).toEqual([1, 2, 3, 4]);
    expect(ids(sortRows(people, columns, 'name', 'desc'))).toEqual([4, 3, 2, 1]);
  });

  it('sorts numbers as numbers, not as text', () => {
    const rows = [person(1, 'a', 'x', 'x', 100), person(2, 'b', 'x', 'x', 9)];
    expect(ids(sortRows(rows, columns, 'age', 'asc'))).toEqual([2, 1]);
    expect(ids(sortRows(rows, columns, 'age', 'desc'))).toEqual([1, 2]);
  });

  it('sorts by the column asked for', () => {
    expect(ids(sortRows(people, columns, 'age', 'desc'))).toEqual([4, 2, 3, 1]);
  });

  it('puts a null value last, ascending or descending', () => {
    const rows = [person(10, 'Unknown', 'x', 'x', null), ada, linus, grace];
    expect(ids(sortRows(rows, columns, 'age', 'asc'))).toEqual([1, 3, 2, 10]);
    expect(ids(sortRows(rows, columns, 'age', 'desc'))).toEqual([2, 3, 1, 10]);
  });

  it('keeps rows with an empty value in their original order, last in both directions', () => {
    const unknown = (id: number) => person(id, `Unknown ${id}`, 'x', 'x', null);
    const rows = [unknown(10), ada, unknown(11), grace, unknown(12)];
    expect(ids(sortRows(rows, columns, 'age', 'asc'))).toEqual([1, 2, 10, 11, 12]);
    expect(ids(sortRows(rows, columns, 'age', 'desc'))).toEqual([2, 1, 10, 11, 12]);
  });

  describe('comparator', () => {
    // The engine decides how it calls the comparator, so a wrong answer for a
    // pair it never asks about goes unseen: capture the comparator and judge
    // it on every pair.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const captureComparator = (rows: Person[], sortKey: string, sortDir: 'asc' | 'desc') => {
      const sort = Array.prototype.sort;
      let compare: ((a: Person, b: Person) => number) | undefined;
      vi.spyOn(Array.prototype, 'sort').mockImplementation(function (
        this: unknown[],
        fn?: (a: unknown, b: unknown) => number
      ) {
        compare = fn;
        return sort.call(this, fn);
      });
      sortRows(rows, columns, sortKey, sortDir);
      if (!compare) throw new Error('sortRows did not sort with a comparator');
      return compare;
    };

    const unknown = (id: number) => person(id, `Unknown ${id}`, 'x', 'x', null);

    it.each(['asc', 'desc'] as const)('finds two empty values equal, %s', (dir) => {
      const rows = [unknown(10), unknown(11), ada];
      const compare = captureComparator(rows, 'age', dir);
      expect(compare(rows[0], rows[1])).toBe(0);
      expect(compare(rows[1], rows[0])).toBe(0);
      expect(compare(rows[0], rows[0])).toBe(0);
    });

    it.each(['asc', 'desc'] as const)('is antisymmetric on every pair, %s', (dir) => {
      const rows = [unknown(10), unknown(11), ada, grace, person(12, 'Newborn', 'x', 'x', 0)];
      const compare = captureComparator(rows, 'age', dir);
      for (const a of rows) {
        for (const b of rows) {
          expect(Math.sign(compare(a, b)) + Math.sign(compare(b, a))).toBe(0);
        }
      }
    });
  });

  it('treats 0 as a value, not as a missing one', () => {
    const rows = [ada, person(10, 'Newborn', 'x', 'x', 0)];
    expect(ids(sortRows(rows, columns, 'age', 'asc'))).toEqual([10, 1]);
    expect(ids(sortRows(rows, columns, 'age', 'desc'))).toEqual([1, 10]);
  });

  it('keeps rows with equal values in their original order, in both directions', () => {
    // Engineer: ada (1) and linus (3); Admiral: grace (2); Director: margaret (4).
    expect(ids(sortRows(people, columns, 'role', 'asc'))).toEqual([2, 4, 1, 3]);
    expect(ids(sortRows(people, columns, 'role', 'desc'))).toEqual([1, 3, 4, 2]);
  });

  it('returns a sorted copy and leaves the rows it is given in place', () => {
    const rows = [linus, ada];
    const sorted = sortRows(rows, columns, 'name', 'asc');
    expect(sorted).not.toBe(rows);
    expect(ids(sorted)).toEqual([1, 3]);
    expect(ids(rows)).toEqual([3, 1]);
  });
});

describe('filtersToRecord', () => {
  it('turns the sets into sorted arrays', () => {
    expect(
      filtersToRecord({ role: new Set(['Ops', 'Engineer']), team: new Set(['Core']) })
    ).toEqual({
      role: ['Engineer', 'Ops'],
      team: ['Core'],
    });
  });

  it('leaves out a column with nothing selected', () => {
    expect(filtersToRecord({ role: new Set(), team: new Set(['Core']) })).toEqual({
      team: ['Core'],
    });
    expect(filtersToRecord({})).toEqual({});
  });
});
