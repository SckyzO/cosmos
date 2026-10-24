import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { SlidersHorizontal } from 'lucide-react';
import {
  expectBelow,
  expectGraphicContrast,
  inEachTheme,
  portalDocsParams,
} from '../storybook-helpers';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';
import { Combobox } from '../forms/Combobox';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Overlays/Drawer',
  component: Drawer,
  subcomponents: {
    'Drawer.Header': Drawer.Header,
    'Drawer.Body': Drawer.Body,
    'Drawer.Footer': Drawer.Footer,
  },
  // Drawer portals into `document.body` — force iframe rendering in autodocs
  // so the panel doesn't slide into the Storybook docs page itself.
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
  args: { open: false, onClose: () => {}, children: null },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Sides: Story = {
  render: () => {
    const [side, setSide] = useState<'left' | 'right' | null>(null);
    return (
      <Wrap>
        <SectionCard title="Drawer sides">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setSide('left')}>
              Open left
            </Button>
            <Button variant="secondary" onClick={() => setSide('right')}>
              Open right
            </Button>
          </div>
        </SectionCard>
        {/* One drawer per side: a drawer's side is fixed, so switching it while
            the panel slides would send it in or out by the wrong edge. */}
        {(['left', 'right'] as const).map((drawerSide) => (
          <Drawer
            key={drawerSide}
            open={side === drawerSide}
            onClose={() => setSide(null)}
            side={drawerSide}
          >
            <Drawer.Header
              title="Server details"
              icon={SlidersHorizontal}
              description="Inspect and configure"
              onClose={() => setSide(null)}
            />
            <Drawer.Body>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <p>This drawer slides in from the {drawerSide}.</p>
                <p>Use it for inspectors, filters, or supplementary forms.</p>
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" size="sm" onClick={() => setSide(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setSide(null)}>
                Apply
              </Button>
            </Drawer.Footer>
          </Drawer>
        ))}
      </Wrap>
    );
  },
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** The left drawer enters and leaves by the left edge, never the right. */
export const LeftDrawerStaysOnTheLeft: Story = {
  tags: ['!autodocs'],
  render: Sides.render,
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open left' }));
    const panel = body
      .getByText('This drawer slides in from the left.')
      .closest('[role="dialog"]')!;
    const left = () => panel.getBoundingClientRect().left;

    // A frame into the slide, the panel is still coming in from off-screen left.
    await nextFrame();
    await expect(left()).toBeLessThan(0);
    await waitFor(() => expect(left()).toBe(0));

    await userEvent.click(within(panel as HTMLElement).getByRole('button', { name: 'Cancel' }));
    await nextFrame();
    await expect(left()).toBeLessThanOrEqual(0);
    await waitFor(() => expect(left()).toBe(-panel.getBoundingClientRect().width));
  },
};

// TUI Plus pattern "With close button on outside" — the X sits on the backdrop
// adjacent to the panel edge instead of inside the header.
export const CloseOutsideOverlay: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Close on the outside">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Open drawer
          </Button>
        </SectionCard>
        <Drawer open={open} onClose={() => setOpen(false)} closeOutside>
          <Drawer.Header title="Panel title" />
          <Drawer.Body>
            <div className="h-full rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700" />
          </Drawer.Body>
        </Drawer>
      </Wrap>
    );
  },
};

// TUI Plus pattern "Empty" — slide-over with no backdrop; the page stays
// interactive behind the panel.
export const EmptySlideOverNoBackdrop: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Slide-over without backdrop">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The page behind stays interactive — the drawer floats over without dimming.
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => setOpen(true)}>
            Open drawer
          </Button>
        </SectionCard>
        <Drawer open={open} onClose={() => setOpen(false)} withBackdrop={false}>
          <Drawer.Header title="Panel title" onClose={() => setOpen(false)} />
          <Drawer.Body>
            <div className="h-full rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700" />
          </Drawer.Body>
        </Drawer>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const CloseOutsideRendersBackdropButton: Story = {
  render: () => (
    <Drawer open onClose={() => {}} closeOutside>
      <Drawer.Header title="Panel" />
    </Drawer>
  ),
  // Drawer portals into `document.body` — query there, not in `canvasElement`.
  play: async () => {
    const btn = document.body.querySelector('button[aria-label="Close drawer"]');
    await expect(btn).not.toBeNull();
  },
};

