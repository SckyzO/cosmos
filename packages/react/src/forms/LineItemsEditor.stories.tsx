import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Totals } from '../data/Totals';
import {
  bothDirections,
  endEdge,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startEdge,
} from '../storybook-helpers';
import {
  LineItemsEditor,
  summarizeLineItems,
  type LineItem,
  type LineItemsEditorProps,
  type LineItemsSummary,
} from './LineItemsEditor';

const meta = {
  title: 'Forms/Line Items Editor',
  component: LineItemsEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof LineItemsEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const page = within(document.body);

// The surface a form sits on, so the checks read the colours the user sees.
const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'rounded-lg bg-white p-6 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10',
      className
    )}
  >
    {children}
  </div>
);

const CATALOGUE = [
  { label: 'Brand identity workshop', rate: 1800 },
  { label: 'Landing page design', rate: 950 },
  { label: 'Landing page copy', rate: 60 },
  { label: 'Copy editing (per page)', rate: 45 },
];

const LINES: LineItem[] = [
  { id: 'workshop', item: 'Brand identity workshop', quantity: 1, rate: 1800 },
  { id: 'design', item: 'Landing page design', quantity: 2, rate: 950 },
  { id: 'editing', item: 'Copy editing (per page)', quantity: 12, rate: 45 },
];

type EditorProps = Partial<LineItemsEditorProps> & { initial?: LineItem[] };

/** Owns the lines, like a page does: what `onChange` reports comes back as `value`. */
const Editor = ({ initial = LINES, onChange, ...props }: EditorProps) => {
  const [lines, setLines] = useState(initial);
  return (
    <LineItemsEditor
      {...props}
      value={lines}
      onChange={(next, summary) => {
        setLines(next);
        onChange?.(next, summary);
      }}
    />
  );
};

const withTax = ({ subtotal }: LineItemsSummary) => {
  const tax = Math.round(subtotal * 20) / 100;
  return (
    <>
      <Totals.Row label="Tax (20%)" value={tax} />
      <Totals.Total label="Total due" value={subtotal + tax} />
    </>
  );
};

const NEW_INVOICE = (
  <Card className="max-w-5xl">
    <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Items</h3>
    <Editor
      aria-label="Invoice items"
      currency="USD"
      locale="en-US"
      catalogue={CATALOGUE}
      footer={withTax}
    />
  </Card>
);

// ── Visible stories ──────────────────────────────────────────────────────────

/**
 * A new invoice: the item is a `Combobox` over the catalogue that also takes free text, and
 * picking an entry copies its rate. A grid with the amounts aligned in a column, the subtotal
 * under it, and `footer` adding tax and the total due to the block.
 */
export const NewInvoice: Story = {
  render: () => NEW_INVOICE,
};

/** The same page on a phone: each line is a card, with the titles of its fields in view. */
export const NewInvoiceMobile: Story = {
  globals: mobileViewport,
  render: () => NEW_INVOICE,
};

/** No lines yet: an empty state with the one action, and the page's own message once it validates. */
export const EmptyWithError: Story = {
  render: () => (
    <Card className="max-w-5xl">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Items</h3>
      <Editor
        aria-label="Invoice items"
        initial={[]}
        currency="USD"
        locale="en-US"
        error="Add at least one line."
      />
    </Card>
  ),
};

/** A message under the cell that has one: the columns stay aligned, the amount keeps its line. */
export const CellErrors: Story = {
  render: () => (
    <Card className="max-w-5xl">
      <Editor
        aria-label="Invoice items"
        initial={[
          LINES[0],
          { id: 'blank', item: '', quantity: 1, rate: 950 },
          { id: 'none', item: 'Copy editing (per page)', quantity: 0, rate: 45 },
        ]}
        currency="USD"
        locale="en-US"
        errors={{
          blank: { item: 'Enter an item' },
          none: { quantity: 'Must be at least 1' },
        }}
      />
    </Card>
  ),
};

/** A sent invoice: the lines as text, no field, no "Add line", no remove button. */
export const ReadOnly: Story = {
  render: () => (
    <Card className="max-w-5xl">
      <LineItemsEditor
        aria-label="Invoice items"
        value={LINES}
        currency="USD"
        locale="en-US"
        readOnly
        footer={withTax}
      />
    </Card>
  ),
};

