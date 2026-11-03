import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { isFading, transitionMs } from '../storybook-motion';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Popover, type PopoverPosition } from './Popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  parameters: portalDocsParams.sm(),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors">
          Open popover
        </Popover.Trigger>
        <Popover.Content aria-label="Basic popover">
          <p>This is a basic popover.</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const Positions: Story = {
  // The panels open outside the 2×2 grid: leave room on every side so the
  // `top` one isn't cut off by the frame.
  parameters: portalDocsParams(400),
  render: () => (
    <div className="grid grid-cols-2 place-items-center gap-x-12 gap-y-24 p-20">
      {(['top', 'end', 'bottom', 'start'] as PopoverPosition[]).map((pos) => (
        <Popover key={pos} defaultOpen>
          <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            {pos}
          </Popover.Trigger>
          <Popover.Content position={pos} arrow width="w-40" aria-label={`Popover on the ${pos}`}>
            <p className="text-xs">Position: {pos}</p>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
};

/** `align="end"` keeps a panel opened from the end of the line inside the screen. */
export const AlignEnd: Story = {
  render: () => (
    <div className="flex h-48 items-start justify-end p-6">
      <Popover defaultOpen>
        <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          Settings
        </Popover.Trigger>
        <Popover.Content align="end" arrow width="w-64" aria-label="Settings">
          <p className="text-xs">Flush with the trigger&apos;s end edge.</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const RichContent: Story = {
  render: () => (
    <div className="flex h-72 items-center justify-center">
      <Popover>
        <Popover.Trigger
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <HelpCircle className="h-5 w-5" aria-hidden />
        </Popover.Trigger>
        <Popover.Content position="bottom" arrow width="w-72" aria-labelledby="popover-help-title">
          <h4
            id="popover-help-title"
            className="mb-1 text-sm font-semibold text-gray-900 dark:text-white"
          >
            Need help?
          </h4>
          <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">
            Read the docs or contact support — we usually reply within a few hours.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm">
              Docs
            </Button>
            <Button variant="primary" size="sm">
              Contact
            </Button>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

// A list of actions (rename, delete…) is a `Menu`, with the menu roles and arrow keys; a
// `Popover` holds free-form content.

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            Open ({open ? 'on' : 'off'})
          </Popover.Trigger>
          <Popover.Content arrow aria-label="Controlled popover">
            <p className="text-xs">Externally controlled popover.</p>
          </Popover.Content>
        </Popover>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-brand-600 dark:text-brand-400 text-xs underline"
        >
          Toggle from outside
        </button>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const TriggerOpensCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Click</Popover.Trigger>
        <Popover.Content>
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

/** `aria-labelledby` names the panel after a heading inside it, so the text isn't written twice. */
export const NamedByItsHeading: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Help</Popover.Trigger>
        <Popover.Content aria-labelledby="popover-named-by-heading">
          <h4 id="popover-named-by-heading" className="font-semibold">
            Need help?
          </h4>
          <p>Read the docs or contact support.</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Help' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Need help?' });
    await expect(dialog).not.toHaveAttribute('aria-label');
  },
};

export const EscapeCloses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Open</Popover.Trigger>
        <Popover.Content>
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  },
};

/** At the bottom of the screen a `bottom` popover opens above its trigger, its arrow under it. */
export const ArrowFollowsTheFlip: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-screen items-end justify-center p-2">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Low</Popover.Trigger>
        <Popover.Content arrow aria-label="Flipped panel">
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Low' });
    await userEvent.click(trigger);
    const panel = await within(document.body).findByRole('dialog', { name: 'Flipped panel' });
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    await expect(p.bottom).toBeCloseTo(t.top - 8, 0);
    // The arrow straddles the panel's bottom edge (1px inside its border), under the
    // trigger's center.
    const arrow = panel.querySelector('[aria-hidden]')!.getBoundingClientRect();
    await expect(arrow.top + arrow.height / 2).toBeCloseTo(p.bottom - 1, 0);
    await expect(arrow.left + arrow.width / 2).toBeCloseTo((t.left + t.right) / 2, 0);
  },
};

export const AlignEndIsFlushWithTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-start justify-end p-6">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Align</Popover.Trigger>
        <Popover.Content align="end" offset={8} aria-label="Aligned panel">
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Align' });
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;
    await expect(panel).toHaveAccessibleName('Aligned panel');
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    // Flush with the trigger's end edge: its right in ltr, its left in rtl.
    await expect(endOffset(panel, trigger)).toBeCloseTo(0, 2);
    await expect(p.top).toBeCloseTo(t.bottom + 8, 2);
  },
};

export const AlignEndFollowsTriggerResize: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-start justify-end p-6">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Resize</Popover.Trigger>
        <Popover.Content align="end" arrow aria-label="Panel">
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    // Fonts first, so a late font swap can't refresh the rect by itself.
    await document.fonts.ready;
    const trigger = canvas.getByRole('button', { name: 'Resize' });
    await userEvent.click(trigger);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    // A wider trigger (web font swap, new label) must move the arrow with it.
    trigger.style.paddingInlineStart = '48px';
    const arrowCenter = () => {
      const a = document
        .querySelector('[role="dialog"] span[aria-hidden]')!
        .getBoundingClientRect();
      return (a.left + a.right) / 2;
    };
    await waitFor(() => {
      const t = trigger.getBoundingClientRect();
      expect(arrowCenter()).toBeCloseTo((t.left + t.right) / 2, 1);
    });
  },
};

export const OnOpenChangeFires: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <div className="flex h-48 items-center justify-center">
      <Popover onOpenChange={args.onOpenChange as (o: boolean) => void}>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Trigger</Popover.Trigger>
        <Popover.Content aria-label="Panel">
          <p>Panel</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
  args: { onOpenChange: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onOpenChange: ReturnType<typeof fn> };
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    await expect(extra.onOpenChange).toHaveBeenCalledWith(true);
  },
};

/** Panels open on mount don't take focus, so they don't close each other. */
export const DefaultOpenPanelsStayOpen: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center gap-24">
      {['One', 'Two'].map((name) => (
        <Popover key={name} defaultOpen>
          <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">{name}</Popover.Trigger>
          <Popover.Content aria-label={name}>
            <button type="button">Inside {name}</button>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
  play: async () => {
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2));
    await expect(document.activeElement).toBe(document.body);
  },
};

/**
 * A mousedown outside closes the panel, and the click still reaches what is under the
 * pointer: no backdrop swallows it. A click inside keeps the panel open.
 */
export const OutsideClickClosesAndGoesThrough: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onOutsideClick: fn() } as never,
  render: (args) => (
    <div className="flex h-48 items-center justify-center gap-24">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Open</Popover.Trigger>
        <Popover.Content aria-label="Panel">
          <button type="button">Inside</button>
        </Popover.Content>
      </Popover>
      <button
        type="button"
        onClick={(args as unknown as { onOutsideClick: () => void }).onOutsideClick}
      >
        Outside
      </button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onOutsideClick: ReturnType<typeof fn> };
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.click(within(dialog()!).getByRole('button', { name: 'Inside' }));
    await expect(dialog()).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(extra.onOutsideClick).toHaveBeenCalledTimes(1);
  },
};

/**
 * A menu opened from the panel renders in its own portal, outside the panel: taking focus
 * there or clicking one of its items doesn't count as leaving the panel.
 */
export const NestedMenuKeepsThePanelOpen: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Filters</Popover.Trigger>
        <Popover.Content aria-label="Filters">
          <Dropdown
            label="Project"
            options={[
              { value: 'web', label: 'Website' },
              { value: 'api', label: 'Public API' },
            ]}
          />
        </Popover.Content>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const page = within(document.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
    const panel = await page.findByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Project' }));
    const menu = await page.findByRole('menu', { name: 'Project' });
    await expect(panel.contains(menu)).toBe(false);
    await waitFor(() =>
      expect(within(menu).getByRole('menuitemradio', { name: 'Website' })).toHaveFocus()
    );
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Public API' }));
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await expect(within(panel).getByRole('button', { name: 'Public API' })).toHaveFocus();
  },
};

