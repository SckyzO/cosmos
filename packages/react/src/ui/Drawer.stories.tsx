import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { SlidersHorizontal } from 'lucide-react';
import {
  expectBelow,
  expectGraphicContrast,
  expectNoHorizontalOverflow,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { Drawer } from './Drawer';
import type { DrawerProps } from './Drawer';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';
import { Combobox } from '../forms/Combobox';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { Textarea } from '../forms/Textarea';
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
    const [side, setSide] = useState<'left' | 'right' | 'bottom' | null>(null);
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
            <Button variant="secondary" onClick={() => setSide('bottom')}>
              Open bottom
            </Button>
          </div>
        </SectionCard>
        {/* One drawer per side: a drawer's side is fixed, so switching it while
            the panel slides would send it in or out by the wrong edge. */}
        {(['left', 'right', 'bottom'] as const).map((drawerSide) => (
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

/** Open on mount, as the panel looks once a trigger has opened it: header, scrolling body, pinned footer. */
export const Open: Story = {
  tags: ['!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Closed it? Open it again">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Open drawer
          </Button>
        </SectionCard>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <Drawer.Header
            title="Server details"
            icon={SlidersHorizontal}
            description="Inspect and configure"
            onClose={() => setOpen(false)}
          />
          <Drawer.Body>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>web-01 runs in Europe (West) and has been up for 41 days.</p>
              <p>Use a drawer for inspectors, filters or a supplementary form.</p>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </Drawer.Footer>
        </Drawer>
      </Wrap>
    );
  },
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Server details' });
    await expect(dialog).toBeVisible();
  },
};

const REGIONS = [
  { value: 'eu-west', label: 'Europe (West)' },
  { value: 'us-east', label: 'US (East)' },
  { value: 'ap-south', label: 'Asia Pacific (South)' },
];

/**
 * A form in a drawer: the title with its close button, the fields in a body that scrolls while
 * the footer stays pinned, Cancel and the primary action together on the right (the primary
 * stays disabled until the form is valid) and the destructive action apart on the left.
 */
export const FormInDrawer: Story = {
  tags: ['!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const valid = name.trim() !== '' && region !== '';
    const close = () => setOpen(false);
    return (
      <Wrap>
        <SectionCard title="Closed it? Open it again">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Edit server
          </Button>
        </SectionCard>
        <Drawer open={open} onClose={close}>
          <Drawer.Header
            title="Edit server"
            description="Changes apply to the next deploy."
            onClose={close}
          />
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              close();
            }}
          >
            <Drawer.Body className="min-h-0 space-y-4">
              <Input
                label="Name"
                required
                placeholder="web-01"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Select
                label="Region"
                required
                placeholder="Choose a region"
                options={REGIONS}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              />
              <Textarea label="Notes" rows={4} description="Visible to your team only." />
            </Drawer.Body>
            <Drawer.Footer className="justify-between">
              <Button type="button" variant="ghost" intent="danger" size="sm">
                Delete server
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!valid}>
                  Save changes
                </Button>
              </div>
            </Drawer.Footer>
          </form>
        </Drawer>
      </Wrap>
    );
  },
  play: async () => {
    const dialog = within(
      await within(document.body).findByRole('dialog', { name: 'Edit server' })
    );
    const save = dialog.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();
    await userEvent.type(dialog.getByRole('textbox', { name: /^Name/ }), 'web-01');
    // A name alone is not enough: the region is required too.
    await expect(save).toBeDisabled();
    await userEvent.selectOptions(dialog.getByRole('combobox', { name: /^Region/ }), 'eu-west');
    await expect(save).toBeEnabled();
    await userEvent.clear(dialog.getByRole('textbox', { name: /^Name/ }));
    await expect(save).toBeDisabled();
  },
};

type SheetDemoProps = Pick<DrawerProps, 'handle' | 'swipeToClose'> & {
  /** Rows in the body: a few fit, many make `Drawer.Body` scroll. */
  rows?: number;
};

