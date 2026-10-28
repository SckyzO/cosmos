import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, Fragment } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Plus, ArrowRight, Trash2, Download, Undo2 } from 'lucide-react';
import {
  bothDirections,
  expectFocusRing,
  expectMirrored,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
  mirroredIcon,
} from '../storybook-helpers';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

// Icons that point along the line turn around in right to left.
const Forward = mirroredIcon(ArrowRight);
const Back = mirroredIcon(Undo2);
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
const INTENTS = ['brand', 'success', 'warning', 'danger'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const INTENT_LABEL = {
  brand: 'Connect',
  success: 'Connect',
  warning: 'Reconnect',
  danger: 'Disconnect',
} as const;

// Width and height of an icon-only button, by size: 1.75, 2, 2.25, 2.75 and 3rem.
const ICON_ONLY_PX = { xs: 28, sm: 32, md: 36, lg: 44, xl: 48 } as const;

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
 * or `soft` (tinted) where it sits next to other actions, as on a card. `warning` is
 * amber: dark text on the `primary` fill, amber text on the other variants.
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
                  {INTENT_LABEL[intent]}
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
          <Button variant="ghost" icon={Forward} iconPosition="end">
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
  tags: ['!dev'],
  args: { children: 'Click me', onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Click me' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledBlocksClick: Story = {
  tags: ['!dev'],
  args: { children: 'Disabled', onClick: fn(), disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Disabled' });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const LoadingBlocksClick: Story = {
  tags: ['!dev'],
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

/**
 * `square` is the icon-only button with `rounded-lg` corners: as wide as it is tall at every size,
 * like `circle`. An icon-only button needs an `aria-label`.
 */
export const SquareIconOnly: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Square and circular (icon-only)">
        <div className="space-y-3">
          {(['square', 'circle'] as const).map((shape) => (
            <div key={shape} className="flex flex-wrap items-center gap-3">
              <span className="text-2xs w-12 font-mono text-[var(--color-text-muted)] uppercase">
                {shape}
              </span>
              {SIZES.map((size) => (
                <Button
                  key={size}
                  shape={shape}
                  size={size}
                  icon={Plus}
                  aria-label={`${shape} ${size}`}
                />
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xs w-12 font-mono text-[var(--color-text-muted)] uppercase">
              Intents
            </span>
            {INTENTS.map((intent) => (
              <Button
                key={intent}
                shape="square"
                variant="secondary"
                intent={intent}
                icon={Plus}
                aria-label={`square ${intent}`}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const shape of ['square', 'circle'] as const) {
      for (const size of SIZES) {
        const button = canvas.getByRole('button', { name: `${shape} ${size}` });
        const box = button.getBoundingClientRect();
        await expect(box.width).toBe(ICON_ONLY_PX[size]);
        await expect(box.height).toBe(ICON_ONLY_PX[size]);
        // The size's horizontal padding must not squeeze the icon.
        const icon = button.querySelector('svg')!.getBoundingClientRect();
        await expect(icon.width).toBe(icon.height);
        // Square keeps its corners, circle is round.
        const radius = parseFloat(getComputedStyle(button).borderTopLeftRadius);
        if (shape === 'square') await expect(radius).toBeLessThan(box.width / 2);
        else await expect(radius).toBeGreaterThanOrEqual(box.width / 2);
      }
    }
    // `square` takes the same box with a border, and with any intent.
    for (const intent of INTENTS) {
      const box = canvas.getByRole('button', { name: `square ${intent}` }).getBoundingClientRect();
      await expect(box.width).toBe(ICON_ONLY_PX.md);
      await expect(box.height).toBe(ICON_ONLY_PX.md);
    }
  },
};

/**
 * `link` is an action that looks like a link: underlined text with no fixed height, padding or
 * margin, so `size` only sets the text size. Navigation stays on `Link`; this one runs an action.
 */
export const LinkVariant: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Link × intents × sizes">
        <div className="space-y-3">
          {INTENTS.map((intent) => (
            <div key={intent} className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-2xs w-16 font-mono text-[var(--color-text-muted)] uppercase">
                {intent}
              </span>
              {SIZES.map((size) => (
                <Button key={size} variant="link" intent={intent} size={size}>
                  {intent} {size}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-2xs w-16 font-mono text-[var(--color-text-muted)] uppercase">
              Icon
            </span>
            <Button variant="link" icon={Back}>
              Undo
            </Button>
            <Button variant="link" icon={Forward} iconPosition="end">
              Continue
            </Button>
          </div>
          <p className="text-sm text-[var(--color-text-base)]">
            In a sentence: the file was archived,{' '}
            <Button variant="link" size="md">
              restore it
            </Button>{' '}
            or{' '}
            <Button variant="link" size="md" intent="danger">
              delete it for good
            </Button>
            .
          </p>
        </div>
      </SectionCard>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const link = (intent: string, size: string) =>
      canvas.getByRole('button', { name: `${intent} ${size}` });
    const fontSize = (intent: string, size: string) =>
      parseFloat(getComputedStyle(link(intent, size)).fontSize);

    for (const intent of INTENTS) {
      for (const size of SIZES) {
        const button = link(intent, size);
        const style = getComputedStyle(button);
        // Underlined text, and nothing around it: no fill, border, padding or margin.
        await expect(style.textDecorationLine).toContain('underline');
        await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
          await expect(style.getPropertyValue(`border-${side.toLowerCase()}-width`)).toBe('0px');
          await expect(style.getPropertyValue(`padding-${side.toLowerCase()}`)).toBe('0px');
          await expect(style.getPropertyValue(`margin-${side.toLowerCase()}`)).toBe('0px');
        }
        // No fixed height: the box is its line of text, shorter than the smallest button (28px).
        const box = button.getBoundingClientRect();
        await expect(box.height).toBeCloseTo(parseFloat(style.lineHeight), 0);
        await expect(box.height).toBeLessThan(ICON_ONLY_PX.xs);
      }
      // `size` sets the text size.
      await expect(fontSize(intent, 'md')).toBeGreaterThan(fontSize(intent, 'xs'));
      await expect(fontSize(intent, 'xl')).toBeGreaterThan(fontSize(intent, 'md'));
    }

    // The accent text is brand-600, and the other intents take the text color of their ghost.
    await expect(link('brand', 'md')).toHaveClass('text-brand-600', 'dark:text-brand-400');
    await expect(link('success', 'md')).toHaveClass('text-green-700', 'dark:text-green-400');
    await expect(link('warning', 'md')).toHaveClass('text-amber-700', 'dark:text-amber-400');
    await expect(link('danger', 'md')).toHaveClass('text-red-700', 'dark:text-red-400');

    // The icon sits next to the text, and the text stays underlined.
    const withIcon = canvas.getByRole('button', { name: 'Undo' });
    await expect(withIcon.querySelector('svg')).not.toBeNull();
    await expect(getComputedStyle(withIcon).textDecorationLine).toContain('underline');

    // Readable on every theme.
    inEachTheme(() => {
      for (const intent of INTENTS) {
        for (const size of SIZES) expectTextContrast(link(intent, size));
      }
    });
  },
};

// ── Interaction tests for new props ──────────────────────────────────────────

export const SoftVariantHasTintedBg: Story = {
  tags: ['!dev'],
  args: { children: 'Soft', variant: 'soft' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Soft' });
    await expect(btn.className).toMatch(/bg-brand-50/);
  },
};

export const PillShapeIsFullyRounded: Story = {
  tags: ['!dev'],
  args: { children: 'Pill', shape: 'pill' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Pill' });
    await expect(btn.className).toMatch(/rounded-full/);
  },
};

export const CircleShapeMakesSquare: Story = {
  tags: ['!dev'],
  args: { 'aria-label': 'Add', shape: 'circle', icon: Plus, children: undefined },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'Add' });
    await expect(btn.className).toMatch(/rounded-full/);
    await expect(btn.className).toMatch(/w-ctrl-36/); // default md size: 36px square
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

    // `warning` is amber: dark text on the fill, amber text on the other emphases.
    await expect(button('primary warning')).toHaveClass(
      'bg-amber-500',
      'hover:bg-amber-600',
      'text-gray-900',
      'shadow-sm'
    );
    await expect(button('primary warning')).not.toHaveClass('bg-brand-500');
    await expect(button('secondary warning')).toHaveClass(
      'bg-white',
      'border',
      'border-amber-200',
      'text-amber-700'
    );
    await expect(button('ghost warning')).toHaveClass('text-amber-700', 'hover:bg-amber-50');
    await expect(button('ghost warning')).not.toHaveClass('border');
    await expect(button('soft warning')).toHaveClass('bg-amber-50', 'text-amber-700');
    await expect(button('soft warning')).not.toHaveClass('bg-brand-50');

    // No intent is `brand`.
    await expect(button('default').className).toBe(button('primary brand').className);

    // Red and amber text stay readable in every theme.
    inEachTheme(() => {
      for (const intent of ['danger', 'warning']) {
        for (const variant of EMPHASES) expectTextContrast(button(`${variant} ${intent}`));
      }
    });
  },
};

// `warning`, `square` and `link` block the click like the other variants.
export const NewVariantsBlockClickWhenDisabledOrLoading: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClick: fn() },
  render: (args) => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={args.onClick} variant="link" disabled>
          link disabled
        </Button>
        <Button onClick={args.onClick} variant="link" loading>
          link loading
        </Button>
        <Button onClick={args.onClick} intent="warning" disabled>
          warning disabled
        </Button>
        <Button onClick={args.onClick} intent="warning" loading>
          warning loading
        </Button>
        <Button
          onClick={args.onClick}
          shape="square"
          icon={Plus}
          aria-label="square disabled"
          disabled
        />
        <Button
          onClick={args.onClick}
          shape="square"
          icon={Plus}
          aria-label="square loading"
          loading
        />
      </div>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    for (const name of [
      'link disabled',
      'link loading',
      'warning disabled',
      'warning loading',
      'square disabled',
      'square loading',
    ]) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toBeDisabled();
      await userEvent.click(button);
    }
    await expect(args.onClick).not.toHaveBeenCalled();
    // A disabled link is dimmed and shows it is not clickable.
    const disabled = getComputedStyle(canvas.getByRole('button', { name: 'link disabled' }));
    await expect(disabled.opacity).toBe('0.5');
    await expect(disabled.cursor).toBe('not-allowed');
  },
};

/** An enabled link runs its action. */
export const LinkClickFiresOnClick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: 'Undo', variant: 'link', onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** White on amber-500 is about 2.1:1: the warning fill takes dark text, as success does on green. */
export const PrimaryWarningHasDarkTextOnAmber: Story = {
  tags: ['!dev', '!autodocs'],
  args: { intent: 'warning', children: 'Pause sync' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Pause sync' });
    await expect(button).toHaveClass('bg-amber-500', 'text-gray-900');
    inEachTheme(() => expectTextContrast(button));
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
  tags: ['!dev'],
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};

export const LinkShowsFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { variant: 'link', children: 'Undo' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('button', { name: 'Undo' }));
  },
};

/** White on green-500 is about 2.3:1: the success fill takes dark text. */
export const PrimarySuccessHasDarkTextOnGreen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { intent: 'success', children: 'Saved' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Saved' });
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    const rgb = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const style = getComputedStyle(button);
    const [tr, tg, tb] = rgb(style.color);
    const [br, bg, bb] = rgb(style.backgroundColor);
    await expect(tr + tg + tb).toBeLessThan(300);
    await expect(bg).toBeGreaterThan(br);
    await expect(bg).toBeGreaterThan(bb);
    expectTextContrast(button);
  },
};

/** `iconPosition` `start` leads the label, `end` follows it: both mirror in right to left. */
export const IconsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="flex gap-3">
        <Button icon={Plus}>Add</Button>
        <Button icon={ArrowRight} iconPosition="end">
          Next
        </Button>
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const nth of [0, 1]) {
      expectMirrored(canvasElement, (box) => box.querySelectorAll('svg')[nth]);
    }
  },
};
