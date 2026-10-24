import type { Meta, StoryObj } from '@storybook/react-vite';
import { Save, Search, Undo2 } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectOutsideClip, scrollAnchor } from '../storybook-helpers';
import { Tooltip, TooltipHelp, type TooltipProps } from './Tooltip';
import { SectionCard } from '../templates/SectionCard';
import { Button } from './Button';

const meta = {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { content: 'Tooltip content', children: null },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Tooltips are queried from the whole page, wherever they render.
const page = within(document.body);

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-12 text-[var(--color-text-base)]">{children}</div>
);

export const Positions: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Positions — hover the buttons">
        <div className="flex flex-wrap items-center gap-12">
          {(['top', 'bottom', 'left', 'right'] as const).map((position) => (
            <Tooltip key={position} content={`Position: ${position}`} position={position}>
              <Button variant="secondary" size="sm">
                {position}
              </Button>
            </Tooltip>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Variants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants">
        <div className="flex flex-wrap items-center gap-6">
          <Tooltip content="Dark variant (default)" variant="dark">
            <Button variant="secondary" size="sm">
              Dark
            </Button>
          </Tooltip>
          <Tooltip content="White variant" variant="white">
            <Button variant="secondary" size="sm">
              White
            </Button>
          </Tooltip>
          <Tooltip content="Brand accent" intent="brand">
            <Button variant="secondary" size="sm">
              Brand
            </Button>
          </Tooltip>
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="Status — explain a state">
          <div className="flex flex-wrap items-center gap-6">
            <Tooltip content="All 12 checks passing" intent="success">
              <Button variant="secondary" size="sm">
                Success
              </Button>
            </Tooltip>
            <Tooltip content="Disk 92% full" intent="warning">
              <Button variant="secondary" size="sm">
                Warning
              </Button>
            </Tooltip>
            <Tooltip content="Node unreachable since 14:02" intent="danger">
              <Button variant="secondary" size="sm">
                Danger
              </Button>
            </Tooltip>
          </div>
        </SectionCard>
      </div>
      <div className="mt-4">
        <SectionCard title="TooltipHelp shortcut">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hover the help icon</span>
            <TooltipHelp text="TooltipHelp uses the HelpCircle icon as trigger." />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

// ── Keyboard access ──────────────────────────────────────────────────────────

/** Focus shows the tooltip, Escape hides it, and it describes its trigger. */
export const KeyboardFocusShowsTooltip: Story = {
  render: () => (
    <Wrap>
      <Tooltip content="Deletes the selected rows">
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </Tooltip>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Delete' });
    const tip = page.getByRole('tooltip');
    await expect(tip).not.toBeVisible();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
    await expect(trigger).toHaveAccessibleDescription('Deletes the selected rows');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

/** Escape also closes a tooltip opened by the pointer, wherever focus is. */
export const EscapeClosesHoveredTooltip: Story = {
  render: () => (
    <Wrap>
      <Tooltip content="Deletes the selected rows">
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </Tooltip>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const tip = page.getByRole('tooltip');
    await userEvent.hover(canvas.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip).not.toBeVisible());
  },
};

/** The help icon is a button, so keyboard users can open its tooltip too. */
export const HelpIconOpensOnFocus: Story = {
  render: () => (
    <Wrap>
      <TooltipHelp text="Share of failed requests allowed this month." />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    const help = canvas.getByRole('button', { name: 'Help' });
    await expect(help).toHaveFocus();
    await waitFor(() => expect(page.getByRole('tooltip')).toBeVisible());
    await expect(help).toHaveAccessibleDescription('Share of failed requests allowed this month.');
  },
};

// ── Surface and intent ───────────────────────────────────────────────────────

const BOXES: { label: string; props: Pick<TooltipProps, 'variant' | 'intent'> }[] = [
  { label: 'dark', props: {} },
  { label: 'white', props: { variant: 'white' } },
  { label: 'brand', props: { intent: 'brand' } },
  { label: 'success', props: { intent: 'success' } },
  { label: 'warning', props: { intent: 'warning' } },
  { label: 'danger', props: { intent: 'danger' } },
  // The intent colors the tooltip over its surface.
  { label: 'white danger', props: { variant: 'white', intent: 'danger' } },
];

/** `variant` is the surface and `intent` colors the tooltip over it: box and arrow, as the old variants did. */
export const IntentColorsTheTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-6">
        {BOXES.map(({ label, props }) => (
          <Tooltip key={label} {...props} content={`${label} tip`}>
            <Button variant="secondary" size="sm">
              {label}
            </Button>
          </Tooltip>
        ))}
        <TooltipHelp text="help danger tip" intent="danger" />
        <TooltipHelp text="help white tip" variant="white" />
      </div>
    </Wrap>
  ),
  play: async () => {
    const box = (label: string) => page.getByText(label);
    const arrow = (label: string) => box(label).querySelector('[aria-hidden]')!;

    await expect(box('dark tip')).toHaveClass('bg-gray-900', 'text-white');
    await expect(arrow('dark tip')).toHaveClass('bg-gray-900');
    await expect(box('white tip')).toHaveClass('bg-white', 'text-gray-700', 'border-gray-200');
    await expect(arrow('white tip')).toHaveClass('bg-white', 'border-gray-200');

    const intents = {
      'brand tip': ['bg-brand-500', 'text-white'],
      'success tip': ['bg-green-700', 'text-white'],
      'warning tip': ['bg-amber-400', 'text-gray-900'],
      'danger tip': ['bg-red-600', 'text-white'],
    };
    for (const [label, classes] of Object.entries(intents)) {
      await expect(box(label)).toHaveClass(...classes);
      await expect(box(label)).not.toHaveClass('bg-gray-900', 'bg-white');
      await expect(arrow(label)).toHaveClass(classes[0]);
    }

    // With an intent, the surface is not drawn.
    await expect(box('white danger tip')).toHaveClass('bg-red-600');
    await expect(box('white danger tip')).not.toHaveClass('bg-white', 'border-gray-200');
    await expect(arrow('white danger tip')).toHaveClass('bg-red-600');
    await expect(arrow('white danger tip')).not.toHaveClass('bg-white');

    // TooltipHelp forwards both.
    await expect(box('help danger tip')).toHaveClass('bg-red-600');
    await expect(box('help white tip')).toHaveClass('bg-white');
  },
};

// ── Content ──────────────────────────────────────────────────────────────────

/** `shortcut` lists keys after the label: the usual toolbar tooltip. */
export const WithShortcut: Story = {
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2">
        <Tooltip content="Save" shortcut={['⌘', 'S']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Save} aria-label="Save" />
        </Tooltip>
        <Tooltip content="Undo" shortcut={['⌘', 'Z']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Undo2} aria-label="Undo" />
        </Tooltip>
        <Tooltip content="Search" shortcut={['⌘', 'K']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Search} aria-label="Search" />
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    await userEvent.hover(save);
    const tip = page.getAllByRole('tooltip')[0];
    await waitFor(() => expect(tip).toBeVisible());
    const keys = [...tip.querySelectorAll('kbd')].map((k) => k.textContent);
    await expect(keys).toEqual(['⌘', 'S']);
  },
};

/** `title` adds a bold first line; the content reads as its explanation. */
export const WithTitle: Story = {
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2 text-sm">
        Error budget
        <Tooltip
          title="Error budget"
          content="Share of failed requests allowed this month before on-call is paged."
          position="right"
        >
          <Button variant="ghost" size="xs">
            What is this?
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async () => {
    await userEvent.tab();
    const tip = within(page.getByRole('tooltip'));
    await waitFor(() => expect(page.getByRole('tooltip')).toBeVisible());
    await expect(tip.getByText('Error budget')).toHaveClass('font-semibold');
  },
};

// ── Timing ───────────────────────────────────────────────────────────────────

/**
 * `delay` waits before showing, so crossing a toolbar doesn't flash every
 * tooltip; leaving or Escape cancels it. `arrow={false}` drops the pointer.
 */
export const DelayedWithoutArrow: Story = {
  render: () => (
    <Wrap>
      <div className="flex gap-3">
        <Tooltip content="Refresh the data" delay={300} arrow={false}>
          <Button variant="secondary" size="sm">
            Refresh
          </Button>
        </Tooltip>
        <Tooltip content="Export as CSV" delay={300} arrow={false}>
          <Button variant="secondary" size="sm">
            Export
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Refresh' });
    const tip = page.getByRole('tooltip', { name: /Refresh the data/ });
    await expect(tip.querySelector('[aria-hidden]')).toBeNull();

    // Shows only after the delay.
    await userEvent.hover(trigger);
    await expect(tip).not.toBeVisible();
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.unhover(trigger);
    await waitFor(() => expect(tip).not.toBeVisible());

    // Escape during the delay cancels the pending show. A show that never
    // comes can't be waited for, so race it against the second tooltip: it
    // starts after the Escape with the same delay, so a show still pending on
    // the first one would have fired before this one is visible. Focus, not
    // the pointer, starts it: moving the pointer would cancel the first show
    // on its own.
    await userEvent.hover(trigger);
    await userEvent.keyboard('{Escape}');
    canvas.getByRole('button', { name: 'Export' }).focus();
    await waitFor(() => expect(page.getByRole('tooltip', { name: /Export/ })).toBeVisible());
    await expect(tip).not.toBeVisible();
  },
};

// ── Open state (#151) ────────────────────────────────────────────────────────
// `open` / `defaultOpen` / `onOpenChange`, only `undefined` meaning uncontrolled.
// `defaultOpen` starts it open and it closes on its own; held at a fixed `open`,
// it reports what the user asks for and keeps the state it is given.

export const OpenStateDefaultOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOpenChange: fn() },
  render: (args) => (
    <Wrap>
      <div className="flex gap-24 pt-12">
        <Tooltip content="Own tip" defaultOpen onOpenChange={args.onOpenChange}>
          <Button variant="secondary" size="sm">
            Own
          </Button>
        </Tooltip>
        <Tooltip content="Held tip" open={false} onOpenChange={args.onOpenChange}>
          <Button variant="secondary" size="sm">
            Held
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const own = page.getByRole('tooltip', { name: 'Own tip' });
    await waitFor(() => expect(own).toBeVisible());
    // Escape dismisses a tooltip the pointer did not open (WCAG 1.4.13).
    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(own).not.toBeVisible());

    const held = page.getByRole('tooltip', { name: 'Held tip' });
    await userEvent.hover(canvas.getByRole('button', { name: 'Held' }));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(held).not.toBeVisible();
  },
};

