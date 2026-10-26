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
  args: { open: false, onClose: () => {} },
} satisfies Meta<typeof ConfirmationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnsavedChanges: Story = {
  args: {
    open: true,
    onClose: () => {},
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
    onClose: () => {},
    onDiscard: () => {},
  },
};

export const SavingInProgress: Story = {
  args: {
    open: true,
    saving: true,
    onClose: () => {},
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
          onClose={() => setOpen(false)}
          onDiscard={() => setOpen(false)}
          onSave={() => setOpen(false)}
        />
      </div>
    );
  },
};

export const StayClosesModal: Story = {
  tags: ['!dev'],
  args: { open: true, onClose: fn(), onDiscard: () => {}, onSave: () => {} },
  play: async ({ args }) => {
    // ConfirmationModal portals into document.body: query the document.
    const stay = within(document.body).getByRole('button', { name: 'Stay' });
    await userEvent.click(stay);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

/** Escape means Stay; once closed, Escape no longer reaches it. */
export const EscapeStaysOnce: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClose: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const stay = () => {
      args.onClose();
      setOpen(false);
    };
    return <ConfirmationModal open={open} onClose={stay} onDiscard={() => {}} />;
  },
  play: async ({ args }) => {
    const body = within(document.body);
    await body.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull());
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
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
      <ConfirmationModal open={open} onClose={close} onDiscard={close} onSave={close} />
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
    const dialog = within(await body.findByRole('alertdialog', { name: 'Unsaved changes' }));

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
      await body.findByRole('alertdialog');
      await close();
      await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};

/** Each action calls its own handler; the backdrop and the close icon mean Stay. */
export const ActionsCallTheirHandlers: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn(), onDiscard: fn(), onSave: fn() },
  play: async ({ args }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');

    await userEvent.click(body.getByRole('button', { name: 'Discard' }));
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
    await userEvent.click(body.getByRole('button', { name: 'Save & go' }));
    await expect(args.onSave).toHaveBeenCalledTimes(1);
    await expect(args.onClose).not.toHaveBeenCalled();

    await userEvent.click(body.getByRole('button', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    // The backdrop is the dialog's first child.
    await userEvent.click(dialog.firstElementChild as HTMLElement);
    await expect(args.onClose).toHaveBeenCalledTimes(2);
  },
};

/** While `saving`, Save is disabled and a click on it does nothing. */
export const SavingDisablesTheSaveButton: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn(), onSave: fn(), saving: true },
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
  args: { open: true, onClose: fn(), onSave: fn(), hideSave: true },
  play: async () => {
    const body = within(document.body);
    await body.findByRole('alertdialog');
    await expect(body.queryByRole('button', { name: 'Save & go' })).toBeNull();
    await expect(body.getByRole('button', { name: 'Stay' })).toBeVisible();
  },
};

/** An alert dialog, modal, named by its title and described by its message. */
export const IsAnAlertDialogNamedByItsTitle: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    open: true,
    title: 'Delete this rack?',
    message: 'This action cannot be undone.',
    onClose: fn(),
    onDiscard: fn(),
  },
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog', {
      name: 'Delete this rack?',
    });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription('This action cannot be undone.');
  },
};

