import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, KeyRound, Settings as SettingsIcon, User } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { Tabs } from './Tabs';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: {
    'Tabs.List': Tabs.List,
    'Tabs.Trigger': Tabs.Trigger,
    'Tabs.Panel': Tabs.Panel,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'overview', onChange: () => {}, children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const ThreeTabs: Story = {
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Wrap>
        <SectionCard title="Tabs (overview / metrics / logs)">
          <Tabs value={tab} onChange={setTab}>
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
              <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
              <Tabs.Trigger value="disabled" disabled>
                Soon
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-level summary of the resource.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time-series charts go here.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="logs">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recent log lines from the agent.
              </p>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>
      </Wrap>
    );
  },
};

export const Vertical: Story = {
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Wrap>
        <SectionCard title="Vertical tabs (settings layout)">
          <Tabs value={tab} onChange={setTab} orientation="vertical">
            <Tabs.List className="w-44">
              <Tabs.Trigger value="account" icon={User}>
                Account
              </Tabs.Trigger>
              <Tabs.Trigger value="security" icon={KeyRound}>
                Security
              </Tabs.Trigger>
              <Tabs.Trigger value="notifications" icon={Bell} badge="3">
                Notifications
              </Tabs.Trigger>
              <Tabs.Trigger value="advanced" icon={SettingsIcon}>
                Advanced
              </Tabs.Trigger>
              <Tabs.Trigger value="locked" disabled>
                Billing
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panel value="account">
              <h3 className="mb-2 text-sm font-semibold">Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your username, profile picture and display name.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="security">
              <h3 className="mb-2 text-sm font-semibold">Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Change your password and review active sessions.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="notifications">
              <h3 className="mb-2 text-sm font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick which alerts reach you and through which channels.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="advanced">
              <h3 className="mb-2 text-sm font-semibold">Advanced</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Power-user toggles, feature flags and developer options.
              </p>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SwitchesPanelOnTabClick: Story = {
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p data-testid="panel">overview-panel-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="metrics">
          <p data-testid="panel">metrics-panel-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    // Initial panel is "overview"
    await expect(canvas.getByTestId('panel')).toHaveTextContent('overview-panel-content');
    // Click "Metrics" → panel switches
    await userEvent.click(canvas.getByRole('tab', { name: 'Metrics' }));
    await expect(canvas.getByTestId('panel')).toHaveTextContent('metrics-panel-content');
    // aria-selected wires correctly
    await expect(canvas.getByRole('tab', { name: 'Metrics' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const DisabledTabIsNotClickable: Story = {
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="soon" disabled>
            Soon
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p data-testid="panel">overview-panel-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="soon">
          <p data-testid="panel">soon-panel-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    const soon = canvas.getByRole('tab', { name: 'Soon' });
    await expect(soon).toBeDisabled();
    await userEvent.click(soon);
    // Panel did not switch
    await expect(canvas.getByTestId('panel')).toHaveTextContent('overview-panel-content');
  },
};

export const VerticalAriaOrientation: Story = {
  render: () => {
    const [tab, setTab] = useState('one');
    return (
      <Tabs value={tab} onChange={setTab} orientation="vertical">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="one">
          <p data-testid="panel">one-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="two">
          <p data-testid="panel">two-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.click(canvas.getByRole('tab', { name: 'Two' }));
    await expect(canvas.getByTestId('panel')).toHaveTextContent('two-content');
  },
};
