import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
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

/** `align="end"` keeps a panel opened from the right edge of the screen inside it. */
export const AlignEnd: Story = {
  render: () => (
    <div className="flex h-48 items-start justify-end p-6">
      <Popover defaultOpen>
        <Popover.Trigger className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          Settings
        </Popover.Trigger>
        <Popover.Content align="end" arrow width="w-64" aria-label="Settings">
          <p className="text-xs">Flush with the trigger&apos;s right edge.</p>
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
    await expect(p.right).toBeCloseTo(t.right, 2);
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
    trigger.style.paddingLeft = '48px';
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
