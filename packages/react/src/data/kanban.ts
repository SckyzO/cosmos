import type { ReactNode } from 'react';
import type { Intent } from '../ui/intent';

// The data and the pure logic behind `KanbanBoard`: where a card is, what a move produces, what
// is announced. Nothing here reads the DOM or the drag library.

export type KanbanCard = {
  /** Stable key of the card, unique across the whole board. */
  id: string;
  title: string;
  description?: ReactNode;
  /** Under the description: normally a few `<Tag>`s. */
  badges?: ReactNode;
  /** At the foot of the card: normally an `<AvatarGroup>` and a due date. */
  footer?: ReactNode;
};

export type KanbanColumn = {
  /** Stable key of the column, unique across the whole board. */
  id: string;
  title: string;
  cards: KanbanCard[];
  /** Color of the dot before the title. Default `neutral`. */
  intent?: Intent;
  /** Shown in place of the cards when there are none. Default `No cards`. */
  empty?: ReactNode;
};

export type KanbanMove = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  /** Position in the column the card lands in, from 0. */
  index: number;
};

// The drag library tells a card from a column by id, so the two get a prefix: a card and a column
// with the same id never collide, and the ids the library hands back are told apart at a glance.
const CARD_PREFIX = 'card:';
const COLUMN_PREFIX = 'column:';

export const cardKey = (cardId: string) => `${CARD_PREFIX}${cardId}`;
export const columnKey = (columnId: string) => `${COLUMN_PREFIX}${columnId}`;

/** The card id behind a key the drag library handed back, or `undefined` for anything else. */
export const cardIdOf = (key: unknown): string | undefined =>
  typeof key === 'string' && key.startsWith(CARD_PREFIX)
    ? key.slice(CARD_PREFIX.length)
    : undefined;

export type CardPosition = {
  columnId: string;
  columnTitle: string;
  /** From 0. */
  index: number;
  /** Cards in the column. */
  size: number;
};

export const findCard = (columns: readonly KanbanColumn[], cardId: string) => {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { column, index, card: column.cards[index] };
  }
  return undefined;
};

export const cardPosition = (
  columns: readonly KanbanColumn[],
  cardId: string
): (CardPosition & { title: string }) | undefined => {
  const found = findCard(columns, cardId);
  if (!found) return undefined;
  const { column, index, card } = found;
  return {
    title: card.title,
    columnId: column.id,
    columnTitle: column.title,
    index,
    size: column.cards.length,
  };
};

/**
 * The board with the card moved to `index` of the column `toColumnId` (counted once the card has
 * left its place, so moving down one step is `index + 1`). `index` is clamped to the column. The
 * same array comes back when the card is already there, or when the card or the column is unknown.
 */
export const moveCard = (
  columns: KanbanColumn[],
  cardId: string,
  toColumnId: string,
  index: number
): KanbanColumn[] => {
  const found = findCard(columns, cardId);
  if (!found || !columns.some((column) => column.id === toColumnId)) return columns;
  const without = columns.map((column) =>
    column === found.column
      ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
      : column
  );
  const target = without.find((column) => column.id === toColumnId) as KanbanColumn;
  const at = Math.max(0, Math.min(Math.trunc(index), target.cards.length));
  if (found.column.id === toColumnId && at === found.index) return columns;
  const cards = [...target.cards.slice(0, at), found.card, ...target.cards.slice(at)];
  return without.map((column) => (column === target ? { ...column, cards } : column));
};

/** What moved the card from `before` to `after`, or `undefined` when it stayed where it was. */
export const describeMove = (
  before: readonly KanbanColumn[],
  after: readonly KanbanColumn[],
  cardId: string
): KanbanMove | undefined => {
  const from = findCard(before, cardId);
  const to = findCard(after, cardId);
  if (!from || !to) return undefined;
  if (from.column.id === to.column.id && from.index === to.index) return undefined;
  return {
    cardId,
    fromColumnId: from.column.id,
    toColumnId: to.column.id,
    index: to.index,
  };
};

// ── The drag library's shape ─────────────────────────────────────────────────

/** The board as the drag library's `move` reads it: the card keys of each column, by column key. */
export const toGroups = (columns: readonly KanbanColumn[]): Record<string, string[]> =>
  Object.fromEntries(
    columns.map((column) => [columnKey(column.id), column.cards.map((card) => cardKey(card.id))])
  );

/**
 * The board with the order `groups` describes. A column whose cards did not change keeps its
 * object, so React skips it.
 */
export const applyGroups = (
  columns: KanbanColumn[],
  groups: Record<string, string[]>
): KanbanColumn[] => {
  const byId = new Map(columns.flatMap((column) => column.cards.map((card) => [card.id, card])));
  return columns.map((column) => {
    const keys = groups[columnKey(column.id)];
    if (!keys) return column;
    const cards = keys.flatMap((key) => {
      const card = byId.get(cardIdOf(key) ?? '');
      return card ? [card] : [];
    });
    return cards.length === column.cards.length &&
      cards.every((card, i) => card === column.cards[i])
      ? column
      : { ...column, cards };
  });
};

// ── What is announced ────────────────────────────────────────────────────────

const where = (at: CardPosition) =>
  `Column ${at.columnTitle}, position ${at.index + 1} of ${at.size}.`;

/** On pick up. */
export const announcePickUp = (columns: readonly KanbanColumn[], cardId: string) => {
  const at = cardPosition(columns, cardId);
  return at && `Picked up ${at.title}. ${where(at)}`;
};

/** On each move: the new column and position. */
export const announceMove = (columns: readonly KanbanColumn[], cardId: string) => {
  const at = cardPosition(columns, cardId);
  return at && where(at);
};

/** On drop, and after a move from the card's menu. */
export const announceDrop = (columns: readonly KanbanColumn[], cardId: string) => {
  const at = cardPosition(columns, cardId);
  return at && `${at.title} dropped in ${at.columnTitle}, position ${at.index + 1} of ${at.size}.`;
};

/** On cancel: `columns` is the board before the pick up. */
export const announceCancel = (columns: readonly KanbanColumn[], cardId: string) => {
  const at = cardPosition(columns, cardId);
  return (
    at &&
    `Move cancelled. ${at.title} is back in ${at.columnTitle}, position ${at.index + 1} of ${at.size}.`
  );
};
