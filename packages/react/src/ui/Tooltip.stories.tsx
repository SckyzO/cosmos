import type { Meta, StoryObj } from '@storybook/react-vite';
import { Save, Search, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectOutsideClip,
  expectReadsLeftToRight,
  portalDocsParams,
  scrollAnchor,
  startOffset,
} from '../storybook-helpers';
import { Tooltip, TooltipHelp, type TooltipProps } from './Tooltip';
import { SectionCard } from '../templates/SectionCard';
import { Button } from './Button';
import { Modal } from './Modal';

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
          {(['top', 'bottom', 'start', 'end'] as const).map((position) => (
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Hover the help icon</span>
            <TooltipHelp text="TooltipHelp uses the HelpCircle icon as trigger." />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

/**
 * `open` pins the tooltip so it can be read without hovering: the four positions, then the
 * `white` surface and the `intent` colors. Hover and focus only report through `onOpenChange`.
 */
export const Open: Story = {
  parameters: portalDocsParams.md(),
  render: () => (
    <Wrap>
      <div className="grid grid-cols-2 gap-x-48 gap-y-32 pt-10 pb-10 md:grid-cols-4 md:gap-x-24">
        {(['top', 'bottom', 'start', 'end'] as const).map((position) => (
          <div key={position} className="flex justify-center">
            <Tooltip content={`Position: ${position}`} position={position} open>
              <Button variant="secondary" size="sm">
                {position}
              </Button>
            </Tooltip>
          </div>
        ))}
        <div className="flex justify-center">
          <Tooltip content="White surface" variant="white" position="bottom" open>
            <Button variant="secondary" size="sm">
              white
            </Button>
          </Tooltip>
        </div>
        <div className="flex justify-center">
          <Tooltip content="Disk almost full" intent="warning" position="bottom" open>
            <Button variant="secondary" size="sm">
              warning
            </Button>
          </Tooltip>
        </div>
        <div className="flex justify-center">
          <Tooltip
            title="Error budget"
            content="Share of failed requests allowed this month."
            shortcut={['⌘', 'E']}
            position="bottom"
            open
          >
            <Button variant="secondary" size="sm">
              title
            </Button>
          </Tooltip>
        </div>
      </div>
    </Wrap>
  ),
};

export const OpenChecks: Story = {
  ...Open,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await waitFor(() => expect(page.getAllByRole('tooltip')).toHaveLength(7));
    for (const tip of page.getAllByRole('tooltip')) await expect(tip).toBeVisible();
  },
};

// ── Keyboard access ──────────────────────────────────────────────────────────

/** Focus shows the tooltip, Escape hides it, and it describes its trigger. */
export const KeyboardFocusShowsTooltip: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
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

/** In a modal, Escape hides the tooltip of the focused control and leaves the modal open. */
export const EscapeInAModalHidesOnlyTheTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header title="Selected rows" />
        <Modal.Body>
          <Tooltip content="Deletes the selected rows">
            <Button variant="secondary" size="sm">
              Delete
            </Button>
          </Tooltip>
        </Modal.Body>
      </Modal>
    );
  },
  play: async () => {
    const tip = page.getByRole('tooltip');
    // The modal moves focus to its first control, the tooltip's trigger.
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip).not.toBeVisible());
    await expect(page.getByRole('dialog', { name: 'Selected rows' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
  },
};

/** The help icon is a button, so keyboard users can open its tooltip too. */
export const HelpIconOpensOnFocus: Story = {
  tags: ['!dev'],
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
  // The first tooltip open, to show its shortcut.
  play: ({ canvas }) => userEvent.hover(canvas.getByRole('button', { name: 'Save' })),
};

export const WithShortcutChecks: Story = {
  ...WithShortcut,
  tags: ['!dev', '!autodocs'],
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
          position="end"
        >
          <Button variant="ghost" size="xs">
            What is this?
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  // The tooltip open, to show its title.
  play: () => userEvent.tab(),
};

export const WithTitleChecks: Story = {
  ...WithTitle,
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await userEvent.tab();
    const tip = within(page.getByRole('tooltip'));
    await waitFor(() => expect(page.getByRole('tooltip')).toBeVisible());
    await expect(tip.getByText('Error budget').parentElement).toHaveClass('font-semibold');
  },
};

// ── Timing ───────────────────────────────────────────────────────────────────

const DELAY = 300;

/**
 * `delay` waits before showing, so crossing a toolbar doesn't flash every
 * tooltip; leaving or Escape cancels it. `arrow={false}` drops the pointer.
 */
