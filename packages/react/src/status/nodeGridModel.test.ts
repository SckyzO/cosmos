import { describe, expect, it } from 'vitest';
import {
  countNodes,
  headerStatuses,
  nodeKey,
  statusesPresent,
  targetIndex,
  verticalTarget,
  visibleGroups,
  type Box,
  type NodeGridGroup,
} from './nodeGridModel';
import type { HealthStatus } from './types';

const group = (id: string, statuses: HealthStatus[]): NodeGridGroup => ({
  id,
  label: `Room ${id}`,
  nodes: statuses.map((status, index) => ({ id: `${id}${index}`, status })),
});

const GROUPS = [
  group('a', ['OK', 'CRIT', 'OK', 'WARN']),
  group('b', ['OK', 'OK']),
  group('c', ['UNKNOWN', 'INFO', 'CRIT']),
];

describe('countNodes', () => {
  it('counts every status across the groups', () => {
    expect(countNodes(GROUPS)).toEqual({ OK: 4, WARN: 1, CRIT: 2, UNKNOWN: 1, INFO: 1 });
  });

  it('counts nothing for no groups, and for a group with no nodes', () => {
    const zero = { OK: 0, WARN: 0, CRIT: 0, UNKNOWN: 0, INFO: 0 };
    expect(countNodes([])).toEqual(zero);
    expect(countNodes([group('a', [])])).toEqual(zero);
  });
});

describe('visibleGroups', () => {
  it('keeps every group and node for all, as given', () => {
    expect(visibleGroups(GROUPS, 'all')).toBe(GROUPS);
  });

  it('keeps the nodes that are not OK for alerting, info and unknown included, in order', () => {
    const shown = visibleGroups(GROUPS, 'alerting');
    expect(shown.map((g) => g.nodes.map((n) => n.id))).toEqual([
      ['a1', 'a3'],
      ['c0', 'c1', 'c2'],
    ]);
  });

  it('drops a group with no node left, and answers nothing when every node is OK', () => {
    expect(visibleGroups(GROUPS, 'alerting').map((g) => g.id)).toEqual(['a', 'c']);
    expect(visibleGroups([group('a', ['OK', 'OK'])], 'alerting')).toEqual([]);
  });

  it('leaves the given groups alone', () => {
    const before = JSON.stringify(GROUPS);
    visibleGroups(GROUPS, 'alerting');
    expect(JSON.stringify(GROUPS)).toBe(before);
  });
});

describe('statusesPresent', () => {
  it('lists the statuses in use, worst first', () => {
    expect(statusesPresent(GROUPS)).toEqual(['CRIT', 'WARN', 'UNKNOWN', 'INFO', 'OK']);
    expect(statusesPresent([group('a', ['OK', 'WARN', 'OK'])])).toEqual(['WARN', 'OK']);
    expect(statusesPresent([])).toEqual([]);
  });
});

describe('headerStatuses', () => {
  it('shows critical and warning only above 0, and OK always', () => {
    expect(headerStatuses({ OK: 0, WARN: 0, CRIT: 0, UNKNOWN: 0, INFO: 0 })).toEqual(['OK']);
    expect(headerStatuses({ OK: 77, WARN: 19, CRIT: 40, UNKNOWN: 0, INFO: 0 })).toEqual([
      'CRIT',
      'WARN',
      'OK',
    ]);
    expect(headerStatuses({ OK: 3, WARN: 0, CRIT: 1, UNKNOWN: 2, INFO: 1 })).toEqual([
      'CRIT',
      'UNKNOWN',
      'INFO',
      'OK',
    ]);
  });
});

describe('nodeKey', () => {
  it('tells two nodes of one id apart across groups, and cannot be forged by an id', () => {
    expect(nodeKey('a', 'n1')).not.toBe(nodeKey('b', 'n1'));
    expect(nodeKey('a', 'b,n1')).not.toBe(nodeKey('a,b', 'n1'));
  });
});

// A grid of 16px marks, 4px apart, `perRow` to a row, from (0, 0): index = row * perRow + column.
const gridBoxes = (count: number, perRow: number, rtl = false): Box[] =>
  Array.from({ length: count }, (_, index) => {
    const column = index % perRow;
    return {
      top: Math.floor(index / perRow) * 20,
      left: rtl ? (perRow - 1 - column) * 20 : column * 20,
      width: 16,
      height: 16,
    };
  });

