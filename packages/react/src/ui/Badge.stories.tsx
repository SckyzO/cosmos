import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Check, Info, Star, X, Zap } from 'lucide-react';
import { expect } from 'storybook/test';
import { bothDirections, expectMirrored, inEachTheme } from '../storybook-helpers';
import { Badge } from './Badge';
import type { Intent } from './intent';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const AllVariants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Intents × sizes">
        <div className="space-y-3">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Badge intent="neutral" size={size}>
                Neutral
              </Badge>
              <Badge intent="brand" size={size}>
                Brand
              </Badge>
              <Badge intent="success" size={size}>
                Success
              </Badge>
              <Badge intent="warning" size={size}>
                Warning
              </Badge>
              <Badge intent="danger" size={size}>
                Danger
              </Badge>
              <Badge intent="info" size={size}>
                Info
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Solid: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Solid appearance — filled bg + white text">
        <div className="flex flex-wrap items-center gap-2">
          <Badge appearance="solid" intent="neutral">
            Neutral
          </Badge>
          <Badge appearance="solid" intent="brand">
            Brand
          </Badge>
          <Badge appearance="solid" intent="success">
            Success
          </Badge>
          <Badge appearance="solid" intent="warning">
            Warning
          </Badge>
          <Badge appearance="solid" intent="danger">
            Danger
          </Badge>
          <Badge appearance="solid" intent="info">
            Info
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIconStart: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With start icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge intent="success" icon={Check}>
            Verified
          </Badge>
          <Badge intent="warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge intent="danger" icon={X}>
            Failed
          </Badge>
          <Badge intent="info" icon={Info}>
            FYI
          </Badge>
          <Badge intent="brand" icon={Zap}>
            Pro
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIconEnd: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With end icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge intent="brand" icon={Star} iconPosition="end">
            Featured
          </Badge>
          <Badge intent="success" icon={Check} iconPosition="end">
            Done
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const SolidWithIcon: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Solid + icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge appearance="solid" intent="success" icon={Check}>
            Approved
          </Badge>
          <Badge appearance="solid" intent="danger" icon={X}>
            Rejected
          </Badge>
          <Badge appearance="solid" intent="brand" icon={Zap}>
            New
          </Badge>
          <Badge appearance="solid" intent="warning" icon={AlertTriangle}>
            Beta
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

const INTENTS: Intent[] = ['neutral', 'brand', 'success', 'warning', 'danger', 'info'];

