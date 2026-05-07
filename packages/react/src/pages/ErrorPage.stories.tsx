import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Home } from 'lucide-react';
import { ErrorPage } from './ErrorPage';
import { Button } from '../ui/Button';

const meta = {
  title: 'Pages/Error Page',
  component: ErrorPage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { code: 404, title: 'Not found' },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: {
    code: 404,
    title: 'Page not found',
    description: "Sorry, the page you're looking for doesn't exist.",
    actions: (
      <>
        <Button icon={Home}>Go to dashboard</Button>
        <Button variant="secondary" icon={ArrowLeft}>
          Go back
        </Button>
      </>
    ),
  },
};

export const ServerError: Story = {
  args: {
    code: 500,
    title: 'Internal server error',
    description: 'Something went wrong on our end. The team has been notified.',
    actions: <Button icon={Home}>Go to dashboard</Button>,
  },
};

export const Maintenance: Story = {
  args: {
    code: 503,
    title: 'Scheduled maintenance',
    description: "We're upgrading the cluster. Back online in approximately 15 minutes.",
  },
};
