import type { Meta, StoryObj } from '@storybook/react-vite';
import { Info } from 'lucide-react';
import { Tooltip, TooltipHelp } from './Tooltip';
import { SectionCard } from '../templates/SectionCard';
import { Button } from './Button';

const meta = {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { content: 'Tooltip content', children: null },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-12 text-[var(--color-text-base)]">{children}</div>
);

export const PositionsAndVariants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Positions (hover the buttons)">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {(['top', 'bottom', 'left', 'right'] as const).map((position) => (
            <Tooltip key={position} content={`Position: ${position}`} position={position}>
              <Button variant="secondary" size="sm">
                {position}
              </Button>
            </Tooltip>
          ))}
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="Variants">
          <div className="flex flex-wrap items-center gap-6">
            <Tooltip content="Dark variant (default)" variant="dark">
              <Button variant="secondary" size="sm">
                Dark
              </Button>
            </Tooltip>
            <Tooltip content="White variant" variant="white">
              <Button variant="secondary" size="sm">
                White
              </Button>
            </Tooltip>
            <Tooltip content="Brand accent" variant="brand">
              <Button variant="secondary" size="sm">
                Brand
              </Button>
            </Tooltip>
            <TooltipHelp text="TooltipHelp shortcut — uses the HelpCircle icon as trigger." />
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <Info className="h-3.5 w-3.5" />
              Hover trigger to reveal
            </span>
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};
