import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ActiveFiltersBar, type ActiveFilter } from './ActiveFiltersBar';
import { LabelsProvider } from '../labels/LabelsProvider';
import { expectTextContrast, inEachTheme } from '../storybook-helpers';
import { FRENCH_ACTIVE_FILTERS_LABELS } from './storybook-fixtures';

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

export const ClearAllGetsNoEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClearAll: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(args.onClearAll).toHaveBeenCalledTimes(1);
    // The prop is `() => void`: the click event stays with the button.
    await expect(args.onClearAll).toHaveBeenCalledWith();
  },
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

/** The provider's words reach the bar and its chips; the bar's own `labels` win over them. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={{ activeFiltersBar: FRENCH_ACTIVE_FILTERS_LABELS }}>
      <ActiveFiltersBar
        filters={FILTERS}
        onClearOne={() => {}}
        onClearAll={() => {}}
        labels={{ clearAll: 'Réinitialiser' }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Filtres actifs :')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Effacer le filtre severity' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Effacer le filtre owner' })).toBeVisible();
    // Its own label wins over the provider's "Tout effacer".
    await expect(canvas.getByRole('button', { name: 'Réinitialiser' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Tout effacer' })).toBeNull();
  },
};
