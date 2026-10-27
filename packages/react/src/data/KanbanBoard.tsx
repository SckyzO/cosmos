import { CollisionPriority } from '@dnd-kit/abstract';
import { Accessibility, defaultPreset } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider, DragOverlay, useDroppable } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { clsx } from 'clsx';
import { ArrowDown, ArrowUp, Ellipsis, GripVertical, Plus } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useInsertionEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { flushSync } from 'react-dom';
import { Sk } from '../feedback/Skeleton';
import { useControllableState } from '../hooks/useControllableState';
import { useScrollFade } from '../hooks/useScrollFade';
import type { Intent } from '../ui/intent';
import { Menu } from '../ui/Menu';
import { mergeRefs } from '../ui/mergeRefs';
import {
  announceCancel,
  announceDrop,
  announceMove,
  announcePickUp,
  applyGroups,
  cardIdOf,
  cardKey,
  columnKey,
  describeMove,
  findCard,
  moveCard,
  toGroups,
  type KanbanCard,
  type KanbanColumn,
  type KanbanMove,
} from './kanban';

export type { KanbanCard, KanbanColumn, KanbanMove } from './kanban';

export type KanbanBoardProps = {
  /** The board, controlled. Only `undefined` means uncontrolled. */
  value?: KanbanColumn[];
  /** The board to start from while uncontrolled. */
  defaultValue?: KanbanColumn[];
  /**
   * Called with the board to move to, once a card is dropped or moved from its menu. A controlled
   * board shows the move once the host passes the new `value` back; until then the card goes
   * back to its place.
   */
  onChange?: (columns: KanbanColumn[]) => void;
  /**
   * Called after `onChange`, in both modes, with what changed: a server needs the move and not
   * the whole board. Not called when a card is dropped where it was.
   */
  onCardMove?: (move: KanbanMove) => void;
  /**
   * Makes the card's title a button that covers the whole card (not the grip and the actions
   * menu), calling this. Without it the card is not interactive. Ignored with `renderCard`,
   * whose content is yours.
   */
  onCardOpen?: (card: KanbanCard, columnId: string) => void;
  /** Adds an "Add card" button at the foot of each column. The host owns the form. */
  onAddCard?: (columnId: string) => void;
  /**
   * Replaces what is inside the card: the title, description, `badges` and `footer`. The board
   * keeps the card's frame, its grip and its actions menu, so a custom card still moves.
   */
  renderCard?: (card: KanbanCard, columnId: string) => ReactNode;
  /** Shows skeleton columns, as many as `value` has (three when it has none), and sets `aria-busy`. */
  loading?: boolean;
  /** Names the board for assistive technology. Default `Kanban board`. */
  ariaLabel?: string;
  className?: string;
  /** Ref of the board's root element. */
  ref?: Ref<HTMLDivElement>;
};

type Announcements = NonNullable<
  NonNullable<ConstructorParameters<typeof Accessibility>[1]>['announcements']
>;

const NO_COLUMNS: KanbanColumn[] = [];
const SKELETON_COLUMNS = 3;

const DOT: Record<Intent, string> = {
  neutral: 'bg-gray-400 dark:bg-gray-500',
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

// A lane is a tinted well and a card a bordered panel on it. The well is darker than the page in
// the dark themes, so the card, on the panel surface, still stands out.
const LANE = 'flex flex-col gap-2 rounded-2xl bg-gray-100 px-2 pt-2.5 pb-2 dark:bg-white/4';
// Below `sm` a lane is one column wide with the next one peeking; from `sm` it is a fixed 288px.
const LANE_WIDTH = 'w-[85%] max-w-[300px] shrink-0 sm:w-72 sm:max-w-none';

const ICON_BUTTON =
  'focus-visible:focus-indicator relative z-10 flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/10';

type BoardState = { columns: KanbanColumn[]; shown: KanbanColumn[] };

// A value the drag library's callbacks read when they run, kept up to date after each render. Not a
// ref: the plugins are set up while rendering, and only read it later.
const box = <T,>(initial: T) => {
  let value = initial;
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
    },
  };
};

