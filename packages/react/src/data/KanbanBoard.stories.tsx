import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, Flag } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  keyToEnd,
  mobileViewport,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { AvatarGroup } from '../ui/AvatarGroup';
import { Drawer } from '../ui/Drawer';
import { Tag } from '../ui/Tag';
import { KanbanBoard, type KanbanCard, type KanbanColumn, type KanbanMove } from './KanbanBoard';

const meta = {
  title: 'Data/Kanban Board',
  component: KanbanBoard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { ariaLabel: 'Sprint board' },
} satisfies Meta<typeof KanbanBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Data ─────────────────────────────────────────────────────────────────────

const people = (...names: string[]) => (
  <AvatarGroup size="xs" aria-label="Assignees" avatars={names.map((name) => ({ name }))} />
);

const due = (date: string, late = false) => (
  <span
    className={
      late
        ? 'flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400'
        : 'flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]'
    }
  >
    <CalendarDays className="size-3.5" aria-hidden />
    {date}
  </span>
);

const foot = (assignees: string[], date?: string, late?: boolean) => (
  <div className="flex items-center justify-between gap-2">
    {people(...assignees)}
    {date && due(date, late)}
  </div>
);

// The sprint of the design mockups. A function, so that a story never shares a board with another.
const sprint = (): KanbanColumn[] => [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      {
        id: 'billing-emails',
        title: 'Audit the billing emails',
        description: 'Check the dunning sequence against the new plans.',
        badges: (
          <>
            <Tag size="sm" intent="info">
              Billing
            </Tag>
            <Tag size="sm">Copy</Tag>
          </>
        ),
        footer: foot(['Ana Costa'], 'Oct 30'),
      },
      {
        id: 'export-rate-limit',
        title: 'Rate-limit the export API',
        badges: (
          <Tag size="sm" intent="brand">
            API
          </Tag>
        ),
        footer: foot(['Marcus Bell', 'Jade Dupont'], 'Nov 2'),
      },
      {
        id: 'legend-contrast',
        title: 'Legend contrast in dark mode',
        badges: (
          <Tag size="sm" intent="danger">
            Design
          </Tag>
        ),
        footer: foot(['Lena Fischer']),
      },
      {
        id: 'onboarding',
        title: 'Onboarding checklist v2',
        badges: (
          <Tag size="sm" intent="success">
            Growth
          </Tag>
        ),
      },
    ],
  },
  {
    id: 'doing',
    title: 'In progress',
    intent: 'brand',
    cards: [
      {
        id: 'sso',
        title: 'SSO for enterprise',
        description: 'SAML first, then OIDC.',
        badges: (
          <>
            <Tag size="sm" intent="warning">
              Auth
            </Tag>
            <Tag size="sm">Security</Tag>
          </>
        ),
        footer: foot(['Ana Costa', 'Jade Dupont', 'Marcus Bell'], 'Today', true),
      },
      {
        id: 'invoice-pdf',
        title: 'Invoice PDF layout',
        badges: (
          <Tag size="sm" intent="info">
            Billing
          </Tag>
        ),
        footer: foot(['Lena Fischer'], 'Nov 5'),
      },
      {
        id: 'pipeline-stages',
        title: 'Pipeline stages strip',
        badges: (
          <Tag size="sm" intent="brand">
            UI
          </Tag>
        ),
        footer: foot(['Marcus Bell']),
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    intent: 'warning',
    cards: [
      {
        id: 'webhook-retries',
        title: 'Webhook retries',
        description: 'Exponential backoff, capped at six tries.',
        badges: (
          <Tag size="sm" intent="brand">
            API
          </Tag>
        ),
        footer: foot(['Jade Dupont'], 'Oct 29'),
      },
      {
        id: 'status-tabs',
        title: 'Status tabs on the table',
        badges: (
          <Tag size="sm" intent="brand">
            UI
          </Tag>
        ),
        footer: foot(['Marcus Bell', 'Lena Fischer']),
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    intent: 'success',
    cards: [
      {
        id: 'tag',
        title: 'Tag component',
        badges: (
          <Tag size="sm" intent="brand">
            UI
          </Tag>
        ),
        footer: foot(['Marcus Bell']),
      },
      {
        id: 'avatar-group',
        title: 'AvatarGroup',
        badges: (
          <Tag size="sm" intent="brand">
            UI
          </Tag>
        ),
        footer: foot(['Lena Fischer']),
      },
    ],
  },
];

// ── Display ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { defaultValue: sprint() },
};

/**
 * With `value` and `onChange` the host owns the board: a card moves once the host passes the new
 * board back. `onCardMove` carries the move on its own, which is what a server needs.
 */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState(sprint);
    const [last, setLast] = useState<KanbanMove>();
    return (
      // One `minmax(0, 1fr)` column: an `auto` one grows to the whole board, which then
      // overflows the page instead of scrolling inside its frame.
      <div className="grid grid-cols-1 gap-4">
        <KanbanBoard {...args} value={value} onChange={setValue} onCardMove={setLast} />
        <p
          aria-live="polite"
          data-testid="last-move"
          className="m-0 text-sm text-[var(--color-text-secondary)]"
        >
          {last
            ? `Last move: ${last.cardId} from ${last.fromColumnId} to ${last.toColumnId}, position ${last.index + 1}.`
            : 'Move a card to see its move here.'}
        </p>
      </div>
    );
  },
};

