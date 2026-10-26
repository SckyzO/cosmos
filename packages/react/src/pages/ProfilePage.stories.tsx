import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar, Mail, MapPin } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../templates/PageHeader';
import { ProfileHeader } from '../templates/ProfileHeader';
import { SectionCard } from '../templates/SectionCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { placeholderAvatar, placeholderCover } from '../storybook-avatars';

// A profile page: ProfileHeader with its tab strip, and the content of the active tab below.
// The header only lays the tabs out; the page owns the panels.

const meta = {
  title: 'Pages/Examples/Profile Overview',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ProfilePage = () => {
  const [tab, setTab] = useState('overview');
  return (
    <PageContainer>
      <Tabs value={tab} onChange={setTab}>
        <ProfileHeader
          as="h1"
          cover={placeholderCover('Ana Ruiz cover', 1600, 400)}
          avatar={{ name: 'Ana Ruiz', src: placeholderAvatar('Ana Ruiz', 192) }}
          name="Ana Ruiz"
          headline="Product designer, design systems at Northwind"
          badges={
            <>
              <Badge intent="brand">Admin</Badge>
              <Badge intent="success">Verified</Badge>
            </>
          }
          meta={
            <>
              <PageHeader.MetaItem icon={MapPin}>Lisbon</PageHeader.MetaItem>
              <PageHeader.MetaItem icon={Calendar}>Joined March 2023</PageHeader.MetaItem>
              <PageHeader.MetaItem icon={Mail}>ana@northwind.example</PageHeader.MetaItem>
            </>
          }
          actions={
            <>
              <Button variant="secondary">Message</Button>
              <Button>Follow</Button>
            </>
          }
          stats={[
            { label: 'Followers', value: '1,204' },
            { label: 'Following', value: '312' },
            { label: 'Projects', value: '28' },
          ]}
          tabs={
            <Tabs.List aria-label="Profile">
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="projects">Projects</Tabs.Trigger>
              <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
            </Tabs.List>
          }
        />
        <div className="mt-6">
          <Tabs.Panel value="overview">
            <SectionCard as="h2" title="About">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Designs and maintains the component library used by twelve product teams.
              </p>
            </SectionCard>
          </Tabs.Panel>
          <Tabs.Panel value="projects">
            <SectionCard as="h2" title="Projects">
              <p className="text-sm text-[var(--color-text-secondary)]">28 projects.</p>
            </SectionCard>
          </Tabs.Panel>
          <Tabs.Panel value="activity">
            <SectionCard as="h2" title="Activity">
              <p className="text-sm text-[var(--color-text-secondary)]">Nothing new this week.</p>
            </SectionCard>
          </Tabs.Panel>
        </div>
      </Tabs>
    </PageContainer>
  );
};

export const Overview: Story = {
  render: () => <ProfilePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('heading', { level: 1, name: 'Ana Ruiz' })).toBeInTheDocument();
    expect(canvas.getByText('Designs and maintains', { exact: false })).toBeInTheDocument();
  },
};

/** The tabs switch the page's panel. */
export const TabsSwitchThePanel: Story = {
  ...Overview,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Projects' }));
    expect(canvas.getByText('28 projects.')).toBeInTheDocument();
  },
};
