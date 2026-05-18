import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Bell, Briefcase, Search, User } from 'lucide-react';
import { Shell } from '../layout/Shell';
import { Navbar } from '../navigation/Navbar';
import { Topbar } from '../layout/Topbar';
import { Sidebar } from '../layout/Sidebar';
import { Tabs } from '../ui/Tabs';
import { ContentNarrow } from '../templates/ContentNarrow';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { Textarea } from '../forms/Textarea';
import { AvatarUploader } from '../forms/AvatarUploader';
import { FormFooter } from '../forms/FormFooter';
import { Accordion } from '../ui/Accordion';
import { Button } from '../ui/Button';

// TUI Plus "Page Examples / Settings Screens" — typical user settings page
// with a horizontal sub-nav (Account / Notifications / Billing / Teams /
// Integrations) and a 2-column "labels + form" layout per section.
//
// Built entirely from existing Cosmos primitives — no new component needed.

const meta = {
  title: 'Pages/Settings Screen',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TABS = [
  { value: 'account', label: 'Account' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'billing', label: 'Billing' },
  { value: 'teams', label: 'Teams' },
  { value: 'integrations', label: 'Integrations' },
];

const SettingsForm = () => {
  const [avatar, setAvatar] = useState<string | null>(
    'https://i.pravatar.cc/192?u=cosmos-settings-demo',
  );
  return (
    <div className="space-y-10">
      <SettingsSection
        title="Personal Information"
        description="Use a permanent address where you can receive mail."
      >
        <div className="mb-6">
          <AvatarUploader
            src={avatar ?? undefined}
            name="Jane Smith"
            onUpload={(f) => setAvatar(URL.createObjectURL(f))}
            onRemove={() => setAvatar(null)}
            helperText="JPG, GIF or PNG. 1MB max."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" />
          <Input label="Last name" />
        </div>
        <Input label="Email address" type="email" className="mt-4" />
        <Input label="Username" prefix="example.com/" placeholder="janesmith" className="mt-4" />
        <Select
          label="Timezone"
          className="mt-4"
          options={[
            { value: 'pst', label: 'Pacific Standard Time' },
            { value: 'cst', label: 'Central Standard Time' },
            { value: 'est', label: 'Eastern Standard Time' },
          ]}
          defaultValue="pst"
        />
      </SettingsSection>

      <SettingsSection
        title="About"
        description="Write a few sentences about yourself — visible on your profile."
      >
        <Textarea label="Bio" rows={4} />
      </SettingsSection>

      <SettingsSection
        title="Frequently asked"
        description="Quick answers for common questions about the settings on this page."
      >
        <Accordion type="single" collapsible defaultValue="reset">
          <Accordion.Item value="reset">
            <Accordion.Trigger>How do I reset my profile to defaults?</Accordion.Trigger>
            <Accordion.Content>
              Open the user menu in the top-right corner, then choose
              <em> Reset profile</em>. Your avatar and bio are cleared; account
              identifiers stay untouched.
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="visibility">
            <Accordion.Trigger>Who can see my bio?</Accordion.Trigger>
            <Accordion.Content>
              Anyone you have shared a workspace with. Bios are never indexed
              outside the platform.
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="email">
            <Accordion.Trigger>Can I change my email after signup?</Accordion.Trigger>
            <Accordion.Content>
              Yes. Update it above and confirm via the link sent to the new
              address — the previous one stays valid until you confirm.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </SettingsSection>

      <FormFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Save</Button>
      </FormFooter>
    </div>
  );
};

const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
    <div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
    <div className="md:col-span-2">{children}</div>
  </div>
);

const BellBtn = () => (
  <button
    type="button"
    aria-label="Notifications"
    className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
  >
    <Bell className="size-5" aria-hidden />
  </button>
);

// TUI Plus "Sidebar" — full settings with a left sidebar + sub-tab nav + form.
export const Sidebar_: Story = {
  name: 'Sidebar',
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Shell
        topbar={
          <Topbar
            sidebarCollapsed={false}
            onToggleSidebar={() => {}}
            center={
              <div className="relative max-w-md">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] py-1.5 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
            }
            rightActions={
              <>
                <BellBtn />
                <img
                  alt=""
                  src="https://i.pravatar.cc/64?u=cosmos-settings-sidebar"
                  className="size-8 rounded-full"
                />
              </>
            }
          />
        }
        sidebar={
          <Sidebar>
            <Sidebar.Brand title="Cosmos" />
            <Sidebar.Section>
              <Sidebar.Item icon={User} label="Profile" active />
              <Sidebar.Item icon={Briefcase} label="Workspaces" />
              <Sidebar.Item icon={Bell} label="Notifications" />
            </Sidebar.Section>
          </Sidebar>
        }
      >
        <div className="bg-[var(--color-bg-base)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)]">
            <ContentNarrow maxWidth={896} className="py-3">
              <Tabs value={tab} onChange={setTab}>
                <Tabs.List>
                  {TABS.map((t) => (
                    <Tabs.Trigger key={t.value} value={t.value}>
                      {t.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs>
            </ContentNarrow>
          </div>
          <ContentNarrow maxWidth={896} className="py-10">
            <SettingsForm />
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};

// TUI Plus "Stacked" — top navbar (no left sidebar) + sub-tab nav + form.
export const Stacked: Story = {
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Shell
        topbar={
          (
            <Navbar theme="dark">
              <Navbar.Brand>
                <Navbar.MobileMenuButton theme="dark" />
                <span className="ml-2 text-lg font-semibold text-white">Cosmos</span>
                <Navbar.Items>
                  <Navbar.Item theme="dark" href="#">Dashboard</Navbar.Item>
                  <Navbar.Item theme="dark" active href="#">Settings</Navbar.Item>
                </Navbar.Items>
              </Navbar.Brand>
              <Navbar.Actions>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="rounded-full p-1 text-gray-400 hover:text-white"
                >
                  <Bell className="size-5" aria-hidden />
                </button>
                <img
                  alt=""
                  src="https://i.pravatar.cc/64?u=cosmos-settings-stacked"
                  className="size-8 rounded-full"
                />
              </Navbar.Actions>
            </Navbar>
          ) as never
        }
      >
        <div className="bg-[var(--color-bg-base)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)]">
            <ContentNarrow maxWidth={896} className="py-3">
              <Tabs value={tab} onChange={setTab}>
                <Tabs.List>
                  {TABS.map((t) => (
                    <Tabs.Trigger key={t.value} value={t.value}>
                      {t.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs>
            </ContentNarrow>
          </div>
          <ContentNarrow maxWidth={896} className="py-10">
            <SettingsForm />
          </ContentNarrow>
        </div>
      </Shell>
    );
  },
};