/** A column with no cards still takes a drop, and shows `empty` in place of "No cards". */
export const EmptyColumn: Story = {
  args: {
    defaultValue: [
      ...sprint().slice(0, 2),
      { id: 'review', title: 'Review', intent: 'warning', cards: [] },
      {
        id: 'done',
        title: 'Done',
        intent: 'success',
        cards: [],
        empty: 'Nothing shipped yet. Drop a finished card here.',
      },
    ],
  },
};

/** `onAddCard` adds an "Add card" button at the foot of every column; the host owns the form. */
export const WithAddCard: Story = {
  args: { defaultValue: sprint(), onAddCard: fn() },
};

const Compact = ({ card }: { card: KanbanCard }) => (
  <div className="flex items-center gap-2">
    <Flag className="text-brand-600 dark:text-brand-400 size-3.5 shrink-0" aria-hidden />
    <span className="text-sm font-medium text-[var(--color-text-primary)]">{card.title}</span>
  </div>
);

/**
 * `renderCard` replaces what is inside the card. The board keeps the frame, the grip and the
 * actions menu, so the card still moves.
 */
export const WithCustomCard: Story = {
  args: {
    defaultValue: sprint(),
    renderCard: (card) => <Compact card={card} />,
  },
};

/** `loading` shows skeleton columns, as many as the board has (three when it has none). */
export const Loading: Story = {
  args: { loading: true, defaultValue: sprint() },
};

/** `onCardOpen` makes the whole card open something: here, a `Drawer` with its details. */
export const WithDetailDrawer: Story = {
  parameters: portalDocsParams.lg(),
  render: (args) => {
    const [open, setOpen] = useState<KanbanCard>();
    return (
      <>
        <KanbanBoard {...args} onCardOpen={(card) => setOpen(card)} />
        <Drawer open={Boolean(open)} onClose={() => setOpen(undefined)}>
          <Drawer.Header title={open?.title ?? ''} />
          <Drawer.Body>
            <div className="grid gap-3 text-sm text-[var(--color-text-secondary)]">
              {open?.description && <p className="m-0">{open.description}</p>}
              {open?.badges && <div className="flex flex-wrap gap-1">{open.badges}</div>}
              {open?.footer}
            </div>
          </Drawer.Body>
        </Drawer>
      </>
    );
  },
  args: { defaultValue: sprint() },
};

/**
 * Below `sm` the board scrolls sideways in its own container: one column wide, the next one
 * peeking, snapping on touch. A card still drags to the next column.
 */
export const OnNarrowScreen: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  args: { defaultValue: sprint() },
};

