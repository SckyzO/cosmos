import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { bothDirections, expectMirrored, startEdge } from '../storybook-helpers';
import { StatusBadge } from './StatusBadge';
import type { HealthStatus } from './types';

const meta = {
  title: 'Status/Status Badge',
  component: StatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { status: 'OK' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = { args: { status: 'OK' } };
export const Warn: Story = { args: { status: 'WARN' } };
export const Crit: Story = { args: { status: 'CRIT' } };
export const Unknown: Story = { args: { status: 'UNKNOWN' } };
export const Info: Story = { args: { status: 'INFO' } };

const STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO', 'UNKNOWN'];
const SIZES = ['sm', 'md', 'lg'] as const;

export const Matrix: Story = {
  render: () => (
    <div className="space-y-3">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-8 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
            {size}
          </span>
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const CustomLabel: Story = { args: { status: 'OK', label: 'Healthy' } };

/** The outlined badge with an icon: the look the old `HealthBadge` had, for a status that is the subject of the page. */
export const Outline: Story = {
  args: { status: 'OK', shape: 'rounded', appearance: 'outline', icon: true, size: 'lg' },
};

export const OutlineMatrix: Story = {
  render: () => (
    <div className="space-y-3">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-8 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
            {size}
          </span>
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} size={size} shape="rounded" appearance="outline" icon />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status="WARN" shape="pill" />
      <StatusBadge status="WARN" shape="rounded" />
      <StatusBadge status="WARN" shape="pill" appearance="outline" />
      <StatusBadge status="WARN" shape="rounded" appearance="outline" />
    </div>
  ),
};

export const WithIcon: Story = { args: { status: 'CRIT', icon: true } };

// A badge is the span that holds the label's own `bdi`.
const badgeOf = (label: HTMLElement) => label.closest('span')!;
const px = (value: string) => parseFloat(value);

const OUTLINE_CLASSES = {
  OK: ['bg-green-50', 'text-green-700', 'border-green-200'],
  WARN: ['bg-amber-50', 'text-amber-700', 'border-amber-200'],
  CRIT: ['bg-red-50', 'text-red-700', 'border-red-200'],
  UNKNOWN: ['bg-gray-100', 'text-gray-600', 'border-gray-200'],
  INFO: ['bg-blue-50', 'text-blue-700', 'border-blue-200'],
} as const;

/**
 * `appearance="outline"` is the tinted fill, border and text of the five statuses, `icon` draws
 * the status icon (hidden from assistive technology: the label says the status), and `shape`
 * picks the corners. The default stays the filled pill with no icon and no border.
 */
export const OutlineIconAndShape: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status="UNKNOWN" label="plain" />
      {STATUSES.map((s) => (
        <StatusBadge key={s} status={s} shape="rounded" appearance="outline" icon />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const plain = badgeOf(canvas.getByText('plain'));
    await expect(plain.querySelector('svg')).toBeNull();
    await expect(getComputedStyle(plain).borderTopWidth).toBe('0px');
    await expect(px(getComputedStyle(plain).borderTopLeftRadius)).toBeGreaterThanOrEqual(
      plain.getBoundingClientRect().height / 2
    );

    for (const status of STATUSES) {
      const badge = badgeOf(canvas.getByText(status));
      await expect(badge).toHaveClass(...OUTLINE_CLASSES[status]);
      await expect(getComputedStyle(badge).borderTopWidth).toBe('1px');
      await expect(px(getComputedStyle(badge).borderTopLeftRadius)).toBeLessThan(
        badge.getBoundingClientRect().height / 2
      );
      const icon = badge.querySelector('svg');
      await expect(icon).not.toBeNull();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      // The icon leads the label.
      await expect(startEdge(icon!.getBoundingClientRect())).toBeLessThan(
        startEdge(canvas.getByText(status).getBoundingClientRect())
      );
    }
  },
};

/** The icon grows with the badge: 12px on `sm`, 14px on `md`, 16px on `lg`. */
export const IconFollowsSize: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((size) => (
        <StatusBadge key={size} status="OK" size={size} label={size} icon />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const widths = SIZES.map(
      (size) => badgeOf(canvas.getByText(size)).querySelector('svg')!.getBoundingClientRect().width
    );
    await expect(widths).toEqual([12, 14, 16]);
  },
};

/** Right to left: the icon moves to the other side with the label, and keeps leading it. */
export const OutlineMirrors: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <StatusBadge status="WARN" shape="rounded" appearance="outline" icon size="lg" />
    )),
  play: async ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('svg'));
  },
};
