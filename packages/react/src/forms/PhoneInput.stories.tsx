import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import {
  expectFocusBorder,
  expectNoHorizontalOverflow,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { FormRow } from './FormRow';
import { PhoneInput } from './PhoneInput';

const meta = {
  title: 'Forms/Phone Input',
  component: PhoneInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Phone number' },
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultCountry: 'FR', defaultValue: '+33612345678' },
};

export const Empty: Story = {
  args: { description: 'We only call about your order.', placeholder: '201 555 0123' },
};

/** The country list is cut to the countries the product ships to. */
export const AllowList: Story = {
  args: { countries: ['FR', 'DE', 'BE', 'CH', 'ES', 'IT'], defaultCountry: 'FR' },
};

/** A UK number puts the country by itself: +44 is shared with Jersey, Guernsey and the Isle of Man, and the main one is the United Kingdom. */
export const PrefilledNumber: Story = {
  args: { defaultValue: '+447911123456' },
};

export const Required: Story = {
  args: { defaultCountry: 'DE', defaultValue: '+4915112345678', required: true },
};

export const Error: Story = {
  args: {
    defaultCountry: 'DE',
    defaultValue: '+4915112345678',
    error: 'This number is already linked to another account.',
  },
};

export const Disabled: Story = {
  args: { defaultCountry: 'FR', defaultValue: '+33612345678', disabled: true },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-6">
      <PhoneInput label="Small" size="sm" defaultCountry="FR" defaultValue="+33612345678" />
      <PhoneInput label="Medium" size="md" defaultCountry="FR" defaultValue="+33612345678" />
      <PhoneInput label="Large" size="lg" defaultCountry="FR" defaultValue="+33612345678" />
    </div>
  ),
};

/** A bare field is named and described by its row, as the other controls are. */
export const InAFormRow: Story = {
  render: () => (
    <div className="max-w-2xl rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
      <FormRow label="Mobile phone" description="Used for two-factor codes">
        <PhoneInput defaultCountry="FR" defaultValue="+33612345678" />
      </FormRow>
    </div>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Mobile phone' });
    await expect(field).toHaveAccessibleDescription('Used for two-factor codes');
  },
};

// A host plugs a formatter in (libphonenumber-js's AsYouType, here a stand-in for France).
const formatFrance = (country: string, national: string) =>
  country === 'FR'
    ? `${national.slice(0, 1)} ${
        national
          .slice(1)
          .match(/.{1,2}/g)
          ?.join(' ') ?? ''
      }`.trim()
    : national;

export const WithHostFormat: Story = {
  args: { defaultCountry: 'FR', defaultValue: '+33612345678', format: formatFrance },
};

