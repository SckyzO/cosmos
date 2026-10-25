import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { PageActionButton, PageActionIconButton } from './PageActionButton';

const meta = {
  title: 'Actions/Page Action Button',
  component: PageActionButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Action' },
} satisfies Meta<typeof PageActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = { args: { children: 'Configure', icon: SlidersHorizontal } };
export const Primary: Story = { args: { children: 'New', variant: 'primary', icon: Plus } };
export const BrandOutline: Story = {
  args: { children: 'Edit layout', intent: 'brand', icon: Pencil },
};
export const DangerOutline: Story = {
  args: { children: 'Delete', intent: 'danger', icon: Trash2 },
};

export const ClickFiresOnClick: Story = {
  tags: ['!dev'],
  args: { children: 'Save', icon: Plus, onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <PageActionIconButton icon={SlidersHorizontal} title="Configure" />
      <PageActionIconButton icon={Plus} title="Add" variant="primary" />
      <PageActionIconButton icon={Trash2} title="Delete" intent="danger" />
    </div>
  ),
};

const buttonRef = createRef<HTMLButtonElement>();
const iconButtonRef = createRef<HTMLButtonElement>();

/** Each ref gets its `<button>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-center gap-2">
      <PageActionButton ref={buttonRef}>Configure</PageActionButton>
      <PageActionIconButton ref={iconButtonRef} icon={Plus} title="Add" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: 'Configure' }));
    await expectRefFocuses(iconButtonRef, canvas.getByRole('button', { name: 'Add' }));
  },
};

/** `variant` is the emphasis and `intent` the color: an outline is neutral and a primary brand until told otherwise. */
export const IntentColorsEachVariant: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <PageActionButton>outline</PageActionButton>
      <PageActionButton intent="brand">outline brand</PageActionButton>
      <PageActionButton intent="danger">outline danger</PageActionButton>
      <PageActionButton variant="primary">primary</PageActionButton>
      <PageActionButton variant="primary" intent="brand">
        primary brand
      </PageActionButton>
      <PageActionButton variant="primary" intent="danger">
        primary danger
      </PageActionButton>
      <PageActionIconButton icon={Trash2} title="icon danger" intent="danger" />
      <PageActionIconButton icon={Plus} title="icon primary" variant="primary" />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = (name: string) => canvas.getByRole('button', { name });

    await expect(button('outline')).toHaveClass('border-gray-200', 'bg-white', 'text-gray-600');
    // `brand-outline` and `danger-outline`, as they were.
    await expect(button('outline brand')).toHaveClass(
      'border-brand-200',
      'bg-brand-50',
      'text-brand-600'
    );
    await expect(button('outline danger')).toHaveClass(
      'border-red-200',
      'bg-white',
      'text-red-600'
    );
    await expect(button('primary')).toHaveClass('border-transparent', 'bg-brand-500', 'text-white');
    await expect(button('primary brand').className).toBe(button('primary').className);
    await expect(button('primary danger')).toHaveClass(
      'border-transparent',
      'bg-red-600',
      'text-white'
    );
    await expect(button('primary danger')).not.toHaveClass('bg-brand-500');

    await expect(button('icon danger')).toHaveClass('border-red-200', 'text-red-600');
    await expect(button('icon primary')).toHaveClass('bg-brand-500', 'text-white');
  },
};
