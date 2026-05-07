import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
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
