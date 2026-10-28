import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
import { bothDirections, endOffset, directionBox, expectMirrored } from '../storybook-helpers';
import { Card as CosmosCard } from './Card';
import { Ribbon, type RibbonIntent, type RibbonPosition } from './Ribbon';

const meta = {
  title: 'Atoms/Ribbon',
  component: Ribbon,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof Ribbon>;

export default meta;
type Story = StoryObj<typeof meta>;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-44 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    {children}
    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pro plan</h4>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">29 € / month</p>
    <p className="mt-3 text-xs text-gray-700 dark:text-gray-300">
      Unlimited members, priority support, and 1 TB of storage.
    </p>
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const FlatTopEnd: Story = {
  render: () => (
    <Card>
      <Ribbon>NEW</Ribbon>
    </Card>
  ),
};

export const Angled: Story = {
  render: () => (
    <Card>
      <Ribbon shape="angled" intent="warning">
        SALE
      </Ribbon>
    </Card>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as RibbonPosition[]).map((pos) => (
        <Card key={pos}>
          <Ribbon position={pos} intent="brand">
            {pos}
          </Ribbon>
        </Card>
      ))}
    </div>
  ),
};

export const Intents: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
      {(['brand', 'success', 'warning', 'danger', 'neutral'] as RibbonIntent[]).map((i) => (
        <Card key={i}>
          <Ribbon intent={i}>{i}</Ribbon>
        </Card>
      ))}
    </div>
  ),
};

export const AngledPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as RibbonPosition[]).map((pos) => (
        <Card key={pos}>
          <Ribbon shape="angled" position={pos} intent="success">
            {pos}
          </Ribbon>
        </Card>
      ))}
    </div>
  ),
};

export const Pill: Story = {
  render: () => (
    <Card>
      <Ribbon shape="pill" intent="success">
        NEW
      </Ribbon>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`shape="pill"` is a fully rounded label set inside the card, 12px from the corner of its `position`. `flat` and `angled` stay stuck to the corner.',
      },
    },
  },
};

export const PillPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as RibbonPosition[]).map((pos) => (
        <Card key={pos}>
          <Ribbon shape="pill" position={pos} intent="brand">
            {pos}
          </Ribbon>
        </Card>
      ))}
    </div>
  ),
};

export const PillIntents: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
      {(['brand', 'success', 'warning', 'danger', 'neutral'] as RibbonIntent[]).map((i) => (
        <Card key={i}>
          <Ribbon shape="pill" intent={i}>
            {i}
          </Ribbon>
        </Card>
      ))}
    </div>
  ),
};

export const OnImage: Story = {
  render: () => (
    <div className="relative h-44 w-64 overflow-hidden rounded-xl shadow-sm">
      <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500" />
      <Ribbon shape="angled" intent="danger">
        −30%
      </Ribbon>
    </div>
  ),
};

export const FlatVsAngled: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <Ribbon shape="flat" intent="brand">
          NEW
        </Ribbon>
      </Card>
      <Card>
        <Ribbon shape="angled" intent="brand">
          NEW
        </Ribbon>
      </Card>
    </div>
  ),
};

export const DemoCorner: Story = {
  render: () => (
    <Card>
      <Ribbon shape="angled" position="top-start" intent="warning">
        DEMO
      </Ribbon>
    </Card>
  ),
};

/** A flat ribbon on a Cosmos `Card` takes the card's corner radius, whatever it is. */
export const FollowsCardRadius: Story = {
  tags: ['!dev'],
  render: () => (
    <CosmosCard padding="lg" className="relative h-44 w-64">
      <Ribbon position="top-end">NEW</Ribbon>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pro plan</h4>
    </CosmosCard>
  ),
  play: async ({ canvas }) => {
    const ribbon = canvas.getByText('NEW');
    const card = ribbon.parentElement as HTMLElement;
    // The ribbon's `top-end` is the end of the line: the top-left corner in right to left.
    const corner =
      getComputedStyle(ribbon).direction === 'rtl' ? 'borderTopLeftRadius' : 'borderTopRightRadius';
    await expect(getComputedStyle(ribbon)[corner]).toBe(getComputedStyle(card)[corner]);
  },
};

const INSET: Record<RibbonPosition, [side: 'start' | 'end', edge: 'top' | 'bottom']> = {
  'top-start': ['start', 'top'],
  'top-end': ['end', 'top'],
  'bottom-start': ['start', 'bottom'],
  'bottom-end': ['end', 'bottom'],
};