/** A bottom sheet open on mount, with a button to open it again once closed. */
const SheetDemo = ({ rows = 3, ...props }: SheetDemoProps) => {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);
  return (
    <Wrap>
      <SectionCard title="Closed it? Open it again">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open sheet
        </Button>
      </SectionCard>
      <Drawer {...props} side="bottom" open={open} onClose={close}>
        <Drawer.Header
          title="Server actions"
          description="web-01 · Europe (West)"
          onClose={close}
        />
        <Drawer.Body>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {Array.from({ length: rows }, (_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>web-{String(i + 1).padStart(2, '0')}</span>
                <Button variant="secondary" size="sm">
                  Restart
                </Button>
              </li>
            ))}
          </ul>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" size="sm" onClick={close}>
            Cancel
          </Button>
        </Drawer.Footer>
      </Drawer>
    </Wrap>
  );
};

/**
 * `side="bottom"`: a sheet as wide as the viewport and as tall as its content, rounded on top,
 * with a grab handle. The scrim stays visible above it, and a tap there closes it. The focus
 * trap, Escape and the header, body and footer are those of the other sides.
 */
export const BottomSheet: Story = {
  render: () => <SheetDemo />,
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'Server actions' });
    await expect(sheet).toBeVisible();
    // The handle is a visual cue: hidden from assistive technology, not a control.
    await expect(sheet.querySelector('[data-slot="handle"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  },
};

/** Past 85% of the viewport height the sheet stops growing and `Drawer.Body` scrolls; the header and the footer stay in place. */
export const BottomSheetScrolls: Story = {
  tags: ['!autodocs'],
  render: () => <SheetDemo rows={40} />,
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'Server actions' });
    await expect(sheet).toBeVisible();
  },
};

/** `handle={false}` removes the grab handle. */
export const BottomSheetWithoutHandle: Story = {
  tags: ['!autodocs'],
  render: () => <SheetDemo handle={false} />,
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'Server actions' });
    await expect(sheet.querySelector('[data-slot="handle"]')).toBeNull();
  },
};

/** At the `mobile` viewport the sheet spans the screen, stays under 85% of its height and does not widen the page. */
export const BottomSheetOnMobile: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  render: () => <SheetDemo rows={40} swipeToClose />,
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'Server actions' });
    await waitFor(() => expect(window.innerWidth).toBeLessThanOrEqual(400));
    await waitFor(() => expect(sheet.getBoundingClientRect().bottom).toBe(window.innerHeight));
    const box = sheet.getBoundingClientRect();
    await expect(box.left).toBe(0);
    await expect(box.width).toBe(document.documentElement.clientWidth);
    await expect(box.height).toBeLessThanOrEqual(window.innerHeight * 0.85 + 1);
    expectNoHorizontalOverflow(sheet);
  },
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** The left drawer enters and leaves by the left edge, never the right. */
export const LeftDrawerStaysOnTheLeft: Story = {
  tags: ['!dev', '!autodocs'],
  // The story watches the slide itself: keep it in the story tests.
  parameters: { settleMotion: false },
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
    const drawer = document.body.querySelector('[role="dialog"]');
    await expect(drawer).not.toBeNull();
    // Without a backdrop the page stays interactive: the drawer is not modal.
    await expect(drawer).not.toHaveAttribute('aria-modal');
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
  tags: ['!dev', '!autodocs'],
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
  // The end of a real slide (`transitionend`): keep the slide in the story tests.
  // `ClosedDrawerIsInvisibleWithoutASlide` covers a close that runs none.
  parameters: { settleMotion: false },
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

/**
 * With transitions at `0s` (a reduced-motion reset, a user stylesheet, and these story tests), the
 * slide-out starts no transition and fires no `transitionend`: the closed drawer is still no longer
 * painted.
 */
export const ClosedDrawerIsInvisibleWithoutASlide: Story = {
  tags: ['!dev', '!autodocs'],
  render: ClosedDrawerIsInvisible.render,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const panel = await within(document.body).findByRole('dialog');
    await expect(panel.getAnimations()).toHaveLength(0);
    await expect(panel).toBeVisible();

    await userEvent.click(within(panel).getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => expect(panel).not.toBeVisible());
  },
};

