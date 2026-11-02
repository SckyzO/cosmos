import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  endOffset,
  expectBorderToken,
  expectFocusBorder,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectPlaceholderContrast,
  expectSuccessBorder,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Type here…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Email', placeholder: 'user@example.com' },
};

export const WithIcon: Story = {
  args: { label: 'Email', icon: Mail, placeholder: 'user@example.com' },
};

export const WithDescription: Story = {
  args: {
    label: 'Email',
    icon: Mail,
    placeholder: 'user@example.com',
    description: 'We will never share your email.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Endpoint URL',
    placeholder: 'https://prom.example.com',
    error: 'Must start with https://',
  },
};

export const WithEndSlot: Story = {
  args: {
    label: 'Scrape interval',
    placeholder: '15',
    type: 'number',
    endSlot: 'seconds',
  },
};

export const WithPrefix: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    placeholder: 'prom.example.com',
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Bucket name',
    suffix: '.s3.amazonaws.com',
    placeholder: 'my-bucket',
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    label: 'Domain',
    prefix: 'https://',
    suffix: '.com',
    placeholder: 'example',
  },
};

export const PrefixCurrency: Story = {
  args: {
    label: 'Monthly budget',
    prefix: '€',
    suffix: '/ month',
    type: 'number',
    placeholder: '0',
  },
};

export const PrefixWithError: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    placeholder: 'prom.example.com',
    error: 'Host could not be reached.',
  },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="max-w-md">
        <Input
          label="Search"
          placeholder="Type to filter…"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Value: <code>{v || '(empty)'}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const TypingFiresOnChange: Story = {
  tags: ['!dev'],
  args: { label: 'Name', placeholder: 'Your name', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Name');
    await userEvent.type(input, 'Tom');
    // onChange called once per keystroke
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const PrefixTypingFiresOnChange: Story = {
  tags: ['!dev'],
  args: {
    label: 'Domain',
    prefix: 'https://',
    placeholder: 'example',
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByPlaceholderText('example');
    await userEvent.type(input, 'abc');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Email' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'));
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox'), { token: '--color-red-500' });
  },
};

export const FocusShowsAccentBorderInLight: Story = {
  ...FocusShowsAccentBorderInDark,
  tags: ['!dev'],
  globals: { theme: 'light' },
};

export const ErrorFocusShowsRedBorderInLight: Story = {
  ...ErrorFocusShowsRedBorderInDark,
  tags: ['!dev'],
  globals: { theme: 'light' },
};

export const PrefixGroupFocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', prefix: 'https://' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, { border: input.parentElement as HTMLElement });
  },
};

export const PrefixGroupErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Endpoint URL', prefix: 'https://', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expectFocusBorder(input, {
      border: input.parentElement as HTMLElement,
      token: '--color-red-500',
    });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Must start with https://'));
  },
};

export const ErrorIsLinkedAsDescription: Story = {
  tags: ['!dev'],
  args: { label: 'Endpoint URL', error: 'Must start with https://' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    await expect(field).toHaveAccessibleDescription('Must start with https://');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const DescriptionIsLinked: Story = {
  tags: ['!dev'],
  args: { label: 'Endpoint URL', description: 'Full URL of the server.' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    await expect(field).toHaveAccessibleDescription('Full URL of the server.');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

// Native placeholders sat under 4.5:1 on light and sand (#151).
export const PlaceholderContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <Input label="Plain" placeholder="user@example.com" />
      <Input label="With prefix" prefix="https://" placeholder="prom.example.com" />
    </div>
  ),
  play: async ({ canvas }) => {
    const fields = [canvas.getByLabelText('Plain'), canvas.getByLabelText('With prefix')];
    inEachTheme(() => fields.forEach((field) => expectPlaceholderContrast(field)));
  },
};

export const ReadOnly: Story = {
  args: { label: 'API endpoint', defaultValue: 'https://prom.example.com', readOnly: true },
};

export const ReadOnlyWithPrefix: Story = {
  args: {
    label: 'API endpoint',
    prefix: 'https://',
    defaultValue: 'prom.example.com',
    readOnly: true,
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: 'Endpoint URL',
    placeholder: 'https://prom.example.com',
    error: 'Must start with https://',
    errorIcon: true,
  },
};

export const WithErrorIconAndPrefix: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    error: 'Enter a valid host',
    errorIcon: true,
  },
};

export const ReadOnlyIsMutedAndFocusable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'API endpoint', defaultValue: 'https://prom.example.com', readOnly: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'API endpoint' });
    const white = document.createElement('div');
    white.className = 'bg-white dark:bg-gray-800';
    document.body.append(white);
    const editable = getComputedStyle(white).backgroundColor;
    white.remove();
    await expect(getComputedStyle(input).backgroundColor).not.toBe(editable);
    // Not disabled: it takes focus and keeps its value, which can't be typed over.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'x');
    await expect(input).toHaveValue('https://prom.example.com');
  },
};

