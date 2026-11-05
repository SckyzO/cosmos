import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnsavedIndicator } from './UnsavedIndicator';
import { LabelsProvider } from '../labels/LabelsProvider';
import { expect } from 'storybook/test';

const meta = {
  title: 'Actions/Unsaved Indicator',
  component: UnsavedIndicator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { visible: true },
} satisfies Meta<typeof UnsavedIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = { args: { visible: true } };
/** With nothing to save the indicator renders nothing, and the toolbar shows no label. */
export const Hidden: Story = {
  args: { visible: false },
  render: (args) => (
    <div className="w-80 space-y-2">
      <div className="flex h-10 items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-900 dark:text-white">Profile settings</span>
        <UnsavedIndicator {...args} />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        <code>visible</code> is false: the form has no unsaved changes, so no label is drawn.
      </p>
    </div>
  ),
};
export const CustomLabel: Story = {
  args: { visible: true, labels: { unsaved: 'Form has changed' } },
};

/** The provider writes the text, the indicator's own `labels` win over it. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={{ unsavedIndicator: { unsaved: 'Modifications non enregistrées' } }}>
      <UnsavedIndicator visible />
      <UnsavedIndicator visible labels={{ unsaved: 'Brouillon' }} />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Modifications non enregistrées')).toBeVisible();
    await expect(canvas.getByText('Brouillon')).toBeVisible();
  },
};
