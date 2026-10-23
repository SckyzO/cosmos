import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SlidersHorizontal } from 'lucide-react';
import { expectGraphicContrast, inEachTheme, portalDocsParams } from '../storybook-helpers';
import { Drawer } from './Drawer';
import { Button } from './Button';
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
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    // Once the slide-out has run, the panel is still out of reach.
    await new Promise((resolve) => setTimeout(resolve, 400));
    after.focus();
    await userEvent.tab();
    await expect(inDialog(document.activeElement)).toBe(false);
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