export const ErrorIconShowsOnlyOnError: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Endpoint URL', errorIcon: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

export const ErrorIconIsDecorative: Story = {
  ...WithErrorIcon,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('svg')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    // The input keeps room for it: its text can't run under the icon.
    const input = canvasElement.querySelector('input')!;
    const pad = parseFloat(getComputedStyle(input).paddingInlineEnd);
    await expect(pad).toBeGreaterThanOrEqual(icon.getBoundingClientRect().width + 12);
  },
};

// ── Success (#405) ───────────────────────────────────────────────────────────

/**
 * `success` is the message under the field once its value is valid: a green border and message,
 * and a check icon on the end edge. `error` wins when both are set.
 */
export const WithSuccess: Story = {
  args: {
    label: 'Username',
    defaultValue: 'sckyzo',
    success: 'Username is available.',
  },
};

export const WithSuccessAndPrefix: Story = {
  args: {
    label: 'Endpoint URL',
    prefix: 'https://',
    defaultValue: 'prom.example.com',
    success: 'Host reached.',
  },
};

/** The message follows the value: `success` while the name is free, `error` once it is taken. */
export const ValidatedAsYouType: Story = {
  render: () => {
    const [name, setName] = useState('');
    const taken = name === 'admin';
    const free = name.length >= 3 && !taken;
    return (
      <div className="max-w-md">
        <Input
          label="Username"
          placeholder="At least 3 characters"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={taken ? 'Username is taken.' : undefined}
          success={free ? 'Username is available.' : undefined}
        />
      </div>
    );
  },
};

export const ValidatedAsYouTypeChecks: Story = {
  ...ValidatedAsYouType,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Username' });
    await userEvent.type(field, 'sc');
    await expect(field).not.toHaveAccessibleDescription();
    await userEvent.type(field, 'k');
    await expect(field).toHaveAccessibleDescription('Username is available.');
    await expect(field).not.toHaveAttribute('aria-invalid');
    await userEvent.clear(field);
    await userEvent.type(field, 'admin');
    await expect(field).toHaveAccessibleDescription('Username is taken.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const SuccessIsLinkedAndAnnounced: Story = {
  ...WithSuccess,
  tags: ['!dev'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Username' });
    const message = canvas.getByText('Username is available.');
    await expect(field).toHaveAccessibleDescription('Username is available.');
    await expect(field.getAttribute('aria-describedby')).toBe(message.id);
    await expect(message.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    // A valid value is not an invalid one: nothing marks the field as such.
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

export const ErrorWinsOverSuccess: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: { label: 'Username', error: 'Username is taken.', success: 'Username is available.' },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('textbox', { name: 'Username' });
    await expect(field).toHaveAccessibleDescription('Username is taken.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.queryByText('Username is available.')).toBeNull();
    await expect(canvas.getByText('Username is taken.')).not.toHaveAttribute('aria-live');
    // The border stays red and no check icon is drawn.
    expectBorderToken(field, '--color-red-400');
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

/** An empty `error` is no error (`error={errors.name ?? ''}`): the success still shows. */
export const EmptyErrorLetsSuccessShow: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  args: { ...WithSuccess.args, error: '' },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Username' });
    await expect(field).toHaveAccessibleDescription('Username is available.');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

export const SuccessColorsInEveryTheme: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Username' });
    const message = canvas.getByText('Username is available.');
    expectSuccessBorder(field);
    inEachTheme(() => expectTextContrast(message));
  },
};

export const SuccessFocusShowsAccentBorderInDark: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    await expectFocusBorder(canvas.getByRole('textbox', { name: 'Username' }));
  },
};

export const PrefixGroupSuccessFocusShowsAccentBorderInDark: Story = {
  ...WithSuccessAndPrefix,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    await expectFocusBorder(input, { border: input.parentElement as HTMLElement });
  },
};

export const SuccessIconIsDecorativeOnTheEndEdge: Story = {
  ...WithSuccess,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('svg')!;
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    const input = canvasElement.querySelector('input')!;
    // 12px from the end edge (`inset-e-3`), and the text can't run under it.
    await expect(endOffset(icon, input)).toBe(12);
    const pad = parseFloat(getComputedStyle(input).paddingInlineEnd);
    await expect(pad).toBeGreaterThanOrEqual(icon.getBoundingClientRect().width + 12);
  },
};

/** The end slot owns the end edge: it replaces the check, the rest of the state stays. */
export const SuccessIconYieldsToEndSlot: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Scrape interval', endSlot: 'seconds', success: 'Target reachable.' },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('textbox', { name: 'Scrape interval' });
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(field).toHaveAccessibleDescription('Target reachable.');
    expectSuccessBorder(field);
  },
};

export const PrefixGroupSuccess: Story = {
  ...WithSuccessAndPrefix,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: 'Endpoint URL' });
    const group = input.parentElement as HTMLElement;
    await expect(input).toHaveAccessibleDescription('Host reached.');
    // The group draws the border, and the check sits inside it.
    expectSuccessBorder(group);
    await expect(group).toContainElement(canvasElement.querySelector('svg') as SVGElement);
  },
};

