import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Sparkles, Star, Zap } from 'lucide-react';
import { expect } from 'storybook/test';
import { List } from './List';

const meta = {
  title: 'Lists/List',
  component: List,
  subcomponents: { 'List.Item': List.Item },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = ['Provision new server', 'Configure monitoring', 'Deploy application'];

// ── Stories ──────────────────────────────────────────────────────────────────

export const Unordered: Story = {
  render: () => (
    <List>
      {ITEMS.map((label) => (
        <List.Item key={label}>{label}</List.Item>
      ))}
    </List>
  ),
};

export const Ordered: Story = {
  render: () => (
    <List variant="ordered">
      {ITEMS.map((label) => (
        <List.Item key={label}>{label}</List.Item>
      ))}
    </List>
  ),
};

export const Plain: Story = {
  render: () => (
    <List variant="plain">
      {ITEMS.map((label) => (
        <List.Item key={label}>{label}</List.Item>
      ))}
    </List>
  ),
};

export const WithChecks: Story = {
  render: () => (
    <List marker="check">
      <List.Item>Unlimited team members</List.Item>
      <List.Item>1 TB encrypted storage</List.Item>
      <List.Item>Priority support</List.Item>
      <List.Item>Custom domain</List.Item>
    </List>
  ),
};

export const WithArrows: Story = {
  render: () => (
    <List marker="arrow">
      <List.Item>Pick a monitoring stack</List.Item>
      <List.Item>Define alert rules</List.Item>
      <List.Item>Wire up notifications</List.Item>
      <List.Item>Run end-to-end test</List.Item>
    </List>
  ),
};

export const WithDots: Story = {
  render: () => (
    <List marker="dot" spacing="tight">
      <List.Item>Lightweight</List.Item>
      <List.Item>Container-first</List.Item>
      <List.Item>Tree-shakeable</List.Item>
    </List>
  ),
};

export const SpacingComparison: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-3">
      {(['tight', 'normal', 'loose'] as const).map((s) => (
        <div key={s}>
          <p className="mb-2 font-mono text-[10px] text-gray-400 uppercase">{s}</p>
          <List marker="check" spacing={s}>
            {ITEMS.map((label) => (
              <List.Item key={label}>{label}</List.Item>
            ))}
          </List>
        </div>
      ))}
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <List orientation="horizontal" marker="dot">
      <List.Item>Home</List.Item>
      <List.Item>Pricing</List.Item>
      <List.Item>Docs</List.Item>
      <List.Item>Blog</List.Item>
      <List.Item>Contact</List.Item>
    </List>
  ),
};

export const PerItemIconOverride: Story = {
  render: () => (
    <List marker="check">
      <List.Item>Default check icon</List.Item>
      <List.Item icon={Sparkles} iconColor="text-violet-500">
        Override with Sparkles
      </List.Item>
      <List.Item icon={Star} iconColor="text-amber-500">
        Override with Star
      </List.Item>
      <List.Item icon={Zap} iconColor="text-brand-500">
        Override with Zap
      </List.Item>
    </List>
  ),
};

export const RichItems: Story = {
  render: () => (
    <List marker="check" spacing="loose">
      <List.Item>
        <strong className="text-gray-900 dark:text-white">SSO &amp; SCIM</strong> — connect your IdP
        for single sign-on and automated user provisioning.
      </List.Item>
      <List.Item>
        <strong className="text-gray-900 dark:text-white">Audit logs</strong> — every action is
        logged and exportable as JSON or CSV.
      </List.Item>
      <List.Item>
        <strong className="text-gray-900 dark:text-white">99.99 % SLA</strong> — backed by a status
        page and 24/7 on-call rotation.
      </List.Item>
    </List>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RendersAsUl: Story = {
  render: () => (
    <List>
      <List.Item>One</List.Item>
      <List.Item>Two</List.Item>
    </List>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('ul')).not.toBeNull();
    await expect(canvasElement.querySelectorAll('li').length).toBe(2);
  },
};

export const OrderedRendersAsOl: Story = {
  render: () => (
    <List variant="ordered">
      <List.Item>First</List.Item>
      <List.Item>Second</List.Item>
    </List>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('ol')).not.toBeNull();
    await expect(canvasElement.querySelector('ul')).toBeNull();
  },
};
