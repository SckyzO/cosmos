import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';

const meta = {
  title: 'Actions/Confirmation Modal',
  component: ConfirmationModal,
  parameters: { layout: 'fullscreen' },
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
