import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { FormRow } from './FormRow';
import { Toggle } from './Toggle';
import { SelectInput } from '../ui/SelectInput';
import { NumberInput } from './NumberInput';
import { SearchInput } from './SearchInput';
import { SegmentedControl } from './SegmentedControl';
import { StepperInput } from './StepperInput';

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

const INTERVALS = [
  { label: '15s', value: '15' },
  { label: '30s', value: '30' },
];

export const NamesAndDescribesItsControl: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="max-w-xl">
      <FormRow label="Auto-refresh" description="Reload page data automatically" tooltip="Polls.">
        <Toggle checked onChange={() => {}} />
      </FormRow>
      <FormRow label="Retries" description="Attempts before failing">
        <NumberInput value={3} onChange={() => {}} />
      </FormRow>
      <FormRow label="Timeout" description="Seconds per request">
        <StepperInput value={5} onChange={() => {}} />
      </FormRow>
      <FormRow label="Filter" description="Match on host name">
        <SearchInput value="" onChange={() => {}} />
      </FormRow>
      <FormRow label="Default interval" description="Time between refreshes">
        <SelectInput value="30" onChange={() => {}} options={INTERVALS} />
      </FormRow>
      <FormRow label="View" description="Layout of the room">
        <SegmentedControl
          value="grid"
          onChange={() => {}}
          options={[
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' },
          ]}
        />
      </FormRow>
    </div>
  ),
  play: async ({ canvas }) => {
    const cases = [
      [canvas.getByRole('switch', { name: 'Auto-refresh' }), 'Reload page data automatically'],
      [canvas.getByRole('spinbutton', { name: 'Retries' }), 'Attempts before failing'],
      [canvas.getByRole('spinbutton', { name: 'Timeout' }), 'Seconds per request'],
      [canvas.getByRole('textbox', { name: 'Filter' }), 'Match on host name'],
      [canvas.getByRole('combobox', { name: 'Default interval' }), 'Time between refreshes'],
      [canvas.getByRole('radiogroup', { name: 'View' }), 'Layout of the room'],
    ] as const;
    for (const [control, description] of cases) {
      await expect(control).toHaveAccessibleDescription(description);
    }
  },
};

export const ExplicitPropsWinOverRow: Story = {
  tags: ['!dev'],
  render: () => (
    <FormRow label="Auto-refresh">
      <Toggle checked onChange={() => {}} id="auto" aria-label="Refresh automatically" />
    </FormRow>
  ),
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole('switch', { name: 'Refresh automatically' });
    await expect(toggle).toHaveAttribute('id', 'auto');
  },
};
