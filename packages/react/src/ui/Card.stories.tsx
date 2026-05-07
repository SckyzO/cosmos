import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Button } from './Button';

const meta = {
  title: 'Data/Card',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Plain: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold">Simple card</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A flat container with default padding.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold">Larger padding</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use <code>padding=&quot;lg&quot;</code> when content needs more breathing room.
          </p>
        </Card>
      </div>
    </Wrap>
  ),
};

export const Composed: Story = {
  render: () => (
    <Wrap>
      <Card padding="none" className="max-w-md">
        <Card.Header>
          <h3 className="text-sm font-semibold">Connection settings</h3>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Card.Header>
        <Card.Body>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure how the agent connects to your Prometheus endpoint.
          </p>
        </Card.Body>
        <Card.Footer>
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </Card.Footer>
      </Card>
    </Wrap>
  ),
};