/** Hours in euros, in French: a half-hour step, the sign of the currency before the rate. */
export const HoursInEuros: Story = {
  render: () => (
    <Card className="max-w-5xl">
      <Editor
        aria-label="Heures facturées"
        initial={[
          { id: 'a', item: 'Atelier de cadrage', quantity: 3.5, rate: 120 },
          { id: 'b', item: 'Revue de maquettes', quantity: 1.5, rate: 120 },
        ]}
        currency="EUR"
        locale="fr-FR"
        quantity={{ min: 0.5, step: 0.5 }}
        labels={{
          item: 'Prestation',
          quantity: 'Heures',
          rate: 'Taux',
          amount: 'Montant',
          add: 'Ajouter une ligne',
          subtotal: 'Sous-total',
          line: (n) => `Ligne ${n}`,
          fieldName: (column, n) => `${column}, ligne ${n}`,
          remove: (n, item) => `Supprimer la ligne ${n}${item ? ` : ${item}` : ''}`,
          added: (n, count) => `Ligne ${n} ajoutée. ${count} lignes.`,
          removed: (n, count) => `Ligne ${n} supprimée. ${count} lignes restantes.`,
          subtotalAnnouncement: (amount) => `Sous-total ${amount}`,
        }}
      />
    </Card>
  ),
};

function SideSummaryEditor() {
  const options = { currency: 'USD', locale: 'en-US' };
  const [lines, setLines] = useState(LINES);
  const [summary, setSummary] = useState(() => summarizeLineItems(LINES, options));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card>
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Items</h3>
        <LineItemsEditor
          aria-label="Invoice items"
          value={lines}
          onChange={(next, nextSummary) => {
            setLines(next);
            setSummary(nextSummary);
          }}
          footer={false}
          catalogue={CATALOGUE}
          {...options}
        />
      </Card>
      <aside aria-label="Summary" className="h-fit">
        <Card>
          <h3 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">Summary</h3>
          <Totals {...options}>
            <Totals.Row label={`Subtotal (${lines.length} lines)`} value={summary.subtotal} />
            <Totals.Row label="Tax (20%)" value={Math.round(summary.subtotal * 20) / 100} />
            <Totals.Total
              label="Total due"
              value={summary.subtotal + Math.round(summary.subtotal * 20) / 100}
            />
          </Totals>
        </Card>
      </aside>
    </div>
  );
}

/**
 * `footer={false}` for a page that shows the summary elsewhere: it reads the subtotal from the
 * second argument of `onChange`, and from `summarizeLineItems` before the first edit.
 */
export const SideSummary: Story = {
  render: () => <SideSummaryEditor />,
};

export const SideSummaryMobile: Story = {
  globals: mobileViewport,
  render: () => <SideSummaryEditor />,
};

// ── Helpers of the checks ────────────────────────────────────────────────────

const lineRows = (group: HTMLElement) =>
  Array.from(group.querySelector('ul')!.children) as HTMLElement[];

const invoiceGroup = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('group', { name: 'Invoice items' });

/** The column titles drawn once above the lines, hidden from assistive technology. */
const headerOf = (group: HTMLElement) =>
  group.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')!;

const controlOf = (input: HTMLElement) => input.closest<HTMLElement>('[class*="rounded-lg"]')!;

const status = (canvas: ReturnType<typeof within>) => canvas.getByRole('status');

/**
 * The editor in a form with a submit button, as a page has it: what Enter does is the form's. The
 * number of submissions is written out for the checks.
 */
const InAForm = (props: EditorProps) => {
  const [submits, setSubmits] = useState(0);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((n) => n + 1);
      }}
    >
      <Editor {...props} />
      <button type="submit">Save</button>
      <p data-testid="submits">{submits}</p>
    </form>
  );
};

// ── Keyboard ─────────────────────────────────────────────────────────────────

/**
 * Tab goes item, quantity, rate, remove, line after line, then "Add line". Enter in a field is
 * the form's (it submits), never an extra line; "Add line" adds one and moves into its item.
 */
