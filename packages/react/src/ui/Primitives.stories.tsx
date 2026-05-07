import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Bell, Cpu, LayoutDashboard, Server, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from './Spinner';
import { SectionLabel } from './SectionLabel';
import { IconBox } from './IconBox';
import { AlertBanner } from './AlertBanner';
import { SelectInput } from './SelectInput';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Primitives',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const SpinnerSizes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Spinner — 4 sizes">
        <div className="flex items-center gap-6">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Labels: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="SectionLabel">
        <SectionLabel>Section title example</SectionLabel>
      </SectionCard>
    </Wrap>
  ),
};

export const IconBoxes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="IconBox — sizes & color combos">
        <div className="flex flex-wrap items-center gap-3">
          <IconBox icon={Server} size="sm" />
          <IconBox icon={Cpu} size="md" />
          <IconBox icon={Activity} size="lg" />
          <IconBox icon={Bell} bg="bg-brand-50 dark:bg-brand-500/10" color="text-brand-500" />
          <IconBox icon={Trash2} bg="bg-red-50 dark:bg-red-500/10" color="text-red-500" />
          <IconBox
            icon={LayoutDashboard}
            bg="bg-green-50 dark:bg-green-500/10"
            color="text-green-500"
          />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Alerts: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="AlertBanner — 4 variants">
        <div className="space-y-2">
          <AlertBanner variant="success">Settings saved successfully.</AlertBanner>
          <AlertBanner variant="error">Failed to connect to Prometheus.</AlertBanner>
          <AlertBanner variant="warning">Simulator is running with overrides active.</AlertBanner>
          <AlertBanner variant="info">Changes will take effect on next scrape cycle.</AlertBanner>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const NativeSelect: Story = {
  render: () => {
    const [v, setV] = useState('15');
    return (
      <Wrap>
        <SectionCard title="SelectInput — native select wrapper">
          <SelectInput
            value={v}
            onChange={setV}
            options={[
              { label: '15s', value: '15' },
              { label: '30s', value: '30' },
              { label: '1m', value: '60' },
              { label: '5m', value: '300' },
            ]}
          />
        </SectionCard>
      </Wrap>
    );
  },
};
