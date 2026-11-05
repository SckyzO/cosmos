import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LabelsProvider } from '../labels/LabelsProvider';
import { portalDocsParams } from '../storybook-helpers';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { ColumnHeader } from './ColumnHeader';
import { FRENCH_COLUMN_FILTER_LABELS, FRENCH_COLUMN_HEADER_LABELS } from './storybook-fixtures';

// The header cell of a DataTable column. DataTable wires it with arrows of its own, so these
// stories hand it mocks, to check what it calls them with.
const meta = {
  title: 'Tables/Column Header',
  component: ColumnHeader,
  parameters: portalDocsParams.md(),
  args: { label: 'Role' },
  render: (args) => (
    <table>
      <thead>
        <tr>
          <ColumnHeader {...args} />
        </tr>
      </thead>
    </table>
  ),
} satisfies Meta<typeof ColumnHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The sort button calls `onSortToggle` with no argument: the click event stays with the button. */
export const SortToggleGetsNoEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { sortable: true, onSortToggle: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Role' }));
    await expect(args.onSortToggle).toHaveBeenCalledTimes(1);
    await expect(args.onSortToggle).toHaveBeenCalledWith();
  },
};

/** "Clear" in the filter dropdown calls `onFilterClear` with no argument too. */
export const FilterClearGetsNoEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    filterable: true,
    filterValues: ['Engineer', 'Designer'],
    filterSelected: new Set(['Engineer']),
    onFilterToggle: fn(),
    onFilterClear: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Role, 1 selected' }));
    // The dropdown is a floating panel: it renders at the end of the body.
    const clear = await within(document.body).findByRole('button', { name: /^Clear/ });
    await userEvent.click(clear);
    await expect(args.onFilterClear).toHaveBeenCalledTimes(1);
    await expect(args.onFilterClear).toHaveBeenCalledWith();
  },
};

/**
 * The provider's words reach the filter button and the dropdown it opens, and the standalone
 * dropdown; a header's or a dropdown's own `labels` win over them.
 */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        columnHeader: FRENCH_COLUMN_HEADER_LABELS,
        columnFilterDropdown: FRENCH_COLUMN_FILTER_LABELS,
      }}
    >
      <table>
        <thead>
          <tr>
            <ColumnHeader
              label="Role"
              filterable
              filterValues={['Engineer', 'Designer']}
              filterSelected={new Set(['Engineer'])}
              onFilterToggle={() => {}}
              onFilterClear={() => {}}
            />
            <ColumnHeader
              label="Team"
              filterable
              filterValues={['Core']}
              onFilterToggle={() => {}}
              onFilterClear={() => {}}
              labels={{ filter: (column) => `Restreindre ${column}` }}
            />
            <ColumnHeader
              label={<em>City</em>}
              filterable
              filterValues={['Paris']}
              onFilterToggle={() => {}}
              onFilterClear={() => {}}
            />
          </tr>
        </thead>
      </table>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filtrer la colonne' })).toBeVisible();
    // Its own `filter` wins over the provider's.
    await expect(canvas.getByRole('button', { name: 'Restreindre Team' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Filtrer Role, 1 sélectionné' }));
    const body = within(document.body);
    await userEvent.type(await body.findByPlaceholderText('Rechercher…'), 'zzz');
    await expect(await body.findByText('Aucun résultat')).toBeVisible();
    await userEvent.clear(body.getByPlaceholderText('Rechercher…'));
    await expect(
      await body.findByRole('button', { name: 'Effacer (1 sélectionné)' })
    ).toBeVisible();
  },
};

/** The dropdown on its own: the provider's words, and one label of its own that wins. */
export const FilterDropdownTranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={{ columnFilterDropdown: FRENCH_COLUMN_FILTER_LABELS }}>
      <ColumnFilterDropdown
        values={['Engineer', 'Designer']}
        selected={new Set(['Designer'])}
        onToggle={() => {}}
        onClear={() => {}}
        labels={{ noResults: 'Rien à montrer' }}
      />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Effacer (1 sélectionné)' })).toBeVisible();
    await userEvent.type(canvas.getByPlaceholderText('Rechercher…'), 'zzz');
    await expect(canvas.getByText('Rien à montrer')).toBeVisible();
    await expect(canvas.queryByText('Aucun résultat')).toBeNull();
  },
};
