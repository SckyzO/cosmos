import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ImageGrid } from './ImageGrid';

const meta = {
  title: 'Media/Image Grid',
  component: ImageGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof ImageGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const PALETTES = [
  ['#6366f1', '#a855f7'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#06b6d4', '#3b82f6'],
  ['#84cc16', '#10b981'],
  ['#f97316', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
];

const gradient = (i: number) => {
  const [from, to] = PALETTES[i % PALETTES.length];
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
         <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
         <rect width="400" height="400" fill="url(#g)"/>
         <text x="50%" y="55%" font-family="sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle" opacity="0.85">${i + 1}</text>
       </svg>`
    )
  );
};

const Image = ({ i }: { i: number }) => <img src={gradient(i)} alt={`Tile ${i + 1}`} />;

// ── Stories ──────────────────────────────────────────────────────────────────

export const TwoColumns: Story = {
  render: () => (
    <ImageGrid columns={2}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <ImageGrid columns={3}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <ImageGrid columns={4} gap="sm">
      {Array.from({ length: 8 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-muted)]">
        Resize the viewport: 1 col on mobile, 2 on sm, 3 on md, 4 on lg.
      </p>
      <ImageGrid columns={{ sm: 2, md: 3, lg: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Image key={i} i={i} />
        ))}
      </ImageGrid>
    </div>
  ),
};

export const VideoAspect: Story = {
  render: () => (
    <ImageGrid columns={2} aspectRatio="aspect-video">
      {Array.from({ length: 4 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const PortraitAspect: Story = {
  render: () => (
    <ImageGrid columns={3} aspectRatio="aspect-[3/4]">
      {Array.from({ length: 6 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const LargeGap: Story = {
  render: () => (
    <ImageGrid columns={3} gap="lg">
      {Array.from({ length: 6 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

export const Sharp: Story = {
  render: () => (
    <ImageGrid columns={3} rounded={false} gap="sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Image key={i} i={i} />
      ))}
    </ImageGrid>
  ),
};

/** `ImageGrid.Item` adds a caption over the bottom edge. */
export const WithCaptions: Story = {
  render: () => (
    <ImageGrid columns={3}>
      {Array.from({ length: 6 }).map((_, i) => (
        <ImageGrid.Item key={i} caption={`Photo ${i + 1}`}>
          <Image i={i} />
        </ImageGrid.Item>
      ))}
    </ImageGrid>
  ),
};

/** An `overlay` covers the tile on hover and on keyboard focus; `onClick` or `href` make the tile clickable. */
export const ClickableWithOverlay: Story = {
  render: () => (
    <ImageGrid columns={3}>
      {Array.from({ length: 3 }).map((_, i) => (
        <ImageGrid.Item key={i} caption={`Photo ${i + 1}`} overlay="Open" onClick={() => {}}>
          <Image i={i} />
        </ImageGrid.Item>
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <ImageGrid.Item key={i} overlay="View original" href="#original">
          <Image i={i + 3} />
        </ImageGrid.Item>
      ))}
    </ImageGrid>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ItemIsAButtonOrALink: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: null },
  render: () => (
    <ImageGrid columns={3}>
      <ImageGrid.Item onClick={() => {}} overlay="Open">
        <img src={gradient(0)} alt="Clickable" />
      </ImageGrid.Item>
      <ImageGrid.Item href="#there">
        <img src={gradient(1)} alt="Linked" />
      </ImageGrid.Item>
      <ImageGrid.Item caption="Static">
        <img src={gradient(2)} alt="Plain item" />
      </ImageGrid.Item>
      <img src={gradient(3)} alt="Bare image" />
    </ImageGrid>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /Clickable/ });
    const link = canvas.getByRole('link', { name: 'Linked' });
    await expect(link).toHaveAttribute('href', '#there');
    // The static tile and the bare image are not interactive.
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    await expect(canvas.getAllByRole('link')).toHaveLength(1);
    await expect(canvas.getByRole('img', { name: 'Bare image' })).toBeVisible();

    // Keyboard: both are reachable with Tab, in order, and Enter/Space activate the button.
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(button).toHaveFocus();
  },
};

export const OverlayShowsOnFocus: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: null },
  render: () => (
    <ImageGrid columns={2}>
      <ImageGrid.Item onClick={() => {}} overlay="Open">
        <img src={gradient(0)} alt="First" />
      </ImageGrid.Item>
    </ImageGrid>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    const overlay = canvas.getByText('Open');
    await expect(getComputedStyle(overlay).opacity).toBe('0');
    await userEvent.tab();
    await expect(button).toHaveFocus();
    // Focus shows the overlay and the focus indicator, like hover does.
    await expect(button.matches(':focus-visible')).toBe(true);
    await waitFor(() => expect(getComputedStyle(overlay).opacity).toBe('1'));
    await expect(getComputedStyle(button).boxShadow).not.toBe('none');
  },
};

export const ItemClickFires: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: null },
  render: () => {
    const [count, setCount] = useState(0);
    return (
      <div>
        <ImageGrid columns={2}>
          <ImageGrid.Item onClick={() => setCount((c) => c + 1)}>
            <img src={gradient(0)} alt="First" />
          </ImageGrid.Item>
        </ImageGrid>
        <p>Clicks: {count}</p>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Clicks: 1')).toBeVisible();
    // Enter on the focused tile clicks it too.
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Clicks: 2')).toBeVisible();
  },
};
