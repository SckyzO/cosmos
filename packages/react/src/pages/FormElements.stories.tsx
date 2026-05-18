import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Box,
  Calendar as CalendarIcon,
  Check,
  CheckSquare,
  Clock,
  FileText,
  Globe,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  Radio as RadioIcon,
  Settings,
  Type,
  Upload,
  User,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ActionPanel } from '../forms/ActionPanel';
import { AvatarUploader } from '../forms/AvatarUploader';
import { Calendar } from '../forms/Calendar';
import { Checkbox, CheckboxGroup } from '../forms/Checkbox';
import { Combobox } from '../forms/Combobox';
import { DatePicker } from '../forms/DatePicker';
import { Dropzone } from '../forms/Dropzone';
import { FileInput } from '../forms/FileInput';
import { FilterPills } from '../forms/FilterPills';
import { FormFooter } from '../forms/FormFooter';
import { Input } from '../forms/Input';
import { NumberInput } from '../forms/NumberInput';
import { OtpInput } from '../forms/OtpInput';
import { PasswordInput } from '../forms/PasswordInput';
import { PasswordPolicyChecker } from '../forms/PasswordPolicyChecker';
import { Radio, RadioGroup } from '../forms/Radio';
import { SearchInput } from '../forms/SearchInput';
import { SegmentedControl } from '../forms/SegmentedControl';
import { Select } from '../forms/Select';
import { StepperInput } from '../forms/StepperInput';
import { Textarea } from '../forms/Textarea';
import { TimePicker } from '../forms/TimePicker';
import { Toggle } from '../forms/Toggle';
import { ZoomBar } from '../forms/ZoomBar';
import { placeholderAvatar } from '../storybook-avatars';
import { MiniCalendar } from '../data/MiniCalendar';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageBreadcrumb } from '../templates/PageBreadcrumb';
import { PageHeader } from '../templates/PageHeader';
import { SectionCard } from '../templates/SectionCard';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

