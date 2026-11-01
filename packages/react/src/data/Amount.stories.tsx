import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../table/Table';
import {
  bothDirections,
  directionBox,
  expectReadsLeftToRight,
  inEachTheme,
  expectTextContrast,
  textLines,
} from '../storybook-helpers';
import { Amount } from './Amount';
import type { MoneySignDisplay } from './money';

const meta = {
  title: 'Data/Amount',
  component: Amount,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 1234.5, currency: 'USD', locale: 'en-US' },
} satisfies Meta<typeof Amount>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A figure of money: written by `formatMoney`, on one line, in digits of one width. */
export const Default: Story = {};

/** The same amount in other places: the separators, the digits and the currency follow the locale. */
export const Locales: Story = {
  render: () => (
    <ul className="space-y-2 text-sm text-[var(--color-text-primary)]">
      {[
        { locale: 'en-US', currency: 'USD' },
        { locale: 'en-IN', currency: 'INR' },
        { locale: 'fr-FR', currency: 'EUR' },
        { locale: 'de-CH', currency: 'CHF' },
        { locale: 'ja-JP', currency: 'JPY' },
        { locale: 'ar-EG', currency: 'EGP' },
        { locale: 'he-IL', currency: 'ILS' },
      ].map(({ locale, currency }) => (
        <li key={locale} className="flex items-baseline gap-4">
          <code className="w-28 text-xs text-[var(--color-text-muted)]">{locale}</code>
          <Amount value={1234567.5} currency={currency} locale={locale} />
        </li>
      ))}
    </ul>
  ),
};

export const LocalesChecks: Story = {
  ...Locales,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const amount = (locale: string) => canvas.getByText(locale).nextElementSibling as HTMLElement;
    await expect(amount('en-US').textContent).toBe('$1,234,567.50');
    // Lakh grouping in India, an apostrophe in Switzerland.
    await expect(amount('en-IN').textContent).toBe('₹12,34,567.50');
    await expect(amount('de-CH').textContent).toMatch(/1.?234.?567\.50/);
    // The yen has no decimals, so the half rounds up.
    await expect(amount('ja-JP').textContent).toMatch(/1,234,568$/);
    await expect(amount('ar-EG').textContent).toMatch(/[٠-٩]/);
    await expect(amount('ar-EG').textContent).not.toMatch(/[0-9]/);
    for (const el of canvas.getAllByRole('listitem').map((li) => li.lastElementChild!)) {
      await expect(el.tagName).toBe('BDI');
      await expect(getComputedStyle(el).whiteSpace).toBe('nowrap');
      await expect(getComputedStyle(el).fontVariantNumeric).toContain('tabular-nums');
    }
  },
};

const MODES: MoneySignDisplay[] = ['negative', 'exceptZero', 'always', 'never', 'auto'];
const VALUES = [12.5, -12.5, 0, -0.001];

/** `signDisplay` picks which amounts get a sign. The default, `negative`, never writes `-$0.00`. */
export const SignDisplay: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>signDisplay</TableHeaderCell>
          {VALUES.map((value) => (
            <TableHeaderCell key={value} numeric>
              {value}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {MODES.map((mode) => (
          <TableRow key={mode}>
            <TableCell>
              <code>{mode}</code>
              {mode === 'negative' && ' (default)'}
            </TableCell>
            {VALUES.map((value) => (
              <TableCell key={value} numeric>
                <Amount value={value} currency="USD" locale="en-US" signDisplay={mode} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const SignDisplayChecks: Story = {
  ...SignDisplay,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = (mode: string) =>
      within(canvas.getByRole('row', { name: new RegExp(`^${mode}`) }))
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent);
    await expect(row('negative')).toEqual(['$12.50', '-$12.50', '$0.00', '$0.00']);
    await expect(row('exceptZero')).toEqual(['+$12.50', '-$12.50', '$0.00', '$0.00']);
    await expect(row('always')).toEqual(['+$12.50', '-$12.50', '+$0.00', '-$0.00']);
    await expect(row('never')).toEqual(['$12.50', '$12.50', '$0.00', '$0.00']);
    await expect(row('auto')).toEqual(['$12.50', '-$12.50', '$0.00', '-$0.00']);
  },
};

/** In a sentence it takes the colour and the weight of the text around it. */
export const InText: Story = {
  render: () => (
    <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
      Your balance is{' '}
      <Amount
        value={-42}
        currency="USD"
        locale="en-US"
        className="font-semibold text-red-700 dark:text-red-400"
      />{' '}
      after the refund of <Amount value={19.9} currency="USD" locale="en-US" />. We will take the
      difference from your card on 1 March.
    </p>
  ),
};

export const InTextChecks: Story = {
  ...InText,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const balance = canvas.getByText('-$42.00');
    const refund = canvas.getByText('$19.90');
    // The tint is the caller's, and the sentence's own colour is kept where there is none.
    await expect(getComputedStyle(balance).color).not.toBe(getComputedStyle(refund).color);
    await expect(getComputedStyle(refund).color).toBe(
      getComputedStyle(refund.parentElement!).color
    );
    await expect(getComputedStyle(balance).fontWeight).toBe('600');
    inEachTheme(() => {
      for (const el of [balance, refund]) expectTextContrast(el);
    });
  },
};

/** In a right-to-left sentence the minus stays in front of the figure. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
      رصيدك بعد الاسترداد: <Amount value={-42} currency="USD" locale="en-US" />. سيتم خصم الفرق من
      بطاقتك.
    </p>
  ),
};

/** `format` writes the value yourself, in place of the currency, the locale and the sign. */
export const CustomFormat: Story = {
  args: { value: 1250, format: (value: number) => `${value.toLocaleString('en-US')} credits` },
};

export const CustomFormatChecks: Story = {
  ...CustomFormat,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1,250 credits')).toBeVisible();
  },
};

// The minus of a plain `<span>` jumps to the other side of the figure in a right-to-left line; the
// `<bdi>` of `Amount` keeps it in front.
export const ReadsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <p>
        <span data-testid="plain">-$12.50</span>{' '}
        <Amount value={-12.5} currency="USD" locale="en-US" />
      </p>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = within(directionBox(canvasElement, dir));
      expectReadsLeftToRight(box.getByText('-$12.50', { selector: 'bdi' }));
    }
    // The same text with no `<bdi>` is reversed in the right-to-left box, which is what the
    // component is for.
    const plain = within(directionBox(canvasElement, 'rtl')).getByTestId('plain');
    expect(() => expectReadsLeftToRight(plain)).toThrow();
  },
};

/** The amount never breaks over two lines, even in a box too narrow for it. */
export const StaysOnOneLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 40 }}>
      <Amount value={1234567.89} currency="USD" locale="en-US" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(textLines(canvas.getByText('$1,234,567.89'))).toBe(1);
  },
};
