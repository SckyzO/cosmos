import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { expectTextContrast, inEachTheme } from '../storybook-helpers';

const FILTERS: ActiveFilter[] = [
  { key: 'severity', label: 'severity', value: 'Critical, Warning' },
  { key: 'owner', label: 'owner', value: 'Platform team' },
];

const meta = {
  title: 'Tables/ActiveFiltersBar',
  component: ActiveFiltersBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { filters: FILTERS, onClearOne: () => {}, onClearAll: () => {} },
} satisfies Meta<typeof ActiveFiltersBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = () => {
  const [filters, setFilters] = useState(FILTERS);
  return (
    <ActiveFiltersBar
      filters={filters}
      onClearOne={(key) => setFilters((all) => all.filter((f) => f.key !== key))}
      onClearAll={() => setFilters([])}
    />
  );
};

/** Each filter is a removable brand Tag, named "Clear {label} filter". */
export const Default: Story = {
  render: () => <Demo />,
};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear severity filter' }));
    await expect(canvas.queryByText('Critical, Warning')).not.toBeInTheDocument();
    await expect(canvas.getByText('Platform team')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    // Nothing left to show: the bar renders nothing.
    await expect(canvas.queryByText('Active filters:')).not.toBeInTheDocument();
  },
};

export const ContrastInEveryTheme: Story = {
  tags: ['!dev'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    inEachTheme(() => {
      expectTextContrast(canvas.getByText('Platform team'));
      expectTextContrast(canvas.getByText('severity'));
    });
  },
};