export const KeyboardAddsALineOnlyFromTheButton: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InAForm aria-label="Invoice items" initial={LINES.slice(0, 2)} currency="USD" locale="en-US" />
  ),
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    const name = (column: string, n: number) => `${column}, line ${n}`;
    const stops = [
      canvas.getByRole('textbox', { name: name('Item', 1) }),
      canvas.getByRole('spinbutton', { name: name('Quantity', 1) }),
      canvas.getByRole('spinbutton', { name: name('Rate', 1) }),
      canvas.getByRole('button', { name: /^Remove line 1/ }),
      canvas.getByRole('textbox', { name: name('Item', 2) }),
      canvas.getByRole('spinbutton', { name: name('Quantity', 2) }),
      canvas.getByRole('spinbutton', { name: name('Rate', 2) }),
      canvas.getByRole('button', { name: /^Remove line 2/ }),
      canvas.getByRole('button', { name: 'Add line' }),
    ];
    stops[0].focus();
    for (const stop of stops.slice(1)) {
      await userEvent.tab();
      await expect(stop).toHaveFocus();
    }

    // Enter in the last field submits the form and adds nothing.
    stops[6].focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('submits')).toHaveTextContent('1');
    await expect(lineRows(group)).toHaveLength(2);

    // The button adds a line, whose item field takes the focus.
    stops[8].focus();
    await userEvent.keyboard('{Enter}');
    await expect(lineRows(group)).toHaveLength(3);
    await expect(canvas.getByTestId('submits')).toHaveTextContent('1');
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: name('Item', 3) })).toHaveFocus()
    );
    await expect(status(canvas)).toHaveTextContent('Line 3 added. 3 lines.');
  },
};

/**
 * After a removal the focus goes to the remove button of the line that took its place, never to
 * the page and never into a field: with a catalogue, a field would open its list.
 */
export const FocusAfterRemovingInTheMiddle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Editor aria-label="Invoice items" currency="USD" locale="en-US" catalogue={CATALOGUE} />
  ),
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    canvas.getByRole('button', { name: /^Remove line 2/ }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(lineRows(group)).toHaveLength(2);
    // The line that was third is second now, and its button holds the focus.
    const remove = canvas.getByRole('button', { name: 'Remove line 2: Copy editing (per page)' });
    await waitFor(() => expect(remove).toHaveFocus());
    await expect(page.queryByRole('listbox')).toBeNull();
    await expect(canvas.getByRole('combobox', { name: 'Item, line 2' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    // So the same key removes the next line, and the one after.
    await userEvent.keyboard('{Enter}');
    await expect(lineRows(group)).toHaveLength(1);
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Remove line 1: Brand identity workshop' })
      ).toHaveFocus()
    );
  },
};

/** Removing the last of several lines leaves the focus on the button of the new last line. */
export const FocusAfterRemovingTheLastLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Editor aria-label="Invoice items" currency="USD" locale="en-US" />,
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    canvas.getByRole('button', { name: /^Remove line 3/ }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(lineRows(group)).toHaveLength(2);
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Remove line 2: Landing page design' })
      ).toHaveFocus()
    );
  },
};

/** From the first line, then the last of two, then the only line: the next, the one before, "Add line". */
export const FocusAfterRemovingFirstLastAndOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Editor aria-label="Invoice items" currency="USD" locale="en-US" />,
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    const remove = async (n: number) => {
      canvas.getByRole('button', { name: new RegExp(`^Remove line ${n}`) }).focus();
      await userEvent.keyboard('{Enter}');
    };

    // The first line goes: the second line, now first, has the focus on its button.
    await remove(1);
    await expect(lineRows(group)).toHaveLength(2);
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Remove line 1: Landing page design' })
      ).toHaveFocus()
    );

    // The last of two goes: the one before it is the last now.
    await remove(2);
    await expect(lineRows(group)).toHaveLength(1);
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Remove line 1: Landing page design' })
      ).toHaveFocus()
    );

    // Nothing is left to focus but the button that adds a line.
    await remove(1);
    await expect(canvas.getByText('No lines yet')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Add line' })).toHaveFocus());
    await expect(status(canvas)).toHaveTextContent('Line 1 removed. 0 lines left.');
  },
};

// ── Catalogue and free text ──────────────────────────────────────────────────