/** Tab cycles inside the open drawer, the outside close button included. */
export const FocusTrapIncludesCloseOutside: Story = {
  tags: ['!dev', '!autodocs'],
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

// ─────────────────────────────────────────────────────────────────────────────
// Swipe to close
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `swipeToClose`: on a touch screen, a swipe toward the panel's edge follows the finger and
 * closes the drawer past a third of its width or as a fast flick; a shorter one springs back.
 * Try it with the touch emulation of your browser's devtools.
 */
export const SwipeToClose: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Drawer open={open} onClose={() => setOpen(false)} side="left" size="sm" swipeToClose>
          <Drawer.Header title="Swipe me" onClose={() => setOpen(false)} />
          <Drawer.Body>
            Swipe this panel to the left with a finger, or use the close button.
          </Drawer.Body>
        </Drawer>
      </Wrap>
    );
  },
};

type Touch = { pointerType?: string; pointerId?: number };
const touch = (clientX: number, init: Touch = {}) => ({
  pointerType: 'touch',
  pointerId: 1,
  isPrimary: true,
  clientX,
  clientY: 200,
  ...init,
});
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const swipePanel = async () => {
  const panel = await within(document.body).findByRole('dialog', { name: 'Swipe' });
  await waitFor(() => expect(panel.getBoundingClientRect().left).toBe(0));
  return panel;
};

/** A swipe past a third of the panel closes it, and the panel follows the finger until then. */
export const SwipePastAThirdCloses: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="left" size="sm" swipeToClose ariaLabel="Swipe">
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const panel = await swipePanel();
    const width = panel.getBoundingClientRect().width;
    await fireEvent.pointerDown(panel, touch(250));
    await fireEvent.pointerMove(panel, touch(250 - 60));
    // The panel is where the finger took it, with no transition in the way.
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBeCloseTo(-60, 0));
    // Never past its open position: the other way does nothing.
    await fireEvent.pointerMove(panel, touch(250 + 80));
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBe(0));
    await fireEvent.pointerMove(panel, touch(250 - width / 3 - 20));
    await sleep(150);
    await expect(args.onClose).not.toHaveBeenCalled();
    await fireEvent.pointerUp(panel, touch(250 - width / 3 - 20));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** A short swipe, slow, springs back to the open position and does not close. */
export const ShortSwipeSpringsBack: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipePastAThirdCloses.render,
  play: async ({ args }) => {
    const panel = await swipePanel();
    await fireEvent.pointerDown(panel, touch(250));
    await fireEvent.pointerMove(panel, touch(250 - 50));
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBeCloseTo(-50, 0));
    await sleep(250);
    await fireEvent.pointerUp(panel, touch(250 - 50));
    await expect(args.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(panel.getBoundingClientRect().left).toBe(0));
    await expect(panel.style.translate).toBe('');
  },
};

/** A fast flick closes even a short swipe. */
export const FastFlickCloses: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipePastAThirdCloses.render,
  play: async ({ args }) => {
    const panel = await swipePanel();
    await fireEvent.pointerDown(panel, touch(250));
    await fireEvent.pointerMove(panel, touch(250 - 40));
    await fireEvent.pointerUp(panel, touch(250 - 40));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** A mouse does not swipe, and nor does a drawer without `swipeToClose`. */
export const MouseAndDefaultDrawerDoNotSwipe: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <>
      <Drawer {...args} side="left" size="sm" swipeToClose ariaLabel="Swipe">
        <Drawer.Body>Content</Drawer.Body>
      </Drawer>
    </>
  ),
  play: async ({ args }) => {
    const panel = await swipePanel();
    const mouse: Touch = { pointerType: 'mouse' };
    await fireEvent.pointerDown(panel, touch(250, mouse));
    await fireEvent.pointerMove(panel, touch(100, mouse));
    await fireEvent.pointerUp(panel, touch(100, mouse));
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(panel.getBoundingClientRect().left).toBe(0);
  },
};

