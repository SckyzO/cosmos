import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AtSign,
  Bell,
  Box,
  Calendar,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { AvatarUploader } from '../forms/AvatarUploader';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import {
  PasswordPolicyChecker,
  defaultPasswordRules,
} from '../forms/PasswordPolicyChecker';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageBreadcrumb } from '../templates/PageBreadcrumb';
import { PageHeader } from '../templates/PageHeader';
import { SectionCard } from '../templates/SectionCard';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { NotificationsPanel } from '../ui/NotificationsPanel';
import { StatefulSaveButton, type SaveState } from '../ui/StatefulSaveButton';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserMenu } from '../ui/UserMenu';

const meta = {
  title: 'Pages/Profile',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
       <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%236366f1"/><stop offset="1" stop-color="%23a855f7"/></linearGradient></defs>
       <rect width="128" height="128" fill="url(%23g)"/>
       <text x="50%" y="58%" font-family="sans-serif" font-size="56" fill="white" text-anchor="middle">JD</text>
     </svg>`,
  );

const SAMPLE_ALERTS = [
  {
    id: '1',
    severity: 'crit' as const,
    title: 'rack-a07-srv03',
    subtitle: 'Rack A07 · Datacenter Paris',
  },
  {
    id: '2',
    severity: 'warn' as const,
    title: 'rack-c02-srv05',
    subtitle: 'Rack C02 · Datacenter London',
  },
  {
    id: '3',
    severity: 'info' as const,
    title: 'rack-a01-srv02',
    subtitle: 'Rack A01 · Datacenter Paris',
  },
];

// ── Inline forms (story-only — real apps wire to their own API) ──────────────

const useFakeSave = () => {
  const [state, setState] = useState<SaveState>('idle');
  const trigger = (after?: () => void) => {
    setState('saving');
    window.setTimeout(() => {
      setState('saved');
      after?.();
      window.setTimeout(() => setState('idle'), 2000);
    }, 1200);
  };
  return [state, setState, trigger] as const;
};

const ChangeUsernameForm = () => {
  const [username, setUsername] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [state, , trigger] = useFakeSave();
  const dirty = username.length > 0 && confirmPwd.length >= 6;
  const visualState: SaveState = state !== 'idle' ? state : dirty ? 'dirty' : 'idle';
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dirty) return;
        trigger(() => {
          setUsername('');
          setConfirmPwd('');
        });
      }}
    >
      <Input
        label="New username"
        placeholder="john.doe"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <PasswordInput
        label="Current password"
        helpText="We confirm it's really you before applying changes."
        value={confirmPwd}
        onChange={(e) => setConfirmPwd(e.target.value)}
      />
      <div className="flex justify-end">
        <StatefulSaveButton state={visualState} onClick={() => dirty && trigger()} />
      </div>
    </form>
  );
};

const ChangePasswordForm = () => {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, , trigger] = useFakeSave();
  const rules = useMemo(() => defaultPasswordRules(newPwd), [newPwd]);
  const allOk = rules.every((r) => r.ok);
  const matches = newPwd.length > 0 && newPwd === confirm;
  const dirty = current.length >= 6 && allOk && matches;
  const visualState: SaveState = state !== 'idle' ? state : dirty ? 'dirty' : 'idle';
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dirty) return;
        trigger(() => {
          setCurrent('');
          setNewPwd('');
          setConfirm('');
        });
      }}
    >
      <PasswordInput
        label="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirm && !matches ? 'Passwords do not match.' : undefined}
        />
      </div>
      {newPwd && <PasswordPolicyChecker rules={rules} />}
      <div className="flex justify-end">
        <StatefulSaveButton state={visualState} onClick={() => dirty && trigger()} />
      </div>
    </form>
  );
};

const ClearCacheSection = () => {
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            API response cache (
            <code className="font-mono text-xs">cosmos.cache.*</code>)
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
            Auth token, theme and dashboard layouts are preserved.
          </p>
        </div>
        <Button
          variant={cleared ? 'secondary' : 'danger'}
          icon={Trash2}
          onClick={() => setOpen(true)}
        >
          {cleared ? 'Cleared' : 'Clear cache'}
        </Button>
      </div>
      <ConfirmationModal
        open={open}
        title="Clear local cache?"
        message="API responses will be re-fetched on the next page load. Auth, theme and layout preferences are preserved."
        discardLabel="Clear cache"
        hideSave
        onStay={() => setOpen(false)}
        onDiscard={() => {
          setOpen(false);
          setCleared(true);
          window.setTimeout(() => setCleared(false), 3000);
        }}
      />
    </>
  );
};

// ── Profile content ──────────────────────────────────────────────────────────

const ProfileContent = ({ withAuthBanner = false }: { withAuthBanner?: boolean }) => {
  const [avatar, setAvatar] = useState<string | null>(SAMPLE_AVATAR);
  return (
    <div className="mx-auto w-full max-w-[760px] space-y-6 p-6">
      <PageHeader
        title="Profile"
        breadcrumb={
          <PageBreadcrumb
            items={[{ label: 'Home', href: '#' }, { label: 'Profile' }]}
          />
        }
      />
      <div className="space-y-4">
        <SectionCard
          title="Account"
          desc="Your display name and profile picture."
          icon={User}
          iconTone="blue"
        >
          <div className="space-y-4">
            <AvatarUploader
              src={avatar}
              name="John Doe"
              onUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => setAvatar(reader.result as string);
                reader.readAsDataURL(file);
              }}
              onRemove={() => setAvatar(null)}
            />
            {withAuthBanner && (
              <AlertBanner variant="info">
                Authentication is disabled — credential changes are saved but
                not enforced. Enable auth in <strong>Settings → Security</strong>{' '}
                to protect the UI with a password.
              </AlertBanner>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Change Username"
          desc="Update the display name shown in the header and audit logs."
          icon={AtSign}
          iconTone="violet"
        >
          <ChangeUsernameForm />
        </SectionCard>

        <SectionCard
          title="Change Password"
          desc="Update your account password."
          icon={KeyRound}
          iconTone="green"
        >
          <ChangePasswordForm />
        </SectionCard>

        <SectionCard
          title="Local Storage"
          desc="Clear cached data stored in your browser."
          icon={Trash2}
          iconTone="amber"
        >
          <ClearCacheSection />
        </SectionCard>
      </div>
    </div>
  );
};

// ── Shell wrapper (Topbar + Sidebar) ─────────────────────────────────────────

const ProfileShell = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  return (
    <Shell
      topbar={
        <Topbar
          pageTitle="Profile"
          rightActions={
            <>
              <ThemeToggle
                isDark={isDark}
                onToggle={() => {
                  setIsDark((d) => !d);
                  document.documentElement.classList.toggle('dark');
                }}
              />
              <NotificationsPanel>
                <NotificationsPanel.Trigger count={SAMPLE_ALERTS.length} />
                <NotificationsPanel.Content>
                  <NotificationsPanel.Header title="Active Alerts">
                    <NotificationsPanel.Counters
                      crit={SAMPLE_ALERTS.filter((a) => a.severity === 'crit').length}
                      warn={SAMPLE_ALERTS.filter((a) => a.severity === 'warn').length}
                      info={SAMPLE_ALERTS.filter((a) => a.severity === 'info').length}
                    />
                  </NotificationsPanel.Header>
                  <NotificationsPanel.List>
                    {SAMPLE_ALERTS.map((a) => (
                      <NotificationsPanel.Item
                        key={a.id}
                        severity={a.severity}
                        title={a.title}
                        subtitle={a.subtitle}
                      />
                    ))}
                  </NotificationsPanel.List>
                  <NotificationsPanel.Footer>View all alerts →</NotificationsPanel.Footer>
                </NotificationsPanel.Content>
              </NotificationsPanel>
              <UserMenu>
                <UserMenu.Trigger name="John Doe" avatarSrc={SAMPLE_AVATAR} />
                <UserMenu.Content>
                  <UserMenu.Header
                    name="John Doe"
                    email="john@example.com"
                    avatarSrc={SAMPLE_AVATAR}
                  />
                  <UserMenu.Items>
                    <UserMenu.Item icon={User}>Profile</UserMenu.Item>
                    <UserMenu.Item icon={Settings}>Settings</UserMenu.Item>
                    <UserMenu.Item icon={CreditCard}>Billing</UserMenu.Item>
                    <UserMenu.Separator />
                    <UserMenu.Item icon={LogOut} variant="danger">
                      Sign Out
                    </UserMenu.Item>
                  </UserMenu.Items>
                </UserMenu.Content>
              </UserMenu>
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <Sidebar.Brand
            logo={<Box className="h-5 w-5" />}
            title="Cosmos"
            subtitle="Design system"
          />
          <div className="py-3">
            <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
            <Sidebar.Item icon={Calendar} label="Calendar" />
            <Sidebar.Section label="Account">
              <Sidebar.Item icon={User} label="Profile" active />
              <Sidebar.Item icon={Users} label="Team" />
              <Sidebar.Item icon={Bell} label="Notifications" />
              <Sidebar.Item icon={Settings} label="Settings" />
            </Sidebar.Section>
          </div>
        </Sidebar>
      }
    >
      {children}
    </Shell>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <ProfileShell>
      <ProfileContent />
    </ProfileShell>
  ),
};

export const WithAuthDisabledBanner: Story = {
  render: () => (
    <ProfileShell>
      <ProfileContent withAuthBanner />
    </ProfileShell>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-base)]">
      <ProfileContent />
    </div>
  ),
};