/** Keyboard users land in the panel, can Tab out of it, and get back to the trigger. */
export const KeyboardFocusManagement: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex h-48 items-center justify-center gap-4">
      <Popover>
        <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Open</Popover.Trigger>
        <Popover.Content aria-label="Panel">
          <button type="button">First</button>
          <button type="button">Second</button>
        </Popover.Content>
      </Popover>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open' });
    const dialog = () => document.querySelector('[role="dialog"]');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog()).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toHaveTextContent('First'));
    await userEvent.tab();
    await expect(document.activeElement).toHaveTextContent('Second');
    // Tab past the last item: the panel closes and focus continues after the trigger.
    await userEvent.tab();
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'After' }));
    // Escape closes and returns focus to the trigger.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('First'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
    // Shift+Tab from the first item goes back to the trigger.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toHaveTextContent('First'));
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(document.activeElement).toBe(trigger);
  },
};

// `padding` replaces the default `p-4`; the two never both reach the panel (#290).
export const PaddingReplacesDefault: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.sm(),
  render: () => (
    <Popover>
      <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Open</Popover.Trigger>
      <Popover.Content aria-label="Tight" padding="p-2">
        Tight
      </Popover.Content>
    </Popover>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    const panel = within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Tight' });
    await expect(getComputedStyle(panel).paddingTop).toBe('8px');
  },
};

// The panel opened from `trigger` in the box of `dir`: portaled, and it takes its anchor's direction.
const dialogsIn = (dir: 'ltr' | 'rtl') => [
  ...document.querySelectorAll<HTMLElement>(`[role="dialog"][dir="${dir}"]`),
];

/**
 * `position="end"` opens after the trigger (on its left in right to left), `start` before it, and
 * the arrow sits on the edge that faces the trigger, level with its centre.
 */
export const SidesFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams(400),
  render: () =>
    bothDirections(() => (
      <div className="flex h-32 items-center justify-center gap-96">
        {(['start', 'end'] as const).map((position) => (
          <Popover key={position} defaultOpen>
            <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">
              {position}
            </Popover.Trigger>
            <Popover.Content
              position={position}
              arrow
              width="w-32"
              aria-label={`Popover on the ${position} side`}
            >
              <p className="text-xs">Panel</p>
            </Popover.Content>
          </Popover>
        ))}
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const [startTrigger, endTrigger] = within(box).getAllByRole('button');
      await waitFor(() => expect(dialogsIn(dir)).toHaveLength(2));
      const [onStart, onEnd] = dialogsIn(dir);
      const gap = (trigger: Element, panel: Element, side: 'start' | 'end') => {
        const t = trigger.getBoundingClientRect();
        const p = panel.getBoundingClientRect();
        // The physical side: `end` is the right in ltr and the left in rtl.
        const right = (side === 'end') === (dir === 'ltr');
        return right ? p.left - t.right : t.left - p.right;
      };
      expect(gap(startTrigger!, onStart!, 'start'), `${dir}: start side`).toBeCloseTo(8, 0);
      expect(gap(endTrigger!, onEnd!, 'end'), `${dir}: end side`).toBeCloseTo(8, 0);
      for (const [trigger, panel] of [
        [startTrigger!, onStart!],
        [endTrigger!, onEnd!],
      ] as const) {
        // Level with the trigger's centre, on the edge of the panel that faces it.
        const arrow = panel.querySelector('span[aria-hidden]')!.getBoundingClientRect();
        const t = trigger.getBoundingClientRect();
        const p = panel.getBoundingClientRect();
        expect(arrow.top + arrow.height / 2).toBeCloseTo(t.top + t.height / 2, 0);
        const facing = p.left > t.left ? p.left : p.right;
        // Within the panel's 1px border, which the arrow's inset is measured inside.
        expect(Math.abs(arrow.left + arrow.width / 2 - facing)).toBeLessThanOrEqual(1.5);
      }
    }
  },
};