export const DrawerWithoutSwipeToCloseIgnoresSwipes: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="left" size="sm" ariaLabel="Swipe">
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const panel = await swipePanel();
    await fireEvent.pointerDown(panel, touch(250));
    await fireEvent.pointerMove(panel, touch(30));
    await fireEvent.pointerUp(panel, touch(30));
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(panel.style.translate).toBe('');
  },
};

/** A right drawer closes on a swipe to the right, not to the left. */
export const RightDrawerSwipesToTheRight: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="right" size="sm" swipeToClose ariaLabel="Swipe">
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const panel = await within(document.body).findByRole('dialog', { name: 'Swipe' });
    await waitFor(() => expect(panel.getBoundingClientRect().right).toBe(window.innerWidth));
    const x = window.innerWidth - 100;
    await fireEvent.pointerDown(panel, touch(x));
    await fireEvent.pointerMove(panel, touch(x - 120));
    await sleep(150);
    await fireEvent.pointerUp(panel, touch(x - 120));
    await expect(args.onClose).not.toHaveBeenCalled();

    await fireEvent.pointerDown(panel, touch(x));
    await fireEvent.pointerMove(panel, touch(x + 60));
    await waitFor(() =>
      expect(panel.getBoundingClientRect().right).toBeCloseTo(window.innerWidth + 60, 0)
    );
    await fireEvent.pointerMove(panel, touch(x + 130));
    await sleep(150);
    await fireEvent.pointerUp(panel, touch(x + 130));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** Under `prefers-reduced-motion` the gesture still works; only the spring-back is not animated. */
export const ReducedMotionSkipsTheSpring: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipePastAThirdCloses.render,
  play: async () => {
    const realMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) =>
      query.includes('prefers-reduced-motion')
        ? ({ ...realMatchMedia(query), matches: true } as MediaQueryList)
        : realMatchMedia(query);
    try {
      const panel = await swipePanel();
      await fireEvent.pointerDown(panel, touch(250));
      await fireEvent.pointerMove(panel, touch(250 - 50));
      await sleep(250);
      await fireEvent.pointerUp(panel, touch(250 - 50));
      await waitFor(() => expect(panel.style.transition).toBe('none'));
      await expect(panel.getBoundingClientRect().left).toBe(0);
      // Not left on: the next slide animates again.
      await waitFor(() => expect(panel.style.transition).toBe(''));
    } finally {
      window.matchMedia = realMatchMedia;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

const findSheet = (name: string) => within(document.body).findByRole('dialog', { name });
const viewportBottom = () => document.documentElement.clientHeight;
/** The sheet has slid in: its bottom edge is the bottom of the viewport. */
const sheetOpen = async (name: string) => {
  const sheet = await findSheet(name);
  await waitFor(() => expect(sheet.getBoundingClientRect().bottom).toBe(viewportBottom()));
  return sheet;
};
const scrim = () =>
  document.body.querySelector<HTMLElement>('div[aria-hidden][class*="bg-gray-500"]')!;

/** The sheet enters and leaves by the bottom edge, never the top or a side. */
export const BottomSheetSlidesFromTheBottom: Story = {
  tags: ['!dev', '!autodocs'],
  // The story watches the slide itself: keep it in the story tests.
  parameters: { settleMotion: false },
  render: Sides.render,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open bottom' }));
    const sheet = within(document.body)
      .getByText('This drawer slides in from the bottom.')
      .closest<HTMLElement>('[role="dialog"]')!;
    const box = () => sheet.getBoundingClientRect();
    // A frame into the slide the sheet is still coming in from below the viewport, and in line.
    await nextFrame();
    await expect(box().bottom).toBeGreaterThan(viewportBottom());
    await waitFor(() => expect(box().bottom).toBe(viewportBottom()));
    await expect(box().left).toBe(0);

    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }));
    await nextFrame();
    await expect(box().top).toBeGreaterThanOrEqual(viewportBottom() - box().height);
    await waitFor(() => expect(box().top).toBe(viewportBottom()));
    await expect(box().left).toBe(0);
  },
};

/**
 * The sheet is as wide as the viewport whatever `size` says, anchored to the bottom, rounded on
 * top only, and as tall as its content. The scrim stays visible above it and closes it.
 */