export const Sizes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Sizes: sm, md (default) and lg">
        <div className="flex flex-wrap items-center gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Badge key={size} size={size} intent="brand" icon={Zap}>
              {size}
            </Badge>
          ))}
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Badge key={size} size={size} appearance="outline" intent="success">
              {size}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Shapes: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Shapes: pill (default) and rounded">
        <div className="space-y-3">
          {(['pill', 'rounded'] as const).map((shape) => (
            <div key={shape} className="flex flex-wrap items-center gap-2">
              <span className="text-3xs w-14 font-mono text-[var(--color-text-muted)] uppercase">
                {shape}
              </span>
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <Badge key={size} shape={shape} size={size} intent="info">
                  {size}
                </Badge>
              ))}
              <Badge shape={shape} appearance="solid" intent="danger" icon={X}>
                Failed
              </Badge>
              <Badge shape={shape} appearance="outline" intent="success" icon={Check}>
                Verified
              </Badge>
              <Badge shape={shape} appearance="dot" intent="warning">
                Pending
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Outline: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Outline appearance — border + colored text, no fill">
        <div className="flex flex-wrap items-center gap-2">
          {INTENTS.map((v) => (
            <Badge key={v} appearance="outline" intent={v}>
              {v}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Dot: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Dot appearance — neutral text led by a dot of the intent color">
        <div className="flex flex-wrap items-center gap-2">
          {INTENTS.map((v) => (
            <Badge key={v} appearance="dot" intent={v}>
              {v}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const AppearanceMatrix: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Appearance × intent">
        <div className="space-y-3">
          {(['light', 'solid', 'outline', 'dot'] as const).map((appearance) => (
            <div key={appearance} className="flex flex-wrap items-center gap-2">
              <span className="w-14 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {appearance}
              </span>
              {INTENTS.map((v) => (
                <Badge key={v} appearance={appearance} intent={v} icon={Check}>
                  {v}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

const LIGHT_CLASSES: Record<Intent, string[]> = {
  neutral: ['bg-gray-100', 'text-gray-700'],
  brand: ['bg-brand-50', 'text-brand-700'],
  success: ['bg-green-100', 'text-green-700'],
  warning: ['bg-amber-100', 'text-amber-700'],
  danger: ['bg-red-100', 'text-red-700'],
  info: ['bg-blue-100', 'text-blue-700'],
};

const SOLID_CLASSES: Record<Intent, string[]> = {
  neutral: ['bg-gray-600', 'text-white'],
  brand: ['bg-brand-500', 'text-white'],
  success: ['bg-green-500', 'text-gray-900'],
  warning: ['bg-amber-500', 'text-gray-900'],
  danger: ['bg-red-600', 'text-white'],
  info: ['bg-blue-600', 'text-white'],
};

/** Each `intent` colors the light badge as its `variant` did; none is `neutral`. */
export const IntentColorsTheBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((i) => (
          <Badge key={i} intent={i}>
            {i}
          </Badge>
        ))}
        <Badge>default</Badge>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      // The badge is the span that holds the label's own span.
      await expect(canvas.getByText(intent).parentElement).toHaveClass(...LIGHT_CLASSES[intent]);
    }
    await expect(canvas.getByText('default').parentElement).toHaveClass(...LIGHT_CLASSES.neutral);
  },
};

/** The same for `appearance="solid"`. Like the other solid stories, it carries the contrast debt. */
export const IntentColorsTheSolidBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((i) => (
          <Badge key={i} appearance="solid" intent={i}>
            {i}
          </Badge>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      await expect(canvas.getByText(intent).parentElement).toHaveClass(...SOLID_CLASSES[intent]);
    }
  },
};

const OUTLINE_CLASSES: Record<Intent, string[]> = {
  neutral: ['border', 'border-gray-300', 'text-gray-700'],
  brand: ['border', 'border-brand-300', 'text-brand-700'],
  success: ['border', 'border-green-300', 'text-green-700'],
  warning: ['border', 'border-amber-300', 'text-amber-700'],
  danger: ['border', 'border-red-300', 'text-red-700'],
  info: ['border', 'border-blue-300', 'text-blue-700'],
};

/** `appearance="outline"` draws a border and colored text with no fill. */
export const OutlineHasABorderAndNoFill: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((i) => (
          <Badge key={i} appearance="outline" intent={i}>
            {i}
          </Badge>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      const badge = canvas.getByText(intent).parentElement!;
      await expect(badge).toHaveClass(...OUTLINE_CLASSES[intent]);
      await expect(badge.className).not.toMatch(/(^|\s)bg-/);
    }
  },
};

/** `appearance="dot"` leads neutral text with a dot of the intent color, hidden from assistive technology. */
export const DotLeadsTheLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Badge appearance="dot" intent="danger">
        Down
      </Badge>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const badge = canvas.getByText('Down').parentElement!;
    await expect(badge).toHaveClass('text-gray-700');
    const dot = badge.firstElementChild!;
    await expect(dot).toHaveClass('bg-red-500', 'rounded-full');
    await expect(dot).toHaveAttribute('aria-hidden', 'true');
  },
};

/**
 * The neutral light badge on the surface of a card (`gray-800` in dark): it keeps a fill of its own
 * in every theme, instead of melting into the card.
 */
export const NeutralBadgeShowsOnACardSurface: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div
      data-testid="surface"
      className="w-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
    >
      <Badge>Available</Badge>
    </div>
  ),
  play: async ({ canvas }) => {
    const surface = canvas.getByTestId('surface');
    const badge = canvas.getByText('Available').parentElement!;
    inEachTheme(() => {
      const fill = getComputedStyle(badge).backgroundColor;
      expect(fill).not.toBe(getComputedStyle(surface).backgroundColor);
      expect(fill).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};

// A badge is the span that holds the label's own span.
const badgeOf = (label: Node | null | HTMLElement) => (label as HTMLElement).parentElement!;
const px = (value: string) => parseFloat(value);

/** `lg` is px-3 py-1 with larger text, taller than `md`, and `md` stays the default. */
export const LargeBadgeIsTheBiggestSize: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">sm</Badge>
        <Badge>default</Badge>
        <Badge size="md">md</Badge>
        <Badge size="lg">lg</Badge>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const [sm, def, md, lg] = ['sm', 'default', 'md', 'lg'].map((t) =>
      badgeOf(canvas.getByText(t))
    );
    const lgStyle = getComputedStyle(lg);
    await expect(px(lgStyle.paddingLeft)).toBe(12);
    await expect(px(lgStyle.paddingTop)).toBe(4);
    await expect(px(lgStyle.fontSize)).toBeGreaterThan(px(getComputedStyle(md).fontSize));
    await expect(lg.getBoundingClientRect().height).toBeGreaterThan(
      md.getBoundingClientRect().height
    );
    await expect(md.getBoundingClientRect().height).toBeGreaterThan(
      sm.getBoundingClientRect().height
    );
    // No size is still `md`.
    await expect(def.className).toBe(md.className);
    await expect(def.getBoundingClientRect().height).toBe(md.getBoundingClientRect().height);
  },
};

/** `rounded` squares the corners to `rounded-md`; the default stays a full pill, at every size. */
export const RoundedShapeKeepsThePillDefault: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Badge key={size} size={size}>
            {`${size} default`}
          </Badge>
        ))}
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Badge key={size} size={size} shape="rounded">
            {`${size} rounded`}
          </Badge>
        ))}
        <Badge shape="pill">explicit pill</Badge>
        <Badge shape="rounded" appearance="dot" intent="danger">
          dot rounded
        </Badge>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const radius = (el: HTMLElement) => px(getComputedStyle(el).borderTopLeftRadius);
    const probe = document.createElement('span');
    probe.className = 'rounded-md';
    document.body.append(probe);
    const roundedMd = radius(probe);
    probe.remove();
    for (const size of ['sm', 'md', 'lg']) {
      const pill = badgeOf(canvas.getByText(`${size} default`));
      const rounded = badgeOf(canvas.getByText(`${size} rounded`));
      // A pill's radius is at least half its height: the ends are fully round.
      await expect(radius(pill)).toBeGreaterThanOrEqual(pill.getBoundingClientRect().height / 2);
      await expect(radius(rounded)).toBe(roundedMd);
      await expect(radius(rounded)).toBeLessThan(rounded.getBoundingClientRect().height / 2);
    }
    await expect(radius(badgeOf(canvas.getByText('explicit pill')))).toBe(
      radius(badgeOf(canvas.getByText('md default')))
    );
    await expect(radius(badgeOf(canvas.getByText('dot rounded')))).toBe(roundedMd);
  },
};

/** An icon before the label is on the right in right to left, one after it on the left. */
export const IconsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="flex gap-3">
        <Badge icon={Star}>Before</Badge>
        <Badge icon={Zap} iconPosition="end">
          After
        </Badge>
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const nth of [0, 1]) {
      expectMirrored(canvasElement, (box) => box.querySelectorAll('svg')[nth]);
    }
  },
};

/** A label in the other script is an island: its own direction, whatever the badge's. */
export const LabelIsIsolated: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-3">
      <div dir="rtl">
        <Badge>Beta</Badge>
      </div>
      <div dir="ltr">
        <Badge>تجريبي</Badge>
      </div>
    </div>
  ),
  play: ({ canvasElement }) => {
    const [latin, arabic] = [...canvasElement.querySelectorAll('bdi')];
    expect(getComputedStyle(latin!).direction).toBe('ltr');
    expect(getComputedStyle(arabic!).direction).toBe('rtl');
    expect(getComputedStyle(latin!).unicodeBidi).toBe('isolate');
  },
};
