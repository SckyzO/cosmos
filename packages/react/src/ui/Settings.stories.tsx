import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { StatefulSaveButton, type SaveState } from './StatefulSaveButton';
import { UnsavedIndicator } from './UnsavedIndicator';
import { ConfirmationModal } from './ConfirmationModal';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Actions/Settings & Save',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const SaveCycle: Story = {
  render: () => {
    const [state, setState] = useState<SaveState>('idle');
    const cycle = () => {
      setState('saving');
      setTimeout(() => setState('saved'), 800);
      setTimeout(() => setState('idle'), 2200);
    };
    return (
      <Wrap>
        <SectionCard title="StatefulSaveButton + UnsavedIndicator">
          <div className="flex items-center gap-3">
            <UnsavedIndicator visible={state === 'idle' || state === 'dirty'} />
            <StatefulSaveButton state={state} onClick={cycle} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-800">
            <p className="mr-1 text-[10px] font-semibold tracking-wider text-gray-300 uppercase dark:text-gray-700">
              states:
            </p>
            {(['idle', 'dirty', 'saving', 'saved', 'error'] as SaveState[]).map((s) => (
              <StatefulSaveButton key={s} state={s} onClick={() => {}} />
            ))}
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="ConfirmationModal — Stay / Discard / Save">
          <Button onClick={() => setOpen(true)}>Open confirmation</Button>
        </SectionCard>
        <ConfirmationModal
          open={open}
          onStay={() => setOpen(false)}
          onDiscard={() => setOpen(false)}
          onSave={() => setOpen(false)}
        />
      </Wrap>
    );
  },
};