const meta = {
  title: 'Pages/Form Elements',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Form content (reusable inside or outside Shell) ──────────────────────────

const FormContent = () => {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      className="mx-auto w-full max-w-[860px] space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        window.setTimeout(() => setSubmitting(false), 1200);
      }}
    >
      <PageHeader
        title="Form Elements"
        breadcrumb={
          <PageBreadcrumb
            items={[{ label: 'Home', href: '#' }, { label: 'Form Elements' }]}
          />
        }
      />

      <SectionCard
        title="Default Inputs"
        desc="Standard text inputs, select and textarea — the everyday building blocks."
        icon={Type}
        iconTone="blue"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" placeholder="John" autoComplete="given-name" />
          <Input label="Last name" placeholder="Doe" autoComplete="family-name" />
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="john@example.com"
            autoComplete="email"
          />
          <Select
            label="Country"
            defaultValue=""
            options={[
              { value: '', label: 'Select a country…' },
              { value: 'fr', label: 'France' },
              { value: 'us', label: 'United States' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'de', label: 'Germany' },
            ]}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Bio"
              placeholder="Tell us a bit about yourself…"
              maxLength={280}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Input States"
        desc="Visual feedback for invalid, helper-text and locked fields."
        icon={CheckSquare}
        iconTone="violet"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Endpoint URL"
            placeholder="https://prom.example.com"
            description="HTTPS required for production."
          />
          <Input
            label="Project key"
            placeholder="ACME-2026"
            error="This key is already taken."
          />
          <Input
            label="API token"
            placeholder="Generated automatically"
            disabled
            defaultValue="sk-••••••••••••••"
          />
          <Input
            label="Slug"
            placeholder="my-project"
            description="Lowercase letters, numbers and hyphens only."
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Input Group"
        desc="Attached prefix / suffix addons sharing a single rounded border."
        icon={Globe}
        iconTone="green"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Website"
            prefix="https://"
            suffix=".com"
            placeholder="example"
          />
          <Input label="S3 bucket" suffix=".s3.amazonaws.com" placeholder="my-bucket" />
          <Input
            label="Monthly budget"
            prefix="€"
            suffix="/ month"
            type="number"
            placeholder="0"
          />
          <Input label="Mention" prefix="@" placeholder="username" />
        </div>
      </SectionCard>

      <SectionCard
        title="Checkbox"
        desc="Single & grouped multi-select."
        icon={ListChecks}
        iconTone="brand"
      >
        <div className="space-y-4">
          <Checkbox label="Subscribe to product updates" defaultChecked />
          <Checkbox
            label="Marketing emails"
            description="Tips, tricks and the occasional newsletter."
          />
          <CheckboxGroup
            legend="Notification channels"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS', description: 'Standard rates apply.' },
              { value: 'push', label: 'Push notifications' },
              { value: 'slack', label: 'Slack', disabled: true },
            ]}
            defaultValue={['email', 'push']}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Radio Buttons"
        desc="Exclusive single-choice selectors."
        icon={RadioIcon}
        iconTone="amber"
      >
        <div className="space-y-4">
          <RadioGroup
            legend="Plan"
            options={[
              { value: 'free', label: 'Free', description: '0 € — 1 user' },
              { value: 'pro', label: 'Pro', description: '29 € / month — 10 users' },
              { value: 'team', label: 'Team', description: '99 € / month — unlimited' },
            ]}
            defaultValue="pro"
          />
          <RadioGroup
            legend="Severity"
            orientation="horizontal"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            defaultValue="medium"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="File Input"
        desc="Two patterns: compact button-style FileInput and a full Dropzone with drag-and-drop."
        icon={Upload}
        iconTone="violet"
      >
        <div className="space-y-4">
          <FileInput
            label="Profile picture"
            accept="image/*"
            description="JPG, PNG or GIF — max 5 MB."
          />
          <Dropzone
            label="Attachments"
            description="Drop one or more files (PDF, DOCX, XLSX, …)."
            multiple
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Date Picker"
        desc="Calendar popover with month/year dropdowns and an optional Today shortcut."
        icon={CalendarIcon}
        iconTone="green"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label="Departure"
            description="Year dropdown is bounded to the next 5 years."
            fromYear={new Date().getFullYear()}
            toYear={new Date().getFullYear() + 5}
          />
          <DatePicker
            label="Birthday"
            description="Year dropdown spans 1950–today."
            fromYear={1950}
            toYear={new Date().getFullYear()}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Time Picker"
        desc="Native time input with optional minute granularity."
        icon={Clock}
        iconTone="red"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TimePicker label="Reminder" defaultValue="09:00" />
          <TimePicker
            label="Meeting slot"
            description="15-minute increments only."
            step={15}
            min="08:00"
            max="18:00"
            defaultValue="14:30"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Specialised inputs"
        desc="Password, OTP, number stepper — focused controls for specific data types."
        icon={Type}
        iconTone="brand"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput label="Password" placeholder="•••••••••" />
          <NumberInputCell />
          <div className="sm:col-span-2">
            <PasswordPolicyChecker
              rules={[
                { label: 'At least 8 characters', ok: true },
                { label: 'One uppercase letter', ok: true },
                { label: 'One number', ok: true },
                { label: 'One special character', ok: false },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
              One-time code
            </p>
            <OtpInputCell />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Search, filter & combo"
        desc="SearchInput, Combobox (autocomplete) and FilterPills for typing-based selection."
        icon={Globe}
        iconTone="violet"
      >
        <div className="space-y-4">
          <SearchInputCell />
          <Combobox
            label="Assigned to"
            options={[
              { value: 'aiden', label: 'Aiden Park' },
              { value: 'mei', label: 'Mei Tanaka' },
              { value: 'olivier', label: 'Olivier Dubois' },
              { value: 'priya', label: 'Priya Singh' },
            ]}
          />
          <FilterPillsCell />
        </div>
      </SectionCard>

      <SectionCard
        title="Toggles, segmented & stepper"
        desc="Binary toggles, segmented selectors, number stepper and a zoom toolbar."
        icon={CheckSquare}
        iconTone="green"
      >
        <div className="space-y-4">
          <ToggleRow />
          <SegmentedControlCell />
          <StepperInputCell />
          <ZoomBarCell />
        </div>
      </SectionCard>

      <SectionCard
        title="Avatar & calendars"
        desc="Picture upload + calendar widgets — DatePicker uses a popover, Calendar is full-size inline, MiniCalendar is a compact data widget."
        icon={CalendarIcon}
        iconTone="blue"
      >
        <div className="space-y-6">
          <AvatarUploaderInline />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                Full Calendar
              </p>
              <Calendar />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                MiniCalendar (data display)
              </p>
              <MiniCalendarCell />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="ActionPanel"
        desc="Card-shaped form section with title, description and a single trailing action."
        icon={CheckSquare}
        iconTone="amber"
      >
        <ActionPanel
          title="Manage subscription"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          action={<Button size="sm">Change plan</Button>}
        />
      </SectionCard>

      <FormFooter
        align="between"
        extra="All fields are demo-only — nothing is persisted."
        onCancel={() => undefined}
        submitting={submitting}
        submitLabel="Save form"
      />
    </form>
  );
};

