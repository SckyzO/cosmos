import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/Button';
import { clipOf, expectFoldClosed } from '../storybook-folds';
import { isFading } from '../storybook-motion';
import { CardNumberInput } from './CardNumberInput';
import { CheckboxGroup } from './Checkbox';
import { ColorInput } from './ColorInput';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { FileInput } from './FileInput';
import { Input } from './Input';
import { MultiSelect } from './MultiSelect';
import { PhoneInput } from './PhoneInput';
import { RadioGroup } from './Radio';
import { Select } from './Select';
import { TimePicker } from './TimePicker';

/**
 * The line under a field (its description, its error, its success message) unfolds when it
 * appears, so the rest of the form moves down over 200 ms instead of at once, and folds back when
 * it goes. A field that has its message from the first render simply has it.
 */
const meta = {
  title: 'Forms/Field errors',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const MESSAGE = 'Enter a valid email address.';

// A form that checks its email on submit: the error shows then, and goes once the value is right.
const EmailForm = ({ description }: { description?: string }) => {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const error = checked && !/^\S+@\S+\.\S+$/.test(value) ? MESSAGE : undefined;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setChecked(true);
      }}
      className="max-w-sm space-y-4"
    >
      <Input
        label="Email"
        value={value}
        description={description}
        onChange={(event) => setValue(event.target.value)}
        error={error}
      />
      <Input label="Name" />
      <Button type="submit">Check</Button>
    </form>
  );
};

/**
 * Check the empty email: the error unfolds under the field and the rest of the form follows it
 * down. Type a valid address and it folds back. With the reduced setting it comes and goes at
 * once.
 */
export const ErrorUnfoldsUnderTheField: Story = {
  parameters: { settleMotion: false },
  render: () => <EmailForm />,
};

// The box that folds around a message.
const foldAround = (message: HTMLElement) => message.closest<HTMLElement>('div.grid')!;

// In the accessibility tree: no ancestor hides it or takes it out of the page.
const expectReachable = (message: HTMLElement) =>
  expect(message.closest('[aria-hidden="true"], [inert]')).toBeNull();

/**
 * The message is read as it always was, and from the commit that shows it: the field is invalid
 * and described by it, the element is not hidden, while it is still unfolding.
 */
export const ErrorIsDescribedAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <EmailForm />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await expect(input).not.toHaveAttribute('aria-describedby');
    await expect(canvas.queryByText(MESSAGE)).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    // Right away, and not once the unfold has played.
    const message = canvas.getByText(MESSAGE);
    expectReachable(message);
    await expect(isFading(foldAround(message))).toBe(true);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input.getAttribute('aria-describedby')).toBe(message.id);
    await expect(input).toHaveAccessibleDescription(MESSAGE);

    // At rest it does not clip: a focus ring at its edge is not cut.
    await waitFor(() =>
      expect(getComputedStyle(clipOf(foldAround(message))).overflow).toBe('visible')
    );
    await expect(isFading(foldAround(message))).toBe(false);
  },
};

/**
 * When the error clears the field stops naming it and the line is out of reach at once; it folds
 * back and is gone once it has.
 */
export const ErrorFoldsBackAndIsGone: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <EmailForm />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    const message = canvas.getByText(MESSAGE);
    const fold = foldAround(message);
    await waitFor(() => expect(isFading(fold)).toBe(false));

    await userEvent.type(input, 'user@example.com');
    // The field says nothing of it any more, and the line is shut at once.
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(input).not.toHaveAttribute('aria-describedby');
    expectFoldClosed(fold);
    await waitFor(() => expect(canvas.queryByText(MESSAGE)).toBeNull(), { timeout: 2000 });
    await expect(fold.isConnected).toBe(false);

    // And it comes again, each time.
    await userEvent.clear(input);
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    const again = canvas.getByText(MESSAGE);
    expectReachable(again);
    await expect(isFading(foldAround(again))).toBe(true);
  },
};

/** A field that has its error from the first render has it: nothing unfolds. */
export const ErrorThereFromTheStartDoesNotMove: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => (
    <div className="max-w-sm">
      <Input label="Email" error={MESSAGE} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const message = canvas.getByText(MESSAGE);
    expectReachable(message);
    await expect(isFading(canvasElement)).toBe(false);
    await expect(getComputedStyle(clipOf(foldAround(message))).overflow).toBe('visible');
    await expect(canvas.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      MESSAGE
    );
  },
};

/**
 * With a description under the field, the error takes the line's place: the line was there, so
 * it neither unfolds nor folds, and the description is back when the error goes.
 */
