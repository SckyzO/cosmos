import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
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

// ── Interaction tests ────────────────────────────────────────────────────────

/** The backdrop covers the viewport above the page, and a click on it calls `onClick`. */
export const ClickDismissesIt: Story = {
  tags: ['!dev', '!autodocs'],
  render: ClickToToggle.render,
  play: async ({ canvas, canvasElement }) => {
    const backdrop = () => canvasElement.querySelector<HTMLElement>('div[aria-hidden]');
    await expect(backdrop()).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Show backdrop' }));
    const layer = backdrop();
    await expect(layer).not.toBeNull();
    const { top, left, width, height } = layer!.getBoundingClientRect();
    await expect([top, left, width, height]).toEqual([
      0,
      0,
      document.documentElement.clientWidth,
      window.innerHeight,
    ]);
    await expect(getComputedStyle(layer!).zIndex).toBe('30');

    await userEvent.click(layer!);
    await expect(backdrop()).toBeNull();
  },
};