describe('verticalTarget', () => {
  it('goes to the mark below and above, in the same column', () => {
    const boxes = gridBoxes(12, 4);
    expect(verticalTarget(boxes, 1, 1)).toBe(5);
    expect(verticalTarget(boxes, 5, 1)).toBe(9);
    expect(verticalTarget(boxes, 9, -1)).toBe(5);
  });

  it('stays still past the first and the last row', () => {
    const boxes = gridBoxes(12, 4);
    expect(verticalTarget(boxes, 2, -1)).toBeUndefined();
    expect(verticalTarget(boxes, 10, 1)).toBeUndefined();
  });

  it('lands on the nearest column when the next row is shorter', () => {
    // 10 marks, 4 to a row: the last row holds columns 0 and 1 only.
    const boxes = gridBoxes(10, 4);
    expect(verticalTarget(boxes, 7, 1)).toBe(9);
    expect(verticalTarget(boxes, 6, 1)).toBe(9);
    expect(verticalTarget(boxes, 4, 1)).toBe(8);
  });

  it('reads the columns from the boxes, whatever the direction the row is laid out in', () => {
    // Right to left: the first mark of a row is at the right.
    const boxes = gridBoxes(8, 4, true);
    expect(boxes[0]!.left).toBeGreaterThan(boxes[3]!.left);
    expect(verticalTarget(boxes, 0, 1)).toBe(4);
    expect(verticalTarget(boxes, 3, 1)).toBe(7);
  });

  it('crosses from one grid to the next, over the label between them', () => {
    // Two grids, the second starting 40px lower than where a row would: a label sits between.
    const first = gridBoxes(6, 3);
    const second = gridBoxes(3, 3).map((box) => ({ ...box, top: box.top + 60 }));
    const boxes = [...first, ...second];
    expect(verticalTarget(boxes, 4, 1)).toBe(7);
    expect(verticalTarget(boxes, 7, -1)).toBe(4);
  });

  it('breaks a tie toward the earlier mark in reading order', () => {
    // The origin sits half way between two marks of the row below.
    const boxes: Box[] = [
      { top: 0, left: 10, width: 16, height: 16 },
      { top: 20, left: 0, width: 16, height: 16 },
      { top: 20, left: 20, width: 16, height: 16 },
    ];
    expect(verticalTarget(boxes, 0, 1)).toBe(1);
  });

  it('answers nothing for a mark that does not exist', () => {
    expect(verticalTarget([], 0, 1)).toBeUndefined();
  });
});

describe('targetIndex', () => {
  const none = () => {
    throw new Error('the boxes are only read for ArrowUp and ArrowDown');
  };

  it('moves along the line with the arrows, without reading a box', () => {
    expect(targetIndex('ArrowRight', 3, 10, 'ltr', none)).toBe(4);
    expect(targetIndex('ArrowLeft', 3, 10, 'ltr', none)).toBe(2);
  });

  it('swaps the arrows along the line in right to left', () => {
    expect(targetIndex('ArrowLeft', 3, 10, 'rtl', none)).toBe(4);
    expect(targetIndex('ArrowRight', 3, 10, 'rtl', none)).toBe(2);
  });

  it('stops at the ends of the grid', () => {
    expect(targetIndex('ArrowRight', 9, 10, 'ltr', none)).toBe(9);
    expect(targetIndex('ArrowLeft', 0, 10, 'ltr', none)).toBe(0);
    expect(targetIndex('ArrowLeft', 9, 10, 'rtl', none)).toBe(9);
  });

  it('goes to the first and the last mark of the whole grid with Home and End', () => {
    expect(targetIndex('Home', 6, 10, 'ltr', none)).toBe(0);
    expect(targetIndex('End', 6, 10, 'rtl', none)).toBe(9);
  });

  it('follows the visual column with ArrowUp and ArrowDown, and stops at the first and last row', () => {
    const boxes = gridBoxes(8, 4);
    expect(targetIndex('ArrowDown', 1, 8, 'ltr', () => boxes)).toBe(5);
    expect(targetIndex('ArrowUp', 5, 8, 'rtl', () => boxes)).toBe(1);
    expect(targetIndex('ArrowUp', 1, 8, 'ltr', () => boxes)).toBe(1);
    expect(targetIndex('ArrowDown', 5, 8, 'ltr', () => boxes)).toBe(5);
  });

  it('does not handle the other keys', () => {
    for (const key of ['Enter', ' ', 'Tab', 'a', 'PageDown', 'Escape']) {
      expect(targetIndex(key, 1, 10, 'ltr', none)).toBeUndefined();
    }
  });
});
