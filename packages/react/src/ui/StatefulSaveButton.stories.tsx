import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { StatefulSaveButton, type SaveState } from './StatefulSaveButton';

const meta = {
  title: 'Actions/Stateful Save Button',
  component: StatefulSaveButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { state: 'idle', onClick: () => {} },
} satisfies Meta<typeof StatefulSaveButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle', onClick: () => {} } };
export const Dirty: Story = { args: { state: 'dirty', onClick: () => {} } };
export const Saving: Story = { args: { state: 'saving', onClick: () => {} } };
export const Saved: Story = { args: { state: 'saved', onClick: () => {} } };
export const ErrorState: Story = { args: { state: 'error', onClick: () => {} } };

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(['idle', 'dirty', 'saving', 'saved', 'error'] as SaveState[]).map((s) => (
        <StatefulSaveButton key={s} state={s} onClick={() => {}} />
      ))}
    </div>
  ),
};

export const SaveCycle: Story = {
  render: () => {
    const [state, setState] = useState<SaveState>('idle');
    const cycle = () => {
      setState('saving');
      setTimeout(() => setState('saved'), 800);
      setTimeout(() => setState('idle'), 2200);
    };
    return <StatefulSaveButton state={state} onClick={cycle} />;
  },
};

export const IdleClickFiresOnClick: Story = {
  args: { state: 'idle', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const SavedDoesNotFireOnClick: Story = {
  args: { state: 'saved', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

const saveRef = createRef<HTMLButtonElement>();

/** The ref gets the `<button>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StatefulSaveButton ref={saveRef} state="idle" onClick={() => {}} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(saveRef, canvas.getByRole('button', { name: 'Save Changes' }));
  },
};

/** `saved` keeps dark text on green (white on green-500 is about 2.3:1), not the brand fill of a disabled Button. */
export const SavedKeepsDarkTextOnGreen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'saved', onClick: () => {} },
  play: async ({ canvas }) => {
    const style = getComputedStyle(canvas.getByRole('button', { name: 'Saved' }));
    // Computed colors may come back as oklch(): a 1x1 canvas turns them into RGB.
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    const rgb = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const [tr, tg, tb] = rgb(style.color);
    const [br, bg, bb] = rgb(style.backgroundColor);
    // Dark text, on a green (not brand blue) background.
    await expect(tr + tg + tb).toBeLessThan(300);
    await expect(bg).toBeGreaterThan(br);
    await expect(bg).toBeGreaterThan(bb);
  },
};

/** `saved` is `aria-disabled`, not natively disabled: it keeps its colours and ignores clicks. */
export const SavedIsAriaDisabledAndIgnoresClicks: Story = {
  tags: ['!dev', '!autodocs'],
  args: { state: 'saved', onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Saved' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