export const OnNarrowScreenChecks: Story = {
  ...OnNarrowScreen,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const todo = canvas.getByRole('region', { name: 'To do' });
    const doing = canvas.getByRole('region', { name: 'In progress' });
    const scroller = todo.parentElement as HTMLElement;
    // One column wide, at most 300px, with the next column peeking in.
    expect(todo.getBoundingClientRect().width).toBeLessThanOrEqual(300);
    expect(todo.getBoundingClientRect().width).toBeGreaterThan(window.innerWidth * 0.6);
    // The next column peeks in: its near edge is on the screen, its far edge past the screen's
    // end (the left one in right to left, where the board starts on the right).
    const next = doing.getBoundingClientRect();
    const rtl = getComputedStyle(scroller).direction === 'rtl';
    expect(rtl ? window.innerWidth - next.right : next.left).toBeLessThan(window.innerWidth);
    expect(rtl ? window.innerWidth - next.left : next.right).toBeGreaterThan(window.innerWidth);
    // The board scrolls, the page does not, and the snap is on.
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expect(getComputedStyle(scroller).overflowX).toBe('auto');
    expect(getComputedStyle(scroller).scrollSnapType).toContain('mandatory');
    expect(getComputedStyle(todo).scrollSnapAlign).toContain('start');
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

type Canvas = ReturnType<typeof within>;

const TITLES = {
  billing: 'Audit the billing emails',
  export: 'Rate-limit the export API',
  legend: 'Legend contrast in dark mode',
  sso: 'SSO for enterprise',
  invoice: 'Invoice PDF layout',
  webhook: 'Webhook retries',
} as const;

const gripOf = (canvas: Canvas, title: string) =>
  canvas.getByRole('button', { name: `Move card: ${title}` });

const actionsOf = (canvas: Canvas, title: string) =>
  canvas.getByRole('button', { name: `Card actions: ${title}` });

/** The titles of a column, top to bottom, read from the grips. */
// Read from the DOM, not by role: during a drag the library hides the card in its new place
// (`visibility: hidden`, the overlay shows it), which a role query leaves out.
const titlesIn = (canvas: Canvas, column: string) =>
  Array.from(
    (canvas.getByRole('region', { name: column }) as HTMLElement).querySelectorAll<HTMLElement>(
      '[aria-label^="Move card: "]'
    )
  ).map((grip) => (grip.getAttribute('aria-label') ?? '').replace('Move card: ', ''));

/** The live region of the board that owns `grip`: the plugin names it after the grip's description. */
const announcement = (grip: HTMLElement) =>
  document.getElementById(
    (grip.getAttribute('aria-describedby') ?? '').replace(
      'dnd-kit-description',
      'dnd-kit-announcement'
    )
  )?.textContent;

const keys = (sequence: string) => userEvent.keyboard(sequence);

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Picks a card up from its grip and waits until an arrow key can move it. The keyboard sensor
 * ignores arrows until the library has measured the lifted card, in a ResizeObserver callback that
 * also sets its `--dnd-*` position: in a busy parallel run that callback comes late.
 */
const pickUp = async (grip: HTMLElement) => {
  await waitFor(() => expect(grip).toHaveAttribute('aria-describedby'));
  grip.focus();
  await keys('[Space]');
  await waitFor(() => expect(announcement(grip)).toMatch(/^Picked up /));
  await waitFor(
    () =>
      expect(document.querySelector('[data-dnd-dragging]')?.getAttribute('style') ?? '').toMatch(
        /--dnd-top/
      ),
    { timeout: 10_000 }
  );
};

const settle = async (frames = 6) => {
  for (let i = 0; i < frames; i += 1) await frame();
};

const centerOf = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/**
 * Drags with a pointer: press on `grip`, move to `to` in a few steps, release. The drag library
 * takes the pointer with `setPointerCapture`, which throws for the made-up pointer of a test, so
 * it is stubbed for the length of the drag; everything else is its own sensor reading real events.
 */
const dragTo = async (grip: HTMLElement, to: { x: number; y: number }, { drop = true } = {}) => {
  const body = document.body;
  const capture = body.setPointerCapture;
  body.setPointerCapture = () => {};
  const event = (point: { x: number; y: number }, buttons: number) => ({
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons,
    clientX: point.x,
    clientY: point.y,
  });
  try {
    const from = centerOf(grip);
    grip.dispatchEvent(new PointerEvent('pointerdown', event(from, 1)));
    await settle();
    const steps = 8;
    for (let step = 1; step <= steps; step += 1) {
      const point = {
        x: from.x + ((to.x - from.x) * step) / steps,
        y: from.y + ((to.y - from.y) * step) / steps,
      };
      document.dispatchEvent(new PointerEvent('pointermove', event(point, 1)));
      await settle(3);
    }
    await settle();
    if (drop) document.dispatchEvent(new PointerEvent('pointerup', event(to, 0)));
    await settle(10);
  } finally {
    body.setPointerCapture = capture;
  }
};

const board = (canvas: Canvas) => ({
  todo: titlesIn(canvas, 'To do'),
  doing: titlesIn(canvas, 'In progress'),
  review: titlesIn(canvas, 'Review'),
  done: titlesIn(canvas, 'Done'),
});

const calls = (callback: unknown) => (callback as ReturnType<typeof fn>).mock.calls;
const orderOf = (callback: unknown) =>
  (callback as ReturnType<typeof fn>).mock.invocationCallOrder[0];

const SPRINT_ORDER = {
  todo: [TITLES.billing, TITLES.export, TITLES.legend, 'Onboarding checklist v2'],
  doing: [TITLES.sso, TITLES.invoice, 'Pipeline stages strip'],
  review: [TITLES.webhook, 'Status tabs on the table'],
  done: ['Tag component', 'AvatarGroup'],
};

/** The pointer drops the card on the lower half of another one: it takes the place below it. */
export const DragWithinAColumn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const legend = canvas.getByText(TITLES.legend).closest('li') as HTMLElement;
    const rect = legend.getBoundingClientRect();
    await dragTo(gripOf(canvas, TITLES.billing), {
      x: rect.left + rect.width / 2,
      y: rect.bottom - 6,
    });
    await waitFor(() =>
      expect(titlesIn(canvas, 'To do')).toEqual([
        TITLES.export,
        TITLES.legend,
        TITLES.billing,
        'Onboarding checklist v2',
      ])
    );
    expect(calls(args.onChange)).toHaveLength(1);
    expect(calls(args.onChange)[0][0][0].cards.map((c: KanbanCard) => c.id)).toEqual([
      'export-rate-limit',
      'legend-contrast',
      'billing-emails',
      'onboarding',
    ]);
    expect(calls(args.onCardMove)).toEqual([
      [{ cardId: 'billing-emails', fromColumnId: 'todo', toColumnId: 'todo', index: 2 }],
    ]);
    // onChange first, then onCardMove.
    expect(orderOf(args.onChange)).toBeLessThan(orderOf(args.onCardMove));
  },
};

/** Dropped on the upper half of a card in another column, the card takes its place. */
export const DragAcrossColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const sso = canvas.getByText(TITLES.sso).closest('li') as HTMLElement;
    const rect = sso.getBoundingClientRect();
    await dragTo(gripOf(canvas, TITLES.billing), {
      x: rect.left + rect.width / 2,
      y: rect.top + 6,
    });
    await waitFor(() =>
      expect(board(canvas)).toEqual({
        ...SPRINT_ORDER,
        todo: SPRINT_ORDER.todo.slice(1),
        doing: [TITLES.billing, ...SPRINT_ORDER.doing],
      })
    );
    expect(calls(args.onChange)).toHaveLength(1);
    expect(calls(args.onCardMove)).toEqual([
      [{ cardId: 'billing-emails', fromColumnId: 'todo', toColumnId: 'doing', index: 0 }],
    ]);
    expect(orderOf(args.onChange)).toBeLessThan(orderOf(args.onCardMove));
  },
};

