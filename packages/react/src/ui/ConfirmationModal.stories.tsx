import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';

const meta = {
  title: 'Overlays/Confirmation Modal',
  component: ConfirmationModal,
  // ConfirmationModal portals into `document.body` — force iframe rendering
  // in autodocs so the dialog doesn't take over the Storybook docs page.
  parameters: portalDocsParams.md(),
  tags: ['autodocs'],
  args: { open: false, onStay: () => {} },
} satisfies Meta<typeof ConfirmationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnsavedChanges: Story = {
  args: {
    open: true,
    onStay: () => {},
    onDiscard: () => {},
    onSave: () => {},
  },
};

export const ConfirmDelete: Story = {
  args: {
    open: true,
    title: 'Delete this rack?',
    message: 'This action cannot be undone.',
    discardLabel: 'Delete',
    hideSave: true,
    onStay: () => {},
    onDiscard: () => {},
  },
};

export const SavingInProgress: Story = {
  args: {
    open: true,
    saving: true,
    onStay: () => {},
    onDiscard: () => {},
    onSave: () => {},
  },
};

export const TriggeredFromButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>Open confirmation</Button>
        <ConfirmationModal
          open={open}
          onStay={() => setOpen(false)}
          onDiscard={() => setOpen(false)}
          onSave={() => setOpen(false)}
        />
      </div>
    );
  },
};

export const StayClosesModal: Story = {
  args: { open: true, onStay: fn(), onDiscard: () => {}, onSave: () => {} },
  play: async ({ args }) => {
    // ConfirmationModal renders into the same DOM (no portal), use document
    const stay = within(document.body).getByRole('button', { name: 'Stay' });
    await userEvent.click(stay);
    await expect(args.onStay).toHaveBeenCalled();
  },
};

/** Escape means Stay; once closed, Escape no longer reaches it. */
export const EscapeStaysOnce: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onStay: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const stay = () => {
      args.onStay();
      setOpen(false);
    };
    return <ConfirmationModal open={open} onStay={stay} onDiscard={() => {}} />;
  },
  play: async ({ args }) => {
    const body = within(document.body);
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await userEvent.keyboard('{Escape}');
    await expect(args.onStay).toHaveBeenCalledTimes(1);
  },
};

// ── Focus and actions ────────────────────────────────────────────────────────

// A trigger, a button after it and a confirmation, so the tests can tell the
// dialog from the page and see where focus goes back to.
const OpenFromButton = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open confirmation</Button>
      <Button variant="secondary">After</Button>
      <ConfirmationModal open={open} onStay={close} onDiscard={close} onSave={close} />
    </div>
  );
};

/** Tab and Shift+Tab cycle through the dialog's buttons and never reach the page behind it. */
export const TabStaysInsideTheDialog: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <OpenFromButton />,
  play: async ({ canvas }) => {
    const body = within(document.body);
    canvas.getByRole('button', { name: 'Open confirmation' }).focus();
    await userEvent.keyboard('{Enter}');
    const dialog = within(await body.findByRole('dialog', { name: 'Unsaved changes' }));

    // Focus starts on the first control, the close icon.
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Close' })).toHaveFocus());
    for (const name of ['Stay', 'Discard', 'Save & go', 'Close']) {
      await userEvent.tab();
      await expect(dialog.getByRole('button', { name })).toHaveFocus();
    }
    // Backwards from the first control, it wraps to the last.
    await userEvent.tab({ shift: true });
    await expect(dialog.getByRole('button', { name: 'Save & go' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'After' })).not.toHaveFocus();
  },
};

/** However the dialog closes, focus goes back to the button that opened it. */
export const FocusReturnsToTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <OpenFromButton />,
  play: async ({ canvas }) => {
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: 'Open confirmation' });
    const closers = [
      () => userEvent.keyboard('{Escape}'),
      () => userEvent.click(body.getByRole('button', { name: 'Stay' })),
      () => userEvent.click(body.getByRole('button', { name: 'Discard' })),
      () => userEvent.click(body.getByRole('button', { name: 'Save & go' })),
    ];
    for (const close of closers) {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await body.findByRole('dialog');
      await close();
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};

/** Each action calls its own handler; the backdrop and the close icon mean Stay. */
export const ActionsCallTheirHandlers: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onStay: fn(), onDiscard: fn(), onSave: fn() },
  play: async ({ args }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');

    await userEvent.click(body.getByRole('button', { name: 'Discard' }));
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
    await userEvent.click(body.getByRole('button', { name: 'Save & go' }));
    await expect(args.onSave).toHaveBeenCalledTimes(1);
    await expect(args.onStay).not.toHaveBeenCalled();

    await userEvent.click(body.getByRole('button', { name: 'Close' }));
    await expect(args.onStay).toHaveBeenCalledTimes(1);
    // The backdrop is the dialog's first child.
    await userEvent.click(dialog.firstElementChild as HTMLElement);
    await expect(args.onStay).toHaveBeenCalledTimes(2);
  },
};

/** While `saving`, Save is disabled and a click on it does nothing. */
export const SavingDisablesTheSaveButton: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onStay: fn(), onSave: fn(), saving: true },
  play: async ({ args }) => {
    const save = await within(document.body).findByRole('button', { name: 'Save & go' });
    await expect(save).toBeDisabled();
    await userEvent.click(save);
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

/** `hideSave` drops the Save button even when an `onSave` is passed. */
export const HideSaveRemovesTheSaveButton: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onStay: fn(), onSave: fn(), hideSave: true },
  play: async () => {
    const body = within(document.body);
    await body.findByRole('dialog');
    await expect(body.queryByRole('button', { name: 'Save & go' })).toBeNull();
    await expect(body.getByRole('button', { name: 'Stay' })).toBeVisible();
  },
};
