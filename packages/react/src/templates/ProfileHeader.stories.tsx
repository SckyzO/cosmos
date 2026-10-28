import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar, Mail, MapPin } from 'lucide-react';
import { expect, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectBeyondEnd,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
} from '../storybook-helpers';
import { placeholderAvatar, placeholderCover } from '../storybook-avatars';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { PageHeader } from './PageHeader';
import { ProfileHeader } from './ProfileHeader';

const meta = {
  title: 'Layout/Profile Header',
  component: ProfileHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    name: 'Ana Ruiz',
    as: 'h1',
    avatar: { name: 'Ana Ruiz' },
    headline: 'Product designer, design systems at Northwind',
    badges: (
      <>
        <Badge intent="brand">Admin</Badge>
        <Badge intent="success">Verified</Badge>
      </>
    ),
    meta: (
      <>
        <PageHeader.MetaItem icon={MapPin}>Lisbon</PageHeader.MetaItem>
        <PageHeader.MetaItem icon={Calendar}>Joined March 2023</PageHeader.MetaItem>
        <PageHeader.MetaItem icon={Mail}>ana@northwind.example</PageHeader.MetaItem>
      </>
    ),
    actions: (
      <>
        <Button variant="secondary">Message</Button>
        <Button>Follow</Button>
      </>
    ),
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATS = [
  { label: 'Followers', value: '1,204' },
  { label: 'Following', value: '312' },
  { label: 'Projects', value: '28' },
];

const ProfileTabs = () => {
  const [tab, setTab] = useState('overview');
  return (
    <Tabs value={tab} onChange={setTab}>
      <Tabs.List aria-label="Profile">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="projects">Projects</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
};

/** The default cover: a gradient of the accent's tints, decorative. */
export const Default: Story = {};

export const WithCoverImage: Story = {
  args: {
    cover: placeholderCover('Ana Ruiz cover', 1600, 400),
    avatar: { name: 'Ana Ruiz', src: placeholderAvatar('Ana Ruiz', 192) },
  },
  play: async ({ canvasElement }) => {
    // Only the avatar overlaps the cover: the name sits on the panel, where its contrast holds.
    const cover = canvasElement.querySelector('img[aria-hidden="true"]')!;
    const heading = within(canvasElement).getByRole('heading', { name: 'Ana Ruiz' });
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      cover.getBoundingClientRect().bottom
    );
  },
};

export const WithStatsAndTabs: Story = {
  args: { stats: STATS, tabs: <ProfileTabs /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The counters are terms and values, read as pairs.
    const list = canvasElement.querySelector('dl')!;
    expect(list.querySelectorAll('dt')).toHaveLength(3);
    expect(canvas.getByText('Followers').tagName).toBe('DT');
    expect(canvas.getByText('Followers').nextElementSibling?.textContent).toBe('1,204');
    expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  },
};

export const LongName: Story = {
  args: {
    name: 'Maximiliano Bartholomew Fitzgerald-Wolfeschlegelsteinhausenbergerdorff the Third',
    headline:
      'Principal staff engineer for distributed systems, observability and everything in between',
    stats: STATS,
    tabs: <ProfileTabs />,
  },
};

export const WithoutOptionalParts: Story = {
  args: {
    headline: undefined,
    badges: undefined,
    meta: undefined,
    actions: undefined,
  },
};

export const Mobile: Story = {
  args: { stats: STATS, tabs: <ProfileTabs /> },
  parameters: { layout: 'fullscreen' },
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
    const canvas = within(canvasElement);
    // The actions share the width below `sm`.
    const group = canvas.getByRole('button', { name: 'Follow' }).parentElement!;
    const text = canvas.getByRole('heading', { name: /Ana Ruiz/ }).parentElement!.parentElement!;
    expect(group.offsetWidth).toBe(text.offsetWidth);
    // The avatar is 80px, `2xl`.
    expect(canvas.getAllByRole('img', { name: 'Ana Ruiz' })[0]!.offsetWidth).toBe(80);
  },
};

export const MobileLongName: Story = {
  args: { ...LongName.args },
  parameters: { layout: 'fullscreen' },
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => expectNoHorizontalOverflow(canvasElement),
};

export const HeadingLevel: Story = {
  args: { as: 'h2' },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headings = canvas.getAllByRole('heading');
    expect(headings).toHaveLength(1);
    expect(headings[0]!.tagName).toBe('H2');
    expect(headings[0]).toHaveTextContent('Ana Ruiz');
  },
};

export const AvatarFallsBackToInitials: Story = {
  args: { avatar: { name: 'Ana Ruiz', src: 'data:image/png;base64,broken' } },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const avatar = within(canvasElement).getAllByRole('img', { name: 'Ana Ruiz' })[0]!;
    await waitFor(() => expect(avatar).toHaveTextContent('AR'));
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The avatar leads at the start edge, the actions end at the end edge, and the name is an island. */
export const FollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: (args) => bothDirections(() => <ProfileHeader {...args} />),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('[class*="ring-4"]'));
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const follow = within(box).getByRole('button', { name: 'Follow' });
      expect(endOffset(follow, box), `${dir}: actions at the end`).toBeLessThanOrEqual(25);
      expectBeyondEnd(follow, within(box).getByRole('heading', { name: 'Ana Ruiz' }));
      expect(getComputedStyle(within(box).getByText('Ana Ruiz')).unicodeBidi).toBe('isolate');
    }
  },
};
