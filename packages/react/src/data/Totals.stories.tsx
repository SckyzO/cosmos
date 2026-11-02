import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { expect, within } from 'storybook/test';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../table/Table';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startOffset,
  textLines,
} from '../storybook-helpers';
import { Amount } from './Amount';
import { Totals } from './Totals';

const meta = {
  title: 'Data/Totals',
  component: Totals,
  subcomponents: {
    'Totals.Row': Totals.Row,
    'Totals.Total': Totals.Total,
    'Totals.Note': Totals.Note,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Totals>;

export default meta;
type Story = StoryObj<typeof meta>;

// The surface a summary usually sits on, so the checks read the colours the user sees.
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={clsx(
      'rounded-lg bg-white p-6 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10',
      className
    )}
  >
    {children}
  </div>
);

const CART = (
  <>
    <Totals.Row label="Subtotal" value={120} />
    <Totals.Row label="Discount (SPRING10)" value={-12} />
    <Totals.Row label="Shipping">Free</Totals.Row>
    <Totals.Row label="Tax (20%)" value={21.6} />
    <Totals.Total label="Total" value={129.6} />
    <Totals.Note>Taxes are calculated again at checkout.</Totals.Note>
  </>
);

/**
 * A cart summary: the currency and the locale are set once on the block, a discount is a negative
 * amount, and a row that is not a figure ("Free") takes its text as `children`.
 */
export const CartSummary: Story = {
  args: { 'aria-label': 'Order summary', currency: 'USD', locale: 'en-US' },
  render: (args) => (
    <Card className="max-w-sm">
      <Totals {...args}>{CART}</Totals>
    </Card>
  ),
};

export const CartSummaryChecks: Story = {
  ...CartSummary,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Order summary' });
    const rows = within(list).getAllByRole('listitem');
    await expect(rows).toHaveLength(6);
    const value = (row: HTMLElement, text: string) => within(row).getByText(text);
    const subtotal = value(rows[0], '$120.00');
    const discount = value(rows[1], '-$12.00');
    const shipping = value(rows[2], 'Free');
    const tax = value(rows[3], '$21.60');
    const total = value(rows[4], '$129.60');
    // Every figure ends where the block ends, and every label starts where it starts.
    for (const el of [subtotal, discount, shipping, tax, total]) {
      await expect(endOffset(el, list)).toBeLessThan(1.5);
    }
    for (const row of rows.slice(0, 5)) {
      await expect(startOffset(row.firstElementChild!, list)).toBeLessThan(1.5);
    }
    // Digits of one width, so the figures line up from row to row.
    for (const el of [subtotal, discount, tax, total]) {
      await expect(getComputedStyle(el).fontVariantNumeric).toContain('tabular-nums');
    }
    // A discount is the colour of the other rows, with its minus sign: not red.
    await expect(getComputedStyle(discount).color).toBe(getComputedStyle(subtotal).color);
    await expect(getComputedStyle(discount).color).toBe(getComputedStyle(tax).color);
    // The total stands out: a rule above it, larger and bolder than the rows.
    await expect(getComputedStyle(rows[4]).borderTopWidth).toBe('1px');
    await expect(getComputedStyle(rows[1]).borderTopWidth).toBe('0px');
    await expect(parseFloat(getComputedStyle(total).fontSize)).toBeGreaterThan(
      parseFloat(getComputedStyle(subtotal).fontSize)
    );
    await expect(Number(getComputedStyle(total).fontWeight)).toBeGreaterThanOrEqual(600);
    // The note is the last line, at the end of the line, in small type.
    const note = canvas.getByText('Taxes are calculated again at checkout.');
    await expect(getComputedStyle(note).textAlign).toBe('end');
    await expect(parseFloat(getComputedStyle(note).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(subtotal).fontSize)
    );
    // The block adds nothing up and announces nothing.
    await expect(list.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull();
    inEachTheme(() => {
      const label = within(rows[0]).getByText('Subtotal');
      for (const el of [label, subtotal, discount, shipping, total, note]) expectTextContrast(el);
    });
  },
};

const INVOICE_LINES = [
  { id: 'design', item: 'Design system audit', qty: 1, price: 900 },
  { id: 'build', item: 'Component library, 12 days', qty: 12, price: 45 },
  { id: 'train', item: 'Team workshop', qty: 1, price: 40 },
];

/**
 * An invoice footer under its lines: subtotal, a discount, shipping, tax, the total due and a
 * note. The block takes `ms-auto` and a maximum width to sit at the end of the line.
 */
export const InvoiceFooter: Story = {
  args: { 'aria-label': 'Invoice totals', currency: 'EUR', locale: 'en-IE' },
  render: (args) => (
    <Card>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        Invoice INV-2026-0042
      </h3>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell numeric>Qty</TableHeaderCell>
            <TableHeaderCell numeric>Unit price</TableHeaderCell>
            <TableHeaderCell numeric>Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {INVOICE_LINES.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.item}</TableCell>
              <TableCell numeric>{line.qty}</TableCell>
              <TableCell numeric>
                <Amount value={line.price} currency={args.currency} locale={args.locale} />
              </TableCell>
              <TableCell numeric>
                <Amount
                  value={line.qty * line.price}
                  currency={args.currency}
                  locale={args.locale}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Totals {...args} className="ms-auto mt-6 max-w-sm">
        <Totals.Row label="Subtotal" value={1480} />
        <Totals.Row label="Volume discount (5%)" value={-74} />
        <Totals.Row label="Shipping" value={25} />
        <Totals.Row label="VAT (20%)" value={286.2} />
        <Totals.Total label="Total due" value={1717.2} />
        <Totals.Note>Payable by 15 February 2026, VAT included.</Totals.Note>
      </Totals>
    </Card>
  ),
};

export const InvoiceFooterChecks: Story = {
  ...InvoiceFooter,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Invoice totals' });
    const rows = within(list).getAllByRole('listitem');
    await expect(rows.map((row) => row.textContent)).toEqual([
      'Subtotal€1,480.00',
      'Volume discount (5%)-€74.00',
      'Shipping€25.00',
      'VAT (20%)€286.20',
      'Total due€1,717.20',
      'Payable by 15 February 2026, VAT included.',
    ]);
    // The block sits at the end of the card, inside its 24px padding, and stops at `max-w-sm`.
    await expect(endOffset(list, list.parentElement!)).toBeCloseTo(24, 0);
    await expect(list.getBoundingClientRect().width).toBeLessThanOrEqual(384);
    await expect(startOffset(list, list.parentElement!)).toBeGreaterThan(24);
  },
};

