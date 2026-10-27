import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { portalDocsParams } from '../storybook-helpers';
import { LogEntryDetail } from './LogEntryDetail';
import { fakeLine, fakeLines } from './storybook-logs';

const meta = {
  title: 'Monitoring/Log Entry Detail',
  component: LogEntryDetail,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { line: fakeLine(4) },
  decorators: [(Story) => <div className="max-w-xl">{Story()}</div>],
} satisfies Meta<typeof LogEntryDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const WITH_STACK = {
  ...fakeLine(4),
  level: 'error',
  stack:
    'TimeoutError: query exceeded 5000 ms\n    at PromClient.query (prom/client.py:118)\n    at MetricsService.cpu (services/metrics.py:64)',
};

/** The fields, the stack trace and the raw record of an error. */
export const Default: Story = { args: { line: WITH_STACK } };

/** With the host's handlers, each field also offers "Filter on this value" and "Exclude this value". */
export const FieldActions: Story = {
  args: { line: WITH_STACK, onFilterValue: fn(), onExcludeValue: fn(), onCopyField: fn() },
};

/** "Show context" draws the lines before and after, passed up front. */
export const WithContext: Story = {
  args: {
    line: WITH_STACK,
    context: { before: fakeLines(3, 1), after: fakeLines(3, 5) },
  },
};

/** A line with nothing but a message. */
export const MessageOnly: Story = {
  args: {
    line: { id: 1, time: Date.parse('2026-01-15T06:12:00.123Z'), message: 'Scheduler started' },
  },
};

/** In a drawer, the way a logs page opens it. */
export const InDrawer: Story = {
  parameters: portalDocsParams.lg(),
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open the entry
        </Button>
        <Drawer open={open} onClose={() => setOpen(false)} size="lg">
          <Drawer.Header title="Log entry" />
          <Drawer.Body>
            <LogEntryDetail
              line={WITH_STACK}
              context={{ before: fakeLines(3, 1), after: fakeLines(3, 5) }}
            />
          </Drawer.Body>
        </Drawer>
      </>
    );
  },
};

/** The test of the actions, hidden: filter and exclude get the field and its value, context is fetched on demand. */
export const FieldActionsCallBack: Story = {
  tags: ['!dev', '!autodocs'],
  args: { line: WITH_STACK, onFilterValue: fn(), onExcludeValue: fn() },
  render: function Render(args) {
    const [context, setContext] = useState<undefined | { before: never[]; after: never[] }>();
    return (
      <LogEntryDetail
        {...args}
        context={context}
        onShowContext={() => setContext({ before: [], after: [] })}
      />
    );
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter on rack' }));
    expect(args.onFilterValue).toHaveBeenCalledWith('rack', WITH_STACK.fields!.rack);
    await userEvent.click(canvas.getByRole('button', { name: 'Exclude rack' }));
    expect(args.onExcludeValue).toHaveBeenCalledWith('rack', WITH_STACK.fields!.rack);
    await userEvent.click(canvas.getByRole('button', { name: 'Show context' }));
    expect(canvas.getByRole('button', { name: 'Hide context' })).toBeVisible();
    expect(within(document.body).queryByText('Raw record')).toBeVisible();
  },
};
