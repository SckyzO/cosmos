import type { Meta, StoryObj } from '@storybook/react-vite';

// Simple inline component — proof that React rendering works in Storybook 10.
// Will be replaced in Phase 1 by real Cosmos components.
const Hello = ({ name = 'Cosmos' }: { name?: string }) => (
  <div
    style={{
      padding: '3rem',
      fontFamily: 'Outfit, system-ui, sans-serif',
      background: 'linear-gradient(135deg, #465fff 0%, #2a31d8 100%)',
      color: 'white',
      borderRadius: '1rem',
      maxWidth: '500px',
    }}
  >
    <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800 }}>
      Hello, {name}.
    </h1>
    <p style={{ margin: '1rem 0 0', opacity: 0.9 }}>
      Phase 0 storybook is alive. Next: extract real components from rackscope.
    </p>
  </div>
);

const meta = {
  title: 'Phase 0/Hello',
  component: Hello,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Hello>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Cosmos',
  },
};

export const Custom: Story = {
  args: {
    name: 'Sckyzo',
  },
};