/** With `align="end"` the arrow keeps pointing at the centre of the trigger, in either direction. */
export const AlignEndArrowPointsAtTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams(400),
  render: () =>
    bothDirections(() => (
      <div className="flex h-32 items-start justify-center">
        <Popover defaultOpen>
          <Popover.Trigger className="rounded-lg border px-12 py-2 text-sm">
            Settings
          </Popover.Trigger>
          <Popover.Content align="end" arrow width="w-72" aria-label="Settings panel">
            <p className="text-xs">Panel</p>
          </Popover.Content>
        </Popover>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const trigger = within(directionBox(canvasElement, dir)).getByRole('button');
      await waitFor(() => expect(dialogsIn(dir)).toHaveLength(1));
      const panel = dialogsIn(dir)[0]!;
      expect(endOffset(panel, trigger), `${dir}: flush with the end edge`).toBeCloseTo(0, 0);
      const arrow = panel.querySelector('span[aria-hidden]')!.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      expect(arrow.left + arrow.width / 2).toBeCloseTo(t.left + t.width / 2, 0);
      // The panel extends from the end edge toward the start of the line.
      expect(startOffset(panel, trigger)).toBeLessThan(0);
    }
  },
};

/** An `end` panel that the screen edge would cut flips to the other side, and the arrow follows. */
export const EndSideFlipsAtTheEdge: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams(400),
  render: () =>
    bothDirections(() => (
      <div className="flex h-32 items-center justify-end">
        <Popover defaultOpen>
          <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Edge</Popover.Trigger>
          <Popover.Content position="end" arrow width="w-96" aria-label="Edge panel">
            <p className="text-xs">Panel</p>
          </Popover.Content>
        </Popover>
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const trigger = within(directionBox(canvasElement, dir)).getByRole('button');
      await waitFor(() => expect(dialogsIn(dir)).toHaveLength(1));
      const panel = dialogsIn(dir)[0]!;
      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      // The trigger is at the physical right edge in ltr, so the panel went to its left.
      if (dir === 'ltr') expect(p.right).toBeLessThanOrEqual(t.left);
      else expect(p.left).toBeGreaterThanOrEqual(t.right);
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
      const arrow = panel.querySelector('span[aria-hidden]')!.getBoundingClientRect();
      expect(
        Math.abs(arrow.left + arrow.width / 2 - (dir === 'ltr' ? p.right : p.left))
      ).toBeLessThanOrEqual(1.5);
    }
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

/**
 * A floating panel at its real speed: it fades in and scales up from 95% out of the corner of the
 * panel nearest the trigger, in 120 ms, and back into it in 80 ms. The origin follows the side it
 * opened on and its alignment, and is mirrored in right to left. Menu, Dropdown, UserMenu and the
 * pickers share it.
 */
export const GrowsFromTheTriggerWithMotion: Story = {
  parameters: { ...portalDocsParams.sm(), settleMotion: false },
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Popover>
        <Popover.Trigger className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors">
          Open popover
        </Popover.Trigger>
        <Popover.Content align="end" aria-label="Basic popover">
          <p>It grows out of the corner nearest the button.</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

const MotionPanel = () => (
  <div className="flex h-48 items-center justify-center">
    <Popover>
      <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Click</Popover.Trigger>
      <Popover.Content aria-label="Panel">
        <p>Panel</p>
      </Popover.Content>
    </Popover>
  </div>
);

const panelNow = () => document.querySelector<HTMLElement>('[role="dialog"]');

/** Open, the panel is at rest: opaque, at its full size. */
export const OpenIsAtRest: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MotionPanel />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Click' }));
    await waitFor(() => expect(panelNow()).not.toBeNull());
    await expect(getComputedStyle(panelNow()!).opacity).toBe('1');
    await expect(getComputedStyle(panelNow()!).scale).toBe('none');
    await expect(panelNow()).not.toHaveAttribute('inert');
  },
};