/** The same block in three locales: separators, the sign of the currency and its decimals follow. */
export const Locales: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-3">
      {[
        { locale: 'en-US', currency: 'USD', title: 'en-US, USD', total: 2519.99 },
        { locale: 'fr-FR', currency: 'EUR', title: 'fr-FR, EUR', total: 2519.99 },
        { locale: 'ja-JP', currency: 'JPY', title: 'ja-JP, JPY (no decimals)', total: 378000 },
      ].map(({ locale, currency, title, total }) => (
        <Card key={locale}>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">{title}</p>
          <Totals aria-label={title} locale={locale} currency={currency}>
            <Totals.Row label="Subtotal" value={total * 1.1} />
            <Totals.Row label="Discount" value={-total * 0.1} />
            <Totals.Total label="Total" value={total} />
          </Totals>
        </Card>
      ))}
    </div>
  ),
};

export const LocalesChecks: Story = {
  ...Locales,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const total = (name: string) =>
      within(within(canvas.getByRole('list', { name })).getAllByRole('listitem')[2]);
    await expect(total('en-US, USD').getByText('$2,519.99')).toBeVisible();
    // French: a space for the thousands, the comma for decimals, the euro after the figure.
    const french = total('fr-FR, EUR').getByText(/2.519,99.€/);
    await expect(french).toBeVisible();
    // A currency with no decimals writes none, so the figure rounds.
    const yen = total('ja-JP, JPY (no decimals)').getByText(/378,000/);
    await expect(yen.textContent).not.toMatch(/[.]/);
  },
};

const SIGNS = (
  <>
    <Totals.Row label="Gain" value={5} />
    <Totals.Row label="Loss" value={-5} />
    <Totals.Row label="Loss too small to show" value={-0.001} />
    <Totals.Row label="Nothing" value={0} />
  </>
);

/**
 * By default a minus shows in front of a negative amount only: no plus in front of a gain and no
 * `-$0.00` for a loss that rounds to zero. `signDisplay="exceptZero"` adds the plus.
 */
export const SignDisplay: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      {(['negative', 'exceptZero'] as const).map((signDisplay) => (
        <Card key={signDisplay}>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">{signDisplay}</p>
          <Totals aria-label={signDisplay} currency="USD" locale="en-US" signDisplay={signDisplay}>
            {SIGNS}
          </Totals>
        </Card>
      ))}
    </div>
  ),
};

export const SignDisplayChecks: Story = {
  ...SignDisplay,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const amounts = (name: string) =>
      within(canvas.getByRole('list', { name }))
        .getAllByRole('listitem')
        .map((row) => row.lastElementChild?.textContent);
    await expect(amounts('negative')).toEqual(['$5.00', '-$5.00', '$0.00', '$0.00']);
    await expect(amounts('exceptZero')).toEqual(['+$5.00', '-$5.00', '$0.00', '$0.00']);
  },
};

