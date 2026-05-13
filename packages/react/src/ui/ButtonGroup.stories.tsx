import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Filter,
  Pencil,
  Plus,
  Save,
  Share2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';

const meta = {
  title: 'Atoms/Button Group',
  component: ButtonGroup,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryAttached: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="primary">Day</Button>
      <Button variant="primary">Week</Button>
      <Button variant="primary">Month</Button>
    </ButtonGroup>
  ),
};

export const SecondaryAttached: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary">Edit</Button>
      <Button variant="secondary">Duplicate</Button>
      <Button variant="secondary">Archive</Button>
    </ButtonGroup>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" icon={Pencil}>
        Edit
      </Button>
      <Button variant="secondary" icon={Copy}>
        Duplicate
      </Button>
      <Button variant="secondary" icon={Trash2}>
        Delete
      </Button>
    </ButtonGroup>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" size="sm" icon={ChevronLeft} aria-label="Previous" />
      <Button variant="secondary" size="sm" icon={ChevronRight} aria-label="Next" />
    </ButtonGroup>
  ),
};

export const Toolbar: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" icon={Save}>
        Save
      </Button>
      <Button variant="secondary" icon={Share2}>
        Share
      </Button>
      <Button variant="secondary" icon={Download}>
        Export
      </Button>
      <Button variant="secondary" icon={Filter}>
        Filter
      </Button>
      <Button variant="secondary" icon={Plus}>
        Add
      </Button>
    </ButtonGroup>
  ),
};

export const SizesSm: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" size="sm">
        Day
      </Button>
      <Button variant="secondary" size="sm">
        Week
      </Button>
      <Button variant="secondary" size="sm">
        Month
      </Button>
    </ButtonGroup>
  ),
};

export const SizesLg: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="primary" size="lg">
        Cancel
      </Button>
      <Button variant="primary" size="lg">
        Confirm
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="secondary" icon={Pencil}>
        Edit
      </Button>
      <Button variant="secondary" icon={Copy}>
        Duplicate
      </Button>
      <Button variant="secondary" icon={Trash2}>
        Delete
      </Button>
    </ButtonGroup>
  ),
};

export const NotAttached: Story = {
  render: () => (
    <ButtonGroup attached={false} gap="gap-3">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save changes</Button>
    </ButtonGroup>
  ),
};

// ── Real interactive pattern: period selector ────────────────────────────────

export const ToggleGroup: Story = {
  render: () => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
    return (
      <div className="space-y-3">
        <ButtonGroup>
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'secondary'}
              onClick={() => setPeriod(p)}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
        <p className="text-xs text-[var(--color-text-muted)]">
          Active period: <code>{period}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickButtonFiresHandler: Story = {
  render: (args) => (
    <ButtonGroup>
      <Button variant="primary" onClick={args.onDay as () => void}>
        Day
      </Button>
      <Button variant="primary" onClick={args.onWeek as () => void}>
        Week
      </Button>
    </ButtonGroup>
  ),
  args: { onDay: fn(), onWeek: fn() } as never,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Day' }));
    await expect((args as { onDay: ReturnType<typeof fn> }).onDay).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Week' }));
    await expect((args as { onWeek: ReturnType<typeof fn> }).onWeek).toHaveBeenCalledTimes(1);
  },
};

export const RoleGroup: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary">A</Button>
      <Button variant="secondary">B</Button>
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group')).toBeInTheDocument();
  },
};
