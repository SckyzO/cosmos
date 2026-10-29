import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  Avatar,
  Badge,
  Button,
  COSMOS_RADII,
  Card,
  Input,
  applyAppearance,
  type CosmosRadius,
} from '../../../packages/react/src';

const meta = {
  title: 'Foundations/Radius',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`data-radius` on `<html>` (or on any element, for one part of a page) rescales every ' +
          'corner at once, through Tailwind’s own `--radius-*` variables: `none` squares them to ' +
          '2px, `sm` halves them, `lg` takes them one and a half times; no attribute is the ' +
          'default. `rounded-full` never moves: avatars, dots, switches, badges and pill buttons ' +
          'stay round. `applyAppearance` sets it, and the toolbar has a Radius menu.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The same few components, under the radius `radius` puts on their wrapper. */
const RadiusPage = ({ radius, label }: { radius: CosmosRadius; label: string }) => (
  <section
    data-radius={radius}
    data-testid={radius}
    aria-label={`${label} radius`}
    className="min-w-0 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4"
  >
    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</h3>
    <div data-testid={`${radius}-card`}>
      <Card>
        <p className="text-sm text-[var(--color-text-secondary)]">A card</p>
      </Card>
    </div>
    <Input label="Name" defaultValue="prod-eu-01" />
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary">Cancel</Button>
      <Button>Save</Button>
      <Button shape="pill">Pill</Button>
      <Avatar name="Ana Costa" size="lg" />
      <Badge>Round</Badge>
      <Badge shape="rounded">Tag</Badge>
    </div>
  </section>
);

const AllRadii = () => (
  <div className="grid gap-4 lg:grid-cols-4">
    {COSMOS_RADII.map(({ id, label }) => (
      <RadiusPage key={id} radius={id} label={label} />
    ))}
  </div>
);

/**
 * One page in each radius. Each column carries its own `data-radius`, so the default column stays
 * default whatever the toolbar says: the toolbar's menu moves the whole page.
 */
export const SamePageInEachRadius: Story = {
  render: () => <AllRadii />,
};

// ── Tests ────────────────────────────────────────────────────────────────────

const radiusOf = (el: Element) => getComputedStyle(el).borderTopLeftRadius;

// The px each component draws at every step: the card is `rounded-2xl` (16px), the button and the
// field `rounded-lg` (8px). `none` is 2px for all; `sm` halves, `lg` takes one and a half times.
const EXPECTED: Record<CosmosRadius, { card: string; button: string; field: string }> = {
  none: { card: '2px', button: '2px', field: '2px' },
  sm: { card: '8px', button: '4px', field: '4px' },
  default: { card: '16px', button: '8px', field: '8px' },
  lg: { card: '24px', button: '12px', field: '12px' },
};

/** A card, a button and a field draw the radius of the step; the round ones stay round. */
export const CornersFollowTheAttribute: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AllRadii />,
  play: async ({ canvas }) => {
    for (const { id } of COSMOS_RADII) {
      const page = within(
        canvas.getByRole('region', {
          name: `${COSMOS_RADII.find((r) => r.id === id)!.label} radius`,
        })
      );
      const want = EXPECTED[id];
      const card = canvas.getByTestId(`${id}-card`).firstElementChild!;
      await expect(radiusOf(card), `${id} card`).toBe(want.card);
      await expect(radiusOf(page.getByRole('button', { name: 'Save' })), `${id} button`).toBe(
        want.button
      );
      await expect(radiusOf(page.getByRole('textbox', { name: 'Name' })), `${id} field`).toBe(
        want.field
      );
      // `rounded-full` is a literal: a pill button, an avatar and a badge never leave the circle.
      for (const round of [
        page.getByRole('button', { name: 'Pill' }),
        page.getByRole('img', { name: /Ana Costa/ }),
        page.getByText('Round'),
      ]) {
        const circle =
          round.closest('[class*="rounded-full"]') ??
          round.querySelector('[class*="rounded-full"]');
        await expect(circle, `${id} round`).not.toBeNull();
        await expect(parseFloat(radiusOf(circle!)), `${id} round`).toBeGreaterThan(1000);
      }
      // The tag badge is `rounded-md` (6px): it scales like the rest.
      const tag = parseFloat(radiusOf(page.getByText('Tag').closest('[class*="rounded-md"]')!));
      await expect(tag, `${id} tag`).toBe({ none: 2, sm: 3, default: 6, lg: 9 }[id]);
    }
  },
};

/** `default` on a part of a page opts that part out of its parent's radius; `lg` inside `sm` wins. */
export const NestedAttributeWins: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-radius="none">
      <div data-testid="inherits" className="size-8 rounded-lg" />
      <div data-radius="default">
        <div data-testid="reset" className="size-8 rounded-lg" />
        <div data-radius="lg">
          <div data-testid="larger" className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(radiusOf(canvas.getByTestId('inherits'))).toBe('2px');
    await expect(radiusOf(canvas.getByTestId('reset'))).toBe('8px');
    await expect(radiusOf(canvas.getByTestId('larger'))).toBe('12px');
  },
};

/** On `<html>`, as the toolbar and `applyAppearance` put it, and back to the default. */
export const AttributeOnTheRootMovesTheCorners: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <div data-testid="probe" className="size-8 rounded-xl" />,
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const before = root.getAttribute('data-radius');
    const probe = canvas.getByTestId('probe');
    try {
      applyAppearance({ theme: 'dark', accent: 'blue', radius: 'none' });
      await expect(root).toHaveAttribute('data-radius', 'none');
      await expect(radiusOf(probe)).toBe('2px');
      applyAppearance({ theme: 'dark', accent: 'blue', radius: 'lg' });
      await expect(radiusOf(probe)).toBe('18px');
      applyAppearance({ theme: 'dark', accent: 'blue', radius: 'sm' });
      await expect(radiusOf(probe)).toBe('6px');
      applyAppearance({ theme: 'dark', accent: 'blue', radius: 'default' });
      await expect(root).not.toHaveAttribute('data-radius');
      await expect(radiusOf(probe)).toBe('12px');
    } finally {
      if (before === null) delete root.dataset.radius;
      else root.dataset.radius = before;
    }
  },
};

/** applyAppearance sets and clears data-radius, and leaves it when omitted. */
export const ApplyAppearanceRadius: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <p>applyAppearance on a detached element.</p>,
  play: async () => {
    const el = document.createElement('div');
    applyAppearance({ theme: 'dark', accent: 'blue', radius: 'lg' }, el);
    await expect(el).toHaveAttribute('data-radius', 'lg');
    applyAppearance({ theme: 'sand', accent: 'blue' }, el);
    await expect(el).toHaveAttribute('data-radius', 'lg');
    applyAppearance({ theme: 'sand', accent: 'blue', radius: 'default' }, el);
    await expect(el).not.toHaveAttribute('data-radius');
  },
};
