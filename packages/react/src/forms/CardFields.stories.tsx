import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  expectFocusBorder,
  expectNoHorizontalOverflow,
  expectPlaceholderContrast,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { CardCvcInput } from './CardCvcInput';
import { CardExpiryInput } from './CardExpiryInput';
import { CardFields, type CardValue } from './CardFields';
import { CardNumberInput } from './CardNumberInput';
import { cardBrand, cardCvcLength, cardNumberLengths, expiryValid, luhnValid } from './cardFormat';
import type { CardBrand } from './cardFormat';

const SECURITY =
  "Cosmos never handles real card data. A real checkout takes the card through its payment provider's hosted fields, which keep the number off your app. These fields are for demos, prototypes and providers that hand the values to your own code. They set no `name` attribute, so a plain form post never sends a card by accident.";

const meta = {
  title: 'Forms/Card Fields',
  component: CardFields,
  parameters: { layout: 'padded', docs: { description: { component: SECURITY } } },
  tags: ['autodocs'],
  args: { legend: 'Card details' },
} satisfies Meta<typeof CardFields>;

export default meta;
type Story = StoryObj<typeof meta>;

const VISA: CardValue = { number: '4539144185296306', expiry: '1230', cvc: '123' };
const AMEX: CardValue = { number: '374185296307413', expiry: '1230', cvc: '1234' };
// A number whose checksum is off, a month that is over and a code a digit short.
const BAD: CardValue = { number: '4539144185296307', expiry: '0925', cvc: '12' };

const Frame = ({ children }: { children: ReactNode }) => <div className="max-w-md">{children}</div>;

/** The group, empty: the number on its own line, the expiry and the code side by side. */
export const Default: Story = {
  render: (args) => (
    <Frame>
      <CardFields {...args} />
    </Frame>
  ),
};

/** A Visa: the number grouped by fours, its brand in the pill, a code of three digits. */
export const Filled: Story = {
  args: { defaultValue: VISA },
  render: Default.render,
};

/** An Amex: grouped 4-6-5, and the code takes four digits. */
export const Amex: Story = {
  args: { defaultValue: AMEX },
  render: Default.render,
};

export const Required: Story = {
  args: { required: true },
  render: Default.render,
};

/** The page decides when to check and which words to use; the group shows each field's message. */
export const Errors: Story = {
  args: {
    defaultValue: BAD,
    errors: {
      number: 'Check the card number.',
      expiry: 'This card has expired.',
      cvc: 'Enter the 3-digit code.',
    },
  },
  render: Default.render,
};

/** An error about the card as a whole sits under the three fields. */
export const Declined: Story = {
  args: { defaultValue: VISA, error: 'Your card was declined.' },
  render: Default.render,
};

export const Disabled: Story = {
  args: { defaultValue: VISA, disabled: true },
  render: Default.render,
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-8">
      <CardFields {...args} legend="Small" size="sm" defaultValue={VISA} />
      <CardFields {...args} legend="Medium" size="md" defaultValue={VISA} />
      <CardFields {...args} legend="Large" size="lg" defaultValue={VISA} />
    </div>
  ),
};

/** Each field works on its own: an "add a card" page may only ask for a new date. */
export const FieldsAlone: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-5">
      <CardNumberInput
        label="Card number"
        description="The 16 digits on the front."
        defaultValue="5412418529630746"
      />
      <CardExpiryInput label="Expiry date" defaultValue="1230" />
      <CardCvcInput label="Security code" brand="amex" defaultValue="1234" />
    </div>
  ),
};

export const FieldErrorsAlone: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-5">
      <CardNumberInput
        label="Card number"
        defaultValue="4539144185296307"
        error="Check the card number."
      />
      <CardExpiryInput label="Expiry date" defaultValue="0925" error="This card has expired." />
      <CardCvcInput label="Security code" defaultValue="12" error="Enter the 3-digit code." />
    </div>
  ),
};

const BRAND_NUMBERS: [label: string, number: string][] = [
  ['Visa', '4539144185296306'],
  ['Mastercard', '5412418529630746'],
  ['Amex', '374185296307413'],
  ['Discover', '6011111111111117'],
  ['Diners Club', '30569309025904'],
  ['JCB', '3530111333300000'],
  ['UnionPay', '6200000000000005'],
];