export const BottomSheetFillsTheWidthAndFollowsItsContent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="bottom" size="sm" ariaLabel="Sheet">
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const sheet = await sheetOpen('Sheet');
    const box = sheet.getBoundingClientRect();
    // `size="sm"` is a 288px width on the side drawers: ignored here.
    await expect(box.left).toBe(0);
    await expect(box.width).toBe(document.documentElement.clientWidth);
    // A line of text and a handle, not a panel that fills the screen.
    await expect(box.height).toBeLessThan(window.innerHeight / 3);
    await expect(sheet.scrollHeight).toBeLessThanOrEqual(sheet.clientHeight);
    const style = getComputedStyle(sheet);
    await expect(style.borderTopLeftRadius).toBe('16px');
    await expect(style.borderTopRightRadius).toBe('16px');
    await expect(style.borderBottomLeftRadius).toBe('0px');
    await expect(style.borderTopWidth).toBe('1px');
    await expect(style.borderBottomWidth).toBe('0px');

    // The scrim shows above the sheet, and a tap there closes it.
    const above = document.elementFromPoint(window.innerWidth / 2, box.top / 2);
    await expect(above).toBe(scrim());
    await userEvent.click(above!);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** A sheet with a long body stops at 85% of the viewport height: the body scrolls, the header and footer stay. */
export const BottomSheetStaysUnder85PercentOfTheViewport: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <SheetDemo rows={60} />,
  play: async () => {
    const sheet = await sheetOpen('Server actions');
    const cap = window.innerHeight * 0.85;
    await expect(sheet.getBoundingClientRect().height).toBeLessThanOrEqual(cap + 1);
    // The content is far taller than that: the sheet reaches its cap.
    await expect(sheet.getBoundingClientRect().height).toBeGreaterThan(cap - 2);

    const body = sheet.querySelector<HTMLElement>('.overflow-y-auto')!;
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const header = within(sheet).getByRole('heading', { name: 'Server actions' });
    const footer = within(sheet).getByRole('button', { name: 'Cancel' });
    const headerTop = header.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await expect(body.scrollTop).toBeGreaterThan(0);
    await expect(header.getBoundingClientRect().top).toBe(headerTop);
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(viewportBottom());
    await expect(footer).toBeVisible();
    // The scrim keeps room above the sheet.
    await expect(sheet.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      window.innerHeight * 0.15 - 1
    );
  },
};

/** The left and right drawers keep their size, their full height and their square corners, and have no handle. */
export const SideDrawersAreUnchangedByTheBottomSheet: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <Drawer open onClose={() => {}} side="left" ariaLabel="Left" withBackdrop={false}>
        <Drawer.Body>Left</Drawer.Body>
      </Drawer>
      <Drawer open onClose={() => {}} side="right" size="sm" ariaLabel="Right" withBackdrop={false}>
        <Drawer.Body>Right</Drawer.Body>
      </Drawer>
    </>
  ),
  play: async () => {
    const left = await findSheet('Left');
    const right = await findSheet('Right');
    await waitFor(() => expect(left.getBoundingClientRect().left).toBe(0));
    await waitFor(() =>
      expect(right.getBoundingClientRect().right).toBe(document.documentElement.clientWidth)
    );
    for (const panel of [left, right]) {
      const box = panel.getBoundingClientRect();
      await expect(box.top).toBe(0);
      await expect(box.bottom).toBe(viewportBottom());
      await expect(getComputedStyle(panel).borderTopLeftRadius).toBe('0px');
      await expect(panel.querySelector('[data-slot="handle"]')).toBeNull();
    }
    await expect(left.getBoundingClientRect().width).toBe(384);
    await expect(right.getBoundingClientRect().width).toBe(288);
  },
};