/**
 * The item is free text or a catalogue entry: typing is accepted as it is and never fills the
 * rate; picking an entry copies its rate, with an arrow key and Enter, which adds no line.
 */
export const CatalogueAndFreeText: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <Editor
      aria-label="Invoice items"
      initial={[{ id: 'one', item: '', quantity: 1, rate: 0 }]}
      currency="USD"
      locale="en-US"
      catalogue={CATALOGUE}
      onChange={args.onChange}
    />
  ),
  play: async ({ args, canvas }) => {
    const group = invoiceGroup(canvas);
    const item = canvas.getByRole('combobox', { name: 'Item, line 1' });
    const rate = canvas.getByRole('spinbutton', { name: 'Rate, line 1' });

    // The list shows the rates written for the currency.
    await userEvent.type(item, 'Land');
    const options = await page.findAllByRole('option');
    await expect(options).toHaveLength(2);
    await expect(within(options[0]).getByText('$950.00')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(item).toHaveValue('Landing page design');
    await expect(rate).toHaveValue(950);
    await expect(lineRows(group)).toHaveLength(1);
    await expect(within(lineRows(group)[0]).getByText('$950.00')).toBeInTheDocument();
    await expect(args.onChange).toHaveBeenLastCalledWith(
      [{ id: 'one', item: 'Landing page design', quantity: 1, rate: 950 }],
      { subtotal: 950 }
    );
    // The pick moved the subtotal: it is announced once the cell is committed.
    await waitFor(() => expect(status(canvas)).toHaveTextContent('Subtotal $950.00'));

    // A second line takes text no entry has, and keeps the rate it was given.
    await userEvent.click(canvas.getByRole('button', { name: 'Add line' }));
    const second = await canvas.findByRole('combobox', { name: 'Item, line 2' });
    await userEvent.type(second, 'Bespoke consulting');
    await expect(second).toHaveValue('Bespoke consulting');
    await userEvent.type(canvas.getByRole('spinbutton', { name: 'Rate, line 2' }), '75');
    await expect(args.onChange).toHaveBeenLastCalledWith(
      [
        { id: 'one', item: 'Landing page design', quantity: 1, rate: 950 },
        { id: expect.any(String), item: 'Bespoke consulting', quantity: 1, rate: 75 },
      ],
      { subtotal: 1025 }
    );

    // Typing the whole label of an entry is typing, not picking: the rate stays.
    await userEvent.clear(second);
    await userEvent.type(second, 'Landing page copy');
    await expect(canvas.getByRole('spinbutton', { name: 'Rate, line 2' })).toHaveValue(75);
    await userEvent.keyboard('{Escape}');
    // Free text, a pick and a keystroke all leave a line count of two.
    await expect(lineRows(group)).toHaveLength(2);
  },
};

// ── Amounts ──────────────────────────────────────────────────────────────────

/**
 * Each line is rounded to the minor unit of its currency, then the amounts shown are added:
 * the subtotal is always what the rows say, in dollars (2 decimals) and in yen (none).
 */
export const RoundingFollowsTheCurrency: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-8">
      <Editor
        aria-label="Dollars"
        initial={[1, 2, 3].map((n) => ({
          id: `d${n}`,
          item: `Item ${n}`,
          quantity: 1,
          rate: 0.335,
        }))}
        currency="USD"
        locale="en-US"
      />
      <Editor
        aria-label="Yen"
        initial={[{ id: 'y1', item: 'Workshop', quantity: 3, rate: 333.5 }]}
        currency="JPY"
        locale="en-US"
      />
      <Editor
        aria-label="Hours"
        initial={[{ id: 'h1', item: 'Review', quantity: 1.5, rate: 0.77 }]}
        currency="USD"
        locale="en-US"
        quantity={{ min: 0.5, step: 0.5 }}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const dollars = within(canvas.getByRole('group', { name: 'Dollars' }));
    // 0.335 shows as $0.34 on each line, so the subtotal is $1.02 and not the $1.01 of 1.005.
    await expect(dollars.getAllByText('$0.34')).toHaveLength(3);
    await expect(dollars.getByText('$1.02')).toBeInTheDocument();

    const yen = within(canvas.getByRole('group', { name: 'Yen' }));
    await expect(yen.getAllByText('¥1,001')).toHaveLength(2);
    // The rate is written with the sign of the currency, not the dollar of the other editors.
    await expect(
      within(controlOf(yen.getByRole('spinbutton', { name: 'Rate, line 1' }))).getByText('¥')
    ).toBeInTheDocument();

    const hours = within(canvas.getByRole('group', { name: 'Hours' }));
    await expect(hours.getAllByText('$1.16')).toHaveLength(2);
  },
};