/** One number per brand: the pill names the brand the leading digits point to. */
export const BrandPills: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
      {BRAND_NUMBERS.map(([label, number]) => (
        <CardNumberInput key={label} label={label} defaultValue={number} />
      ))}
    </div>
  ),
};

// ── A checkout ──────────────────────────────────────────────────────────────

type CardErrors = Partial<Record<keyof CardValue, string>>;

// The checks are the page's: the helpers answer, the page picks the words and the moment.
const check = ({ number, expiry, cvc }: CardValue): CardErrors => {
  const brand = cardBrand(number);
  const need = cardCvcLength(brand);
  const errors: CardErrors = {};
  if (!number) errors.number = 'Enter your card number.';
  else if (!cardNumberLengths(brand).includes(number.length))
    errors.number = 'The card number is incomplete.';
  else if (!luhnValid(number)) errors.number = 'Check the card number.';
  if (expiry.length < 4) errors.expiry = 'Enter the expiry date as MM / YY.';
  else if (!expiryValid(expiry)) errors.expiry = 'This card has expired or the month is wrong.';
  if (cvc.length !== need) errors.cvc = `Enter the ${need}-digit code.`;
  return errors;
};

const CheckoutPayment = ({ initial }: { initial?: CardValue }) => {
  const [card, setCard] = useState<CardValue>(initial ?? { number: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState<CardErrors>({});
  const [status, setStatus] = useState('');
  const pay = () => {
    const next = check(card);
    setErrors(next);
    setStatus(
      Object.keys(next).length === 0
        ? 'The format is valid. A payment provider would answer here.'
        : ''
    );
  };
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="checkout-payment-title" className="min-w-0">
        <h2
          id="checkout-payment-title"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
        >
          Payment
        </h2>
        <AlertBanner intent="info" title="For demos and prototypes" className="mb-6">
          Cosmos never handles real card data. A real checkout uses its payment provider&apos;s
          hosted fields.
        </AlertBanner>
        <CardFields
          legend="Card details"
          required
          value={card}
          onChange={setCard}
          errors={errors}
        />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={pay}>Pay $128.00</Button>
          {status && (
            <p role="status" className="text-sm text-green-700 dark:text-green-400">
              {status}
            </p>
          )}
        </div>
      </section>
      <aside
        aria-label="Order summary"
        className="h-fit rounded-2xl border border-gray-200 bg-[var(--color-bg-panel)] p-5 dark:border-gray-700"
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Order summary</h3>
        <dl className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>$120.00</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>$8.00</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
            <dt>Total</dt>
            <dd>$128.00</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
};

/** The group in the payment step of a checkout, beside the order summary. */
export const Checkout: Story = {
  parameters: { layout: 'padded' },
  render: () => <CheckoutPayment />,
};

/** At 375px the summary goes under the form and the code and the expiry stay side by side. */
const checkoutMobile: Story = {
  globals: mobileViewport,
  render: () => <CheckoutPayment initial={VISA} />,
};

export const CheckoutMobileChecks: Story = {
  ...checkoutMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
    const expiry = canvas.getByRole('textbox', { name: /^Expiry date/ });
    const code = canvas.getByRole('textbox', { name: /^Security code/ });
    // Still two columns: side by side, on one row.
    await expect(
      Math.abs(expiry.getBoundingClientRect().top - code.getBoundingClientRect().top)
    ).toBeLessThan(2);
    await expect(
      Math.abs(expiry.getBoundingClientRect().width - code.getBoundingClientRect().width)
    ).toBeLessThan(2);
  },
};

/** The page's own checks on Pay: the helpers answer, the group shows the messages. */
export const CheckoutChecksOnPay: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <CheckoutPayment initial={BAD} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Pay $128.00' }));
    await expect(canvas.getByText('Check the card number.')).toBeVisible();
    await expect(canvas.getByText('This card has expired or the month is wrong.')).toBeVisible();
    await expect(canvas.getByText('Enter the 3-digit code.')).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: /^Card number/ })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  },
};

// ── Interaction tests ───────────────────────────────────────────────────────

type Canvas = ReturnType<typeof within>;
const numberField = (canvas: Canvas) => canvas.getByRole('textbox', { name: 'Card number' });
const expiryField = (canvas: Canvas) => canvas.getByRole('textbox', { name: 'Expiry date' });
const cvcField = (canvas: Canvas) => canvas.getByRole('textbox', { name: 'Security code' });
const caretOf = (field: HTMLElement) => (field as HTMLInputElement).selectionStart;
const hidden = ['!dev', '!autodocs'];