export const NoBackdropOmitsOverlay: Story = {
  render: () => (
    <Drawer open onClose={() => {}} withBackdrop={false}>
      <Drawer.Header title="Panel" />
    </Drawer>
  ),
  // Drawer portals into `document.body` — query there, not in `canvasElement`.
  // With `withBackdrop={false}`, the overlay <div class="bg-gray-500/75 …">
  // must NOT be rendered. `previousElementSibling` would now match Storybook's
  // own canvas wrapper since both share document.body, so check the absence
  // of the backdrop class directly instead.
  play: async () => {
    const aside = document.body.querySelector('aside[role="dialog"]');
    await expect(aside).not.toBeNull();
    // Without a backdrop the page stays interactive: the drawer is not modal.
    await expect(aside).not.toHaveAttribute('aria-modal');
    const backdrop = document.body.querySelector('div[aria-hidden][class*="bg-gray-500"]');
    await expect(backdrop).toBeNull();
  },
};

const inDialog = (el: Element | null) => !!el?.closest('[role="dialog"]');

/**
 * A closed drawer stays out of the tab order, and closing it hands focus back
 * to the button that opened it.
 */
export const ClosedDrawerIsNotFocusable: Story = {
  tags: ['!autodocs'],
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Button variant="secondary">After</Button>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <Drawer.Header title="Panel" onClose={() => setOpen(false)} />
          <Drawer.Footer>
            <Button size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </Drawer.Footer>
        </Drawer>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    const after = canvas.getByRole('button', { name: 'After' });
    after.focus();
    await userEvent.tab();
    await expect(inDialog(document.activeElement)).toBe(false);

    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await userEvent.click(trigger);
    await waitFor(() => expect(inDialog(document.activeElement)).toBe(true));

    // Let the slide-in finish first: closing a panel that has not moved yet
    // runs no slide-out at all.
    const panel = within(document.body).getByRole('dialog');
    const transitionsEnd = () => Promise.all(panel.getAnimations().map((a) => a.finished));
    await transitionsEnd();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    // Once the slide-out has run, the panel is still out of reach.
    await transitionsEnd();
    after.focus();
    await userEvent.tab();
    await expect(inDialog(document.activeElement)).toBe(false);
  },
};

/**
 * Once its slide-out ends, a closed drawer is no longer painted (`invisible`),
 * not just parked off-screen. The panel slides with the `translate` property,
 * which is what Tailwind 4 animates, so the end of the slide has to be
 * recognized by it.
 */
export const ClosedDrawerIsInvisible: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <Drawer.Header title="Panel" onClose={() => setOpen(false)} />
        </Drawer>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const panel = await within(document.body).findByRole('dialog');
    const slideEnds = () => Promise.all(panel.getAnimations().map((a) => a.finished));
    // Let the slide-in finish first: closing a panel that has not moved yet
    // runs no slide-out at all.
    await slideEnds();
    await expect(panel).toBeVisible();

    await userEvent.click(within(panel).getByRole('button', { name: 'Close drawer' }));
    await slideEnds();
    await waitFor(() => expect(panel).not.toBeVisible());
  },
};

/** Tab cycles inside the open drawer, the outside close button included. */
export const FocusTrapIncludesCloseOutside: Story = {
  tags: ['!autodocs'],
  render: () => (
    <Wrap>
      <Button variant="secondary">Page button</Button>
      <Drawer open onClose={() => {}} closeOutside>
        <Drawer.Header title="Panel" />
        <Drawer.Footer>
          <Button size="sm">Apply</Button>
        </Drawer.Footer>
      </Drawer>
    </Wrap>
  ),
  play: async () => {
    await waitFor(() => expect(inDialog(document.activeElement)).toBe(true));
    const reached = new Set<string>();
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      await expect(inDialog(document.activeElement)).toBe(true);
      reached.add(document.activeElement?.getAttribute('aria-label') ?? '');
    }
    await expect(reached.has('Close drawer')).toBe(true);
  },
};

/** Shift+Tab from the first control wraps to the last one, and Tab from the last back to the first. */
export const ShiftTabWrapsInsideTheDrawer: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Button variant="secondary">Page button</Button>
      <Drawer open onClose={() => {}}>
        <Drawer.Header title="Panel" onClose={() => {}} />
        <Drawer.Footer>
          <Button size="sm" variant="secondary">
            Cancel
          </Button>
          <Button size="sm">Apply</Button>
        </Drawer.Footer>
      </Drawer>
    </Wrap>
  ),
  play: async () => {
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'Panel' }));
    // Focus starts on the first control, the header's close icon.
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Close drawer' })).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(dialog.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.tab();
    await expect(dialog.getByRole('button', { name: 'Close drawer' })).toHaveFocus();
  },
};