/** At 375px a long label wraps, a coupon code with no break point breaks, and the amounts stay on one line. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { 'aria-label': 'Order summary', currency: 'USD', locale: 'en-US' },
  render: (args) => (
    <Totals {...args}>
      <Totals.Row label="Subtotal (3 items)" value={1248} />
      <Totals.Row
        label="Discount: spring launch weekend, 10% off orders over $100, one use per customer"
        value={-124.8}
      />
      <Totals.Row label="Coupon SPRINGLAUNCHWEEKENDEXTRADISCOUNT2026FORMEMBERS" value={-10} />
      <Totals.Row label="Shipping" value={9.9} />
      <Totals.Row label="Tax (20%)" value={224.62} />
      <Totals.Total label="Total" value={1347.72} />
      <Totals.Note>Taxes are calculated again at checkout.</Totals.Note>
    </Totals>
  ),
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const list = canvas.getByRole('list', { name: 'Order summary' });
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    const rows = within(list).getAllByRole('listitem');
    // The long label wraps onto lines of its own and the code breaks inside the row.
    await expect(textLines(rows[1].firstElementChild!)).toBeGreaterThan(1);
    const code = rows[2].firstElementChild as HTMLElement;
    await expect(textLines(code)).toBeGreaterThan(1);
    await expect(code.scrollWidth).toBeLessThanOrEqual(code.clientWidth);
    // The amounts keep one line each, at the end edge, inside the viewport.
    for (const row of rows.slice(0, 6)) {
      const amount = row.lastElementChild as HTMLElement;
      await expect(textLines(amount)).toBe(1);
      await expect(endOffset(amount, list)).toBeLessThan(1.5);
      await expect(amount.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    }
  },
};

/** In Arabic the labels start on the right and the figures end on the left, in Arabic digits. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  args: { 'aria-label': 'ملخص الطلب', currency: 'EGP', locale: 'ar-EG' },
  render: (args) => (
    <Card className="max-w-sm">
      <Totals {...args}>
        <Totals.Row label="المجموع الفرعي" value={1200} />
        <Totals.Row label="الخصم (SPRING10)" value={-120} />
        <Totals.Row label="الشحن">مجاني</Totals.Row>
        <Totals.Row label="ضريبة القيمة المضافة (14%)" value={151.2} />
        <Totals.Total label="الإجمالي" value={1231.2} />
        <Totals.Note>الأسعار بالجنيه المصري.</Totals.Note>
      </Totals>
    </Card>
  ),
};

export const RightToLeftChecks: Story = {
  ...RightToLeft,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'ملخص الطلب' });
    await expect(getComputedStyle(list).direction).toBe('rtl');
    const rows = within(list).getAllByRole('listitem');
    // The figures are Arabic-Indic digits, with the minus of a discount.
    const discount = rows[1].lastElementChild as HTMLElement;
    await expect(discount.textContent).toMatch(/[٠-٩]/);
    await expect(discount.textContent).not.toMatch(/[0-9]/);
    await expect(discount.textContent).toContain('-');
    for (const row of rows.slice(0, 5)) {
      await expect(startOffset(row.firstElementChild!, list)).toBeLessThan(1.5);
      await expect(endOffset(row.lastElementChild!, list)).toBeLessThan(1.5);
    }
  },
};

// How far the end of the text of `el` is from the end edge of `box`: the right edge in left to
// right, the left one in right to left.
const textEndGap = (el: Element, box: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const text = range.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return getComputedStyle(box).direction === 'rtl' ? text.left - b.left : b.right - text.right;
};

/** The same block mirrors: labels at the start, figures and the note at the end, in both directions. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="max-w-sm">
        <Totals aria-label="Order summary" currency="USD" locale="en-US">
          {CART}
        </Totals>
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const list = within(box).getByRole('list');
      const rows = within(list).getAllByRole('listitem');
      for (const row of rows.slice(0, 5)) {
        expect(
          startOffset(row.firstElementChild!, list),
          `${dir}: label at the start`
        ).toBeLessThan(1.5);
        expect(endOffset(row.lastElementChild!, list), `${dir}: figure at the end`).toBeLessThan(
          1.5
        );
      }
      expect(textEndGap(rows[5], list), `${dir}: note at the end`).toBeLessThan(1.5);
      // The minus stays in front of the figure, where the text of a discount reads it.
      const discount = within(rows[1]).getByText('-$12.00');
      const range = document.createRange();
      range.setStart(discount.firstChild!, 0);
      range.setEnd(discount.firstChild!, 1);
      const minus = range.getBoundingClientRect().left;
      range.setStart(discount.firstChild!, 3);
      range.setEnd(discount.firstChild!, 4);
      expect(minus, `${dir}: the minus is left of the digits`).toBeLessThan(
        range.getBoundingClientRect().left
      );
    }
  },
};