/** The number groups itself by fours as it is typed, and the value stays the bare digits. */
export const TypingGroupsTheNumber: Story = {
  tags: hidden,
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '4111');
    await expect(field).toHaveValue('4111');
    await userEvent.type(field, '1');
    await expect(field).toHaveValue('4111 1');
    await userEvent.type(field, '11111111111');
    await expect(field).toHaveValue('4111 1111 1111 1111');
    await expect(args.onChange).toHaveBeenLastCalledWith({
      number: '4111111111111111',
      expiry: '',
      cvc: '',
    });
    // Letters are not typed.
    await userEvent.type(field, 'ab');
    await expect(field).toHaveValue('4111 1111 1111 1111');
  },
};

/** A digit typed in the middle keeps the caret after it, and the next one lands right behind. */
export const TypingInTheMiddleKeepsTheCaret: Story = {
  tags: hidden,
  play: async ({ canvas }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '411111111');
    await expect(field).toHaveValue('4111 1111 1');
    await userEvent.type(field, '9', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    await expect(field).toHaveValue('4191 1111 11');
    await expect(caretOf(field)).toBe(3);
    await userEvent.keyboard('8');
    await expect(field).toHaveValue('4198 1111 111');
    await expect(caretOf(field)).toBe(4);
  },
};

/** Backspace on the space between two groups removes the digit before it instead of doing nothing. */
export const BackspaceOnASpaceTakesTheDigit: Story = {
  tags: hidden,
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '41112222');
    await expect(field).toHaveValue('4111 2222');
    await userEvent.type(field, '{Backspace}', {
      initialSelectionStart: 5,
      initialSelectionEnd: 5,
    });
    await expect(field).toHaveValue('4112 222');
    await expect(caretOf(field)).toBe(3);
    await expect(args.onChange).toHaveBeenLastCalledWith({
      number: '4112222',
      expiry: '',
      cvc: '',
    });
    // Delete on the space does the same with the digit after it.
    await userEvent.clear(field);
    await userEvent.type(field, '41112222');
    await userEvent.type(field, '{Delete}', { initialSelectionStart: 4, initialSelectionEnd: 4 });
    await expect(field).toHaveValue('4111 222');
    await expect(caretOf(field)).toBe(4);
  },
};

/** A pasted number is accepted with its spaces or dashes, at the end or in the middle. */
export const PastingANumber: Story = {
  tags: hidden,
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    field.focus();
    await userEvent.paste('4111-1111-1111-1111');
    await expect(field).toHaveValue('4111 1111 1111 1111');
    await userEvent.clear(field);
    await userEvent.paste('5412 4185 2963 0746');
    await expect(field).toHaveValue('5412 4185 2963 0746');
    await expect(canvas.getByText('Mastercard')).toBeVisible();
    // Past the longest number of the brand, the rest is cut.
    await userEvent.clear(field);
    await userEvent.paste('3741 8529 6307 4139 999');
    await expect(field).toHaveValue('3741 852963 07413');
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ number: '374185296307413' })
    );
    // In the middle, the caret ends behind what was pasted.
    await userEvent.clear(field);
    await userEvent.type(field, '41111111');
    field.setSelectionRange(4, 4);
    await userEvent.paste('9999 8888');
    await expect(field).toHaveValue('4111 9999 8888 1111');
    await expect(caretOf(field)).toBe(14);
  },
};

/** The expiry shows `MM / YY` over a value of `MMYY`, and Backspace takes the separator with its digit. */
export const ExpiryTypingAndPaste: Story = {
  tags: hidden,
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = expiryField(canvas);
    await userEvent.type(field, '5');
    // A month from 2 to 9 is 02 to 09.
    await expect(field).toHaveValue('05 / ');
    await userEvent.type(field, '28');
    await expect(field).toHaveValue('05 / 28');
    await expect(args.onChange).toHaveBeenLastCalledWith({ number: '', expiry: '0528', cvc: '' });
    await userEvent.type(field, '3');
    await expect(field).toHaveValue('05 / 28');
    await userEvent.type(field, '{Backspace}{Backspace}{Backspace}');
    await expect(field).toHaveValue('0');
    await userEvent.type(field, '9');
    await expect(field).toHaveValue('09 / ');
    await userEvent.clear(field);
    await userEvent.type(field, '1');
    await expect(field).toHaveValue('1');
    // A pasted year in four digits keeps its last two.
    await userEvent.clear(field);
    await userEvent.paste('12/2028');
    await expect(field).toHaveValue('12 / 28');
    await expect(args.onChange).toHaveBeenLastCalledWith({ number: '', expiry: '1228', cvc: '' });
    await userEvent.clear(field);
    await userEvent.paste('12 / 28');
    await expect(field).toHaveValue('12 / 28');
  },
};

