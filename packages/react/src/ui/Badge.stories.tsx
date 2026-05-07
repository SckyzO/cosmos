import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const AllVariants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants × sizes">
        <div className="space-y-3">
          {(['sm', 'md'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Badge variant="neutral" size={size}>
                Neutral
              </Badge>
              <Badge variant="brand" size={size}>
                Brand
              </Badge>
              <Badge variant="success" size={size}>
                Success
              </Badge>
              <Badge variant="warning" size={size}>
                Warning
              </Badge>
              <Badge variant="danger" size={size}>
                Danger
              </Badge>
              <Badge variant="info" size={size}>
                Info
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};
