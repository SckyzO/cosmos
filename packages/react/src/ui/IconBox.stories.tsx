import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, LayoutDashboard, Server, Trash2 } from 'lucide-react';
import { expect } from 'storybook/test';
import { IconBox, type IconBoxSize } from './IconBox';

const meta = {
  title: 'Atoms/Icon Box',
  component: IconBox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { icon: Server },
} satisfies Meta<typeof IconBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// The box, the icon and the corners of each size, in px. Every size is listed (the compiler checks
// it), and the story reads its sizes from here.
const PX = {
  xs: { box: 24, icon: 12, radius: 6 },
  sm: { box: 28, icon: 14, radius: 6 },
  md: { box: 32, icon: 16, radius: 8 },
  lg: { box: 40, icon: 20, radius: 12 },
  xl: { box: 48, icon: 24, radius: 12 },
  '2xl': { box: 56, icon: 28, radius: 16 },
  '3xl': { box: 64, icon: 32, radius: 16 },
} as const satisfies Record<IconBoxSize, { box: number; icon: number; radius: number }>;
const SIZES = Object.keys(PX) as IconBoxSize[];

/** Seven sizes, `xs` to `3xl`. `md` is the default. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map((size) => (
        <div key={size} data-size={size} className="flex flex-col items-center gap-2">
          <IconBox icon={Server} size={size} />
          <span className="text-3xs text-gray-600 uppercase dark:text-gray-400">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const SizesChecks: Story = {
  ...Sizes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    for (const cell of canvasElement.querySelectorAll('[data-size]')) {
      const size = cell.getAttribute('data-size') as IconBoxSize;
      const boxElement = cell.firstElementChild!;
      const box = boxElement.getBoundingClientRect();
      const icon = cell.querySelector('svg')!.getBoundingClientRect();
      await expect([box.width, box.height], `${size} box`).toEqual([PX[size].box, PX[size].box]);
      await expect([icon.width, icon.height], `${size} icon`).toEqual([
        PX[size].icon,
        PX[size].icon,
      ]);
      await expect(
        parseFloat(getComputedStyle(boxElement).borderTopLeftRadius),
        `${size} corners`
      ).toBe(PX[size].radius);
    }
  },
};

export const DefaultIsMedium: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box">
      <IconBox icon={Server} />
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('box').firstElementChild!.getBoundingClientRect();
    await expect(box.width).toBe(PX.md.box);
  },
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconBox icon={Server} />
      <IconBox icon={Bell} bg="bg-brand-50 dark:bg-brand-500/10" color="text-brand-500" />
      <IconBox icon={Trash2} bg="bg-red-50 dark:bg-red-500/10" color="text-red-500" />
      <IconBox
        icon={LayoutDashboard}
        bg="bg-green-50 dark:bg-green-500/10"
        color="text-green-500"
      />
    </div>
  ),
};