/** An empty column takes a drop anywhere on its lane. */
export const DragIntoAnEmptyColumn: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue: [...sprint().slice(0, 2), { id: 'review', title: 'Review', cards: [] }],
    onChange: fn(),
    onCardMove: fn(),
  },
  play: async ({ canvas, args }) => {
    const lane = canvas.getByRole('region', { name: 'Review' });
    expect(within(lane).getByText('No cards')).toBeVisible();
    await dragTo(gripOf(canvas, TITLES.sso), centerOf(lane));
    await waitFor(() => expect(titlesIn(canvas, 'Review')).toEqual([TITLES.sso]));
    expect(canvas.getByRole('region', { name: 'Review' })).not.toHaveTextContent('No cards');
    expect(calls(args.onCardMove)).toEqual([
      [{ cardId: 'sso', fromColumnId: 'doing', toColumnId: 'review', index: 0 }],
    ]);
  },
};

/** Dropped where it started, a card moves nothing and tells nobody. */
export const DragBackToTheSamePlace: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const grip = gripOf(canvas, TITLES.export);
    const start = centerOf(grip);
    await dragTo(grip, { x: start.x + 12, y: start.y + 2 });
    expect(board(canvas)).toEqual(SPRINT_ORDER);
    expect(calls(args.onChange)).toHaveLength(0);
    expect(calls(args.onCardMove)).toHaveLength(0);
  },
};

/** Only the grip starts a drag: pressing the card itself and moving does nothing. */
export const OnlyTheGripStartsADrag: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn(), onCardOpen: fn() },
  play: async ({ canvas, args }) => {
    const title = canvas.getByRole('button', { name: TITLES.billing });
    const sso = centerOf(canvas.getByText(TITLES.sso));
    await dragTo(title, sso);
    expect(board(canvas)).toEqual(SPRINT_ORDER);
    expect(calls(args.onChange)).toHaveLength(0);
    // Touch scrolling is given up on the grip only.
    expect(getComputedStyle(gripOf(canvas, TITLES.billing)).touchAction).toBe('none');
    expect(getComputedStyle(title).touchAction).not.toBe('none');
  },
};

/** While a card is dragged it is lifted in the overlay and leaves a dashed hole in its slot. */
export const LiftedCardAndHole: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    const sso = canvas.getByText(TITLES.sso).closest('li') as HTMLElement;
    const rect = sso.getBoundingClientRect();
    await dragTo(
      gripOf(canvas, TITLES.billing),
      { x: rect.left + 40, y: rect.top + 6 },
      { drop: false }
    );
    const overlay = document.querySelector<HTMLElement>('[data-dnd-overlay]') as HTMLElement;
    await waitFor(() => expect(within(overlay).getByText(TITLES.billing)).toBeVisible());
    const lifted = within(overlay)
      .getByText(TITLES.billing)
      .closest('div[class*="rounded-xl"]') as HTMLElement;
    expect(getComputedStyle(lifted).rotate).toBe('2deg');
    expect(getComputedStyle(lifted).boxShadow).not.toBe('none');
    // The slot, where the card will land, is a dashed hole with its content hidden.
    const slot = Array.from(document.querySelectorAll<HTMLElement>('li > div')).find(
      (frame) => getComputedStyle(frame).outlineStyle === 'dashed'
    );
    expect(slot).toBeDefined();
    document.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })
    );
    await settle(10);
  },
};

/** Space picks the card up, the arrows move it down and across, Space drops it: one change. */
export const KeyboardPickUpMoveAndDrop: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const grip = gripOf(canvas, TITLES.billing);
    await userEvent.tab();
    await pickUp(grip);
    await keys('{ArrowDown}');
    await waitFor(() =>
      expect(titlesIn(canvas, 'To do').slice(0, 2)).toEqual([TITLES.export, TITLES.billing])
    );
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    // Nothing is reported until the drop.
    expect(calls(args.onChange)).toHaveLength(0);
    await keys('[Space]');
    await waitFor(() => expect(calls(args.onCardMove)).toHaveLength(1));
    expect(calls(args.onChange)).toHaveLength(1);
    expect(calls(args.onCardMove)[0][0]).toMatchObject({
      cardId: 'billing-emails',
      fromColumnId: 'todo',
      toColumnId: 'doing',
    });
    expect(board(canvas).todo).toEqual(SPRINT_ORDER.todo.slice(1));
    expect(board(canvas).doing).toContain(TITLES.billing);
    // The focus is back on the grip, which is a new element in the new column.
    await waitFor(() => expect(gripOf(canvas, TITLES.billing)).toHaveFocus());
  },
};

/** Enter picks up and drops as well, and the arrows reach an empty column. */
export const KeyboardEnterAndEmptyColumn: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue: [...sprint().slice(0, 2), { id: 'review', title: 'Review', cards: [] }],
    onCardMove: fn(),
  },
  play: async ({ canvas, args }) => {
    gripOf(canvas, TITLES.sso).focus();
    await keys('{Enter}');
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'Review')).toEqual([TITLES.sso]));
    await keys('{Enter}');
    await waitFor(() =>
      expect(calls(args.onCardMove)).toEqual([
        [{ cardId: 'sso', fromColumnId: 'doing', toColumnId: 'review', index: 0 }],
      ])
    );
  },
};