/** The backdrop, the header's close icon and Escape each call `onClose`. */
export const CloseTriggers: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Header title="Panel" onClose={args.onClose} />
    </Drawer>
  ),
  play: async ({ args }) => {
    const body = within(document.body);
    await body.findByRole('dialog');
    // The backdrop is the dimmed layer behind the panel.
    await userEvent.click(document.body.querySelector('div[aria-hidden][class*="bg-gray-500"]')!);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(body.getByRole('button', { name: 'Close drawer' }));
    await expect(args.onClose).toHaveBeenCalledTimes(2);
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(3);
  },
};

/**
 * A listbox, a menu and a tooltip opened in the drawer render inside it and are drawn at
 * their trigger, although the drawer, which slides with `translate`, is then the box their
 * fixed position is relative to. A click elsewhere in the drawer closes a panel and Escape
 * closes the menu, and the drawer stays open.
 */
export const PanelsRenderInsideTheDrawer: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer open={args.open} onClose={args.onClose}>
      <Drawer.Header title="Filters" />
      <Drawer.Body className="space-y-4">
        <Combobox
          label="Owner"
          options={[
            { value: 'leslie', label: 'Leslie Alexander' },
            { value: 'michael', label: 'Michael Foster' },
          ]}
        />
        <p>Filters apply to every table.</p>
        <div className="flex items-center justify-end gap-3">
          <Tooltip content="Newest first">
            <Button variant="secondary" size="sm">
              Order
            </Button>
          </Tooltip>
          <Dropdown
            label="Sort"
            align="right"
            options={[
              { value: 'new', label: 'Newest' },
              { value: 'old', label: 'Oldest' },
            ]}
          />
        </div>
      </Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const body = within(document.body);
    const drawerElement = await body.findByRole('dialog', { name: 'Filters' });
    const drawer = within(drawerElement);

    const input = drawer.getByRole('combobox', { name: 'Owner' });
    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await expect(drawerElement).toContainElement(listbox);
    expectBelow(listbox, input.parentElement!, { offset: 4, align: 'start' });
    await userEvent.click(drawer.getByText('Filters apply to every table.'));
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull());

    const sort = drawer.getByRole('button', { name: 'Sort' });
    await userEvent.click(sort);
    const menu = await body.findByRole('menu');
    await expect(drawerElement).toContainElement(menu);
    expectBelow(menu, sort, { offset: 4, align: 'end' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());

    const order = drawer.getByRole('button', { name: 'Order' });
    await userEvent.hover(order);
    const tip = body.getByRole('tooltip');
    await waitFor(() => expect(tip).toBeVisible());
    await expect(drawerElement).toContainElement(tip);
    const a = order.parentElement!.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    await expect(t.bottom).toBeCloseTo(a.top - 10, 0);
    await expect((t.left + t.right) / 2).toBeCloseTo((a.left + a.right) / 2, 0);

    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** Escape closes a popover open in the drawer first, and the drawer on the next press. */
export const EscapeClosesThePopoverFirst: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const close = () => {
      args.onClose();
      setOpen(false);
    };
    return (
      <Drawer open={open} onClose={close}>
        <Drawer.Header title="Filters" />
        <Drawer.Body>
          <Popover>
            <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Help</Popover.Trigger>
            <Popover.Content aria-label="Filter help">
              <p>Filters apply to every table.</p>
            </Popover.Content>
          </Popover>
        </Drawer.Body>
      </Drawer>
    );
  },
  play: async ({ args }) => {
    const body = within(document.body);
    const drawer = within(await body.findByRole('dialog', { name: 'Filters' }));
    await userEvent.click(drawer.getByRole('button', { name: 'Help' }));
    await body.findByRole('dialog', { name: 'Filter help' });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter help' })).toBeNull());
    await expect(body.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull());
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** The title names the dialog; `ariaLabel` names one that has none. A backdrop makes it modal. */
export const DrawerIsANamedModalDialog: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <Drawer open onClose={() => {}} side="left">
        <Drawer.Header title="Server details" />
      </Drawer>
      <Drawer open onClose={() => {}} ariaLabel="Filters" withBackdrop={false}>
        <Drawer.Body>No header here.</Drawer.Body>
      </Drawer>
    </>
  ),
  play: async () => {
    const body = within(document.body);
    await expect(await body.findByRole('dialog', { name: 'Server details' })).toHaveAttribute(
      'aria-modal',
      'true'
    );
    await expect(body.getByRole('dialog', { name: 'Filters' })).not.toHaveAttribute('aria-modal');
  },
};

// The close icon (gray-400, gray-500 in dark) was under 3:1 against the panel (#151).
export const CloseButtonContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Drawer open onClose={() => {}}>
      <Drawer.Header title="Panel" onClose={() => {}} />
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async () => {
    const close = await within(document.body).findByRole('button', { name: 'Close drawer' });
    inEachTheme(() => expectGraphicContrast(close, 'color'));
  },
};
