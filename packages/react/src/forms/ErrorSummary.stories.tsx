import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { Input } from './Input';
import { Select } from './Select';
import { ErrorSummary, type ErrorSummaryItem } from './ErrorSummary';

const meta = {
  title: 'Forms/Error Summary',
  component: ErrorSummary,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { errors: [] },
} satisfies Meta<typeof ErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

// The first field is named by its own id, the second by the box around it, the third is a
// Select: the link focuses the first control it finds, whichever is named.
const ERRORS: ErrorSummaryItem[] = [
  { field: 'name', label: 'Organisation name' },
  { field: 'url-box', label: 'Booking URL' },
  { field: 'plan', label: 'Plan' },
];

const Form = ({ errors }: { errors: ErrorSummaryItem[] }) => (
  <form className="max-w-xl space-y-4" noValidate>
    <ErrorSummary title="We couldn’t save your changes" errors={errors} />
    <Input id="name" label="Organisation name" error="Enter a name." />
    <div id="url-box">
      <Input label="Booking URL" error="That address is taken." />
    </div>
    <Select
      id="plan"
      label="Plan"
      error="Choose a plan."
      options={[
        { value: '', label: 'Choose…' },
        { value: 'team', label: 'Team' },
      ]}
    />
  </form>
);

export const Default: Story = {
  render: () => <Form errors={ERRORS} />,
};

export const LinksFocusTheirField: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const summary = canvas.getByRole('alert');
    await expect(within(summary).getByText('We couldn’t save your changes')).toBeVisible();
    const fields = [
      ['Organisation name', canvas.getByRole('textbox', { name: 'Organisation name' })],
      ['Booking URL', canvas.getByRole('textbox', { name: 'Booking URL' })],
      ['Plan', canvas.getByRole('combobox', { name: 'Plan' })],
    ] as const;
    for (const [name, field] of fields) {
      await userEvent.click(within(summary).getByRole('link', { name }));
      await expect(field).toHaveFocus();
    }
  },
};

/** One field, two, three: "needs" and "need", and the list joined with commas and an "and". */
export const WordingFollowsTheCount: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-xl space-y-4">
      <ErrorSummary errors={ERRORS.slice(0, 1)} />
      <ErrorSummary errors={ERRORS.slice(0, 2)} />
      <ErrorSummary errors={ERRORS} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [one, two, three] = canvas.getAllByRole('alert');
    await expect(one).toHaveTextContent(
      'There is a problemFix 1 field and try again: Organisation name needs attention.'
    );
    await expect(two).toHaveTextContent(
      'Fix 2 fields and try again: Organisation name and Booking URL need attention.'
    );
    await expect(three).toHaveTextContent(
      'Fix 3 fields and try again: Organisation name, Booking URL and Plan need attention.'
    );
  },
};

export const NoErrorsDrawsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ErrorSummary errors={[]} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

/** The link skips a disabled control and lands on the first one that can take the focus. */
export const SkipsDisabledControls: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-xl space-y-4">
      <ErrorSummary errors={[{ field: 'range', label: 'Date range' }]} />
      <div id="range" className="flex gap-2">
        <input aria-label="Locked" disabled />
        <input aria-label="From" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('link', { name: 'Date range' }));
    await expect(canvas.getByRole('textbox', { name: 'From' })).toHaveFocus();
  },
};

/** A field that is not on the page leaves the click to the browser, which follows `#missing`. */
export const MissingFieldLeavesTheLink: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ErrorSummary errors={[{ field: 'missing', label: 'Somewhere else' }]} />,
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Somewhere else' });
    await expect(link).toHaveAttribute('href', '#missing');
    // A listener above React's sees whether the click was claimed, then cancels the jump.
    let claimed: boolean | undefined;
    const record = (event: Event) => {
      claimed = event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener('click', record);
    try {
      link.click();
    } finally {
      document.removeEventListener('click', record);
    }
    await expect(claimed).toBe(false);
  },
};

const LONG_ERRORS: ErrorSummaryItem[] = [
  { field: 'name', label: 'Organisation name and the legal name of its registered office' },
  { field: 'url-box', label: 'Public booking address of the first climbing gym' },
  { field: 'plan', label: 'Plan' },
];

/** On a 375px screen the sentence wraps in the banner, and the page does not scroll sideways. */
export const OnMobile: Story = {
  render: () => <Form errors={LONG_ERRORS} />,
  globals: mobileViewport,
};

export const OnMobileChecks: Story = {
  ...OnMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};
