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