/** While `saving`, Save swaps its icon for a spinner; Stay and Discard still work. */
export const SavingLeavesStayAndDiscard: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn(), onDiscard: fn(), onSave: fn(), saving: true },
  play: async ({ args }) => {
    const body = within(document.body);
    const save = await body.findByRole('button', { name: 'Save & go' });
    await expect(save.querySelector('.animate-spin')).not.toBeNull();
    await expect(save.querySelector('svg')).toBeNull();

    await userEvent.click(body.getByRole('button', { name: 'Discard' }));
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
    await userEvent.click(body.getByRole('button', { name: 'Stay' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

// ── Danger and type-to-confirm ───────────────────────────────────────────────

/** `danger`: a red tile with a trash icon and a solid red action. */
export const ConfirmDanger: Story = {
  args: {
    open: true,
    intent: 'danger',
    title: 'Delete this rack?',
    message: 'This deletes the rack and its 14 devices. It cannot be undone.',
    discardLabel: 'Delete rack',
    stayLabel: 'Cancel',
    hideSave: true,
    onClose: () => {},
    onDiscard: () => {},
  },
};

/** With `requireText`, the action stays disabled until the exact text is typed. */
export const ConfirmDangerTypeToConfirm: Story = {
  args: {
    open: true,
    intent: 'danger',
    title: 'Delete project?',
    message: 'This deletes cosmos-prod, its 14 dashboards and their history. It cannot be undone.',
    discardLabel: 'Delete project',
    stayLabel: 'Cancel',
    hideSave: true,
    requireText: 'cosmos-prod',
    onClose: () => {},
    onDiscard: () => {},
  },
};

export const TypeToConfirmGatesTheAction: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ConfirmDangerTypeToConfirm.args, onClose: fn(), onDiscard: fn() },
  play: async ({ args }) => {
    const body = within(document.body);
    const field = await body.findByRole('textbox', { name: 'Type "cosmos-prod" to confirm' });
    const action = body.getByRole('button', { name: 'Delete project' });
    await expect(action).toBeDisabled();
    await userEvent.type(field, 'cosmos');
    await expect(action).toBeDisabled();
    // Case-sensitive: the right letters in the wrong case do not count.
    await userEvent.clear(field);
    await userEvent.type(field, 'COSMOS-PROD');
    await expect(action).toBeDisabled();
    await userEvent.click(action);
    await expect(args.onDiscard).not.toHaveBeenCalled();
    await userEvent.clear(field);
    await userEvent.type(field, 'cosmos-prod');
    await expect(action).toBeEnabled();
    // Solid red once enabled.
    const probe = document.createElement('span');
    probe.className = 'bg-red-600';
    document.body.append(probe);
    await expect(getComputedStyle(action).backgroundColor).toBe(
      getComputedStyle(probe).backgroundColor
    );
    probe.remove();
    await userEvent.click(action);
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** Enter in the field acts only when the text matches. */
export const EnterInTheFieldActsOnlyOnAMatch: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ConfirmDangerTypeToConfirm.args, onClose: fn(), onDiscard: fn() },
  play: async ({ args }) => {
    const field = await within(document.body).findByRole('textbox');
    await userEvent.type(field, 'cosmos-pro{Enter}');
    await expect(args.onDiscard).not.toHaveBeenCalled();
    await userEvent.type(field, 'd{Enter}');
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
  },
};

/** The dialog is still described by its message; the field is named by its instruction. */
export const TypeToConfirmKeepsTheDialogAccessible: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    ...ConfirmDangerTypeToConfirm.args,
    requireTextLabel: 'Tapez « cosmos-prod » pour confirmer',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog', { name: 'Delete project?' });
    await expect(dialog).toHaveAccessibleDescription(/deletes cosmos-prod/);
    await expect(
      body.getByRole('textbox', { name: 'Tapez « cosmos-prod » pour confirmer' })
    ).toBeVisible();
  },
};

const TypeToConfirmHarness = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Delete project</Button>
      <ConfirmationModal
        open={open}
        intent="danger"
        title="Delete project?"
        message="This cannot be undone."
        discardLabel="Delete"
        hideSave
        requireText="cosmos-prod"
        onClose={() => setOpen(false)}
        onDiscard={() => setOpen(false)}
      />
    </div>
  );
};

/** What was typed does not survive a close: the field is empty when the dialog opens again. */
export const TypedTextResetsWhenTheDialogCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <TypeToConfirmHarness />,
  play: async () => {
    const body = within(document.body);
    const field = await body.findByRole('textbox');
    await userEvent.type(field, 'cosmos-prod');
    await expect(body.getByRole('button', { name: 'Delete' })).toBeEnabled();
    await userEvent.click(body.getByRole('button', { name: 'Stay' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull());
    await userEvent.click(body.getByRole('button', { name: 'Delete project' }));
    await expect(await body.findByRole('textbox')).toHaveValue('');
    await expect(body.getByRole('button', { name: 'Delete' })).toBeDisabled();
  },
};

/** Without `requireText` the action is never gated, in either intent. */
export const WithoutRequireTextTheActionIsEnabled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ...ConfirmDanger.args, onClose: fn(), onDiscard: fn() },
  play: async ({ args }) => {
    const body = within(document.body);
    await expect(body.queryByRole('textbox')).toBeNull();
    const action = await body.findByRole('button', { name: 'Delete rack' });
    await expect(action).toBeEnabled();
    await userEvent.click(action);
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
  },
};

/** The default intent keeps the amber triangle and the quiet discard button. */
export const WarningIsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn(), onDiscard: fn(), onSave: fn() },
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog');
    await expect(dialog.querySelector('svg.text-amber-500')).not.toBeNull();
    await expect(dialog.querySelector('svg.text-red-500')).toBeNull();
  },
};
