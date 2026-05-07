import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormRow } from './FormRow';
import { Toggle } from './Toggle';
import { SelectInput } from '../ui/SelectInput';

const meta = {
  title: 'Forms/Form Row',
  component: FormRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Label', children: null },
} satisfies Meta<typeof FormRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToggle: Story = {
  render: () => {
    const [v, setV] = useState(true);
    return (
      <div className="max-w-xl rounded-xl border border-gray-200 px-4 dark:border-gray-800">
        <div className="py-3">
          <FormRow
            label="Auto-refresh"
            description="Reload page data automatically"
            tooltip="Polls the backend at the chosen interval."
          >
            <Toggle checked={v} onChange={setV} />
          </FormRow>
        </div>
      </div>
    );
  },
};

export const Stacked: Story = {
  render: () => {
    const [auto, setAuto] = useState(true);
    const [interval, setInterval] = useState('30');
    const [legend, setLegend] = useState(false);
    return (
      <div className="max-w-xl divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-800">
        <div className="py-3">
          <FormRow label="Auto-refresh" description="Reload page data automatically">
            <Toggle checked={auto} onChange={setAuto} />
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
        <div className="py-3">
          <FormRow label="Show health legend" description="Display color legend on room view">
            <Toggle checked={legend} onChange={setLegend} />
          </FormRow>
        </div>
      </div>
    );
  },
};
