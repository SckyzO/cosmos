import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Modal',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Click to open">
          <Button onClick={() => setOpen(true)}>Open modal</Button>
        </SectionCard>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Delete this template?"
          description="This action cannot be undone. The template will be removed from all environments."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to delete <span className="font-semibold">prod-default-template</span>. 13
            servers currently use it.
          </p>
        </Modal>
      </Wrap>
    );
  },
};
