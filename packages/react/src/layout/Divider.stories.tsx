import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Plus, ArrowRight } from 'lucide-react';
import { bothDirections, directionBox, endOffset, startOffset } from '../storybook-helpers';
import { Divider } from './Divider';
import { Button } from '../ui/Button';
import { ButtonGroup } from '../ui/ButtonGroup';

const meta = {
  title: 'Typography/Divider',
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

// TUI Plus "With label on left" — line with a text inset at the start of the line.
export const WithLabelAtStart: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Continue" align="start" />
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

// TUI Plus "With title on left" — emphasized inset at the start of the line.
export const WithTitleAtStart: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Divider inset="Section title" emphasis align="start" />
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
          <Button size="sm" icon={ArrowRight} iconPosition="end">
            View all
          </Button>
        }
      />
    </div>
  ),
};

// TUI Plus "With toolbar" — bordered row with title + button group at the end.
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
  tags: ['!dev'],
  render: () => <Divider data-testid="d" />,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('[data-testid="d"]');
    await expect(el).not.toBeNull();
    await expect(el).toHaveAttribute('role', 'separator');
  },
};

export const InsetCenteredByDefault: Story = {
  tags: ['!dev'],
  render: () => <Divider inset="X" />,
  play: async ({ canvasElement }) => {
    const inner = canvasElement.querySelector('.flex.justify-center');
    await expect(inner).not.toBeNull();
  },
};

export const AlignStartMovesInsetToStart: Story = {
  tags: ['!dev'],
  render: () => <Divider inset="X" align="start" />,
  play: async ({ canvasElement }) => {
    const inner = canvasElement.querySelector('.flex.justify-start');
    await expect(inner).not.toBeNull();
  },
};

export const EmphasisSwitchesToTitleStyle: Story = {
  tags: ['!dev'],
  render: () => <Divider inset="X" emphasis />,
  play: async ({ canvasElement }) => {
    const span = canvasElement.querySelector('span.font-semibold');
    await expect(span).not.toBeNull();
  },
};

export const RowRendersTitleAndActions: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <Divider.Icon icon={Plus} data-testid="d" />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-testid="d"]');
    await expect(root).not.toBeNull();
    const svg = root?.querySelector('svg');
    await expect(svg).not.toBeNull();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** `start` and `end` name the reading direction: the inset sits on the right in right to left. */
export const AlignFollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-6">
        <Divider inset="Start label" align="start" />
        <Divider inset="End label" align="end" />
        <Divider.Icon icon={Plus} align="start" data-testid="start-icon" />
        <Divider.Icon icon={Plus} align="end" data-testid="end-icon" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const start = within(box).getByText('Start label');
      const end = within(box).getByText('End label');
      expect(startOffset(start, box), `${dir}: start`).toBeLessThan(endOffset(start, box));
      expect(endOffset(end, box), `${dir}: end`).toBeLessThan(startOffset(end, box));
      const startIcon = within(box).getByTestId('start-icon').querySelector('svg')!;
      const endIcon = within(box).getByTestId('end-icon').querySelector('svg')!;
      expect(startOffset(startIcon, box), `${dir}: start icon`).toBeLessThan(
        endOffset(startIcon, box)
      );
      expect(endOffset(endIcon, box), `${dir}: end icon`).toBeLessThan(startOffset(endIcon, box));
    }
  },
};
