import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Home } from 'lucide-react';
import { ErrorPage } from './ErrorPage';
import { StickyScrollNav } from './StickyScrollNav';
import { Button } from '../ui/Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Pages/Templates',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
    {children}
  </div>
);

export const NotFound: Story = {
  render: () => (
    <Wrap>
      <ErrorPage
        code={404}
        title="Page not found"
        description="Sorry, the page you're looking for doesn't exist."
        actions={
          <>
            <Button icon={Home}>Go to dashboard</Button>
            <Button variant="secondary" icon={ArrowLeft}>
              Go back
            </Button>
          </>
        }
      />
    </Wrap>
  ),
};

export const ServerError: Story = {
  render: () => (
    <Wrap>
      <ErrorPage
        code={500}
        title="Internal server error"
        description="Something went wrong on our end. The team has been notified."
        actions={<Button icon={Home}>Go to dashboard</Button>}
      />
    </Wrap>
  ),
};

export const Maintenance: Story = {
  render: () => (
    <Wrap>
      <ErrorPage
        code={503}
        title="Scheduled maintenance"
        description="We're upgrading the cluster. Back online in approximately 15 minutes."
      />
    </Wrap>
  ),
};

export const StickyNavExample: Story = {
  render: () => (
    <Wrap>
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
    </Wrap>
  ),
};
