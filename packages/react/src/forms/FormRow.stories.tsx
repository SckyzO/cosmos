import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import {
  bothDirections,
  expectMirrored,
  expectBeyondEnd,
  expectNoHorizontalOverflow,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { FormRow } from './FormRow';
import { Toggle } from './Toggle';
import { Select } from './Select';
import { NumberInput } from './NumberInput';
import { SearchInput } from './SearchInput';
import { SegmentedControl } from './SegmentedControl';

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
            <Select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              fullWidth={false}
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
        <NumberInput controls="stacked" value={5} onChange={() => {}} />
      </FormRow>
      <FormRow label="Filter" description="Match on host name">
        <SearchInput value="" onChange={() => {}} />
      </FormRow>
      <FormRow label="Default interval" description="Time between refreshes">
        <Select value="30" onChange={() => {}} options={INTERVALS} fullWidth={false} />
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

// ── Right to left ───────────────────────────────────────────────────────────

/** The label is at the start of the row and the control at the end. */
export const LabelAndControlSwapSides: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <FormRow label="Notifications">
        <Toggle checked onChange={() => {}} />
      </FormRow>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByText('Notifications'));
    expectMirrored(canvasElement, (box) => within(box).getByRole('switch'));
  },
};

const SettingsRows = () => (
  <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-800">
    <div className="py-3">
      <FormRow
        label="Time zone"
        description="Dates in reports and emails use it."
        tooltip="Each member can still pick their own."
      >
        <Select
          aria-label="Time zone"
          options={[
            { value: 'paris', label: 'Europe/Paris (UTC+02:00)' },
            { value: 'lisbon', label: 'Europe/Lisbon (UTC+01:00)' },
          ]}
        />
      </FormRow>
    </div>
    <div className="py-3">
      <FormRow label="Weekly digest" description="An email every Monday morning.">
        <Toggle aria-label="Weekly digest" defaultChecked />
      </FormRow>
    </div>
  </div>
);

/** Below `sm` the label and its description stack above the field, which takes the row's width. */
export const MobileStacksLabelAboveField: Story = {
  globals: mobileViewport,
  render: () => <SettingsRows />,
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    const labelText = canvas.getByText('Time zone');
    const description = canvas
      .getByText('Dates in reports and emails use it.')
      .getBoundingClientRect();
    const selectField = canvas.getByRole('combobox');
    const select = selectField.getBoundingClientRect();
    await expect(select.top).toBeGreaterThanOrEqual(description.bottom);
    // Same start edge as the label, and wide: not squeezed beside it.
    await expect(
      Math.abs(startOffset(selectField, canvasElement) - startOffset(labelText, canvasElement))
    ).toBeLessThanOrEqual(1);
    await expect(select.width).toBeGreaterThan(250);
  },
};

/** A switch stays beside its label on a phone, at the end of the row. */
export const MobileKeepsASwitchBesideItsLabel: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => <SettingsRows />,
  play: async ({ canvas }) => {
    const label = canvas.getByText('Weekly digest');
    const toggle = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(toggle.getBoundingClientRect().top).toBeLessThan(
      canvas.getByText('An email every Monday morning.').getBoundingClientRect().bottom
    );
    expectBeyondEnd(toggle, label);
  },
};

/** From `sm` up the control stays beside its label, on the row's centre line. */
export const DesktopKeepsTheControlBesideTheLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SettingsRows />,
  play: async ({ canvas }) => {
    const label = canvas.getByText('Weekly digest');
    const toggle = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(toggle.getBoundingClientRect().top).toBeLessThan(
      label.getBoundingClientRect().bottom
    );
    expectBeyondEnd(toggle, label);
  },
};
