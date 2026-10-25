import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { expectRefFocuses } from '../storybook-helpers';
import { RowActionButton } from './RowActionButton';

const meta = {
  title: 'Actions/Row Action Button',
  component: RowActionButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'View' },
} satisfies Meta<typeof RowActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HideChevron: Story = { args: { children: 'Open', hideChevron: true } };

export const ClickFiresOnClick: Story = {
  tags: ['!dev'],
  args: { children: 'View', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /View/ }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

const buttonRef = createRef<HTMLButtonElement>();

/** The ref gets the `<button>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <RowActionButton ref={buttonRef} />,
  play: async ({ canvas }) => {
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: /View/ }));
  },
};
