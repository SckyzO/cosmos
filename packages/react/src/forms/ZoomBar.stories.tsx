import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { ZoomBar } from './ZoomBar';

const meta = {
  title: 'Forms/Zoom Bar',
  component: ZoomBar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { zoom: 1, onZoomIn: () => {}, onZoomOut: () => {} },
} satisfies Meta<typeof ZoomBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { zoom: 1, onZoomIn: () => {}, onZoomOut: () => {} },
};

export const WithFitAndReset: Story = {
  args: { zoom: 0.85, onZoomIn: () => {}, onZoomOut: () => {}, onFit: () => {}, onReset: () => {} },
};

export const Controlled: Story = {
  render: () => {
    const [zoom, setZoom] = useState(1);
    return (
      <ZoomBar
        zoom={zoom}
        onZoomOut={() => setZoom((z) => Math.max(0.15, Math.round((z - 0.1) * 10) / 10))}
        onZoomIn={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
        onFit={() => setZoom(1.0)}
        onReset={() => setZoom(1.0)}
      />
    );
  },
};

export const ZoomInFiresHandler: Story = {
  args: { zoom: 1, onZoomIn: fn(), onZoomOut: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByTitle('Zoom in'));
    await expect(args.onZoomIn).toHaveBeenCalled();
  },
};

export const ZoomOutFiresHandler: Story = {
  args: { zoom: 1, onZoomIn: fn(), onZoomOut: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByTitle('Zoom out'));
    await expect(args.onZoomOut).toHaveBeenCalled();
  },
};
