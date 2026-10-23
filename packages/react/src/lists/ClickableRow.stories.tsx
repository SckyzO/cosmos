import type { Meta, StoryObj } from '@storybook/react-vite';
import { Database, Server } from 'lucide-react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { ClickableRow } from './ClickableRow';

const meta = {
  title: 'Lists/Clickable Row',
  component: ClickableRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Item' },
} satisfies Meta<typeof ClickableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: Server, title: 'Server alpha-01', subtitle: 'Rack 01-A · Slot 5' },
};

export const Stacked: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <ClickableRow icon={Server} title="Server alpha-01" subtitle="Rack 01-A · Slot 5" />
      <ClickableRow icon={Server} title="Server alpha-02" subtitle="Rack 01-A · Slot 6" />
      <ClickableRow icon={Database} title="DB primary" subtitle="Rack 01-B · Slot 12" />
    </div>
  ),
};

export const ClickFiresOnClick: Story = {
  args: { icon: Server, title: 'Click me', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Click me/ }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

const linkRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
const buttonRef = createRef<HTMLAnchorElement | HTMLButtonElement>();

/** The ref gets the row's root, an `<a>` with `href` and a `<button>` without, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <ClickableRow ref={linkRef} title="Linked" href="#linked" />
      <ClickableRow ref={buttonRef} title="Pressed" onClick={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(linkRef, canvas.getByRole('link', { name: /Linked/ }));
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: /Pressed/ }));
  },
};