/** At 375px the field fills the screen and the list stays inside it. */
export const MobileFillsTheScreen: Story = {
  globals: mobileViewport,
  render: () => (
    <div className="p-4">
      <PhoneInput
        label="Phone number"
        defaultCountry="FR"
        defaultValue="+33612345678"
        description="Used for two-factor codes"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Interaction tests ───────────────────────────────────────────────────────

const numberField = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('textbox', { name: 'Phone number' });
const trigger = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('button', { name: /^Country:/ });
const searchField = () => screen.getByRole('combobox', { name: 'Search countries' });
// The name on each row, without its flag.
const names = () =>
  screen
    .getAllByRole('option')
    .map((o) => (o.textContent ?? '').replace(/^[^\p{L}]+/u, '').split(/ [A-Z]{2}\+/)[0]!);
const option = (name: string) => screen.getByRole('option', { name: new RegExp(`^${name}`) });

/** The list: flag, name, ISO code and calling code on each row, the current country marked. */
export const OpenListShowsTheCountries: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  args: { defaultCountry: 'FR', defaultValue: '+33612345678' },
  play: async ({ canvas }) => {
    await userEvent.click(trigger(canvas));
    await expect(searchField()).toHaveFocus();
    await expect(trigger(canvas)).toHaveAttribute('aria-expanded', 'true');
    const france = option('France');
    await expect(france).toHaveAttribute('aria-selected', 'true');
    await expect(france).toHaveTextContent('France FR+33');
    await expect(france.querySelector('[aria-hidden]')).toHaveTextContent('\u{1F1EB}\u{1F1F7}');
    await expect(option('Germany')).toHaveAttribute('aria-selected', 'false');
    // Alphabetical, in the page language.
    const listed = names();
    await expect(listed.indexOf('Algeria')).toBeGreaterThan(-1);
    await expect(listed.indexOf('Algeria')).toBeLessThan(listed.indexOf('Zimbabwe'));
    await expect(listed).toEqual([...listed].sort((a, b) => a.localeCompare(b, 'en')));
    // The list is whole: the table has 243 countries.
    await expect(screen.getAllByRole('option')).toHaveLength(243);
  },
};

/** Picking a country keeps the digits typed and reports the number with the new calling code. */
export const PickingACountryKeepsTheDigits: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCountry: 'FR', onChange: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.type(numberField(canvas), '612345678');
    await expect(args.onChange).toHaveBeenLastCalledWith('+33612345678');
    await userEvent.click(trigger(canvas));
    await userEvent.click(option('Germany'));
    await expect(args.onChange).toHaveBeenLastCalledWith('+49612345678');
    await expect(numberField(canvas)).toHaveValue('612345678');
    await expect(trigger(canvas)).toHaveAccessibleName('Country: Germany, DE +49');
    await expect(trigger(canvas)).toHaveTextContent(/DE\s*\+49/);
    // The list is closed and focus is back on its trigger.
    await expect(screen.queryByRole('listbox')).toBeNull();
    await expect(trigger(canvas)).toHaveFocus();
  },
};

/** The search takes a name, an ISO code or a calling code, and the keyboard picks. */
export const SearchAndKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  args: { defaultCountry: 'FR', defaultValue: '+33612345678', onChange: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(trigger(canvas));
    await userEvent.type(searchField(), 'ger');
    await expect(names()).toEqual(['Algeria', 'Germany', 'Niger', 'Nigeria']);
    await userEvent.keyboard('{ArrowDown}');
    await expect(searchField()).toHaveAttribute('aria-activedescendant', option('Germany').id);
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('+49612345678');
    await expect(trigger(canvas)).toHaveAccessibleName('Country: Germany, DE +49');

    // By ISO code, then by calling code with or without the plus.
    await userEvent.click(trigger(canvas));
    await userEvent.type(searchField(), 'dz');
    await expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.clear(searchField());
    await userEvent.type(searchField(), '+212');
    await expect(names()).toContain('Morocco');
    await userEvent.clear(searchField());
    await userEvent.type(searchField(), 'zzzz');
    await expect(screen.getByText('No matches found.')).toBeVisible();
  },
};

/** Escape closes the list and puts focus back on the trigger; ArrowDown on the trigger opens it. */
export const EscapeAndArrowDown: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCountry: 'FR' },
  play: async ({ canvas }) => {
    trigger(canvas).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(screen.getByRole('listbox')).toBeVisible();
    await expect(searchField()).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await expect(trigger(canvas)).toHaveFocus();
  },
};

/** A "+" and a known calling code switch the country and leave the rest in the field. */
export const TypingAPlusCodeSwitchesTheCountry: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCountry: 'FR', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '+49');
    await expect(trigger(canvas)).toHaveAccessibleName('Country: Germany, DE +49');
    await expect(field).toHaveValue('');
    await userEvent.type(field, '15112345678');
    await expect(args.onChange).toHaveBeenLastCalledWith('+4915112345678');
    // A pasted full number does the same.
    await userEvent.clear(field);
    await userEvent.paste('+34 612 345 678');
    await expect(trigger(canvas)).toHaveAccessibleName('Country: Spain, ES +34');
    await expect(args.onChange).toHaveBeenLastCalledWith('+34612345678');
    await expect(field).toHaveValue('612345678');
  },
};