/** Without `success` the field is what it was: neutral border, no icon, no live region. */
export const NoSuccessKeepsTheNeutralLook: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: { label: 'Email', description: 'We will never share your email.' },
  play: async ({ canvas, canvasElement }) => {
    expectBorderToken(canvas.getByRole('textbox', { name: 'Email' }), '--color-gray-200');
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('We will never share your email.')).not.toHaveAttribute(
      'aria-live'
    );
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * A text field follows the direction of what is typed in it (`unicode-bidi: plaintext`), and keeps
 * the page's own direction, so the room it leaves for a trailing icon stays under the icon: a URL
 * in a right-to-left page reads left to right, and its end padding is still on the icon's side.
 */
export const TextFollowsWhatIsTypedInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div dir="rtl" className="space-y-4">
      <Input
        label="Website"
        defaultValue="https://example.com/a-long-path-to-a-page"
        error="Not reachable."
        errorIcon
      />
      <Input label="الاسم" defaultValue="محمد" error="مطلوب." errorIcon />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const name of ['Website', 'الاسم']) {
      const input = canvas.getByRole('textbox', { name });
      const style = getComputedStyle(input);
      await expect(style.unicodeBidi).toBe('plaintext');
      // The field keeps the page's direction: the padding that clears the icon is where the icon is.
      await expect(style.direction).toBe('rtl');
      const icon = input.parentElement!.querySelector('svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(parseFloat(style.paddingLeft)).toBeGreaterThanOrEqual(
        icon.getBoundingClientRect().width + 12
      );
      await expect(icon.getBoundingClientRect().left).toBeLessThan(
        input.getBoundingClientRect().left + 28
      );
    }
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** The icon, the addons and the slot sit on the same edge of the field, mirrored. */
export const AdornmentsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-3">
        <Input label="Email" icon={Mail} defaultValue="user@example.com" />
        <Input label="Endpoint" prefix="https://" suffix=".com" defaultValue="example" />
        <Input label="Interval" endSlot="seconds" defaultValue="30" />
        <Input label="Username" defaultValue="sckyzo" success="Available." />
      </div>
    )),
  play: ({ canvasElement }) => {
    const input = (box: HTMLElement, name: string) => within(box).getByRole('textbox', { name });
    expectMirrored(canvasElement, (box) => input(box, 'Email').parentElement!.querySelector('svg'));
    expectMirrored(canvasElement, (box) => input(box, 'Endpoint').parentElement!.firstElementChild);
    expectMirrored(canvasElement, (box) => input(box, 'Endpoint').parentElement!.lastElementChild);
    expectMirrored(canvasElement, (box) => input(box, 'Interval').nextElementSibling);
    expectMirrored(canvasElement, (box) => input(box, 'Username').nextElementSibling);
  },
};

/** An addon is an island: `https://` keeps its slashes after the colon in a right-to-left page. */
export const AddonsAreIsolatedInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div dir="rtl">
      <Input label="Endpoint" prefix="https://" suffix=".com" defaultValue="example" />
    </div>
  ),
  play: ({ canvasElement }) => {
    const [prefix, suffix] = [...canvasElement.querySelectorAll('bdi')];
    expect(prefix).toHaveTextContent('https://');
    expect(suffix).toHaveTextContent('.com');
    for (const island of [prefix!, suffix!]) {
      expect(getComputedStyle(island).direction).toBe('ltr');
      expect(getComputedStyle(island).unicodeBidi).toBe('isolate');
    }
  },
};

// ── aria-describedby ─────────────────────────────────────────────────────────

/** A caller's `aria-describedby` is added to the field's own, not a replacement for it. */
export const CallerDescribedByIsMergedWithOwn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <Input label="Own only" description="Used on the invoice." />
      <Input label="Caller only" aria-describedby="note" />
      <Input label="Both" description="Used on the invoice." aria-describedby="note" />
      <Input label="Error and caller" error="Required." aria-describedby="note" />
      <Input label="Neither" />
      <p id="note">Extra note</p>
    </>
  ),
  play: ({ canvas }) => {
    const field = (name: string) => canvas.getByLabelText(name);
    const own = (name: string) => `${field(name).id}-desc`;
    expect(field('Own only')).toHaveAttribute('aria-describedby', own('Own only'));
    expect(field('Caller only')).toHaveAttribute('aria-describedby', 'note');
    // The field's own message comes first, then the caller's.
    expect(field('Both')).toHaveAttribute('aria-describedby', `${own('Both')} note`);
    expect(field('Both')).toHaveAccessibleDescription('Used on the invoice. Extra note');
    expect(field('Error and caller')).toHaveAttribute(
      'aria-describedby',
      `${own('Error and caller')} note`
    );
    expect(field('Neither')).not.toHaveAttribute('aria-describedby');
  },
};
