import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'UI/Avatar',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const InitialsAndImage: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Sizes">
        <div className="flex flex-wrap items-center gap-4">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <Avatar size={size} name="Tom Bourdin" />
              <span className="text-[10px] text-gray-500 uppercase">{size}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="Image fallback">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="lg" name="Jane Doe" />
            <Avatar size="lg" name="Tom Bourdin" />
            <Avatar size="lg" name="Sckyzo" />
            <Avatar size="lg" name="A B C D" />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};
