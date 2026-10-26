import { describe, expect, it } from 'vitest';
import {
  announceCancel,
  announceDrop,
  announceMove,
  announcePickUp,
  applyGroups,
  cardIdOf,
  cardKey,
  cardPosition,
  columnKey,
  describeMove,
  moveCard,
  toGroups,
  type KanbanColumn,
} from './kanban';

const board = (): KanbanColumn[] => [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      { id: 'a', title: 'Audit emails' },
      { id: 'b', title: 'Rate-limit export' },
      { id: 'c', title: 'Legend contrast' },
    ],
  },
  { id: 'doing', title: 'In progress', cards: [{ id: 'd', title: 'SSO' }] },
  { id: 'done', title: 'Done', cards: [] },
];

const ids = (columns: KanbanColumn[]) =>
  Object.fromEntries(columns.map((c) => [c.id, c.cards.map((card) => card.id)]));

describe('cardPosition', () => {
  it('names the column and the place of a card', () => {
    expect(cardPosition(board(), 'b')).toEqual({
      title: 'Rate-limit export',
      columnId: 'todo',
      columnTitle: 'To do',
      index: 1,
      size: 3,
    });
  });

  it('is undefined for an unknown card', () => {
    expect(cardPosition(board(), 'nope')).toBeUndefined();
  });
});

describe('moveCard', () => {
  it('reorders a card inside its column, counting once it has left its place', () => {
    expect(ids(moveCard(board(), 'a', 'todo', 2)).todo).toEqual(['b', 'c', 'a']);
    expect(ids(moveCard(board(), 'c', 'todo', 0)).todo).toEqual(['c', 'a', 'b']);
    expect(ids(moveCard(board(), 'a', 'todo', 1)).todo).toEqual(['b', 'a', 'c']);
  });

  it('moves a card to another column at the given place', () => {
    const next = ids(moveCard(board(), 'b', 'doing', 0));
    expect(next.todo).toEqual(['a', 'c']);
    expect(next.doing).toEqual(['b', 'd']);
  });

  it('fills an empty column', () => {
    expect(ids(moveCard(board(), 'a', 'done', 0)).done).toEqual(['a']);
  });

  it('clamps the index to the column', () => {
    expect(ids(moveCard(board(), 'a', 'doing', 99)).doing).toEqual(['d', 'a']);
    expect(ids(moveCard(board(), 'c', 'doing', -3)).doing).toEqual(['c', 'd']);
  });

  it('returns the same board when the card stays where it is', () => {
    const before = board();
    expect(moveCard(before, 'b', 'todo', 1)).toBe(before);
    expect(moveCard(before, 'c', 'todo', 2)).toBe(before);
  });

  it('returns the same board for an unknown card or column', () => {
    const before = board();
    expect(moveCard(before, 'nope', 'todo', 0)).toBe(before);
    expect(moveCard(before, 'a', 'nope', 0)).toBe(before);
  });

  it('does not touch the board it was given, and keeps the columns it did not change', () => {
    const before = board();
    const next = moveCard(before, 'b', 'doing', 1);
    expect(ids(before).todo).toEqual(['a', 'b', 'c']);
    expect(next[2]).toBe(before[2]);
  });
});

describe('describeMove', () => {
  it('names the card, both columns and where it landed', () => {
    const before = board();
    expect(describeMove(before, moveCard(before, 'b', 'doing', 1), 'b')).toEqual({
      cardId: 'b',
      fromColumnId: 'todo',
      toColumnId: 'doing',
      index: 1,
    });
  });

  it('reports a reorder as a move inside one column', () => {
    const before = board();
    expect(describeMove(before, moveCard(before, 'a', 'todo', 2), 'a')).toEqual({
      cardId: 'a',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      index: 2,
    });
  });

  it('is undefined when the card is back where it started', () => {
    const before = board();
    expect(describeMove(before, board(), 'a')).toBeUndefined();
  });
});

describe('keys', () => {
  it('tells a card from a column that has the same id', () => {
    expect(cardKey('x')).not.toBe(columnKey('x'));
  });

  it('gives back the id of a card key only', () => {
    expect(cardIdOf(cardKey('abc'))).toBe('abc');
    expect(cardIdOf(columnKey('abc'))).toBeUndefined();
    expect(cardIdOf(42)).toBeUndefined();
  });
});

describe('toGroups and applyGroups', () => {
  it('round-trips a board', () => {
    const before = board();
    expect(applyGroups(before, toGroups(before))).toEqual(before);
  });

  it('keeps the object of every column whose cards did not change', () => {
    const before = board();
    const groups = toGroups(before);
    groups[columnKey('todo')] = [cardKey('b'), cardKey('a'), cardKey('c')];
    const next = applyGroups(before, groups);
    expect(ids(next).todo).toEqual(['b', 'a', 'c']);
    expect(next[1]).toBe(before[1]);
    expect(next[2]).toBe(before[2]);
  });

  it('moves a card between columns, with its data', () => {
    const before = board();
    const groups = toGroups(before);
    groups[columnKey('todo')] = [cardKey('a'), cardKey('c')];
    groups[columnKey('done')] = [cardKey('b')];
    const next = applyGroups(before, groups);
    expect(next[2].cards[0]).toBe(before[0].cards[1]);
  });
});

describe('announcements', () => {
  it('says where the card is', () => {
    expect(announcePickUp(board(), 'b')).toBe(
      'Picked up Rate-limit export. Column To do, position 2 of 3.'
    );
    expect(announceMove(moveCard(board(), 'b', 'doing', 0), 'b')).toBe(
      'Column In progress, position 1 of 2.'
    );
    expect(announceDrop(moveCard(board(), 'b', 'doing', 0), 'b')).toBe(
      'Rate-limit export dropped in In progress, position 1 of 2.'
    );
    expect(announceCancel(board(), 'b')).toBe(
      'Move cancelled. Rate-limit export is back in To do, position 2 of 3.'
    );
  });

  it('says nothing for a card that is not on the board', () => {
    expect(announcePickUp(board(), 'nope')).toBeUndefined();
    expect(announceDrop(board(), 'nope')).toBeUndefined();
  });
});