export const DelayedWithoutArrow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex gap-3">
        <Tooltip content="Refresh the data" delay={DELAY} arrow={false}>
          <Button variant="secondary" size="sm">
            Refresh
          </Button>
        </Tooltip>
        <Tooltip content="Export as CSV" delay={DELAY} arrow={false}>
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

    // Shows only after the delay. The delay's timer is held back until the
    // check is done, so how long the hover takes (a loaded machine) can't let
    // it elapse before the tooltip is asserted hidden.
    const realSetTimeout = window.setTimeout;
    const held: Array<() => void> = [];
    window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) =>
      ms === DELAY
        ? held.push(() => (handler as (...args: unknown[]) => void)(...rest))
        : realSetTimeout(handler, ms, ...rest)) as typeof window.setTimeout;
    try {
      await userEvent.hover(trigger);
    } finally {
      window.setTimeout = realSetTimeout;
    }
    await expect(held).toHaveLength(1);
    await expect(tip).not.toBeVisible();
    held[0]();
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
 * the screen edge would cut moves back inside, and its arrow still points at the trigger.
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
    // The tooltip is visible from its first frame, before the flip and the shift back inside.
    await waitFor(() => {
      const a = anchor.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      expect(t.top).toBeCloseTo(a.bottom + 10, 0);
      // Moved back inside, 16px from the edge the trigger is at (the left one, the right in rtl).
      expect(startOffset(tip, document.documentElement)).toBeCloseTo(16, 0);
      // The arrow sits on the tooltip's top edge, under the trigger's center.
      const arrow = tip.querySelector('[aria-hidden]')!.getBoundingClientRect();
      expect(arrow.top + arrow.height / 2).toBeCloseTo(t.top, 0);
      expect(arrow.left + arrow.width / 2).toBeCloseTo((a.left + a.right) / 2, 0);
    });
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

// The tooltip of the trigger in `box`, found through the `aria-describedby` that links them.
const tipOf = (box: HTMLElement) => {
  const trigger = within(box).getByRole('button');
  return {
    trigger,
    anchor: trigger.parentElement!,
    tip: document.getElementById(trigger.getAttribute('aria-describedby')!)!,
  };
};

/**
 * `position="end"` puts the tooltip after the trigger: on its right, and on its left in right to
 * left. The arrow sits on the edge that faces the trigger, level with its centre.
 */
export const EndSideFollowsTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () =>
    bothDirections(() => (
      <div className="px-48 py-8">
        <Tooltip content="Opens the report" position="end" defaultOpen>
          <Button variant="secondary" size="sm">
            Report
          </Button>
        </Tooltip>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const { anchor, tip } = tipOf(directionBox(canvasElement, dir));
      await waitFor(() => {
        const a = anchor.getBoundingClientRect();
        const t = tip.getBoundingClientRect();
        // 10px of room for the arrow, on the right of the trigger or on its left.
        expect(dir === 'ltr' ? t.left - a.right : a.left - t.right, `${dir}: gap`).toBeCloseTo(
          10,
          0
        );
        const arrow = tip.querySelector('[aria-hidden]')!.getBoundingClientRect();
        expect(arrow.top + arrow.height / 2).toBeCloseTo(a.top + a.height / 2, 0);
        // On the tooltip's edge that faces the trigger.
        expect(arrow.left + arrow.width / 2).toBeCloseTo(dir === 'ltr' ? t.left : t.right, 0);
      });
    }
  },
};

/** `start` is the opposite side, and the tooltip reads in the direction of its trigger. */
export const StartSideFollowsTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () =>
    bothDirections(() => (
      <div className="px-48 py-8">
        <Tooltip content="Opens the report" position="start" defaultOpen>
          <Button variant="secondary" size="sm">
            Report
          </Button>
        </Tooltip>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const { anchor, tip } = tipOf(directionBox(canvasElement, dir));
      await waitFor(() => {
        const a = anchor.getBoundingClientRect();
        const t = tip.getBoundingClientRect();
        expect(dir === 'ltr' ? a.left - t.right : t.left - a.right, `${dir}: gap`).toBeCloseTo(
          10,
          0
        );
      });
      expect(tip.getAttribute('dir')).toBe(dir);
    }
  },
};

/** A trigger at the end of the line has no room for an `end` tooltip: it flips to the start side. */
export const EndSideFlipsAtTheEdge: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () =>
    bothDirections(() => (
      <div className="flex justify-end p-1">
        <Tooltip
          content="Deletes every selected row, then empties the trash"
          position="end"
          defaultOpen
        >
          <Button variant="secondary" size="sm">
            Delete
          </Button>
        </Tooltip>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const { anchor, tip } = tipOf(directionBox(canvasElement, dir));
      await waitFor(() => {
        const a = anchor.getBoundingClientRect();
        const t = tip.getBoundingClientRect();
        // The trigger is at the physical right in ltr, so the tooltip went to its left; the
        // mirror image in rtl. The tooltip stays on screen.
        if (dir === 'ltr') expect(t.right).toBeLessThanOrEqual(a.left);
        else expect(t.left).toBeGreaterThanOrEqual(a.right);
        expect(t.left).toBeGreaterThanOrEqual(0);
        expect(t.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
      });
    }
  },
};

/** The keys of a shortcut keep the order they are pressed in, and the gap before them is on the content's end side. */
export const ShortcutKeysKeepTheirOrder: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () =>
    bothDirections(() => (
      <div className="px-48 py-12">
        <Tooltip content="Save" shortcut={['Ctrl', 'S']} title="Draft" defaultOpen>
          <Button variant="secondary" size="sm">
            Save
          </Button>
        </Tooltip>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const { tip } = tipOf(directionBox(canvasElement, dir));
      await waitFor(() => expect(tip).toBeVisible());
      const keys = tip.querySelector<HTMLElement>('[dir="ltr"]')!;
      expectReadsLeftToRight(keys);
      const first = keys.firstElementChild!.getBoundingClientRect();
      const last = keys.lastElementChild!.getBoundingClientRect();
      expect(first.left).toBeLessThan(last.left);
    }
  },
};
