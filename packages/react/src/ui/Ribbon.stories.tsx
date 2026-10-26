import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
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

export const FlatTopRight: Story = {
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
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as RibbonPosition[]).map((pos) => (
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
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as RibbonPosition[]).map((pos) => (
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
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as RibbonPosition[]).map((pos) => (
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
      <Ribbon shape="angled" position="top-left" intent="warning">
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
      <Ribbon position="top-right">NEW</Ribbon>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pro plan</h4>
    </CosmosCard>
  ),
  play: async ({ canvas }) => {
    const ribbon = canvas.getByText('NEW');
    const card = ribbon.parentElement as HTMLElement;
    await expect(getComputedStyle(ribbon).borderTopRightRadius).toBe(
      getComputedStyle(card).borderTopRightRadius
    );
  },
};

const INSET: Record<RibbonPosition, [side: 'left' | 'right', edge: 'top' | 'bottom']> = {
  'top-left': ['left', 'top'],
  'top-right': ['right', 'top'],
  'bottom-left': ['left', 'bottom'],
  'bottom-right': ['right', 'bottom'],
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
      const [side, edge] = INSET[pos];
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
    await expect(
      flatCard.getBoundingClientRect().right - flat.getBoundingClientRect().right
    ).toBeLessThan(12);
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
          <Ribbon shape="flat" intent={i} position="bottom-left">
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
