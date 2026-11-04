import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { ColumnHeader } from './ColumnHeader';

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