/** Escape puts the card back where it was, and nothing is reported. */
export const KeyboardCancel: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const grip = gripOf(canvas, TITLES.billing);
    await pickUp(grip);
    await keys('{ArrowDown}');
    // Each move lands before the next key: the sensor measures the card again after it.
    await waitFor(() => expect(titlesIn(canvas, 'To do').indexOf(TITLES.billing)).toBe(1));
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await keys('{Escape}');
    await waitFor(() => expect(board(canvas)).toEqual(SPRINT_ORDER));
    expect(calls(args.onChange)).toHaveLength(0);
    expect(calls(args.onCardMove)).toHaveLength(0);
    await waitFor(() => expect(gripOf(canvas, TITLES.billing)).toHaveFocus());
  },
};

// A board that takes its time to render: the work of a slow device, made on purpose.
const spin = (ms: number) => {
  const end = performance.now() + ms;
  while (performance.now() < end);
};

/**
 * The drop lands where the card was last moved, even when the board has not rendered that move yet:
 * on a slow device the next key can arrive before the render of the previous one. The keys are sent
 * back to back on purpose, as a fast typist would on such a device; what the test waits for is what
 * the user would, the card in its new column.
 */
export const KeyboardDropDoesNotWaitForTheRender: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue: sprint(),
    onCardMove: fn(),
    renderCard: (card) => {
      spin(15);
      return <span className="text-sm font-semibold">{card.title}</span>;
    },
  },
  play: async ({ canvas, args }) => {
    await pickUp(gripOf(canvas, TITLES.billing));
    await keys(`{${keyToEnd()}}[Space]`);
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await waitFor(() => expect(calls(args.onCardMove)).toHaveLength(1));
    expect(calls(args.onCardMove)[0][0]).toMatchObject({
      cardId: 'billing-emails',
      fromColumnId: 'todo',
      toColumnId: 'doing',
    });
  },
};

/** The live region says where the card is on pick up, on each move, on drop and on cancel. */
export const AnnouncesPickUpMoveDropAndCancel: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    const grip = gripOf(canvas, TITLES.export);
    await waitFor(() => expect(grip).toHaveAttribute('aria-describedby'));
    const region = document.getElementById(
      (grip.getAttribute('aria-describedby') ?? '').replace(
        'dnd-kit-description',
        'dnd-kit-announcement'
      )
    ) as HTMLElement;
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    grip.focus();
    await keys('[Space]');
    await waitFor(() =>
      expect(announcement(grip)).toBe(`Picked up ${TITLES.export}. Column To do, position 2 of 4.`)
    );
    await keys('{ArrowDown}');
    await waitFor(() => expect(announcement(grip)).toBe('Column To do, position 3 of 4.'));
    await keys(`{${keyToEnd()}}`);
    await waitFor(() =>
      expect(announcement(grip)).toMatch(/^Column In progress, position \d of 4\.$/)
    );
    await keys('[Space]');
    await waitFor(() =>
      expect(announcement(grip)).toMatch(
        new RegExp(`^${TITLES.export} dropped in In progress, position \\d of 4\\.$`)
      )
    );
    // And a cancel, from the card's new place, once the drop has settled.
    const moved = gripOf(canvas, TITLES.export);
    const place = titlesIn(canvas, 'In progress').indexOf(TITLES.export) + 1;
    await waitFor(() => expect(moved).toHaveFocus());
    await waitFor(() => expect(document.querySelector('[data-dnd-overlay]')).toBeEmptyDOMElement());
    await pickUp(moved);
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'Review')).toContain(TITLES.export));
    await keys('{Escape}');
    await waitFor(() =>
      expect(announcement(moved)).toBe(
        `Move cancelled. ${TITLES.export} is back in In progress, position ${place} of 4.`
      )
    );
  },
};

/** The grip is named after its card, and is a button for the keyboard and for assistive technology. */
export const GripIsNamedAndFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    const grips = canvas.getAllByRole('button', { name: /^Move card: / });
    expect(grips).toHaveLength(11);
    const grip = gripOf(canvas, TITLES.sso);
    await expectFocusRing(grip);
    await waitFor(() => expect(grip).toHaveAttribute('aria-roledescription', 'draggable'));
    expect(document.getElementById(grip.getAttribute('aria-describedby') ?? '')).toHaveTextContent(
      /Press Space or Enter to pick up the card/
    );
    // 24px at least, a touch target.
    expect(grip.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(grip.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  },
};

const menu = () => within(document.body).getByRole('menu');

/** "Move to" sends the card to the end of another column, and the focus follows it. */
export const MoveToMenuAcrossColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(actionsOf(canvas, TITLES.billing));
    const items = within(menu());
    // The other columns, not the card's own.
    expect(items.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'In progress',
      'Review',
      'Done',
      'Move up',
      'Move down',
    ]);
    expect(items.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
    await userEvent.click(items.getByRole('menuitem', { name: 'In progress' }));
    await waitFor(() =>
      expect(board(canvas)).toEqual({
        ...SPRINT_ORDER,
        todo: SPRINT_ORDER.todo.slice(1),
        doing: [...SPRINT_ORDER.doing, TITLES.billing],
      })
    );
    expect(calls(args.onChange)).toHaveLength(1);
    expect(calls(args.onCardMove)).toEqual([
      [{ cardId: 'billing-emails', fromColumnId: 'todo', toColumnId: 'doing', index: 3 }],
    ]);
    expect(orderOf(args.onChange)).toBeLessThan(orderOf(args.onCardMove));
    await waitFor(() => expect(actionsOf(canvas, TITLES.billing)).toHaveFocus());
  },
};

