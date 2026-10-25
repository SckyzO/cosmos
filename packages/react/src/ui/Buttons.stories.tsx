import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, Fragment } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Plus, ArrowRight, Trash2, Download } from 'lucide-react';
import {
  expectFocusRing,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';
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

const EMPHASES = ['primary', 'secondary', 'ghost', 'soft'] as const;
const INTENTS = ['brand', 'danger'] as const;

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
              <Button intent="danger" size={size}>
                Danger
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

/**
 * Every variant takes an `intent`. `danger` gives three levels of emphasis for a
 * destructive action: `primary` for the confirmation itself, `secondary` (outlined)
 * or `soft` (tinted) where it sits next to other actions, as on a card.
 */
export const Intents: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants × intents">
        <div className="grid grid-cols-[repeat(5,max-content)] items-center gap-x-6 gap-y-3">
          <span />
          {EMPHASES.map((variant) => (
            <span
              key={variant}
              className="text-2xs font-mono text-[var(--color-text-muted)] uppercase"
            >
              {variant}
            </span>
          ))}
          {INTENTS.map((intent) => (
            <Fragment key={intent}>
              <span className="text-2xs font-mono text-[var(--color-text-muted)] uppercase">
                {intent}
              </span>
              {EMPHASES.map((variant) => (
                <Button key={variant} variant={variant} intent={intent}>
                  {intent === 'danger' ? 'Disconnect' : 'Connect'}
                </Button>
              ))}
            </Fragment>
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
          <Button intent="danger" icon={Trash2}>
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
          <Button variant="secondary" size="xs">
            Button text
          </Button>
          <Button variant="secondary" size="sm">
            Button text
          </Button>
          <Button variant="secondary" size="md">
            Button text
          </Button>
          <Button variant="secondary" size="lg">
            Button text
          </Button>
          <Button variant="secondary" size="xl">
            Button text
          </Button>
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
          <Button variant="soft" size="xs">
            Button text
          </Button>
          <Button variant="soft" size="sm">
            Button text
          </Button>
          <Button variant="soft" size="md">
            Button text
          </Button>
          <Button variant="soft" size="lg">
            Button text
          </Button>
          <Button variant="soft" size="xl">
            Button text
          </Button>
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
          <Button shape="pill" size="xs">
            Button text
          </Button>
          <Button shape="pill" size="sm">
            Button text
          </Button>
          <Button shape="pill" size="md">
            Button text
          </Button>
          <Button shape="pill" size="lg">
            Button text
          </Button>
          <Button shape="pill" size="xl">
            Button text
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" shape="pill" size="xs">
            Secondary
          </Button>
          <Button variant="secondary" shape="pill" size="sm">
            Secondary
          </Button>
          <Button variant="secondary" shape="pill" size="md">
            Secondary
          </Button>
          <Button variant="secondary" shape="pill" size="lg">
            Secondary
          </Button>
          <Button variant="secondary" shape="pill" size="xl">
            Secondary
          </Button>
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
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole('button', { name: 'Add' })) {
      const box = button.getBoundingClientRect();
      await expect(box.width).toBe(box.height);
      // The size's horizontal padding must not squeeze the icon.
      const icon = button.querySelector('svg')!.getBoundingClientRect();
      await expect(icon.width).toBe(icon.height);
    }
  },
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

// White on red-500 fell under 4.5:1 (#151).
export const DangerContrastInLight: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  args: { intent: 'danger', children: 'Delete' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByRole('button', { name: 'Delete' }));
  },
};

// `variant` is the emphasis and `intent` the color: every pair of the two keeps one look.

export const IntentColorsEachVariant: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-3">
        {INTENTS.map((intent) => (
          <div key={intent} className="flex flex-wrap items-center gap-3">
            {EMPHASES.map((variant) => (
              <Button key={variant} variant={variant} intent={intent}>
                {variant} {intent}
              </Button>
            ))}
          </div>
        ))}
        <Button>default</Button>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const button = (name: string) => canvas.getByRole('button', { name });

    // The accent: what each variant looked like before `intent` existed.
    await expect(button('primary brand')).toHaveClass('bg-brand-500', 'text-white', 'shadow-sm');
    await expect(button('secondary brand')).toHaveClass('bg-white', 'text-gray-700', 'border');
    await expect(button('ghost brand')).toHaveClass('text-gray-600');
    await expect(button('soft brand')).toHaveClass('bg-brand-50', 'text-brand-700');

    // `variant="primary" intent="danger"` is the old `variant="danger"`.
    await expect(button('primary danger')).toHaveClass(
      'bg-red-600',
      'hover:bg-red-700',
      'text-white',
      'shadow-sm',
      'disabled:opacity-50'
    );
    await expect(button('primary danger')).not.toHaveClass('bg-brand-500');
    // The other emphases get a red counterpart in their own style.
    await expect(button('secondary danger')).toHaveClass(
      'bg-white',
      'border',
      'border-red-200',
      'text-red-700'
    );
    await expect(button('ghost danger')).toHaveClass('text-red-700', 'hover:bg-red-50');
    await expect(button('ghost danger')).not.toHaveClass('border');
    await expect(button('soft danger')).toHaveClass('bg-red-50', 'text-red-700');
    await expect(button('soft danger')).not.toHaveClass('bg-brand-50');

    // No intent is `brand`.
    await expect(button('default').className).toBe(button('primary brand').className);

    // Red text stays readable in every theme.
    inEachTheme(() => {
      for (const name of ['secondary danger', 'ghost danger', 'soft danger', 'primary danger']) {
        expectTextContrast(button(name));
      }
    });
  },
};

const buttonRef = createRef<HTMLButtonElement>();

/** The ref gets the `<button>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Button ref={buttonRef}>Save</Button>,
  play: async ({ canvas }) => {
    await expectRefFocuses(buttonRef, canvas.getByRole('button', { name: 'Save' }));
  },
};

// The keyboard focus indicator: a 2px accent ring and its halo, on every theme.

export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { children: 'Save' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('button', { name: 'Save' }));
  },
};

export const FocusShowsRingInLight: Story = {
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};