/** The code is three digits, four for an Amex, and follows the number with nothing wired. */
export const AmexSwitchesTheCvcToFourDigits: Story = {
  tags: hidden,
  args: { onChange: fn() },
  play: async ({ canvas, args }) => {
    const code = cvcField(canvas);
    await userEvent.type(code, '1234');
    await expect(code).toHaveValue('123');
    await expect(code).toHaveAttribute('placeholder', '123');
    await userEvent.clear(code);
    await userEvent.type(numberField(canvas), '374185296307413');
    await expect(canvas.getByText('Amex')).toBeVisible();
    await expect(code).toHaveAttribute('placeholder', '1234');
    await userEvent.type(code, '1234');
    await expect(code).toHaveValue('1234');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cvc: '1234' }));
    // Back to a Visa: the code is cut to three digits and the page hears of it.
    await userEvent.clear(numberField(canvas));
    await userEvent.type(numberField(canvas), '4111111111111111');
    await waitFor(() => expect(code).toHaveValue('123'));
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ cvc: '123' }));
    await expect(code).toHaveAttribute('placeholder', '123');
  },
};

/** Alone, the code takes its brand from a prop. */
export const CvcAloneTakesTheBrandProp: Story = {
  tags: hidden,
  render: () => (
    <div className="flex max-w-sm flex-col gap-5">
      <CardCvcInput label="Visa code" brand="visa" />
      <CardCvcInput label="Amex code" brand="amex" />
      <CardCvcInput label="No brand" />
    </div>
  ),
  play: async ({ canvas }) => {
    const cases: [string, string][] = [
      ['Visa code', '123'],
      ['Amex code', '1234'],
      ['No brand', '123'],
    ];
    for (const [name, shown] of cases) {
      const field = canvas.getByRole('textbox', { name });
      await userEvent.type(field, '12345');
      await expect(field).toHaveValue(shown);
    }
    await userEvent.type(canvas.getByRole('textbox', { name: 'Amex code' }), 'ab{Backspace}');
    await expect(canvas.getByRole('textbox', { name: 'Amex code' })).toHaveValue('123');
  },
};

/** Autofill and numeric keypads: the right `autocomplete`, `inputmode`, and no `name` unless asked. */
export const AutocompleteAttributesAndNoName: Story = {
  tags: hidden,
  render: (args) => (
    <div className="flex max-w-md flex-col gap-6">
      <CardFields {...args} />
      <CardNumberInput label="Number with a name" name="pan" />
    </div>
  ),
  play: async ({ canvas }) => {
    const group = [numberField(canvas), expiryField(canvas), cvcField(canvas)];
    const autocomplete = ['cc-number', 'cc-exp', 'cc-csc'];
    group.forEach((field, i) => {
      expect(field).toHaveAttribute('autocomplete', autocomplete[i]);
      expect(field).toHaveAttribute('inputmode', 'numeric');
      expect(field).not.toHaveAttribute('name');
      expect(field).toHaveAttribute('type', 'text');
      expect(field).toHaveAttribute('spellcheck', 'false');
    });
    // A host can pass one.
    await expect(canvas.getByRole('textbox', { name: 'Number with a name' })).toHaveAttribute(
      'name',
      'pan'
    );
  },
};