/** "Move up" and "Move down" step a card through its column, and stop at its ends. */
export const MoveUpAndDownMenu: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(actionsOf(canvas, TITLES.export));
    await userEvent.click(within(menu()).getByRole('menuitem', { name: 'Move down' }));
    await waitFor(() =>
      expect(titlesIn(canvas, 'To do').slice(0, 3)).toEqual([
        TITLES.billing,
        TITLES.legend,
        TITLES.export,
      ])
    );
    await waitFor(() => expect(actionsOf(canvas, TITLES.export)).toHaveFocus());
    await userEvent.click(actionsOf(canvas, TITLES.export));
    await userEvent.click(within(menu()).getByRole('menuitem', { name: 'Move up' }));
    await waitFor(() => expect(titlesIn(canvas, 'To do')).toEqual(SPRINT_ORDER.todo));
    expect(calls(args.onCardMove).map(([move]) => move)).toEqual([
      { cardId: 'export-rate-limit', fromColumnId: 'todo', toColumnId: 'todo', index: 2 },
      { cardId: 'export-rate-limit', fromColumnId: 'todo', toColumnId: 'todo', index: 1 },
    ]);
    expect(calls(args.onChange)).toHaveLength(2);
    // The ends of a column have nowhere to go.
    await userEvent.click(actionsOf(canvas, 'Onboarding checklist v2'));
    expect(within(menu()).getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
  },
};

/** A move from the menu is announced, since it has no drag to announce it. */
export const MenuMoveIsAnnounced: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    await userEvent.click(actionsOf(canvas, TITLES.sso));
    await userEvent.click(within(menu()).getByRole('menuitem', { name: 'Done' }));
    const region = canvas.getAllByRole('status').find((el) => el.className.includes('sr-only'));
    await waitFor(() =>
      expect(region).toHaveTextContent(`${TITLES.sso} dropped in Done, position 3 of 3.`)
    );
  },
};

/** The title is a button that covers the card when `onCardOpen` is set, and a click does not drag. */
export const OpensTheCardOnClick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onCardOpen: fn(), onChange: fn() },
  play: async ({ canvas, args }) => {
    const open = canvas.getByRole('button', { name: TITLES.billing });
    // Anywhere on the card but the grip and the actions menu lands on that button.
    const description = canvas.getByText('Check the dunning sequence against the new plans.');
    const at = centerOf(description);
    expect(document.elementFromPoint(at.x, at.y)).toBe(open);
    const grip = centerOf(gripOf(canvas, TITLES.billing));
    expect(document.elementFromPoint(grip.x, grip.y)?.closest('button')).toBe(
      gripOf(canvas, TITLES.billing)
    );
    const actions = centerOf(actionsOf(canvas, TITLES.billing));
    expect(document.elementFromPoint(actions.x, actions.y)?.closest('button')).toBe(
      actionsOf(canvas, TITLES.billing)
    );
    await userEvent.click(open);
    expect(calls(args.onCardOpen)).toHaveLength(1);
    expect(calls(args.onCardOpen)[0][0]).toMatchObject({
      id: 'billing-emails',
      title: TITLES.billing,
    });
    expect(calls(args.onCardOpen)[0][1]).toBe('todo');
    expect(board(canvas)).toEqual(SPRINT_ORDER);
    expect(calls(args.onChange)).toHaveLength(0);
    // The keyboard opens it too, and the focus shows on the card.
    open.focus();
    await userEvent.keyboard('{Enter}');
    expect(calls(args.onCardOpen)).toHaveLength(2);
  },
};

/** Without `onCardOpen` the card is not interactive: its only buttons are the grip and the menu. */
export const CardIsNotInteractiveWithoutOnCardOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    const names = canvas.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    expect(names).toHaveLength(22);
    expect(names.every((name) => /^(Move card|Card actions): /.test(name ?? ''))).toBe(true);
  },
};

/** `onAddCard` adds one "Add card" button per column, called with the id of its column. */
export const AddCardButtons: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onAddCard: fn() },
  play: async ({ canvas, args }) => {
    const buttons = canvas.getAllByRole('button', { name: /^Add card/ });
    expect(buttons).toHaveLength(4);
    expect(buttons[1]).toHaveAccessibleName('Add card to In progress');
    await userEvent.click(buttons[1]);
    expect(calls(args.onAddCard)).toEqual([['doing']]);
    await expectFocusRing(buttons[2]);
  },
};

export const NoAddCardWithoutHandler: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    expect(canvas.queryByRole('button', { name: /^Add card/ })).toBeNull();
  },
};

/** A controlled board reports the move and stays put until the host passes the new board back. */
export const ControlledBoardWaitsForTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: sprint(), onChange: fn(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const grip = gripOf(canvas, TITLES.billing);
    await pickUp(grip);
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await keys('[Space]');
    await waitFor(() => expect(calls(args.onCardMove)).toHaveLength(1));
    expect(calls(args.onChange)).toHaveLength(1);
    // The host did not pass the new board back: the card goes back where it was.
    await waitFor(() => expect(board(canvas)).toEqual(SPRINT_ORDER));
    // The library gives the focus back to the grip once the card has settled; a menu opened before
    // that would lose it to the grip and close.
    await waitFor(() => expect(gripOf(canvas, TITLES.billing)).toHaveFocus());
    await waitFor(() => expect(document.querySelector('[data-dnd-overlay]')).toBeEmptyDOMElement());
    // Same for a move from the menu.
    await userEvent.click(actionsOf(canvas, TITLES.sso));
    await userEvent.click(within(menu()).getByRole('menuitem', { name: 'Done' }));
    expect(calls(args.onCardMove)).toHaveLength(2);
    expect(board(canvas)).toEqual(SPRINT_ORDER);
  },
};

