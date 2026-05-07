import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { StepperInput } from './StepperInput';
import { NumberInput } from './NumberInput';
import { ZoomBar } from './ZoomBar';
import { FormRow } from './FormRow';
import { Toggle } from './Toggle';
import { SelectInput } from '../ui/SelectInput';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Forms/Advanced',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Steppers: Story = {
  render: () => {
    const [a, setA] = useState(60);
    const [b, setB] = useState(8);
    return (
      <Wrap>
        <SectionCard title="StepperInput vs NumberInput">
          <div className="flex flex-wrap items-center gap-4">
            <StepperInput
              value={a}
              onChange={setA}
              min={5}
              max={3600}
              step={5}
              unit="s"
              className="w-28"
            />
            <NumberInput value={b} onChange={setB} min={1} max={20} step={1} unit="x" />
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};

export const ZoomControl: Story = {
  render: () => {
    const [zoom, setZoom] = useState(1);
    return (
      <Wrap>
        <SectionCard title="ZoomBar">
          <ZoomBar
            zoom={zoom}
            onZoomOut={() => setZoom((z) => Math.max(0.15, Math.round((z - 0.1) * 10) / 10))}
            onZoomIn={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
            onFit={() => setZoom(1.0)}
            onReset={() => setZoom(1.0)}
          />
        </SectionCard>
      </Wrap>
    );
  },
};

export const FormRows: Story = {
  render: () => {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [interval, setInterval] = useState('30');
    return (
      <Wrap>
        <SectionCard title="FormRow — settings panel">
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-800">
            <div className="py-3">
              <FormRow
                label="Auto-refresh"
                description="Reload page data automatically"
                tooltip="Polls the backend at the chosen interval."
              >
                <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
              </FormRow>
            </div>
            <div className="py-3">
              <FormRow label="Default interval" description="Time between refreshes">
                <SelectInput
                  value={interval}
                  onChange={setInterval}
                  options={[
                    { label: '15s', value: '15' },
                    { label: '30s', value: '30' },
                    { label: '1m', value: '60' },
                    { label: '5m', value: '300' },
                  ]}
                />
              </FormRow>
            </div>
          </div>
        </SectionCard>
      </Wrap>
    );
  },
};