/** The pill reads as text and names the brand; it disappears with the brand. */
export const BrandPillShowsTheName: Story = {
  tags: hidden,
  play: async ({ canvas }) => {
    const field = numberField(canvas);
    const names = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Diners Club', 'JCB', 'UnionPay'];
    await expect(field).toHaveAccessibleDescription('');
    const prefixes: [string, string][] = [
      ['4', 'Visa'],
      ['55', 'Mastercard'],
      ['37', 'Amex'],
      ['6011', 'Discover'],
      ['36', 'Diners Club'],
      ['3530', 'JCB'],
      ['62', 'UnionPay'],
    ];
    for (const [prefix, name] of prefixes) {
      await userEvent.clear(field);
      await userEvent.type(field, prefix);
      await expect(canvas.getByText(name)).toBeVisible();
      for (const other of names.filter((n) => n !== name)) {
        await expect(canvas.queryByText(other)).toBeNull();
      }
      // The brand is part of what the field is described by, not a loose word beside it.
      await expect(field).toHaveAccessibleDescription(name);
    }
    // A lone 5 does not tell yet, and a prefix no brand has stays blank.
    await userEvent.clear(field);
    await userEvent.type(field, '5');
    for (const name of names) await expect(canvas.queryByText(name)).toBeNull();
    await userEvent.clear(field);
    await userEvent.type(field, '9');
    for (const name of names) await expect(canvas.queryByText(name)).toBeNull();
  },
};

/** The group is a fieldset named by its legend, and its error describes it and is announced. */
export const GroupLegendAndSharedError: Story = {
  tags: hidden,
  args: { defaultValue: VISA, error: 'Your card was declined.' },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Card details' });
    await expect(group.tagName).toBe('FIELDSET');
    await expect(group.querySelector('legend')).toHaveTextContent('Card details');
    await expect(group).toHaveAccessibleDescription('Your card was declined.');
    await expect(within(group).getByRole('alert')).toHaveTextContent('Your card was declined.');
    await expect(within(group).getAllByRole('textbox')).toHaveLength(3);
    await expect(numberField(canvas)).toHaveAttribute('autocomplete', 'cc-number');
  },
};

/** No error, no alert and nothing to describe the group by. */
export const GroupWithoutErrorHasNoAlert: Story = {
  tags: hidden,
  args: { defaultValue: VISA },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Card details' });
    await expect(within(group).queryByRole('alert')).toBeNull();
    await expect(group).not.toHaveAttribute('aria-describedby');
    await expect(numberField(canvas)).not.toHaveAttribute('aria-invalid');
  },
};

/** A field's own error turns its border red and describes it; the others are left alone. */
export const FieldErrorsAreDescribed: Story = {
  tags: hidden,
  args: {
    defaultValue: BAD,
    errors: { number: 'Check the card number.', cvc: 'Enter the 3-digit code.' },
  },
  play: async ({ canvas }) => {
    const number = numberField(canvas);
    await expect(number).toHaveAttribute('aria-invalid', 'true');
    await expect(number).toHaveAccessibleDescription(/Check the card number\./);
    await expect(cvcField(canvas)).toHaveAttribute('aria-invalid', 'true');
    await expect(cvcField(canvas)).toHaveAccessibleDescription('Enter the 3-digit code.');
    await expect(expiryField(canvas)).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByText('Check the card number.')).toBeVisible();
    const red = getComputedStyle(number.parentElement!).borderTopColor;
    await expect(red).not.toBe(getComputedStyle(expiryField(canvas).parentElement!).borderTopColor);
  },
};