/** Controlled by a host that does keep the board, the move shows, and `onCardMove` names it. */
export const ControlledBoardFollowsTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  render: Controlled.render,
  args: {},
  play: async ({ canvas }) => {
    await userEvent.click(actionsOf(canvas, TITLES.sso));
    await userEvent.click(within(menu()).getByRole('menuitem', { name: 'Review' }));
    await waitFor(() => expect(titlesIn(canvas, 'Review')).toContain(TITLES.sso));
    expect(canvas.getByTestId('last-move')).toHaveTextContent(
      'Last move: sso from doing to review, position 3.'
    );
  },
};

/** Escape closes the drawer opened from a card and nothing else: the board stays as it was. */
export const EscapeClosesTheDrawerNotTheBoard: Story = {
  ...WithDetailDrawer,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: TITLES.sso }));
    const drawer = await within(document.body).findByRole('dialog');
    expect(drawer).toHaveTextContent('SAML first, then OIDC.');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
    expect(canvas.getByRole('group', { name: 'Sprint board' })).toBeVisible();
    expect(board(canvas)).toEqual(SPRINT_ORDER);
  },
};

/** `loading` swaps the cards for skeletons and marks the board busy. */
export const LoadingShowsSkeletonColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { loading: true, defaultValue: sprint() },
  play: async ({ canvas, canvasElement }) => {
    const board = canvas.getByRole('group', { name: 'Sprint board' });
    expect(board).toHaveAttribute('aria-busy', 'true');
    expect(canvas.queryAllByRole('button')).toHaveLength(0);
    expect(canvasElement.querySelectorAll('.animate-pulse').length).toBeGreaterThan(10);
  },
};

export const LoadingWithoutDataShowsThreeColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { loading: true },
  play: async ({ canvas, canvasElement }) => {
    const board = canvas.getByRole('group', { name: 'Sprint board' });
    expect(board.firstElementChild?.children).toHaveLength(3);
    expect(canvasElement.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  },
};

/** An empty column says so, in its own words when it has some. */
export const EmptyColumnText: Story = {
  ...EmptyColumn,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expect(
      within(canvas.getByRole('region', { name: 'Review' })).getByText('No cards')
    ).toBeVisible();
    expect(
      within(canvas.getByRole('region', { name: 'Done' })).getByText(
        'Nothing shipped yet. Drop a finished card here.'
      )
    ).toBeVisible();
    // The count says 0, to a screen reader too.
    expect(canvas.getByRole('region', { name: 'Review' })).toHaveTextContent('0 cards');
  },
};

/** A column's count is its number of cards. */
export const ColumnCounts: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint() },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('region', { name: 'To do' })).toHaveTextContent('4 cards');
    expect(canvas.getByRole('region', { name: 'Done' })).toHaveTextContent('2 cards');
  },
};

/** On a narrow screen a card still moves to the next column. */
export const OnNarrowScreenMovesCards: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  args: { defaultValue: sprint(), onCardMove: fn() },
  play: async ({ canvas, args }) => {
    const grip = gripOf(canvas, TITLES.billing);
    await pickUp(grip);
    await keys(`{${keyToEnd()}}`);
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await keys('[Space]');
    await waitFor(() => expect(calls(args.onCardMove)).toHaveLength(1));
    expect(calls(args.onCardMove)[0][0]).toMatchObject({ toColumnId: 'doing' });
    expectNoHorizontalOverflow();
  },
};

/** The text and the grips read in the four themes. */
export const ReadableInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    defaultValue: [...sprint().slice(0, 1), { id: 'review', title: 'Review', cards: [] }],
    onAddCard: fn(),
  },
  play: async ({ canvas }) => {
    const description = canvas.getByText('Check the dunning sequence against the new plans.');
    const title = canvas.getByText(TITLES.billing);
    const count = canvas
      .getByRole('region', { name: 'To do' })
      .querySelector('h3 + span') as HTMLElement;
    const empty = canvas.getByText('No cards');
    const add = canvas.getAllByRole('button', { name: /^Add card/ })[0];
    inEachTheme(() => {
      expectTextContrast(title);
      expectTextContrast(description);
      expectTextContrast(count);
      expectTextContrast(empty);
      expectTextContrast(add);
    });
  },
};

