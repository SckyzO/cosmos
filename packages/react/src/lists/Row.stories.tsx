import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cpu, Database, HardDrive, Server } from 'lucide-react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import { Row } from './Row';

const meta = {
  title: 'Lists/Row',
  component: Row,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { title: 'Item' },
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: Server, title: 'Server alpha-01', subtitle: 'Rack 01-A · Slot 5' },
};

export const WithStatus: Story = {
  args: { icon: Server, title: 'server-prod-01', subtitle: 'DC Paris', status: 'OK' },
};

export const Stacked: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <Row icon={Server} title="Server alpha-01" subtitle="Rack 01-A · Slot 5" />
      <Row icon={Server} title="Server alpha-02" subtitle="Rack 01-A · Slot 6" />
      <Row icon={Database} title="DB primary" subtitle="Rack 01-B · Slot 12" />
    </div>
  ),
};

export const StackedWithStatus: Story = {
  render: () => (
    <div className="max-w-md divide-y divide-[var(--color-border)]">
      <Row icon={Server} title="server-prod-01" subtitle="DC Paris" status="OK" />
      <Row icon={Server} title="server-prod-02" subtitle="DC Paris" status="WARN" />
      <Row icon={Database} title="db-primary" subtitle="DC Lyon" status="CRIT" />
      <Row icon={HardDrive} title="storage-cold" subtitle="DC Bordeaux" status="UNKNOWN" />
      <Row icon={Cpu} title="hpc-node-04" subtitle="DC Toulouse" status="OK" />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickFiresOnClick: Story = {
  args: { icon: Server, title: 'Click me', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Click me/ }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

/** With `href` the row is a link, and `onClick` alone makes it a button. */
export const HrefMakesALinkOnClickAButton: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <Row title="Linked" status="OK" href="#linked" />
      <Row title="Pressed" status="WARN" onClick={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Linked/ })).toHaveAttribute('href', '#linked');
    await expect(canvas.getByRole('button', { name: /Pressed/ })).toBeInTheDocument();
  },
};

const PILL_STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];

/** With `status` the row ends with a StatusBadge, same colors and type as the badge of that status. */
export const StatusRendersAStatusBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      {PILL_STATUSES.map((s) => (
        <div key={s} data-status={s}>
          <Row title={`row ${s}`} status={s} />
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

/** The chevron says the row navigates; a status takes its place instead of sitting next to it. */
export const StatusReplacesTheChevron: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <Row title="Plain" />
      <Row title="Healthy" status="OK" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /Plain/ }).querySelector('svg.lucide-chevron-right')
    ).not.toBeNull();
    await expect(
      canvas.getByRole('button', { name: /Healthy/ }).querySelector('svg.lucide-chevron-right')
    ).toBeNull();
    await expect(canvas.getByText('OK')).toBeVisible();
  },
};

/** The hover background clears the content: the text sits inside the row, not on its edge. */
export const ContentIsInsetFromTheHoverBackground: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <Row icon={Server} title="Server alpha-01" status="OK" />
    </div>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /Server alpha-01/ });
    const title = canvas.getByText('Server alpha-01');
    const badge = canvas.getByText('OK');
    const box = row.getBoundingClientRect();
    await expect(title.getBoundingClientRect().left - box.left).toBeGreaterThanOrEqual(8);
    await expect(box.right - badge.getBoundingClientRect().right).toBeGreaterThanOrEqual(8);
  },
};

const linkRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
const buttonRef = createRef<HTMLAnchorElement | HTMLButtonElement>();

/** The ref gets the row's root, an `<a>` with `href` and a `<button>` without, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="max-w-md">
      <Row ref={linkRef} title="Linked" href="#linked" />
      <Row ref={buttonRef} title="Pressed" onClick={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(linkRef, canvas.getByRole('link', { name: /Linked/ }));
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: /Pressed/ }));
  },
};
