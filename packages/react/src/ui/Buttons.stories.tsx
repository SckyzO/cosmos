import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, ArrowRight, Trash2, Download } from 'lucide-react';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Button',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Variants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants × sizes">
        <div className="space-y-3">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Button variant="primary" size={size}>
                Primary
              </Button>
              <Button variant="secondary" size={size}>
                Secondary
              </Button>
              <Button variant="ghost" size={size}>
                Ghost
              </Button>
              <Button variant="danger" size={size}>
                Danger
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With icons">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={Plus}>New item</Button>
          <Button variant="secondary" icon={Download}>
            Download
          </Button>
          <Button variant="ghost" icon={ArrowRight} iconPosition="right">
            Continue
          </Button>
          <Button variant="danger" icon={Trash2}>
            Delete
          </Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const States: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="States">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button variant="secondary" loading>
            Saving…
          </Button>
        </div>
      </SectionCard>
    </Wrap>
  ),
};