// ── Floating tooltip (#151) ──────────────────────────────────────────────────
// The tooltip renders in a portal: no `overflow: hidden` ancestor clips it, and
// it follows its trigger while the page scrolls.

/** A toolbar that clips its content no longer cuts the tooltip off. */
export const TooltipEscapesOverflowHidden: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div
        data-testid="clip"
        className="flex h-12 items-center overflow-hidden rounded-lg border px-3"
      >
        <Tooltip content="Deletes the selected rows" defaultOpen>
          <Button variant="secondary" size="sm">
            Delete
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const tip = page.getByRole('tooltip');
    await waitFor(() => expect(tip).toBeVisible());
    expectOutsideClip(tip, canvas.getByTestId('clip'));
  },
};

/**
 * A `top` tooltip on a trigger at the top of the screen opens below it, arrow included; one
 * the left edge would cut moves right, and its arrow still points at the trigger.
 */
export const TooltipFlipsAndStaysOnScreen: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="p-1">
      <Tooltip content="Deletes every selected row, then empties the trash" defaultOpen>
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    // The tooltip is anchored on the wrapper around its trigger.
    const anchor = canvas.getByRole('button', { name: 'Delete' }).parentElement!;
    const tip = page.getByRole('tooltip');
    await waitFor(() => expect(tip).toBeVisible());
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    await expect(t.top).toBeCloseTo(a.bottom + 10, 0);
    await expect(t.left).toBeCloseTo(16, 0);
    // The arrow sits on the tooltip's top edge, under the trigger's center.
    const arrow = tip.querySelector('[aria-hidden]')!.getBoundingClientRect();
    await expect(arrow.top + arrow.height / 2).toBeCloseTo(t.top, 0);
    await expect(arrow.left + arrow.width / 2).toBeCloseTo((a.left + a.right) / 2, 0);
  },
};

/** The tooltip stays 10px under its trigger, centered, while the page scrolls. */
export const TooltipFollowsTriggerOnScroll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="scroller" className="h-64 overflow-y-auto">
      {/* Far enough from the left edge for the centered tooltip to fit: one the viewport
          cuts would move back inside (TooltipFlipsAndStaysOnScreen). */}
      <div className="px-24 pt-6 pb-[600px]">
        <Tooltip content="Deletes the selected rows" position="bottom" defaultOpen>
          <Button variant="secondary" size="sm">
            Delete
          </Button>
        </Tooltip>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    // The tooltip is anchored on the wrapper around its trigger.
    const anchor = canvas.getByRole('button', { name: 'Delete' }).parentElement!;
    const tip = page.getByRole('tooltip');
    await waitFor(() => expect(tip).toBeVisible());
    await scrollAnchor(canvas.getByTestId('scroller'), anchor);
    await waitFor(() => {
      const a = anchor.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      expect(t.top).toBeCloseTo(a.bottom + 10, 0);
      expect((t.left + t.right) / 2).toBeCloseTo((a.left + a.right) / 2, 0);
    });
  },
};
