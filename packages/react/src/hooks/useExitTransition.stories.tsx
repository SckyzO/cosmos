import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { isFading, reduceMotion } from '../storybook-motion';
import { useExitTransition } from './useExitTransition';

/**
 * The contract of the internal `useExitTransition`, through a bare harness: a panel that fades
 * over 300 ms while it leaves (a duration the story tests reset to 0 s unless a story opts out),
 * and one that holds a loop. Test-only: the hook is not exported, and each window using it keeps
 * its own stories.
 */

function Harness({ loop = false }: { loop?: boolean }) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const present = useExitTransition(open, ref);
  return (
    <div className="space-y-3 text-sm text-[var(--color-text-base)]">
      <button type="button" onClick={() => setOpen((was) => !was)}>
        {open ? 'Close' : 'Open'}
      </button>
      {present && (
        <div
          ref={ref}
          role="dialog"
          aria-label="Panel"
          inert={!open}
          className={clsx(
            'rounded-lg border border-gray-300 p-4 transition-opacity duration-(--cosmos-motion-slow)',
            open ? 'opacity-100' : 'opacity-0'
          )}
        >
          Panel
          {loop && <span className="ms-2 inline-block animate-ping">*</span>}
        </div>
      )}
    </div>
  );
}

const meta = {
  title: 'Foundations/useExitTransition',
  component: Harness,
  parameters: { layout: 'padded' },
  tags: ['!dev', '!autodocs'],
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing animates (the story tests' 0 s): the panel is gone in the render that closes it. */
export const UnmountsAtOnceWhenNothingAnimates: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
  },
};

/** Under `data-motion="reduced"` the durations read 0, so the panel leaves at once too. */
export const UnmountsAtOnceUnderReducedMotion: Story = {
  parameters: { settleMotion: false },
  play: async ({ canvas }) => {
    const restore = reduceMotion();
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
      await expect(canvas.queryByRole('dialog')).toBeNull();
    } finally {
      restore();
    }
  },
};

/** The panel stays, inert, while its fade plays, and goes when it ends. */
export const StaysUntilTheExitHasPlayed: Story = {
  parameters: { settleMotion: false },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    const panel = canvas.getByRole('dialog');
    await expect(panel).toBeInTheDocument();
    await expect(panel).toHaveAttribute('inert');
    await expect(isFading(panel)).toBe(true);
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
  },
};

/** Opening again while it leaves keeps the same panel, and the fade turns back. */
export const ReopeningDuringTheExitKeepsThePanel: Story = {
  parameters: { settleMotion: false },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    const panel = canvas.getByRole('dialog');
    await expect(isFading(panel)).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await expect(canvas.getByRole('dialog')).toBe(panel);
    await expect(panel).not.toHaveAttribute('inert');
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
    // Still there once the first exit would have ended.
    await expect(canvas.getByRole('dialog')).toBe(panel);
  },
};

/** A loop inside the panel never ends: it must not keep the panel on screen. */
export const ALoopInsideDoesNotHoldIt: Story = {
  args: { loop: true },
  parameters: { settleMotion: false },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
  },
};