export const ErrorReplacesTheDescriptionInPlace: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <EmailForm description="We never share it." />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    const description = canvas.getByText('We never share it.');
    const fold = foldAround(description);
    await expect(isFading(fold)).toBe(false);

    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    const message = canvas.getByText(MESSAGE);
    await expect(foldAround(message)).toBe(fold);
    await expect(isFading(fold)).toBe(false);
    await expect(input).toHaveAccessibleDescription(MESSAGE);

    await userEvent.type(input, 'user@example.com');
    await expect(canvas.getByText('We never share it.')).toBeVisible();
    await expect(foldAround(canvas.getByText('We never share it.'))).toBe(fold);
    await expect(isFading(fold)).toBe(false);
    await expect(input).toHaveAccessibleDescription('We never share it.');
  },
};

/** With the reduced setting the error is there as soon as it shows and gone as soon as it clears. */
export const ErrorComesAndGoesAtOnceUnderReducedMotion: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <EmailForm />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    const message = canvas.getByText(MESSAGE);
    expectReachable(message);
    await expect(isFading(foldAround(message))).toBe(false);
    await expect(input).toHaveAccessibleDescription(MESSAGE);

    await userEvent.type(input, 'user@example.com');
    await expect(canvas.queryByText(MESSAGE)).toBeNull();
    await expect(input).not.toHaveAttribute('aria-describedby');
  },
};

// ── Every field ──────────────────────────────────────────────────────────────

const OPTIONS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];

const FIELDS: { name: string; render: (error?: string) => ReactNode }[] = [
  { name: 'Input', render: (error) => <Input label="Input" error={error} /> },
  { name: 'Select', render: (error) => <Select label="Select" options={OPTIONS} error={error} /> },
  {
    name: 'Combobox',
    render: (error) => <Combobox label="Combobox" options={OPTIONS} error={error} />,
  },
  {
    name: 'MultiSelect',
    render: (error) => <MultiSelect label="MultiSelect" options={OPTIONS} error={error} />,
  },
  { name: 'PhoneInput', render: (error) => <PhoneInput label="PhoneInput" error={error} /> },
  { name: 'ColorInput', render: (error) => <ColorInput label="ColorInput" error={error} /> },
  { name: 'DatePicker', render: (error) => <DatePicker label="DatePicker" error={error} /> },
  { name: 'FileInput', render: (error) => <FileInput label="FileInput" error={error} /> },
  { name: 'TimePicker', render: (error) => <TimePicker label="TimePicker" error={error} /> },
  {
    name: 'CardNumberInput',
    render: (error) => <CardNumberInput label="CardNumberInput" error={error} />,
  },
  {
    name: 'CheckboxGroup',
    render: (error) => <CheckboxGroup legend="CheckboxGroup" options={OPTIONS} error={error} />,
  },
  {
    name: 'RadioGroup',
    render: (error) => <RadioGroup legend="RadioGroup" options={OPTIONS} error={error} />,
  },
];

const AllFields = () => {
  const [error, setError] = useState<string>();
  return (
    <div className="max-w-sm space-y-5">
      <div className="flex gap-2">
        <Button onClick={() => setError('Check this one.')}>Show errors</Button>
        <Button variant="secondary" onClick={() => setError(undefined)}>
          Clear errors
        </Button>
      </div>
      {FIELDS.map(({ name, render }) => (
        <div key={name} data-testid={name}>
          {render(error)}
        </div>
      ))}
    </div>
  );
};

/** The same line under every field that shows one: show the errors, then clear them. */
export const ErrorUnfoldsOnEveryField: Story = {
  parameters: { settleMotion: false },
  render: () => <AllFields />,
};

/**
 * Every field takes the error in the same way: reachable from the commit that shows it, while it
 * unfolds, folded shut at once when it clears and gone after.
 */
export const EveryFieldUnfoldsAndFoldsItsError: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <AllFields />,
  play: async ({ canvas }) => {
    const MARK = 'Check this one.';
    const boxes = FIELDS.map(({ name }) => within(canvas.getByTestId(name)));
    for (const box of boxes) await expect(box.queryByText(MARK)).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Show errors' }));
    const folds = boxes.map((box, i) => {
      const message = box.getByText(MARK);
      expectReachable(message);
      const fold = foldAround(message);
      expect(isFading(fold), FIELDS[i]!.name).toBe(true);
      return fold;
    });
    await waitFor(() =>
      folds.forEach((fold, i) =>
        expect(getComputedStyle(clipOf(fold)).overflow, FIELDS[i]!.name).toBe('visible')
      )
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Clear errors' }));
    folds.forEach((fold) => expectFoldClosed(fold));
    await waitFor(
      () => boxes.forEach((box, i) => expect(box.queryByText(MARK), FIELDS[i]!.name).toBeNull()),
      { timeout: 2000 }
    );
  },
};
