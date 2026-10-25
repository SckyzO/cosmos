import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Accordion } from './Accordion';

const meta = {
  title: 'Data/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { type: 'single', collapsible: true, children: null as ReactNode },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ = [
  {
    q: 'What is Cosmos?',
    a: 'Cosmos is the design system used across sckyzo projects — a Tailwind 4 theme + a React 19 component library + opinionated ApexCharts wrappers.',
  },
  {
    q: 'Is it production-ready?',
    a: 'It powers rackscope and several internal tools. The component API is still evolving, but breaking changes are documented in the changelog.',
  },
  {
    q: 'Can I use it in my project?',
    a: 'Sure — packages are published under @sckyzo/* on npm. You only need React 19 + Tailwind 4 in your app.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Open an issue on the GitHub repo with a reproduction. Minimal Storybook stories are very welcome.',
  },
];

// ── Stories ──────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-0" collapsible>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-0', 'item-2']}>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const Seamless: Story = {
  render: () => (
    <Accordion type="single" appearance="seamless" collapsible>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const HideChevron: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger hideChevron>Collapsed by default → Click me</Accordion.Trigger>
        <Accordion.Content>No chevron indicator on this item.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger hideChevron>Another silent item</Accordion.Trigger>
        <Accordion.Content>Useful for kiosk-style menus.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const RichContent: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Pricing breakdown</Accordion.Trigger>
        <Accordion.Content>
          <ul className="list-disc space-y-1 ps-5 marker:text-gray-400">
            <li>
              <strong>Free</strong> — 0 € / month
            </li>
            <li>
              <strong>Pro</strong> — 29 € / month, 10 seats
            </li>
            <li>
              <strong>Team</strong> — 99 € / month, unlimited
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Annual billing saves 20 % on every plan.
          </p>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Cancellation policy</Accordion.Trigger>
        <Accordion.Content>
          You can cancel anytime — your subscription stays active until the end of the billing
          period, no questions asked.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('item-0');
    return (
      <div className="space-y-3">
        <Accordion type="single" collapsible value={value} onValueChange={setValue}>
          {FAQ.slice(0, 3).map((row, i) => (
            <Accordion.Item key={i} value={`item-${i}`}>
              <Accordion.Trigger>{row.q}</Accordion.Trigger>
              <Accordion.Content>{row.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
        <p className="text-xs text-[var(--color-text-muted)]">
          Currently open: <code>{value || '(none)'}</code>
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Open me</Accordion.Trigger>
        <Accordion.Content>Hello.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2" disabled>
        <Accordion.Trigger>This one is disabled</Accordion.Trigger>
        <Accordion.Content>Will never open.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['sm', 'md'] as const).map((size) => (
        <Accordion key={size} type="single" collapsible defaultValue="item-0" size={size}>
          {FAQ.slice(0, 2).map((row, i) => (
            <Accordion.Item key={i} value={`item-${i}`}>
              <Accordion.Trigger>
                {row.q} ({size})
              </Accordion.Trigger>
              <Accordion.Content>{row.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      ))}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickTriggerOpens: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Click me</Accordion.Trigger>
        <Accordion.Content>Revealed content</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click me' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByText('Revealed content')).toBeVisible());
  },
};

export const SingleClosesOthers: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>First</Accordion.Trigger>
        <Accordion.Content>Content one</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Second</Accordion.Trigger>
        <Accordion.Content>Content two</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByRole('button', { name: 'First' });
    const second = canvas.getByRole('button', { name: 'Second' });
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(second);
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    // type=single → opening Second closes First.
    await expect(first).toHaveAttribute('aria-expanded', 'false');
  },
};

export const DisabledBlocksClick: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1" disabled>
        <Accordion.Trigger>Locked</Accordion.Trigger>
        <Accordion.Content>Hidden</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Locked' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger).catch(() => undefined);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const DisabledLooksDisabled: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Live</Accordion.Trigger>
        <Accordion.Content>Hello.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2" disabled>
        <Accordion.Trigger>Locked</Accordion.Trigger>
        <Accordion.Content>Hidden.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const live = canvas.getByRole('button', { name: 'Live' });
    const locked = canvas.getByRole('button', { name: 'Locked' });
    await expect(getComputedStyle(locked).cursor).toBe('not-allowed');
    await expect(Number(getComputedStyle(locked).opacity)).toBeLessThan(1);
    await expect(getComputedStyle(live).opacity).toBe('1');
  },
};

export const SizeMdIsLarger: Story = {
  tags: ['!dev'],
  render: () => (
    <div>
      {(['sm', 'md'] as const).map((size) => (
        <Accordion key={size} type="single" collapsible size={size}>
          <Accordion.Item value="a">
            <Accordion.Trigger>{`Trigger ${size}`}</Accordion.Trigger>
            <Accordion.Content>Body</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const sm = canvas.getByRole('button', { name: 'Trigger sm' });
    const md = canvas.getByRole('button', { name: 'Trigger md' });
    await expect(getComputedStyle(sm).paddingTop).toBe('12px');
    await expect(parseFloat(getComputedStyle(md).paddingTop)).toBeGreaterThan(12);
    await expect(parseFloat(getComputedStyle(md).fontSize)).toBeGreaterThan(
      parseFloat(getComputedStyle(sm).fontSize)
    );
  },
};