// The drag library's plugins, with the screen reader's words for a card. The announcements read the
// board when they speak, not when they are set up: the plugin outlives a render.
const dragPlugins = (id: string, read: () => BoardState) => {
  const announcements: Announcements = {
    dragstart: ({ operation: { source } }) => {
      const cardId = cardIdOf(source?.id);
      return cardId ? announcePickUp(read().shown, cardId) : undefined;
    },
    dragover: (event) => {
      const cardId = cardIdOf(event.operation.source?.id);
      if (!cardId) return undefined;
      const { shown } = read();
      const groups = toGroups(shown);
      const next = move(groups, event);
      return next === groups ? undefined : announceMove(applyGroups(shown, next), cardId);
    },
    dragend: (event) => {
      const cardId = cardIdOf(event.operation.source?.id);
      if (!cardId) return undefined;
      const { columns, shown } = read();
      return event.canceled ? announceCancel(columns, cardId) : announceDrop(shown, cardId);
    },
  };
  return [
    ...defaultPreset.plugins.filter((plugin) => plugin !== Accessibility),
    Accessibility.configure({
      id,
      // Only the moves are debounced: a run of arrow presses says its last stop.
      debounce: 150,
      screenReaderInstructions: {
        draggable:
          'Press Space or Enter to pick up the card. Use the arrow keys to move it, Space or Enter to drop it, Escape to cancel.',
      },
      announcements,
    }),
  ];
};

// ── Card ─────────────────────────────────────────────────────────────────────

type CardState = 'idle' | 'hole' | 'lifted';

type CardFrameProps = {
  card: KanbanCard;
  columnId: string;
  state: CardState;
  grip: ReactNode;
  actions: ReactNode;
  onOpen?: (card: KanbanCard, columnId: string) => void;
  renderCard?: (card: KanbanCard, columnId: string) => ReactNode;
};

// What a card looks like, in its place and lifted in the drag overlay: the grip and the actions
// are given, real buttons in the first and decoration in the second.
const CardFrame = ({
  card,
  columnId,
  state,
  grip,
  actions,
  onOpen,
  renderCard,
}: CardFrameProps) => {
  const title = onOpen ? (
    <button
      type="button"
      onClick={() => onOpen(card, columnId)}
      // The ::after stretches the button over the whole card, so a click anywhere on it opens the
      // card; the grip and the actions sit above it (`relative z-10`).
      className="focus-visible:after:focus-indicator cursor-pointer text-left text-sm leading-5 font-semibold break-words text-[var(--color-text-primary)] outline-hidden after:absolute after:inset-0 after:rounded-xl"
    >
      {card.title}
    </button>
  ) : (
    <span className="text-sm leading-5 font-semibold break-words text-[var(--color-text-primary)]">
      {card.title}
    </span>
  );
  return (
    <div
      className={clsx(
        'relative flex flex-col gap-2 rounded-xl border px-3 pt-2.5 pb-3',
        state === 'idle' && 'border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-xs',
        // A dashed hole where the card was; its content keeps the size of the slot.
        state === 'hole' &&
          'bg-brand-500/5 outline-brand-500/60 border-transparent outline-2 -outline-offset-1 outline-dashed',
        state === 'lifted' &&
          'border-brand-500 ring-brand-500 rotate-2 bg-[var(--color-bg-panel)] shadow-xl ring-1'
      )}
    >
      {state === 'hole' && (
        // The brand line that says where the card will land: the hole is the drop place.
        <span
          aria-hidden
          className="bg-brand-500 before:bg-brand-500 absolute inset-x-1 -top-[5px] h-0.5 rounded-full before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full"
        />
      )}
      <div className={clsx('flex flex-col gap-2', state === 'hole' && 'opacity-0')}>
        <div className="flex items-start gap-1">
          {grip}
          <div className="min-w-0 flex-1 pt-px">
            {renderCard ? renderCard(card, columnId) : title}
          </div>
          {actions}
        </div>
        {!renderCard && card.description && (
          <p className="m-0 text-[13px] leading-[18px] text-[var(--color-text-secondary)]">
            {card.description}
          </p>
        )}
        {!renderCard && card.badges && <div className="flex flex-wrap gap-1">{card.badges}</div>}
        {!renderCard && card.footer && <div>{card.footer}</div>}
      </div>
    </div>
  );
};

