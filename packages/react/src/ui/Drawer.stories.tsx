import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { SlidersHorizontal } from 'lucide-react';
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
  parameters: { layout: 'fullscreen' },
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
        <Drawer open={side !== null} onClose={() => setSide(null)} side={side ?? 'right'}>
          <Drawer.Header
            title="Server details"
            icon={SlidersHorizontal}
            description="Inspect and configure"
            onClose={() => setSide(null)}
          />
          <Drawer.Body>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>This drawer slides in from the {side ?? 'right'}.</p>
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
      </Wrap>
    );
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
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector('button[aria-label="Close drawer"]');
    await expect(btn).not.toBeNull();
  },
};

export const NoBackdropOmitsOverlay: Story = {
  render: () => (
    <Drawer open onClose={() => {}} withBackdrop={false}>
      <Drawer.Header title="Panel" />
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    // The backdrop overlay carries bg-gray-500/75; without backdrop, no aria-hidden div precedes the aside.
    const aside = canvasElement.querySelector('aside[role="dialog"]');
    await expect(aside).not.toBeNull();
    const prev = aside?.previousElementSibling;
    await expect(prev).toBeNull();
  },
};