const ToggleRow = () => {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Toggle
        checked={a}
        onChange={setA}
        label="Email notifications"
        description="Daily summary at 9am."
      />
      <Toggle
        checked={b}
        onChange={setB}
        label="Marketing updates"
        description="Occasional product news."
      />
    </div>
  );
};

const AvatarUploaderInline = () => {
  const [src, setSrc] = useState<string | undefined>(
    placeholderAvatar('form-elements-avatar', 192),
  );
  return (
    <AvatarUploader
      src={src}
      name="Jane Smith"
      onUpload={(f) => setSrc(URL.createObjectURL(f))}
      onRemove={() => setSrc(undefined)}
      helperText="JPG, GIF or PNG. 1MB max."
    />
  );
};

const NumberInputCell = () => {
  const [n, setN] = useState(1);
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">Quantity</p>
      <NumberInput value={n} onChange={setN} min={0} max={99} />
    </div>
  );
};

const OtpInputCell = () => {
  const [code, setCode] = useState('');
  return <OtpInput length={6} value={code} onChange={setCode} />;
};

const SearchInputCell = () => {
  const [q, setQ] = useState('');
  return <SearchInput value={q} onChange={setQ} placeholder="Search hosts, alerts, dashboards…" />;
};

const FilterPillsCell = () => {
  const [tone, setTone] = useState<'crit' | 'warn' | 'ok' | 'info'>('crit');
  return (
    <FilterPills
      value={tone}
      onChange={setTone}
      options={[
        { value: 'crit', label: 'CRIT' },
        { value: 'warn', label: 'WARN' },
        { value: 'ok', label: 'OK' },
        { value: 'info', label: 'INFO' },
      ]}
    />
  );
};

const SegmentedControlCell = () => {
  const [v, setV] = useState<'5' | '15' | '60' | '300'>('15');
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
        Refresh interval
      </p>
      <SegmentedControl
        value={v}
        onChange={setV}
        options={[
          { value: '5', label: '5s' },
          { value: '15', label: '15s' },
          { value: '60', label: '1m' },
          { value: '300', label: '5m' },
        ]}
      />
    </div>
  );
};

const StepperInputCell = () => {
  const [n, setN] = useState(3);
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
        Replicas
      </p>
      <StepperInput value={n} onChange={setN} min={1} max={20} unit="replicas" />
    </div>
  );
};

const MiniCalendarCell = () => {
  const [d, setD] = useState(new Date());
  return <MiniCalendar selected={d} onSelect={setD} />;
};

const ZoomBarCell = () => {
  const [z, setZ] = useState(100);
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
        Zoom toolbar (current: {z}%)
      </p>
      <ZoomBar
        zoom={z}
        onZoomIn={() => setZ((v) => Math.min(200, v + 10))}
        onZoomOut={() => setZ((v) => Math.max(25, v - 10))}
        onFit={() => setZ(100)}
        onReset={() => setZ(100)}
      />
    </div>
  );
};

// ── Shell wrapper ────────────────────────────────────────────────────────────

const FormShell = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  return (
    <Shell
      topbar={
        <Topbar
          pageTitle="Form Elements"
          rightActions={
            <ThemeToggle
              isDark={isDark}
              onToggle={() => {
                setIsDark((d) => !d);
                document.documentElement.classList.toggle('dark');
              }}
            />
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
            <Sidebar.Item icon={Inbox} label="Inbox" />
            <Sidebar.Section label="Library">
              <Sidebar.Item icon={FileText} label="Form Elements" active />
              <Sidebar.Item icon={CheckSquare} label="Buttons" />
              <Sidebar.Item icon={Bell} label="Alerts" />
            </Sidebar.Section>
            <Sidebar.Section label="Account">
              <Sidebar.Item icon={User} label="Profile" />
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
    <FormShell>
      <FormContent />
    </FormShell>
  ),
};

export const OnlyForms: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-base)]">
      <FormContent />
    </div>
  ),
};