const GRIP_ICON = <GripVertical className="size-4" aria-hidden />;
const ACTIONS_ICON = <Ellipsis className="size-4" aria-hidden />;

type SortableCardProps = {
  card: KanbanCard;
  columnId: string;
  index: number;
  columns: KanbanColumn[];
  onMove: (cardId: string, toColumnId: string, index: number) => void;
  onOpen?: (card: KanbanCard, columnId: string) => void;
  renderCard?: (card: KanbanCard, columnId: string) => ReactNode;
};

const SortableCard = ({
  card,
  columnId,
  index,
  columns,
  onMove,
  onOpen,
  renderCard,
}: SortableCardProps) => {
  const { ref, handleRef, isDragSource } = useSortable({
    id: cardKey(card.id),
    index,
    group: columnKey(columnId),
    type: 'card',
    accept: 'card',
    // The board moves the cards itself, from the drag events, and renders the result: the
    // library's own optimistic reordering of the DOM would fight React over the same nodes.
    plugins: [SortableKeyboardPlugin],
  });
  const column = columns.find((c) => c.id === columnId) as KanbanColumn;
  const others = columns.filter((c) => c.id !== columnId);
  return (
    <li ref={ref} className="m-0 list-none p-0">
      <CardFrame
        card={card}
        columnId={columnId}
        state={isDragSource ? 'hole' : 'idle'}
        onOpen={onOpen}
        renderCard={renderCard}
        grip={
          <button
            type="button"
            ref={handleRef}
            aria-label={`Move card: ${card.title}`}
            // The grip is the only part that starts a drag, and the only one that gives up
            // touch scrolling: the rest of the card keeps scrolling the board.
            className={clsx(
              ICON_BUTTON,
              '-mt-0.5 -ml-1.5 cursor-grab touch-none active:cursor-grabbing'
            )}
          >
            {GRIP_ICON}
          </button>
        }
        actions={
          <Menu align="right">
            <Menu.Trigger
              aria-label={`Card actions: ${card.title}`}
              data-kanban-actions={card.id}
              className={clsx(ICON_BUTTON, '-mt-0.5 -mr-1.5')}
            >
              {ACTIONS_ICON}
            </Menu.Trigger>
            <Menu.Content aria-label={`Actions for ${card.title}`} width="w-52">
              {others.length > 0 && (
                <>
                  <Menu.Group label="Move to">
                    {others.map((other) => (
                      <Menu.Item
                        key={other.id}
                        onSelect={() => onMove(card.id, other.id, other.cards.length)}
                      >
                        {other.title}
                      </Menu.Item>
                    ))}
                  </Menu.Group>
                  <Menu.Separator />
                </>
              )}
              <Menu.Item
                icon={ArrowUp}
                disabled={index === 0}
                onSelect={() => onMove(card.id, columnId, index - 1)}
              >
                Move up
              </Menu.Item>
              <Menu.Item
                icon={ArrowDown}
                disabled={index === column.cards.length - 1}
                onSelect={() => onMove(card.id, columnId, index + 1)}
              >
                Move down
              </Menu.Item>
            </Menu.Content>
          </Menu>
        }
      />
    </li>
  );
};

// ── Lane ─────────────────────────────────────────────────────────────────────

type LaneProps = Omit<SortableCardProps, 'card' | 'index' | 'columnId'> & {
  column: KanbanColumn;
  onAddCard?: (columnId: string) => void;
};

