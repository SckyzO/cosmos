import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Plus, ArrowRight, Trash2, Download } from 'lucide-react';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Button' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Variants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants × sizes">
        <div className="space-y-3">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Button variant="primary" size={size}>
                Primary
              </Button>
              <Button variant="secondary" size={size}>
                Secondary
              </Button>
              <Button variant="ghost" size={size}>
                Ghost
              </Button>
              <Button variant="danger" size={size}>
                Danger
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With icons">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={Plus}>New item</Button>
          <Button variant="secondary" icon={Download}>
            Download
          </Button>
          <Button variant="ghost" icon={ArrowRight} iconPosition="right">
            Continue
          </Button>
          <Button variant="danger" icon={Trash2}>
            Delete
          </Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const States: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="States">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button variant="secondary" loading>
            Saving…
          </Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickFiresOnClick: Story = {
  args: { children: 'Click me', onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Click me' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledBlocksClick: Story = {
  args: { children: 'Disabled', onClick: fn(), disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Disabled' });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const LoadingBlocksClick: Story = {
  args: { children: 'Saving…', onClick: fn(), loading: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /Saving/ });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

// TUI Plus pattern "Primary buttons" — 5 sizes (xs/sm/md/lg/xl) of primary.
export const PrimarySizes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Primary — 5 sizes">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Button text</Button>
          <Button size="sm">Button text</Button>
          <Button size="md">Button text</Button>
          <Button size="lg">Button text</Button>
          <Button size="xl">Button text</Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// TUI Plus pattern "Secondary buttons" — 5 sizes of secondary.
export const SecondarySizes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Secondary — 5 sizes">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="xs">Button text</Button>
          <Button variant="secondary" size="sm">Button text</Button>
          <Button variant="secondary" size="md">Button text</Button>
          <Button variant="secondary" size="lg">Button text</Button>
          <Button variant="secondary" size="xl">Button text</Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// TUI Plus pattern "Soft buttons" — tinted background, no border.
export const SoftSizes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Soft — 5 sizes">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="soft" size="xs">Button text</Button>
          <Button variant="soft" size="sm">Button text</Button>
          <Button variant="soft" size="md">Button text</Button>
          <Button variant="soft" size="lg">Button text</Button>
          <Button variant="soft" size="xl">Button text</Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// TUI Plus pattern "Rounded primary/secondary" — pill-shaped.
export const PillShape: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Pill shape">
        <div className="flex flex-wrap items-center gap-3">
          <Button shape="pill" size="xs">Button text</Button>
          <Button shape="pill" size="sm">Button text</Button>
          <Button shape="pill" size="md">Button text</Button>
          <Button shape="pill" size="lg">Button text</Button>
          <Button shape="pill" size="xl">Button text</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" shape="pill" size="xs">Secondary</Button>
          <Button variant="secondary" shape="pill" size="sm">Secondary</Button>
          <Button variant="secondary" shape="pill" size="md">Secondary</Button>
          <Button variant="secondary" shape="pill" size="lg">Secondary</Button>
          <Button variant="secondary" shape="pill" size="xl">Secondary</Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// TUI Plus pattern "Circular buttons" — icon-only square.
export const CircularIconOnly: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Circular (icon-only)">
        <div className="flex flex-wrap items-center gap-3">
          <Button shape="circle" size="xs" icon={Plus} aria-label="Add" />
          <Button shape="circle" size="sm" icon={Plus} aria-label="Add" />
          <Button shape="circle" size="md" icon={Plus} aria-label="Add" />
          <Button shape="circle" size="lg" icon={Plus} aria-label="Add" />
          <Button shape="circle" size="xl" icon={Plus} aria-label="Add" />
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// ── Interaction tests for new props ──────────────────────────────────────────

export const SoftVariantHasTintedBg: Story = {
  args: { children: 'Soft', variant: 'soft' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Soft' });
    await expect(btn.className).toMatch(/bg-brand-50/);
  },
};

export const PillShapeIsFullyRounded: Story = {
  args: { children: 'Pill', shape: 'pill' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Pill' });
    await expect(btn.className).toMatch(/rounded-full/);
  },
};

export const CircleShapeMakesSquare: Story = {
  args: { 'aria-label': 'Add', shape: 'circle', icon: Plus, children: undefined },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Add' });
    await expect(btn.className).toMatch(/rounded-full/);
    await expect(btn.className).toMatch(/w-9/); // default md size: w-9 h-9
  },
};
