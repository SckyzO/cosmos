import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Home } from 'lucide-react';
import { expect } from 'storybook/test';
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

// The big code is a 1.22:1 decoration: AT reads it once, inside the heading (#151).
export const BigCodeIsDecorative: Story = {
  tags: ['!dev', '!autodocs'],
  args: { code: 404, title: 'Page not found' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('p[aria-hidden="true"]')).toHaveTextContent('404');
    await expect(canvas.getByRole('heading', { name: '404: Page not found' })).toBeInTheDocument();
  },
};
