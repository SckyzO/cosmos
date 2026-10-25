import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import type { FieldSize } from './fieldRecipe';
import { Input } from './Input';
import { NumberInput } from './NumberInput';
import { SearchInput } from './SearchInput';
import { Select } from './Select';
import { Textarea } from './Textarea';
import { TimePicker } from './TimePicker';

// Every field of the library, one row per size: they share one recipe, so a row
// reads as one family and the heights step 32 / 36 / 44px like Button's.
const meta = {
  title: 'Forms/Field sizes',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES: FieldSize[] = ['sm', 'md', 'lg'];
const HEIGHT: Record<FieldSize, number> = { sm: 32, md: 36, lg: 44 };
const FONT: Record<FieldSize, string> = { sm: '12px', md: '14px', lg: '16px' };

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
];

const FieldsRow = ({ size, required }: { size: FieldSize; required?: boolean }) => (
  <div data-size={size} className="grid grid-cols-4 items-start gap-4">
    <Input label="Name" placeholder="Type here…" size={size} required={required} />
    <Select label="Region" options={OPTIONS} size={size} required={required} />
    <TimePicker label="Time" size={size} required={required} fullWidth />
    <DatePicker label="Date" size={size} required={required} fullWidth />
    <Combobox
      label="Owner"
      options={OPTIONS}
      placeholder="Search…"
      size={size}
      required={required}
    />
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</p>
      <NumberInput aria-label="Quantity" size={size} fullWidth required={required} />
    </div>
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Search</p>
      <SearchInput aria-label="Search" size={size} required={required} />
    </div>
    <Textarea label="Notes" rows={2} size={size} required={required} />
  </div>
);

export const AllFieldsAllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {SIZES.map((size) => (
        <FieldsRow key={size} size={size} />
      ))}
    </div>
  ),
};

export const SizesStepThroughTheScale: Story = {
  tags: ['!dev', '!autodocs'],
  render: AllFieldsAllSizes.render,
  play: async ({ canvasElement }) => {
    for (const size of SIZES) {
      const row = within(canvasElement.querySelector<HTMLElement>(`[data-size="${size}"]`)!);
      const fixed = [
        row.getByLabelText('Name'),
        row.getByRole('combobox', { name: 'Region' }),
        row.getByLabelText('Time'),
        row.getByRole('button', { name: /Date/ }),
        row.getByRole('combobox', { name: 'Owner' }),
        // The number input sits inside the bordered wrapper that has the height.
        row.getByRole('spinbutton', { name: 'Quantity' }).closest<HTMLElement>('.rounded-lg')!,
        row.getByRole('textbox', { name: 'Search' }),
      ];
      for (const el of fixed) {
        await expect(el.getBoundingClientRect().height).toBe(HEIGHT[size]);
        await expect(getComputedStyle(el).fontSize).toBe(FONT[size]);
      }
      // The textarea has no fixed height: its text follows the size, its height `rows`.
      await expect(getComputedStyle(row.getByLabelText('Notes')).fontSize).toBe(FONT[size]);
    }
  },
};

export const Required: Story = {
  render: () => <FieldsRow size="md" required />,
};

export const RequiredSetsAriaRequired: Story = {
  tags: ['!dev', '!autodocs'],
  render: Required.render,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement);
    const controls = [
      row.getByLabelText('Name', { exact: false }),
      row.getByRole('combobox', { name: /Region/ }),
      row.getByLabelText('Time', { exact: false }),
      row.getByRole('combobox', { name: /Owner/ }),
      row.getByRole('spinbutton', { name: 'Quantity' }),
      row.getByRole('textbox', { name: 'Search' }),
      row.getByLabelText('Notes', { exact: false }),
    ];
    for (const el of controls) await expect(el).toHaveAttribute('aria-required', 'true');
    // Every label carries the asterisk, hidden from assistive technology.
    const labels = [...canvasElement.querySelectorAll('label')];
    await expect(labels).toHaveLength(6);
    for (const label of labels)
      await expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
    // A button can't take aria-required: the DatePicker label says it instead.
    await expect(row.getByRole('button', { name: /Date.*required/ })).toBeInTheDocument();
  },
};

export const NotRequiredByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FieldsRow size="md" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-required]')).toBeNull();
    await expect(canvasElement.querySelector('label [aria-hidden="true"]')).toBeNull();
  },
};