const Lane = ({ column, columns, onMove, onOpen, renderCard, onAddCard }: LaneProps) => {
  const headingId = useId();
  // The whole lane takes a drop, so an empty one, or the space under the last card, does too.
  // Its cards win where they overlap it.
  const { ref, isDropTarget } = useDroppable({
    id: columnKey(column.id),
    type: 'column',
    accept: 'card',
    collisionPriority: CollisionPriority.Low,
  });
  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className={clsx(
        LANE,
        LANE_WIDTH,
        'max-sm:snap-start',
        isDropTarget ? 'ring-brand-500/40 ring-2 ring-inset' : ''
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <span
          aria-hidden
          className={clsx('size-2 shrink-0 rounded-full', DOT[column.intent ?? 'neutral'])}
        />
        <h3
          id={headingId}
          className="m-0 min-w-0 truncate text-[13px] font-semibold text-[var(--color-text-primary)]"
        >
          {column.title}
        </h3>
        <span className="text-2xs rounded-full bg-gray-200 px-1.5 py-px font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
          {column.cards.length}
          <span className="sr-only"> {column.cards.length === 1 ? 'card' : 'cards'}</span>
        </span>
      </div>
      {column.cards.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {column.cards.map((card, index) => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={column.id}
              index={index}
              columns={columns}
              onMove={onMove}
              onOpen={onOpen}
              renderCard={renderCard}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-400">
          {column.empty ?? 'No cards'}
        </div>
      )}
      {onAddCard && (
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          className="focus-visible:focus-indicator py-row-8 flex w-full items-center gap-1.5 rounded-lg px-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
        >
          <Plus className="size-3.5" aria-hidden />
          Add card
          <span className="sr-only"> to {column.title}</span>
        </button>
      )}
    </section>
  );
};

// ── Board ────────────────────────────────────────────────────────────────────

const SKELETON_CARDS = [3, 2, 4];

// The row of lanes, in its own element so that it scrolls sideways, fades where there is more, and
// snaps one lane at a time on a narrow screen.
const Scroller = ({ snap, children }: { snap: boolean; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(ref);
  return (
    <div
      ref={ref}
      style={fade}
      className={clsx(
        // `relative`: the screen-reader-only text inside is absolutely positioned, and with no
        // positioned ancestor in here it would escape the scroll and widen the page.
        'relative flex items-start gap-4 overflow-x-auto pb-2',
        snap && 'max-sm:snap-x max-sm:snap-mandatory'
      )}
    >
      {children}
    </div>
  );
};

const BoardSkeleton = ({ lanes }: { lanes: number }) => (
  <Scroller snap>
    {Array.from({ length: lanes }, (_, lane) => (
      <div key={lane} className={clsx(LANE, LANE_WIDTH)}>
        <div className="flex items-center gap-2 px-1 pb-1">
          <Sk as="span" h="h-2" w="w-2" round="rounded-full" />
          <Sk as="span" h="h-4" w="w-24" round="rounded-md" />
        </div>
        {Array.from({ length: SKELETON_CARDS[lane % SKELETON_CARDS.length] }, (_, card) => (
          <div
            key={card}
            className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3 pt-3 pb-3"
          >
            <Sk h="h-4" w="w-4/5" round="rounded-md" />
            <Sk h="h-3" w="w-full" round="rounded-md" />
            <div className="flex gap-1">
              <Sk h="h-5" w="w-12" round="rounded-md" />
              <Sk h="h-5" w="w-10" round="rounded-md" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </Scroller>
);

/**
 * KanbanBoard — columns of cards that move between columns: a sprint board, a pipeline, a task
 * list by status. Drag a card by its grip with a pointer or a finger; or, from the keyboard,
 * focus the grip, press Space or Enter to pick the card up, the arrow keys to move it, Space or
 * Enter to drop it and Escape to put it back. Every card also has an actions menu with
 * "Move to" the other columns and "Move up / Move down", so the board works without dragging.
 *
 * The board owns no data: `onChange` carries the board to move to and `onCardMove` the move, and
 * the host saves it. Below `sm` the columns scroll sideways, one column wide with the next one
 * peeking.
 */
export const KanbanBoard = ({
  value,
  defaultValue = NO_COLUMNS,
  onChange,
  onCardMove,
  onCardOpen,
  onAddCard,
  renderCard,
  loading = false,
  ariaLabel = 'Kanban board',
  className,
  ref,
}: KanbanBoardProps) => {
  const [columns, setColumns] = useControllableState<KanbanColumn[]>({
    value,
    defaultValue,
    onChange,
    name: 'KanbanBoard.value',
  });
  // The board as the drag shows it, until the card is dropped: the drop is what the host hears of.
  const [draft, setDraft] = useState<KanbanColumn[] | null>(null);
  const [dragging, setDragging] = useState(false);
  // What a move from the actions menu says, for a screen reader: the drag has its own announcements.
  const [note, setNote] = useState('');
  const shown = draft ?? columns;

  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);

  // A holder that outlives the render, for what the drag library's callbacks read when they run.
  const [latest] = useState(() => box<BoardState>({ columns, shown }));
  useInsertionEffect(() => {
    latest.set({ columns, shown });
  });
  const read = latest.get;

  const uid = useId();
  const [plugins] = useState(() => dragPlugins(uid, read));

  const moveFromMenu = useCallback(
    (cardId: string, toColumnId: string, index: number) => {
      const { columns: before } = read();
      const next = moveCard(before, cardId, toColumnId, index);
      const moved = describeMove(before, next, cardId);
      if (!moved) return;
      pendingFocus.current = cardId;
      setNote(announceDrop(next, cardId) ?? '');
      setColumns(next);
      onCardMove?.(moved);
    },
    [read, onCardMove, setColumns]
  );

  // A card that changed column is a new element: put the focus back on its actions button.
  useEffect(() => {
    const cardId = pendingFocus.current;
    if (!cardId) return;
    pendingFocus.current = null;
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-kanban-actions="${CSS.escape(cardId)}"]`)
      ?.focus();
  }, [columns]);

  if (loading) {
    return (
      <div ref={ref} role="group" aria-label={ariaLabel} aria-busy="true" className={className}>
        <BoardSkeleton lanes={columns.length || SKELETON_COLUMNS} />
      </div>
    );
  }

  const lifted = (key: unknown) => {
    const found = findCard(shown, cardIdOf(key) ?? '');
    return found && { card: found.card, columnId: found.column.id };
  };

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      role="group"
      aria-label={ariaLabel}
      className={clsx('max-w-full', className)}
    >
      <DragDropProvider
        plugins={plugins}
        onDragStart={(event) => {
          if (event.operation.source?.type !== 'card') return;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (event.operation.source?.type !== 'card') return;
          // The library runs this inside a transition and, a render later, reads the card's new
          // group and index to go on: a slow render lets the next key, or the drop, see the board
          // as it was. Rendering the move now keeps the board in step with the drag.
          flushSync(() =>
            setDraft((current) => {
              const base = current ?? columns;
              const groups = toGroups(base);
              const next = move(groups, event);
              return next === groups ? base : applyGroups(base, next);
            })
          );
        }}
        onDragEnd={(event) => {
          const { source } = event.operation;
          if (source?.type !== 'card') return;
          const dropped = read().shown;
          setDragging(false);
          setDraft(null);
          const cardId = cardIdOf(source.id);
          if (event.canceled || !cardId) return;
          const moved = describeMove(columns, dropped, cardId);
          if (!moved) return;
          setColumns(dropped);
          onCardMove?.(moved);
        }}
      >
        {/* The snap would fight the auto-scroll of a drag. */}
        <Scroller snap={!dragging}>
          {shown.map((column) => (
            <Lane
              key={column.id}
              column={column}
              columns={shown}
              onMove={moveFromMenu}
              onOpen={onCardOpen}
              renderCard={renderCard}
              onAddCard={onAddCard}
            />
          ))}
        </Scroller>
        <DragOverlay>
          {(source) => {
            const at = lifted(source.id);
            if (!at) return null;
            return (
              <CardFrame
                card={at.card}
                columnId={at.columnId}
                state="lifted"
                renderCard={renderCard}
                grip={
                  <span
                    aria-hidden
                    className={clsx(
                      ICON_BUTTON,
                      'text-brand-600 dark:text-brand-400 -mt-0.5 -ml-1.5'
                    )}
                  >
                    {GRIP_ICON}
                  </span>
                }
                actions={
                  <span aria-hidden className={clsx(ICON_BUTTON, '-mt-0.5 -mr-1.5')}>
                    {ACTIONS_ICON}
                  </span>
                }
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>
      <div role="status" aria-live="polite" className="sr-only">
        {note}
      </div>
    </div>
  );
};
