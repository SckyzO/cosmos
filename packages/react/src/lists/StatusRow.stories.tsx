import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cpu, Database, HardDrive, Server } from 'lucide-react';
import { createRef } from 'react';
import { expect } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import { StatusRow } from './StatusRow';

const meta = {
  title: 'Lists/Status Row',
  component: StatusRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Item', status: 'OK' },
} satisfies Meta<typeof StatusRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: Server, title: 'server-prod-01', subtitle: 'DC Paris', status: 'OK' },
};

export const Mixed: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <StatusRow icon={Server} title="server-prod-01" subtitle="DC Paris" status="OK" />
      <StatusRow icon={Server} title="server-prod-02" subtitle="DC Paris" status="WARN" />
      <StatusRow icon={Database} title="db-primary" subtitle="DC Lyon" status="CRIT" />
      <StatusRow icon={HardDrive} title="storage-cold" subtitle="DC Bordeaux" status="UNKNOWN" />
      <StatusRow icon={Cpu} title="hpc-node-04" subtitle="DC Toulouse" status="OK" />
    </div>
  ),
};

const linkRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
const buttonRef = createRef<HTMLAnchorElement | HTMLButtonElement>();

/** The ref gets the row's root, an `<a>` with `href` and a `<button>` without, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <StatusRow ref={linkRef} title="Linked" status="OK" href="#linked" />
      <StatusRow ref={buttonRef} title="Pressed" status="WARN" onClick={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(linkRef, canvas.getByRole('link', { name: /Linked/ }));
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: /Pressed/ }));
  },
};

const PILL_STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];

/** The row's pill is a StatusBadge: same colors and type as the badge of the same status. */
export const PillIsAStatusBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      {PILL_STATUSES.map((s) => (
        <div key={s} data-status={s}>
          <StatusRow title={`row ${s}`} status={s} />
          <StatusBadge status={s} size="sm" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const s of PILL_STATUSES) {
      const group = canvasElement.querySelector(`[data-status="${s}"]`)!;
      const [pill, badge] = [...group.querySelectorAll('span.rounded-full')].map((el) =>
        getComputedStyle(el)
      );
      for (const prop of ['backgroundColor', 'color', 'fontSize', 'fontWeight'] as const) {
        await expect(`${s} ${prop} ${pill![prop]}`).toBe(`${s} ${prop} ${badge![prop]}`);
      }
    }
  },
};
