import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Home } from 'lucide-react';
import { expect } from 'storybook/test';
import { expectGraphicContrast, inEachTheme } from '../storybook-helpers';
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

// The big code is a decoration: AT reads it once, inside the heading (#151). CSS draws it from
// `data-code`, so it is no text node for axe's contrast check.
export const BigCodeIsDecorative: Story = {
  tags: ['!dev', '!autodocs'],
  args: { code: 404, title: 'Page not found' },
  play: async ({ canvas, canvasElement }) => {
    const watermark = canvasElement.querySelector('p[aria-hidden="true"]');
    await expect(watermark).toHaveAttribute('data-code', '404');
    await expect(watermark).toBeEmptyDOMElement();
    await expect(getComputedStyle(watermark!, '::before').content).toBe('"404"');
    await expect(canvas.getByRole('heading', { name: '404: Page not found' })).toBeInTheDocument();
  },
};

// The numeral is decoration, but it must read on every theme (#303). It is drawn by a
// pseudo-element, so axe cannot check it; the ::before inherits the paragraph's computed colour.
export const BigCodeReachesThreeToOne: Story = {
  tags: ['!dev', '!autodocs'],
  args: { code: 404, title: 'Page not found' },
  play: async ({ canvasElement }) => {
    const watermark = canvasElement.querySelector('p[aria-hidden="true"]')!;
    inEachTheme(() => expectGraphicContrast(watermark, 'color', 3));
  },
};