/** A `pill` ribbon sits 12px from the corner of its position, and is fully rounded. */
export const PillSitsInsideTheCorner: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(Object.keys(INSET) as RibbonPosition[]).map((pos) => (
        <Card key={pos}>
          <Ribbon shape="pill" position={pos} intent="danger">
            {`${pos} pill`}
          </Ribbon>
        </Card>
      ))}
      <Card>
        <Ribbon shape="flat" intent="danger">
          flat
        </Ribbon>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const pos of Object.keys(INSET) as RibbonPosition[]) {
      const ribbon = canvas.getByText(`${pos} pill`);
      const card = ribbon.parentElement as HTMLElement;
      const cardBox = card.getBoundingClientRect();
      const box = ribbon.getBoundingClientRect();
      const style = getComputedStyle(card);
      // An absolute box is placed from the padding edge, inside the border.
      const [named, edge] = INSET[pos];
      // `start` and `end` name the sides of the line.
      const side = (named === 'start') !== (style.direction === 'rtl') ? 'left' : 'right';
      const fromSide =
        side === 'left'
          ? box.left - (cardBox.left + parseFloat(style.borderLeftWidth))
          : cardBox.right - parseFloat(style.borderRightWidth) - box.right;
      const fromEdge =
        edge === 'top'
          ? box.top - (cardBox.top + parseFloat(style.borderTopWidth))
          : cardBox.bottom - parseFloat(style.borderBottomWidth) - box.bottom;
      await expect(fromSide).toBeCloseTo(12, 0);
      await expect(fromEdge).toBeCloseTo(12, 0);
      // Fully rounded: the radius is at least half the height.
      await expect(parseFloat(getComputedStyle(ribbon).borderTopLeftRadius)).toBeGreaterThanOrEqual(
        box.height / 2
      );
    }
    // The flat ribbon still hugs the corner.
    const flat = canvas.getByText('flat');
    const flatCard = flat.parentElement as HTMLElement;
    await expect(endOffset(flat, flatCard)).toBeLessThan(12);
  },
};

/** A `pill` ribbon keeps the solid fill of its intent, as the other shapes do. */
export const PillKeepsTheIntentFill: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(['brand', 'success', 'warning', 'danger', 'neutral'] as RibbonIntent[]).map((i) => (
        <Card key={i}>
          <Ribbon shape="pill" intent={i}>
            {`${i} pill`}
          </Ribbon>
          <Ribbon shape="flat" intent={i} position="bottom-start">
            {`${i} flat`}
          </Ribbon>
        </Card>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const intent of ['brand', 'success', 'warning', 'danger', 'neutral']) {
      const pill = getComputedStyle(canvas.getByText(`${intent} pill`));
      const flat = getComputedStyle(canvas.getByText(`${intent} flat`));
      await expect(pill.backgroundColor).toBe(flat.backgroundColor);
      await expect(pill.color).toBe(flat.color);
    }
  },
};

/**
 * `end` is the end of the line: a `top-end` ribbon takes the top-left corner in right to left,
 * with its corners, its lean and its letter spacing following.
 */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="flex gap-4">
        <Card>
          <Ribbon>NEW</Ribbon>
        </Card>
        <Card>
          <Ribbon shape="angled" intent="warning">
            SALE
          </Ribbon>
        </Card>
        <Card>
          <Ribbon shape="pill" position="bottom-start">
            PRO
          </Ribbon>
        </Card>
      </div>
    )),
  play: ({ canvasElement }) => {
    // Flat: flush with the end of the card. Its width differs with the letter spacing, so it is
    // the end edge that is compared, not the start one.
    const flat = {
      ltr: directionBox(canvasElement, 'ltr').querySelectorAll<HTMLElement>('.absolute')[0]!,
      rtl: directionBox(canvasElement, 'rtl').querySelectorAll<HTMLElement>('.absolute')[0]!,
    };
    for (const ribbon of [flat.ltr, flat.rtl]) {
      // Inside the 1px border of the card.
      expect(endOffset(ribbon, ribbon.parentElement!)).toBeCloseTo(1, 0);
    }
    const angled = expectMirrored(canvasElement, (box) => box.querySelectorAll('.absolute')[1]);
    expectMirrored(canvasElement, (box) => box.querySelectorAll('.absolute')[2]);

    // The rounded corner is the one at the foot of the ribbon, on its inner side.
    const corner = (el: HTMLElement, side: 'Left' | 'Right') =>
      Number.parseFloat(getComputedStyle(el)[`borderBottom${side}Radius`]);
    expect(corner(flat.ltr, 'Left')).toBeGreaterThan(0);
    expect(corner(flat.rtl, 'Right')).toBeGreaterThan(0);
    expect(corner(flat.rtl, 'Left')).toBe(0);

    expect(getComputedStyle(angled.ltr).rotate).toBe('45deg');
    expect(getComputedStyle(angled.rtl).rotate).toBe('-45deg');

    // Letter spacing breaks the joins of Arabic script.
    expect(getComputedStyle(flat.ltr).letterSpacing).not.toBe('normal');
    expect(getComputedStyle(flat.rtl).letterSpacing).toBe('normal');
  },
};
