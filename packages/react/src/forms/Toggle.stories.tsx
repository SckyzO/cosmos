import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Toggle } from './Toggle';

const meta = {
  title: 'Forms/Toggle',
  component: Toggle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { checked: false, onChange: () => {} },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const On: Story = {
  args: { checked: true, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Off: Story = {
  args: { checked: false, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Disabled: Story = {
  args: { checked: true, disabled: true, label: 'Locked feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <Wrap>
        <Toggle
          checked={on}
          onChange={setOn}
          label="Auto-refresh"
          description="Reload data every 30 seconds."
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Current state: <code>{String(on)}</code>
        </p>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickFiresOnChangeWithNextValue: Story = {
  args: { checked: false, onChange: fn(), label: 'Notifications' },
  play: async ({ args, canvas }) => {
    const sw = canvas.getByRole('switch');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const DisabledBlocksInteraction: Story = {
  args: { checked: true, disabled: true, onChange: fn(), label: 'Read only' },
  play: async ({ args, canvas }) => {
    const sw = canvas.getByRole('switch');
    await userEvent.click(sw);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