/** The host owns the three values and hears of the brand, on mount and as it changes. */
export const ControlledValueFollowsTheHost: Story = {
  tags: hidden,
  render: (args) => {
    const [card, setCard] = useState<CardValue>(VISA);
    const [brand, setBrand] = useState<CardBrand | null>(null);
    return (
      <div className="flex max-w-md flex-col gap-4">
        <CardFields {...args} value={card} onChange={setCard} onBrandChange={setBrand} />
        <button type="button" onClick={() => setCard(AMEX)}>
          Use an Amex
        </button>
        <button type="button" onClick={() => setCard({ number: '', expiry: '', cvc: '' })}>
          Reset
        </button>
        <output aria-label="Brand">{brand ?? 'none'}</output>
        <output aria-label="Stored">{JSON.stringify(card)}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(numberField(canvas)).toHaveValue('4539 1441 8529 6306');
    await expect(expiryField(canvas)).toHaveValue('12 / 30');
    await expect(canvas.getByLabelText('Brand')).toHaveTextContent('visa');
    await userEvent.click(canvas.getByRole('button', { name: 'Use an Amex' }));
    await expect(numberField(canvas)).toHaveValue('3741 852963 07413');
    await expect(cvcField(canvas)).toHaveValue('1234');
    await expect(canvas.getByLabelText('Brand')).toHaveTextContent('amex');
    await userEvent.type(cvcField(canvas), '{Backspace}');
    await expect(canvas.getByLabelText('Stored')).toHaveTextContent('"cvc":"123"');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(numberField(canvas)).toHaveValue('');
    await expect(expiryField(canvas)).toHaveValue('');
    await expect(canvas.getByLabelText('Brand')).toHaveTextContent('none');
  },
};

const numberRef = createRef<HTMLInputElement>();
const expiryRef = createRef<HTMLInputElement>();
const cvcRef = createRef<HTMLInputElement>();

/** The page gets the three inputs, to focus the one a validation error names. */
export const InputRefsFocusTheInputs: Story = {
  tags: hidden,
  args: { inputRefs: { number: numberRef, expiry: expiryRef, cvc: cvcRef } },
  play: async ({ canvas }) => {
    await expectRefFocuses(numberRef, numberField(canvas));
    await expectRefFocuses(expiryRef, expiryField(canvas));
    await expectRefFocuses(cvcRef, cvcField(canvas));
  },
};

/** A disabled group disables the fieldset and the three inputs. */
export const DisabledGroupDisablesTheFields: Story = {
  tags: hidden,
  args: { defaultValue: VISA, disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Card details' })).toBeDisabled();
    for (const field of [numberField(canvas), expiryField(canvas), cvcField(canvas)]) {
      await expect(field).toBeDisabled();
    }
  },
};

/** One border and one halo around the number and its pill, in the accent. */
export const FocusShowsAccentBorderInDark: Story = {
  tags: hidden,
  globals: { theme: 'dark' },
  args: { defaultValue: VISA },
  play: async ({ canvas }) => {
    for (const field of [numberField(canvas), expiryField(canvas), cvcField(canvas)]) {
      await expectFocusBorder(field, { border: field.parentElement! });
    }
  },
};

/** The pill, the placeholder and the labels read in every theme. */
export const TextReadsInEveryTheme: Story = {
  tags: hidden,
  args: { defaultValue: { number: '4539144185296306', expiry: '', cvc: '' } },
  play: async ({ canvas }) => {
    const pill = canvas.getByText('Visa').parentElement!;
    inEachTheme(() => {
      expectTextContrast(pill);
      expectTextContrast(canvas.getByText('Card number'));
      expectPlaceholderContrast(expiryField(canvas));
      expectPlaceholderContrast(cvcField(canvas));
    });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * A card number, a date and a code read left to right in any page: each field is an island, with
 * the icon, the digits and the pill in that order from the left, while the labels and the legend
 * keep the page's side.
 */
export const NumbersStayLeftToRightInRightToLeft: Story = {
  tags: hidden,
  args: { defaultValue: VISA },
  render: (args) => (
    <div dir="rtl" data-testid="page" className="max-w-md">
      <CardFields {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const page = canvas.getByTestId('page');
    for (const field of [numberField(canvas), expiryField(canvas), cvcField(canvas)]) {
      await expect(field.parentElement).toHaveAttribute('dir', 'ltr');
      await expect(getComputedStyle(field).direction).toBe('ltr');
    }
    const box = numberField(canvas).parentElement!;
    const input = numberField(canvas).getBoundingClientRect();
    const icon = box.querySelector('svg')!.getBoundingClientRect();
    const pill = canvas.getByText('Visa').closest('span')!.getBoundingClientRect();
    await expect(icon.right).toBeLessThanOrEqual(input.left + 1);
    await expect(pill.left).toBeGreaterThanOrEqual(input.right - 1);
    // The labels and the legend keep the page's side.
    await expect(startOffset(canvas.getByText('Card number'), page)).toBeCloseTo(0, 0);
    await expect(startOffset(canvas.getByText('Card details'), page)).toBeCloseTo(0, 0);
    // The value reads in order whatever the page does.
    await expect(numberField(canvas)).toHaveValue('4539 1441 8529 6306');
    await userEvent.type(numberField(canvas), '{Backspace}', {
      initialSelectionStart: 19,
      initialSelectionEnd: 19,
    });
    await expect(numberField(canvas)).toHaveValue('4539 1441 8529 630');
  },
};