// ── Announcements ────────────────────────────────────────────────────────────

/**
 * A polite status says a line added or removed, and the subtotal once a cell is committed (focus
 * leaves it, or Enter): never on a keystroke.
 */
export const AnnouncementsFollowCommits: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Editor aria-label="Invoice items" initial={LINES.slice(0, 2)} currency="USD" locale="en-US" />
  ),
  play: async ({ canvas }) => {
    const live = status(canvas);
    await expect(live).toHaveTextContent(/^$/);

    await userEvent.click(canvas.getByRole('button', { name: 'Add line' }));
    await expect(live).toHaveTextContent('Line 3 added. 3 lines.');

    // Typing a quantity changes the amounts, and says nothing.
    const quantity = canvas.getByRole('spinbutton', { name: 'Quantity, line 2' });
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '3');
    await expect(within(lineRows(invoiceGroup(canvas))[1]).getByText('$2,850.00')).toBeVisible();
    await expect(live).toHaveTextContent('Line 3 added. 3 lines.');

    // Leaving the cell says the new subtotal.
    await userEvent.tab();
    await waitFor(() => expect(live).toHaveTextContent('Subtotal $4,650.00'));

    // Enter commits a cell too.
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '1{Enter}');
    await waitFor(() => expect(live).toHaveTextContent('Subtotal $2,750.00'));

    // A cell that moves nothing says nothing more.
    await userEvent.type(canvas.getByRole('textbox', { name: 'Item, line 3' }), 'Notes');
    await userEvent.tab();
    await expect(live).toHaveTextContent('Subtotal $2,750.00');

    // A removal says itself and the subtotal it leaves, once.
    await userEvent.click(canvas.getByRole('button', { name: /^Remove line 3/ }));
    await expect(live).toHaveTextContent('Line 3 removed. 2 lines left. Subtotal $2,750.00');
  },
};

// ── Value: controlled or not ─────────────────────────────────────────────────

/**
 * Only `undefined` means uncontrolled. The uncontrolled editor starts from its default and moves
 * on its own; the controlled one, held at a fixed value, reports the edit and keeps the lines it
 * is given. Every new line gets an id of its own.
 */
export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="space-y-8">
      <LineItemsEditor
        aria-label="Own"
        defaultValue={LINES.slice(0, 2)}
        currency="USD"
        locale="en-US"
        onChange={args.onChange}
      />
      <LineItemsEditor
        aria-label="Held"
        value={LINES.slice(0, 2)}
        currency="USD"
        locale="en-US"
        onChange={args.onChange}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('group', { name: 'Own' }));
    await userEvent.click(own.getByRole('button', { name: 'Add line' }));
    await userEvent.click(own.getByRole('button', { name: 'Add line' }));
    await expect(lineRows(canvas.getByRole('group', { name: 'Own' }))).toHaveLength(4);
    const ids = (args.onChange as ReturnType<typeof fn>).mock.lastCall![0].map(
      (line: LineItem) => line.id
    );
    await expect(new Set(ids).size).toBe(4);
    await expect(ids.slice(0, 2)).toEqual(['workshop', 'design']);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.any(Array), { subtotal: 3700 });

    const held = within(canvas.getByRole('group', { name: 'Held' }));
    await userEvent.click(held.getByRole('button', { name: 'Add line' }));
    await expect(args.onChange).toHaveBeenCalledTimes(3);
    await expect(lineRows(canvas.getByRole('group', { name: 'Held' }))).toHaveLength(2);
  },
};

// ── Layout ───────────────────────────────────────────────────────────────────