/** Every control of a card shows the package's focus ring, the open button over the whole card. */
export const FocusShowsOnEveryControl: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onCardOpen: fn(), onAddCard: fn() },
  play: async ({ canvas }) => {
    await expectFocusRing(gripOf(canvas, TITLES.billing));
    await expectFocusRing(actionsOf(canvas, TITLES.billing));
    await expectFocusRing(canvas.getAllByRole('button', { name: /^Add card/ })[0]);
    const open = canvas.getByRole('button', { name: TITLES.billing });
    const ring = () => getComputedStyle(open, '::after').boxShadow;
    expect(ring()).toBe('none');
    open.blur();
    for (let i = 0; i < 40 && document.activeElement !== open; i += 1) await userEvent.tab();
    await expect(open).toHaveFocus();
    await waitFor(() => expect(ring()).not.toBe('none'));
    // The ring is on the pseudo-element that covers the card, not on the title alone.
    const card = open.closest('li > div') as HTMLElement;
    const box = card.getBoundingClientRect();
    expect(box.width).toBeGreaterThan(open.getBoundingClientRect().width);
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** Which physical edges of a scroller fade, read off the gradient of its mask. */
const fadedSides = (scroller: HTMLElement) => {
  const mask = getComputedStyle(scroller).maskImage;
  const toward = /to (left|right)/.exec(mask)?.[1];
  const stops = mask.match(/rgba?\([^)]*\)/g) ?? [];
  if (!toward || stops.length === 0) return { left: false, right: false };
  const clear = (color: string) => color === 'rgba(0, 0, 0, 0)';
  const first = clear(stops[0]!);
  const last = clear(stops[stops.length - 1]!);
  return toward === 'right' ? { left: first, right: last } : { left: last, right: first };
};

/** The columns of `board`, each name suffixed, for two boards on one page (landmarks are unique). */
const named = (board: KanbanColumn[], n: number) =>
  board.map((column) => ({ ...column, title: `${column.title} (${n})` }));

/**
 * The columns start at the start edge, and the board fades the edge that has more to scroll to: the
 * end one at first, the start one once scrolled to the end. In right to left that is the left edge
 * at first and the right one at the end, and the browser counts `scrollLeft` down from 0.
 */
export const ScrollFadeFollowsTheStartEdgeInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    // The two boards are on the page together: each column needs a name of its own.
    let count = 0;
    return bothDirections(() => (
      <div className="w-[600px]">
        <KanbanBoard {...args} defaultValue={named(sprint(), ++count)} />
      </div>
    ));
  },
  play: async ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByRole('region', { name: /^To do/ }));
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const scroller = within(box).getByRole('region', { name: /^To do/ }).parentElement!;
      const rtl = dir === 'rtl';
      const max = scroller.scrollWidth - scroller.clientWidth;
      expect(max).toBeGreaterThan(100);
      // At the start: more to come at the end edge, which is the left one in right to left.
      await waitFor(() => expect(fadedSides(scroller)).toEqual({ left: rtl, right: !rtl }));
      // Somewhere in the middle: both edges.
      scroller.scrollLeft = (rtl ? -1 : 1) * (max / 2);
      await waitFor(() => expect(fadedSides(scroller)).toEqual({ left: true, right: true }));
      // At the end: nothing more past the end edge, more back to the start.
      scroller.scrollLeft = (rtl ? -1 : 1) * max;
      await waitFor(() => expect(fadedSides(scroller)).toEqual({ left: !rtl, right: rtl }));
      expect(rtl ? scroller.scrollLeft < 0 : scroller.scrollLeft > 0).toBe(true);
    }
  },
};

/**
 * The first column is at the start, and the arrow keys move a picked-up card across the board by
 * where the columns are: toward the left, the next column in right to left, and back.
 */
export const KeyboardMovesCardsAcrossAMirroredBoard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: sprint(), onCardMove: fn() },
  render: (args) => (
    <div dir="rtl" data-direction="rtl">
      <KanbanBoard {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const box = directionBox(canvasElement, 'rtl');
    const lane = (name: string) => canvas.getByRole('region', { name });
    expect(startOffset(lane('To do'), box)).toBeLessThan(startOffset(lane('In progress'), box));
    await pickUp(gripOf(canvas, TITLES.billing));
    await keys('{ArrowLeft}');
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await keys('{ArrowRight}');
    await waitFor(() => expect(titlesIn(canvas, 'To do')).toContain(TITLES.billing));
    await keys('{ArrowLeft}');
    await waitFor(() => expect(titlesIn(canvas, 'In progress')).toContain(TITLES.billing));
    await keys('[Space]');
    await waitFor(() => expect(calls(args.onCardMove)).toHaveLength(1));
    expect(calls(args.onCardMove)[0][0]).toMatchObject({
      cardId: 'billing-emails',
      fromColumnId: 'todo',
      toColumnId: 'doing',
    });
  },
};

/** The grip sits at the start of a card and the actions menu at its end, the board over. */
export const CardGripAndActionsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    let count = 0;
    return bothDirections(() => (
      <div className="w-[600px]">
        <KanbanBoard {...args} defaultValue={named(sprint(), ++count)} onCardOpen={() => {}} />
      </div>
    ));
  },
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getAllByLabelText(/^Move card: /)[0]);
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('button', { name: TITLES.billing })
    );
    const ltr = directionBox(canvasElement, 'ltr');
    const rtl = directionBox(canvasElement, 'rtl');
    const actions = (box: HTMLElement) =>
      within(box).getByRole('button', { name: `Card actions: ${TITLES.billing}` });
    const lane = (box: HTMLElement) => within(box).getByRole('region', { name: /^To do/ });
    const gap = (box: HTMLElement) => endOffset(actions(box), lane(box));
    expect(gap(rtl)).toBeCloseTo(gap(ltr), 0);
  },
};
