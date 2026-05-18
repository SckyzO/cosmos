import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Plus, ArrowRight } from 'lucide-react';
import { Divider } from './Divider';
import { Button } from '../ui/Button';
import { ButtonGroup } from '../ui/ButtonGroup';

const meta = {
  title: 'Layout/Divider',
  component: Divider,
  subcomponents: { 'Divider.Icon': Divider.Icon, 'Divider.Row': Divider.Row },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

// TUI Plus "With label" — line with a centered text inset.
export const WithLabel: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Continue" />
    </div>
  ),
};

// TUI Plus "With icon" — line with a centered icon chip.
export const WithIcon: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider.Icon icon={Plus} />
    </div>
  ),
};

// TUI Plus "With label on left" — line with a left-aligned text inset.
export const WithLabelOnLeft: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Continue" align="left" />
    </div>
  ),
};

// TUI Plus "With title" — emphasized inset (text-base, font-semibold).
export const WithTitle: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Section title" emphasis />
    </div>
  ),
};

// TUI Plus "With title on left" — emphasized inset, left-aligned.
export const WithTitleOnLeft: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Section title" emphasis align="left" />
    </div>
  ),
};

// TUI Plus "With button" — bordered row, no title, single trailing button.
export const WithButton: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider.Row actions={<Button size="sm">Create</Button>} />
    </div>
  ),
};

// TUI Plus "With title and button" — bordered row with title + trailing button.
export const WithTitleAndButton: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider.Row
        title="Recent activity"
        actions={
          <Button size="sm" icon={ArrowRight} iconPosition="right">
            View all
          </Button>
        }
      />
    </div>
  ),
};

// TUI Plus "With toolbar" — bordered row with title + button group on the right.
export const WithToolbar: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider.Row
        title="Files"
        actions={
          <ButtonGroup>
            <Button size="sm" variant="secondary">
              Day
            </Button>
            <Button size="sm" variant="secondary">
              Week
            </Button>
            <Button size="sm" variant="secondary">
              Month
            </Button>
          </ButtonGroup>
        }
      />
    </div>
  ),
};

// Plain line (no inset) — base case.
export const PlainLine: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider />
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const PlainLineHasSeparatorRole: Story = {
  render: () => <Divider data-testid="d" />,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('[data-testid="d"]');
    await expect(el).not.toBeNull();
    await expect(el).toHaveAttribute('role', 'separator');
  },
};

export const InsetCenteredByDefault: Story = {
  render: () => <Divider inset="X" />,
  play: async ({ canvasElement }) => {
    const inner = canvasElement.querySelector('.flex.justify-center');
    await expect(inner).not.toBeNull();
  },
};

export const AlignLeftMovesInsetToStart: Story = {
  render: () => <Divider inset="X" align="left" />,
  play: async ({ canvasElement }) => {
    const inner = canvasElement.querySelector('.flex.justify-start');
    await expect(inner).not.toBeNull();
  },
};

export const EmphasisSwitchesToTitleStyle: Story = {
  render: () => <Divider inset="X" emphasis />,
  play: async ({ canvasElement }) => {
    const span = canvasElement.querySelector('span.font-semibold');
    await expect(span).not.toBeNull();
  },
};

export const RowRendersTitleAndActions: Story = {
  render: () => (
    <Divider.Row
      title="T"
      actions={
        <button type="button" data-testid="a">
          Go
        </button>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('h3');
    await expect(title?.textContent).toBe('T');
    const action = canvasElement.querySelector('[data-testid="a"]');
    await expect(action).not.toBeNull();
  },
};

export const IconVariantRendersIconChip: Story = {
  render: () => <Divider.Icon icon={Plus} data-testid="d" />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="d"]');
    await expect(root).not.toBeNull();
    const svg = root?.querySelector('svg');
    await expect(svg).not.toBeNull();
  },
};