/** From the width of a grid, the amounts end in one column, the totals end under it. */
export const GridAlignsTheColumns: Story = {
  ...NewInvoice,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    const rows = lineRows(group);
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      const style = getComputedStyle(row);
      await expect(style.display).toBe('grid');
      await expect(style.gridTemplateColumns.split(' ')).toHaveLength(5);
      await expect(style.borderTopWidth).toBe('0px');
    }
    // The title of a card is for the phone.
    await expect(within(rows[0]).getByText('Line 1')).not.toBeVisible();

    const amounts = [
      within(rows[0]).getByText('$1,800.00'),
      within(rows[1]).getByText('$1,900.00'),
      within(rows[2]).getByText('$540.00'),
    ];
    const ends = amounts.map((amount) => endEdge(amount.getBoundingClientRect()));
    await expect(new Set(ends).size).toBe(1);
    // And so does the subtotal of the totals block under them.
    const totals = group.querySelectorAll('ul')[1] as HTMLElement;
    await expect(endEdge(within(totals).getByText('$4,240.00').getBoundingClientRect())).toBe(
      ends[0]
    );

    // The fields line up from row to row, under the titles drawn once above them.
    const header = headerOf(group);
    await expect(getComputedStyle(header).display).toBe('grid');
    const starts = (name: string) =>
      rows.map((_, i) =>
        startEdge(
          controlOf(
            canvas.getByRole(name === 'Item' ? 'combobox' : 'spinbutton', {
              name: `${name}, line ${i + 1}`,
            })
          ).getBoundingClientRect()
        )
      );
    for (const [column, index] of [
      ['Item', 0],
      ['Quantity', 1],
      ['Rate', 2],
    ] as const) {
      await expect(new Set(starts(column)).size).toBe(1);
      await expect(startEdge(header.children[index].getBoundingClientRect())).toBe(
        starts(column)[0]
      );
    }
    const removes = rows.map((_, i) =>
      startEdge(
        canvas
          .getByRole('button', { name: new RegExp(`^Remove line ${i + 1}`) })
          .getBoundingClientRect()
      )
    );
    await expect(new Set(removes).size).toBe(1);
  },
};

/** An error under a cell leaves the other columns where they were, and the amount on its field's line. */
export const CellErrorsKeepTheColumns: Story = {
  ...CellErrors,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    const rows = lineRows(group);
    const quantity = canvas.getByRole('spinbutton', { name: 'Quantity, line 3' });
    await expect(quantity).toHaveAttribute('aria-invalid', 'true');
    await expect(quantity).toHaveAccessibleDescription('Must be at least 1');
    const item = canvas.getByRole('textbox', { name: 'Item, line 2' });
    await expect(item).toHaveAttribute('aria-invalid', 'true');
    await expect(item).toHaveAccessibleDescription('Enter an item');
    // The cells with nothing to say are not marked.
    for (const field of [
      canvas.getByRole('textbox', { name: 'Item, line 1' }),
      canvas.getByRole('spinbutton', { name: 'Quantity, line 1' }),
      canvas.getByRole('spinbutton', { name: 'Rate, line 3' }),
    ]) {
      await expect(field).not.toHaveAttribute('aria-invalid');
    }

    // The message sits under its field.
    const message = canvas.getByText('Must be at least 1');
    await expect(message.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      controlOf(quantity).getBoundingClientRect().bottom
    );
    // The amounts still end in one column, each level with the fields of its line.
    const amounts = [
      within(rows[0]).getByText('$1,800.00'),
      within(rows[1]).getByText('$950.00'),
      within(rows[2]).getByText('$0.00'),
    ];
    await expect(
      new Set(amounts.map((amount) => endEdge(amount.getBoundingClientRect()))).size
    ).toBe(1);
    const middle = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    await expect(middle(amounts[2])).toBeCloseTo(middle(controlOf(quantity)), 0);

    inEachTheme(() => {
      expectTextContrast(message);
      expectTextContrast(canvas.getByText('Enter an item'));
    });
  },
};