/** A shared code keeps the current country when it has it, else takes the code's main country. */
export const SharedCodeKeepsOrTakesTheMainCountry: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex max-w-sm flex-col gap-6">
      <PhoneInput label="Canada" defaultCountry="CA" />
      <PhoneInput label="France" defaultCountry="FR" />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Canada' }), '+1');
    await expect(canvas.getAllByRole('button')[0]).toHaveAccessibleName('Country: Canada, CA +1');
    await userEvent.type(canvas.getByRole('textbox', { name: 'France' }), '+1');
    await expect(canvas.getAllByRole('button')[1]).toHaveAccessibleName(
      'Country: United States, US +1'
    );
  },
};

/** An allow-list also limits what a typed code can switch to. */
export const AllowListLimitsTheCodes: Story = {
  tags: ['!dev', '!autodocs'],
  args: { countries: ['FR', 'BE'], defaultCountry: 'FR', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.click(trigger(canvas));
    await expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.keyboard('{Escape}');
    await userEvent.type(field, '+4915112345678');
    await userEvent.tab();
    // Germany is not on the list: the number is not a number.
    await expect(trigger(canvas)).toHaveAccessibleName('Country: France, FR +33');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByText('Enter a phone number with 4 to 15 digits.')).toBeVisible();
  },
};

/** Light check: 4 digits at least, shown on blur; only a number that passes reaches `onChange`. */
export const LightValidationOnBlur: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCountry: 'DE', onChange: fn() },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    const message = 'Enter a phone number with 4 to 15 digits.';
    await userEvent.type(field, '12');
    await expect(canvas.queryByText(message)).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByText(message)).toBeVisible();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(message);
    await expect(args.onChange).not.toHaveBeenCalled();

    // Typing takes the message away, and the number is reported once it has 4 digits.
    await userEvent.type(field, '3');
    await expect(canvas.queryByText(message)).toBeNull();
    await userEvent.type(field, '4');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith('+491234');

    // Too long with the country code: back to '' and the message on blur.
    await userEvent.type(field, '5'.repeat(11));
    await expect(args.onChange).toHaveBeenLastCalledWith('');
    await userEvent.tab();
    await expect(canvas.getByText(message)).toBeVisible();
    // Letters are not typed.
    await userEvent.clear(field);
    await userEvent.type(field, 'ab12');
    await expect(field).toHaveValue('12');
  },
};

/** `validate` rejects what the light rule accepted, with its own message. */
export const HostValidateHasTheLastWord: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    defaultCountry: 'FR',
    onChange: fn(),
    validate: (value: string) => (value.startsWith('+336') ? undefined : 'Enter a French mobile.'),
  },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '112345678');
    await userEvent.tab();
    await expect(canvas.getByText('Enter a French mobile.')).toBeVisible();
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.clear(field);
    await userEvent.type(field, '612345678');
    await expect(args.onChange).toHaveBeenLastCalledWith('+33612345678');
  },
};

/** `format` shapes the digits as they are typed; the value stays the bare E.164 number. */
export const HostFormatShapesTheField: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultCountry: 'FR', onChange: fn(), format: formatFrance },
  play: async ({ canvas, args }) => {
    const field = numberField(canvas);
    await userEvent.type(field, '612345678');
    await expect(field).toHaveValue('6 12 34 56 78');
    await expect(args.onChange).toHaveBeenLastCalledWith('+33612345678');
  },
};

