import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ribbon, type RibbonIntent, type RibbonPosition } from './Ribbon';

const meta = {
  title: 'Atoms/Ribbon',
  component: Ribbon,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Ribbon>;

export default meta;
type Story = StoryObj<typeof meta>;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-44 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as RibbonPosition[]).map(
        (pos) => (
          <Card key={pos}>
            <Ribbon position={pos} intent="brand">
              {pos}
            </Ribbon>
          </Card>
        ),
      )}
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
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as RibbonPosition[]).map(
        (pos) => (
          <Card key={pos}>
            <Ribbon shape="angled" position={pos} intent="success">
              {pos}
            </Ribbon>
          </Card>
        ),
      )}
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
