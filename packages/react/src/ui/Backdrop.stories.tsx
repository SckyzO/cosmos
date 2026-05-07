import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Backdrop } from './Backdrop';

const meta = {
  title: 'Atoms/Backdrop',
  component: Backdrop,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClickToToggle: Story = {
  render: () => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative h-screen w-full bg-[var(--color-bg-base)]">
        <div className="p-6">
          <button
            type="button"
            onClick={() => setShow(true)}
            className="bg-brand-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Show backdrop
          </button>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Click the backdrop to dismiss it.
          </p>
        </div>
        {show && <Backdrop onClick={() => setShow(false)} />}
      </div>
    );
  },
};