/** `closeOutside` puts the close button on the scrim, above the sheet's top edge. */
export const BottomSheetCloseOutsideSitsAboveTheSheet: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="bottom" closeOutside ariaLabel="Sheet">
      <Drawer.Body>Content</Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const sheet = await sheetOpen('Sheet');
    const close = within(sheet).getByRole('button', { name: 'Close drawer' });
    const button = close.getBoundingClientRect();
    const box = sheet.getBoundingClientRect();
    await expect(button.bottom).toBeLessThanOrEqual(box.top);
    await expect(button.top).toBeGreaterThanOrEqual(0);
    await expect(button.right).toBeLessThanOrEqual(box.right);
    await userEvent.click(close);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** Tab and Shift+Tab cycle inside the open sheet, as they do in the other sides. */
export const BottomSheetTrapsFocus: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Button variant="secondary">Page button</Button>
      <Drawer open onClose={() => {}} side="bottom">
        <Drawer.Header title="Panel" onClose={() => {}} />
        <Drawer.Body>
          <Button size="sm" variant="secondary">
            Restart
          </Button>
        </Drawer.Body>
        <Drawer.Footer>
          <Button size="sm">Apply</Button>
        </Drawer.Footer>
      </Drawer>
    </Wrap>
  ),
  play: async () => {
    const sheet = within(await findSheet('Panel'));
    // Focus starts on the first control, the header's close icon.
    await waitFor(() => expect(sheet.getByRole('button', { name: 'Close drawer' })).toHaveFocus());
    // Three controls: two laps of Tab never leave the sheet.
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      await expect(inDialog(document.activeElement)).toBe(true);
    }
    await expect(sheet.getByRole('button', { name: 'Close drawer' })).toHaveFocus();
    // Shift+Tab from the first control wraps to the last, Tab from the last back to the first.
    await userEvent.tab({ shift: true });
    await expect(sheet.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.tab();
    await expect(sheet.getByRole('button', { name: 'Close drawer' })).toHaveFocus();
  },
};

