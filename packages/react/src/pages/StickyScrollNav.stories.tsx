import type { Meta, StoryObj } from '@storybook/react-vite';
import { StickyScrollNav } from './StickyScrollNav';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Pages/Sticky Scroll Nav',
  component: StickyScrollNav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { sections: [] },
} satisfies Meta<typeof StickyScrollNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6">
      <StickyScrollNav
        sections={[
          { id: 's1', label: 'Realtime' },
          { id: 's2', label: 'Line / Area' },
          { id: 's3', label: 'Donut' },
          { id: 's4', label: 'Treemap' },
        ]}
      />
      <div className="space-y-6 pt-6">
        {['s1', 's2', 's3', 's4'].map((id) => (
          <div key={id} id={id}>
            <SectionCard title={id.toUpperCase()}>
              <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800/50" />
            </SectionCard>
          </div>
        ))}
      </div>
    </div>
  ),
};