/** Nothing to animate (0 s, as in these tests): the panel is gone in the render that closes it. */
export const ClosingAtZeroSecondsUnmountsAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MotionPanel />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panelNow()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await expect(panelNow()).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

/** In 120 ms, out in 80 ms, and a panel that leaves is inert with focus already back on the trigger. */
export const LeavingPanelIsInertAndFocusIsBack: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <MotionPanel />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panelNow()).not.toBeNull());
    const panel = panelNow()!;
    await expect(transitionMs(panel)).toBe(120);
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));

    await userEvent.keyboard('{Escape}');
    // Still there, fading, and already out of the way.
    await expect(panel).toBeInTheDocument();
    await expect(transitionMs(panel)).toBe(80);
    await expect(panel).toHaveAttribute('inert');
    await expect(getComputedStyle(panel).pointerEvents).toBe('none');
    await expect(trigger).toHaveFocus();
    await expect(isFading(panel)).toBe(true);

    await waitFor(() => expect(panelNow()).toBeNull());
  },
};

/** Opening it again while it leaves brings the same panel back. */
export const ReopeningWhileItLeavesKeepsThePanel: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <MotionPanel />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panelNow()).not.toBeNull());
    const panel = panelNow()!;
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(trigger);
    await expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    await expect(panelNow()).toBe(panel);
    await expect(panel).not.toHaveAttribute('inert');
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
  },
};

// Which corner or edge of the panel the origin sits on, read back from the computed origin (in
// px, against the panel's layout size, which its scale does not change).
const originOf = (panel: HTMLElement) => {
  const [x = '0', y = '0'] = getComputedStyle(panel)
    .transformOrigin.split(' ')
    .map(parseFloat)
    .map(String);
  const place = (value: string, size: number, low: string, high: string) =>
    Math.abs(parseFloat(value)) < 1
      ? low
      : Math.abs(parseFloat(value) - size) < 1
        ? high
        : 'center';
  return `${place(y, panel.offsetHeight, 'top', 'bottom')} ${place(x, panel.offsetWidth, 'left', 'right')}`;
};

/**
 * The panel grows from the corner nearest its trigger: the top edge of one under it, the bottom
 * edge of one over it, the end edge when `align="end"` lines it up with the trigger's (the right
 * one, the left in right to left), and the middle of the edge facing it at the side.
 */
export const GrowsFromTheCornerNearestTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams(400),
  render: () =>
    bothDirections(() => (
      <div className="grid grid-cols-3 place-items-center gap-x-2 gap-y-16 px-2 py-14">
        {(
          [
            ['bottom', 'center'],
            ['bottom', 'end'],
            ['top', 'center'],
            ['top', 'end'],
            ['end', 'center'],
          ] as const
        ).map(([position, align]) => (
          <Popover key={`${position}-${align}`} defaultOpen>
            <Popover.Trigger className="rounded-lg border px-3 py-2 text-xs">
              {position} {align}
            </Popover.Trigger>
            <Popover.Content
              position={position}
              align={align}
              width="w-16"
              padding="p-1"
              aria-label={`${position} ${align}`}
            >
              <p className="text-xs">x</p>
            </Popover.Content>
          </Popover>
        ))}
      </div>
    )),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(10));
    // Ten panels, five per direction, in the order they were rendered: left to right first.
    const panels = (dir: 'ltr' | 'rtl') =>
      within(directionBox(canvasElement, dir))
        .getAllByRole('button')
        .map((trigger) => {
          const name = trigger.textContent!.trim();
          return body
            .getAllByRole('dialog', { name })
            .find((panel) => panel.getAttribute('dir') === dir)!;
        });
    const expected = {
      ltr: ['top center', 'top right', 'bottom center', 'bottom right', 'center left'],
      rtl: ['top center', 'top left', 'bottom center', 'bottom left', 'center right'],
    };
    for (const dir of ['ltr', 'rtl'] as const) {
      expect(panels(dir).map(originOf), dir).toEqual(expected[dir]);
    }
  },
};