/** Escape closes a popover open in the sheet first, and the sheet on the next press. */
export const BottomSheetEscapeClosesOnlyTheTopmostOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const close = () => {
      args.onClose();
      setOpen(false);
    };
    return (
      <Drawer open={open} onClose={close} side="bottom">
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
    const sheet = within(await findSheet('Filters'));
    await userEvent.click(sheet.getByRole('button', { name: 'Help' }));
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

// A downward touch, at the same horizontal position.
const touchY = (clientY: number, init: Touch & { clientX?: number } = {}) => ({
  pointerType: 'touch',
  pointerId: 1,
  isPrimary: true,
  clientX: 200,
  clientY,
  ...init,
});

const SwipeSheet = (args: DrawerProps) => (
  <Drawer {...args} side="bottom" swipeToClose ariaLabel="Swipe">
    <Drawer.Body>
      <div className="h-48">Content</div>
    </Drawer.Body>
  </Drawer>
);

/** A downward swipe past a third of the sheet's height closes it, and the sheet follows the finger until then. */
export const BottomSheetSwipePastAThirdCloses: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipeSheet,
  play: async ({ args }) => {
    const panel = await sheetOpen('Swipe');
    const { top, height } = panel.getBoundingClientRect();
    await fireEvent.pointerDown(panel, touchY(300));
    await fireEvent.pointerMove(panel, touchY(300 + 60));
    // The sheet is where the finger took it, with no transition in the way.
    await waitFor(() => expect(panel.getBoundingClientRect().top).toBeCloseTo(top + 60, 0));
    // Never above its open position: the other way does nothing.
    await fireEvent.pointerMove(panel, touchY(300 - 80));
    await waitFor(() => expect(panel.getBoundingClientRect().top).toBe(top));
    await fireEvent.pointerMove(panel, touchY(300 + height / 3 + 20));
    await sleep(150);
    await expect(args.onClose).not.toHaveBeenCalled();
    await fireEvent.pointerUp(panel, touchY(300 + height / 3 + 20));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** A short, slow swipe springs back to the open position and does not close. */
export const BottomSheetShortSwipeSpringsBack: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipeSheet,
  play: async ({ args }) => {
    const panel = await sheetOpen('Swipe');
    const { top, height } = panel.getBoundingClientRect();
    // Short of a third, so that only the distance is tested.
    await expect(40).toBeLessThan(height / 3);
    await fireEvent.pointerDown(panel, touchY(300));
    await fireEvent.pointerMove(panel, touchY(340));
    await waitFor(() => expect(panel.getBoundingClientRect().top).toBeCloseTo(top + 40, 0));
    await sleep(250);
    await fireEvent.pointerUp(panel, touchY(340));
    await expect(args.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(panel.getBoundingClientRect().top).toBe(top));
    await expect(panel.style.translate).toBe('');
  },
};

/** A fast downward flick closes even a short swipe. */
export const BottomSheetFastFlickCloses: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipeSheet,
  play: async ({ args }) => {
    const panel = await sheetOpen('Swipe');
    await fireEvent.pointerDown(panel, touchY(300));
    await fireEvent.pointerMove(panel, touchY(340));
    await fireEvent.pointerUp(panel, touchY(340));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** A drag that goes sideways is not a swipe: the sheet stays put, even if the finger then goes down. */
export const BottomSheetIgnoresASidewaysDrag: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: SwipeSheet,
  play: async ({ args }) => {
    const panel = await sheetOpen('Swipe');
    await fireEvent.pointerDown(panel, touchY(300));
    await fireEvent.pointerMove(panel, touchY(310, { clientX: 320 }));
    await fireEvent.pointerMove(panel, touchY(500, { clientX: 320 }));
    await sleep(150);
    await fireEvent.pointerUp(panel, touchY(500, { clientX: 320 }));
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(panel.style.translate).toBe('');
    await expect(panel.getBoundingClientRect().bottom).toBe(viewportBottom());
  },
};

/** `swipeToClose` stays off by default on the sheet: a swipe does nothing, and the browser keeps every touch. */
export const BottomSheetWithoutSwipeToCloseIgnoresSwipes: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: true, onClose: fn() },
  render: (args) => (
    <Drawer {...args} side="bottom" ariaLabel="Swipe">
      <Drawer.Body>
        <div className="h-48">Content</div>
      </Drawer.Body>
    </Drawer>
  ),
  play: async ({ args }) => {
    const panel = await sheetOpen('Swipe');
    await fireEvent.pointerDown(panel, touchY(300));
    await fireEvent.pointerMove(panel, touchY(420));
    await fireEvent.pointerUp(panel, touchY(420));
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(panel.style.translate).toBe('');
    await expect(panel.style.touchAction).toBe('');
    const body = panel.querySelector<HTMLElement>('.overflow-y-auto')!;
    await expect(getComputedStyle(body).touchAction).toBe('auto');
  },
};

/**
 * On a sheet that swipes down, the panel takes the vertical drag (`touch-action: none`), but a
 * body that scrolls keeps its own pan, or a swipe would never let a long list scroll on a phone.
 * A body that fits takes the drag, and follows the content when it grows past the sheet.
 */
export const BottomSheetBodyKeepsItsScrollOnTouch: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [rows, setRows] = useState(2);
    return (
      <Drawer open onClose={() => {}} side="bottom" swipeToClose ariaLabel="Swipe">
        <Drawer.Body>
          <ul>
            {Array.from({ length: rows }, (_, i) => (
              <li key={i}>
                <Button variant="ghost" size="sm">
                  Row {i + 1}
                </Button>
              </li>
            ))}
          </ul>
        </Drawer.Body>
        <Drawer.Footer>
          <Button size="sm" onClick={() => setRows(80)}>
            Add rows
          </Button>
        </Drawer.Footer>
      </Drawer>
    );
  },
  play: async () => {
    const panel = await sheetOpen('Swipe');
    const body = panel.querySelector<HTMLElement>('.overflow-y-auto')!;
    await expect(getComputedStyle(panel).touchAction).toBe('none');
    await waitFor(() => expect(getComputedStyle(body).touchAction).toBe('none'));

    await userEvent.click(within(panel).getByRole('button', { name: 'Add rows' }));
    await waitFor(() => expect(body.scrollHeight).toBeGreaterThan(body.clientHeight));
    await waitFor(() => expect(getComputedStyle(body).touchAction).toBe('pan-y'));
    await expect(getComputedStyle(panel).touchAction).toBe('none');
  },
};