/** The page's message is the description of the editor and of the one button that can fix it. */
export const EmptyErrorDescribesTheEditor: Story = {
  ...EmptyWithError,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    await expect(group).toHaveAccessibleDescription('Add at least one line.');
    await expect(canvas.getByRole('button', { name: 'Add line' })).toHaveAccessibleDescription(
      'Add at least one line.'
    );
    await expect(canvas.getByText('No lines yet')).toBeVisible();
    // No lines, no total.
    await expect(group.querySelector('ul')).toBeNull();
    await expect(canvas.queryByText('Subtotal')).toBeNull();
    inEachTheme(() => expectTextContrast(canvas.getByText('Add at least one line.')));
    // Adding the first line leaves the empty state.
    await userEvent.click(canvas.getByRole('button', { name: 'Add line' }));
    await expect(lineRows(group)).toHaveLength(1);
    await expect(canvas.queryByText('No lines yet')).toBeNull();
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Item, line 1' })).toHaveFocus()
    );
  },
};

/** Text, not fields: nothing to focus, nothing to add or remove, each figure named for a screen reader. */
export const ReadOnlyHasNoControls: Story = {
  ...ReadOnly,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(0);
    await expect(canvas.queryAllByRole('spinbutton')).toHaveLength(0);
    await expect(canvas.queryAllByRole('combobox')).toHaveLength(0);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    const rows = lineRows(group);
    await expect(rows).toHaveLength(3);
    await expect(rows[1]).toHaveTextContent('Item: Landing page design');
    await expect(rows[1]).toHaveTextContent('Quantity: 2');
    await expect(rows[1]).toHaveTextContent('Rate: $950.00');
    await expect(rows[1]).toHaveTextContent('Amount: $1,900.00');
    await expect(within(group).getByText('$4,240.00')).toBeVisible();
    await expect(within(group).getByText('Total due')).toBeVisible();
    await expect(getComputedStyle(rows[0]).gridTemplateColumns.split(' ')).toHaveLength(4);
  },
};

/** The summary is the page's: with `footer={false}` the editor draws no totals, and `onChange` feeds the card. */
export const SideSummaryFollowsTheLines: Story = {
  ...SideSummary,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = invoiceGroup(canvas);
    const summary = within(canvas.getByRole('complementary', { name: 'Summary' }));
    // Before any edit the page has the figures of its own lines.
    await expect(summary.getByText('$4,240.00')).toBeVisible();
    await expect(summary.getByText('$5,088.00')).toBeVisible();
    await expect(group.querySelectorAll('ul')).toHaveLength(1);

    const quantity = canvas.getByRole('spinbutton', { name: 'Quantity, line 1' });
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '2');
    await expect(summary.getByText('$6,040.00')).toBeVisible();
    await expect(summary.getByText('Subtotal (3 lines)')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Remove line 3/ }));
    await expect(summary.getByText('Subtotal (2 lines)')).toBeVisible();
    await expect(summary.getByText('$5,500.00')).toBeVisible();
  },
};

/** At 393px a line is a card of its own: titles in view, the fields stacked, no sideways scroll. */
export const NewInvoiceMobileChecks: Story = {
  ...NewInvoiceMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const group = invoiceGroup(canvas);
    expectNoHorizontalOverflow(group);
    const rows = lineRows(group);
    const header = headerOf(group);
    // No column titles above: each field carries its own.
    await expect(getComputedStyle(header).display).toBe('none');
    for (const [i, row] of rows.entries()) {
      const style = getComputedStyle(row);
      await expect(style.borderTopWidth).toBe('1px');
      await expect(within(row).getByText(`Line ${i + 1}`)).toBeVisible();
      for (const title of ['Item', 'Quantity', 'Rate', 'Amount']) {
        await expect(within(row).getByText(title)).toBeVisible();
      }
    }

    const box = (el: Element) => el.getBoundingClientRect();
    const row = box(rows[0]);
    const item = box(controlOf(canvas.getByRole('combobox', { name: 'Item, line 1' })));
    const quantity = box(controlOf(canvas.getByRole('spinbutton', { name: 'Quantity, line 1' })));
    const rate = box(controlOf(canvas.getByRole('spinbutton', { name: 'Rate, line 1' })));
    const remove = box(canvas.getByRole('button', { name: /^Remove line 1/ }));
    // The item takes the card's width; quantity and rate share the row under it, level.
    await expect(item.width).toBeGreaterThan(row.width * 0.85);
    await expect(Math.abs(quantity.top - rate.top)).toBeLessThan(1);
    await expect(quantity.top).toBeGreaterThan(item.bottom);
    await expect(endEdge(quantity)).toBeLessThanOrEqual(startEdge(rate) + 1);
    // The remove button heads the card, at the end, a target a thumb can hit.
    await expect(remove.bottom).toBeLessThan(item.top);
    await expect(remove.width).toBeGreaterThanOrEqual(36);
    await expect(endEdge(remove)).toBeGreaterThanOrEqual(endEdge(item) - 1);
    // The amount closes the card, and "Add line" takes the width of the editor.
    const amount = box(within(rows[0]).getByText('$1,800.00'));
    await expect(amount.top).toBeGreaterThan(quantity.bottom);
    const add = box(canvas.getByRole('button', { name: 'Add line' }));
    await expect(add.width).toBeGreaterThan(box(group).width * 0.95);
    // The totals stay under the cards, as wide as them.
    const totals = group.querySelectorAll('ul')[1] as HTMLElement;
    await expect(box(totals).top).toBeGreaterThan(add.bottom);
    await expect(box(totals).width).toBeGreaterThan(box(group).width * 0.95);
  },
};

