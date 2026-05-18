import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageGrid } from './ImageGrid';

const meta = {
  title: 'Data/Image Grid',
  component: ImageGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ImageGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const PALETTES = [
  ['%236366f1', '%23a855f7'],
  ['%2310b981', '%2306b6d4'],
  ['%23f59e0b', '%23ef4444'],
  ['%23ec4899', '%238b5cf6'],
  ['%2306b6d4', '%233b82f6'],
  ['%2384cc16', '%2310b981'],
  ['%23f97316', '%23ef4444'],
  ['%238b5cf6', '%23ec4899'],
];

const gradient = (i: number) => {
  const [from, to] = PALETTES[i % PALETTES.length];
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
         <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
         <rect width="400" height="400" fill="url(%23g)"/>
         <text x="50%" y="55%" font-family="sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle" opacity="0.85">${i + 1}</text>
       </svg>`,
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
