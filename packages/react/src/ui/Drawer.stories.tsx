import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Overlays/Drawer',
  component: Drawer,
  parameters: { layout: 'padded' },
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
