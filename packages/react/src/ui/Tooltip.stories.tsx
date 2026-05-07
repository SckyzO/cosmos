import type { Meta, StoryObj } from '@storybook/react-vite';
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

export const Positions: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Positions — hover the buttons">
        <div className="flex flex-wrap items-center gap-12">
          {(['top', 'bottom', 'left', 'right'] as const).map((position) => (
            <Tooltip key={position} content={`Position: ${position}`} position={position}>
              <Button variant="secondary" size="sm">
                {position}
              </Button>
            </Tooltip>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Variants: Story = {
  render: () => (
    <Wrap>
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
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="TooltipHelp shortcut">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hover the help icon</span>
            <TooltipHelp text="TooltipHelp uses the HelpCircle icon as trigger." />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};