/** Long text and long messages wrap inside the card instead of widening the page. */
export const MobileLongContentDoesNotScroll: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Editor
      aria-label="Invoice items"
      initial={[
        {
          id: 'long',
          item: 'Supercalifragilisticexpialidocious_consulting_engagement_for_the_whole_quarter',
          quantity: 1234567,
          rate: 98765.43,
        },
      ]}
      currency="USD"
      locale="en-US"
      catalogue={CATALOGUE}
      errors={{
        long: {
          item: 'This description is far too long to fit on the line of an invoice and must be shortened',
          rate: 'The rate of an item cannot be more than the credit limit of the account holder',
        },
      }}
      error="Fix the lines above before this invoice can be sent to the customer by e-mail."
    />
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    expectNoHorizontalOverflow(invoiceGroup(canvas));
  },
};

/** The grid reads from the end: the item first, the remove button last, the amounts on the other edge. */
export const GridMirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Editor
        aria-label="Invoice items"
        initial={LINES.slice(0, 2)}
        currency="USD"
        locale="en-US"
        footer={withTax}
      />
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('textbox', { name: 'Item, line 1' })
    );
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('spinbutton', { name: 'Quantity, line 1' })
    );
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('button', { name: /^Remove line 1/ })
    );
    expectMirrored(canvasElement, (box) => within(box).getByText('$1,800.00'));
    expectMirrored(canvasElement, (box) => within(box).getByText('$3,700.00'));
    // The sign of the currency starts the rate field, on the right here.
    expectMirrored(canvasElement, (box) =>
      within(controlOf(within(box).getByRole('spinbutton', { name: 'Rate, line 1' }))).getByText(
        '$'
      )
    );
  },
};

/** Hours: the quantity steps by half an hour, the labels and the figures follow the page's language. */
export const HoursInEurosChecks: Story = {
  ...HoursInEuros,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const quantity = canvas.getByRole('spinbutton', { name: 'Heures, ligne 1' });
    await expect(quantity).toHaveAttribute('min', '0.5');
    await expect(quantity).toHaveAttribute('step', '0.5');
    await expect(quantity).toHaveValue(3.5);
    await expect(
      within(controlOf(canvas.getByRole('spinbutton', { name: 'Taux, ligne 1' }))).getByText('€')
    ).toBeInTheDocument();
    // French figures: 3.5 × 120 and 1.5 × 120, a space for the thousands, the sign after.
    const plain = (text: string) => text.replace(/[\s\u00a0\u202f]/g, ' ');
    const amounts = canvas
      .getAllByText(/€/)
      .map((el) => plain(el.textContent ?? ''))
      .filter((text) => /\d/.test(text));
    await expect(amounts).toContain('420,00 €');
    await expect(amounts).toContain('180,00 €');
    await expect(amounts).toContain('600,00 €');
    await userEvent.click(canvas.getByRole('button', { name: 'Ajouter une ligne' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Ligne 3 ajoutée. 3 lignes.');
    await expect(canvas.getByRole('spinbutton', { name: 'Heures, ligne 3' })).toHaveValue(1);
  },
};