/** The host owns the value: a new number moves the country, a reset empties the field. */
export const ControlledValueFollowsTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [value, setValue] = useState('+33612345678');
    return (
      <div className="flex max-w-sm flex-col gap-4">
        <PhoneInput label="Phone number" defaultCountry="FR" value={value} onChange={setValue} />
        <button type="button" onClick={() => setValue('+4915112345678')}>
          Use a German number
        </button>
        <button type="button" onClick={() => setValue('')}>
          Reset
        </button>
        <output aria-label="Stored">{value}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const field = numberField(canvas);
    await expect(field).toHaveValue('612345678');
    await userEvent.click(canvas.getByRole('button', { name: 'Use a German number' }));
    await expect(trigger(canvas)).toHaveAccessibleName('Country: Germany, DE +49');
    await expect(field).toHaveValue('15112345678');
    await userEvent.clear(field);
    await userEvent.type(field, '1234');
    await expect(canvas.getByLabelText('Stored')).toHaveTextContent('+491234');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(field).toHaveValue('');
    await expect(canvas.getByLabelText('Stored')).toHaveTextContent('');
  },
};

/** Country names are written in the page language. */
export const NamesFollowThePageLanguage: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  args: { defaultCountry: 'DE' },
  beforeEach: () => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = 'fr';
    return () => {
      document.documentElement.lang = previous;
    };
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(trigger(canvas)).toHaveAccessibleName('Country: Allemagne, DE +49'));
    await userEvent.click(trigger(canvas));
    await expect(option('Allemagne')).toBeVisible();
    await expect(option('Royaume-Uni')).toBeInTheDocument();
  },
};

const phoneRef = createRef<HTMLInputElement>();

export const RefFocusesTheNumberField: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ref: phoneRef },
  play: async ({ canvas }) => {
    await expectRefFocuses(phoneRef, numberField(canvas));
  },
};

/** One border and one focus ring around both parts, whichever is focused or while the list is open. */
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  parameters: portalDocsParams.md(),
  args: { defaultCountry: 'FR' },
  play: async ({ canvas }) => {
    const group = numberField(canvas).parentElement as HTMLElement;
    await expectFocusBorder(numberField(canvas), { border: group });
    numberField(canvas).blur();
    await expectFocusBorder(trigger(canvas), { border: group });
    // The list holds focus in its search field: the field stays ringed while it is open.
    await userEvent.click(trigger(canvas));
    await expect(searchField()).toHaveFocus();
    await waitFor(() => expect(group).toHaveAttribute('data-open'));
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500');
    const probe = document.createElement('span');
    probe.style.color = accent;
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    await expect(getComputedStyle(group).borderTopColor).toBe(expected);
  },
};

/** Text of the list and of the trigger reads in every theme. */
export const TextReadsInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.md(),
  args: { defaultCountry: 'FR', defaultValue: '+33612345678' },
  play: async ({ canvas }) => {
    await userEvent.click(trigger(canvas));
    const france = option('France');
    inEachTheme(() => {
      for (const el of [
        trigger(canvas).children[1]!,
        trigger(canvas).children[2]!,
        france.children[1]!.children[0]!,
        france.children[1]!.children[1]!,
        france.children[2]!,
      ]) {
        expectTextContrast(el);
      }
    });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * A phone number reads left to right in any page: the country button stays on the left of the
 * digits and the list opens as an island, under the field, while the label keeps the page's side.
 */
export const FieldIsLeftToRightInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.lg(),
  args: { defaultCountry: 'FR', defaultValue: '+33612345678' },
  render: (args) => (
    <div dir="rtl">
      <PhoneInput {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = trigger(canvas);
    const input = numberField(canvas);
    const field = button.parentElement!;
    await expect(field).toHaveAttribute('dir', 'ltr');
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
      input.getBoundingClientRect().left + 1
    );
    await expect(
      startOffset(canvas.getByText('Phone number'), button.closest('[dir="rtl"]')!)
    ).toBeCloseTo(0, 0);
    await userEvent.click(button);
    const list = await screen.findByRole('listbox', { name: 'Countries' });
    const panel = list.closest('[dir]')!;
    await expect(panel).toHaveAttribute('dir', 'ltr');
    await expect(panel.getBoundingClientRect().left).toBeCloseTo(
      field.getBoundingClientRect().left,
      0
    );
    await userEvent.keyboard('{Escape}');
  },
};
