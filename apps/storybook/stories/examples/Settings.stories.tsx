import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  Globe,
  LayoutDashboard,
  Mountain,
  Save,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  AlertBanner,
  Avatar,
  AvatarUploader,
  Badge,
  Button,
  ConfirmationModal,
  FormFooter,
  FormRow,
  Input,
  Link,
  NumberInput,
  PageContainer,
  PageHeader,
  PasswordPolicyChecker,
  SectionCard,
  Select,
  Shell,
  Sidebar,
  Sk,
  SkeletonTable,
  StatefulSaveButton,
  StickyScrollNav,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TagInput,
  Toggle,
  Topbar,
  UnsavedIndicator,
  type SaveState,
} from '../../../../packages/react/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../../../../packages/react/src/storybook-helpers';
import {
  BOOKING_HOST,
  COPY,
  GYMS,
  LANGUAGES,
  LONG_COPY,
  NOTIFICATIONS,
  REQUIRED,
  ROLES,
  SCENARIOS,
  SECTIONS,
  TIME_ZONES,
  countEdited,
  summarise,
  validate,
  type SettingsState,
  type SettingsValues,
} from './settings.data';

const meta = {
  title: 'Examples/Settings',
  // The screen is a whole `Shell` and opens a modal: the docs page shows it in an iframe.
  parameters: {
    ...portalDocsParams.full(),
    docs: {
      ...portalDocsParams.full().docs,
      description: {
        component:
          'One long settings page for a booking app (the Alpine Rock Collective, four climbing ' +
          'gyms): a `StickyScrollNav` over six sections, `FormRow`s for the fields, and a ' +
          '`FormFooter` that carries the unsaved-changes note and a `StatefulSaveButton`. The ' +
          'state is a prop of one screen component, not a copy of the page.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Small pieces ────────────────────────────────────────────────────────────

// A field in a FormRow is as wide as the row's end column from `sm` up, the whole row below.
const FIELD_WIDTH = 'w-full sm:w-80';

// Where the error links of the summary land: the first control inside the field's box.
const focusField = (key: string) => {
  const box = document.getElementById(`field-${key}`);
  const target = box?.querySelector<HTMLElement>('input:not([type=file]), select, button');
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'center' });
};

// A section is a SectionCard whose rows are FormRows separated by a hairline. The wrapper
// carries the id the StickyScrollNav scrolls to.
const Section = ({
  id,
  title,
  description,
  icon,
  tone,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'blue' | 'violet' | 'amber' | 'green' | 'red';
  children: ReactNode;
}) => (
  <div id={id}>
    <SectionCard as="h2" title={title} desc={description} icon={icon} iconTone={tone}>
      {children}
    </SectionCard>
  </div>
);

// FormRow lays out one setting. The rows of a section share this hairline and padding.
const Rows = ({ children }: { children: ReactNode }) => (
  <div className="-my-4 divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
);

const ROW = 'py-4';

// While the settings load, a control is a skeleton of its own size; the label and help stay.
const Control = ({
  loading,
  field,
  children,
}: {
  loading: boolean;
  field: string;
  children: ReactNode;
}) =>
  loading ? (
    <Sk h="h-ctrl-36" w={FIELD_WIDTH} round="rounded-lg" />
  ) : (
    <div id={`field-${field}`} className={FIELD_WIDTH}>
      {children}
    </div>
  );

const Switch = ({ loading, children }: { loading: boolean; children: ReactNode }) =>
  loading ? <Sk h="h-6" w="w-11" round="rounded-full" /> : children;

// ── The screen ──────────────────────────────────────────────────────────────

const SettingsScreen = ({
  state,
  defaultDeleteOpen = false,
}: {
  state: SettingsState;
  /** Opens the delete confirmation from the start, for the story that shows it. */
  defaultDeleteOpen?: boolean;
}) => {
  const scenario = SCENARIOS[state];
  const loading = state === 'loading';
  const long = state === 'extreme';
  const copy = long ? LONG_COPY : COPY;

  // `saved` is what the server holds; `values` is the form. The footer counts the difference.
  const [saved, setSaved] = useState(scenario.saved);
  const [values, setValues] = useState(scenario.initial);
  const [errors, setErrors] = useState(scenario.errors);
  // The state of the save button once a save has begun; null while the form is just being edited.
  const [save, setSave] = useState<SaveState | null>(scenario.failed ? 'error' : null);
  const [invited, setInvited] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(defaultDeleteOpen);
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  // Any edit clears the message of the field it touches, and the failed save with it.
  const edit = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(key);
  };
  const clearError = (key: string) => {
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)));
    setSave(null);
  };

  const submit = () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSave('error');
      return;
    }
    setSave('saving');
    timers.current.push(
      window.setTimeout(() => {
        setSaved(values);
        setSave('saved');
        timers.current.push(window.setTimeout(() => setSave(null), 1500));
      }, 1000)
    );
  };
  const cancel = () => {
    setValues(saved);
    setErrors({});
    setSave(null);
  };

  const sendInvites = () => {
    setInvited((list) => [...list, ...values.invites]);
    edit('invites', []);
  };

  const edited = countEdited(values, saved);
  const requiredLeft = REQUIRED.filter((key) => !values[key]).length;
  const summary = summarise(errors);
  const members = scenario.members;
  const memberCount = members.length + invited.length;

  const note =
    save === 'error' ? (
      <>
        <UnsavedIndicator visible /> <span>Nothing was saved.</span>
      </>
    ) : (
      <>
        <UnsavedIndicator
          visible={edited > 0}
          label={`Unsaved changes · ${edited} ${edited === 1 ? 'field' : 'fields'} edited`}
        />
        {requiredLeft > 0 && (
          <span>
            {requiredLeft} required {requiredLeft === 1 ? 'field' : 'fields'} left
          </span>
        )}
      </>
    );

  return (
    <Shell
      topbar={
        <Topbar
          pageTitle="Organisation settings"
          endActions={<Avatar name="Camille Roux" size="sm" />}
        />
      }
      sidebar={
        <Sidebar>
          <Sidebar.Brand logo={<Mountain className="h-5 w-5" />} title="Granite" />
          <div className="py-3">
            <Sidebar.Item icon={LayoutDashboard} label="Dashboard" />
            <Sidebar.Item icon={CalendarDays} label="Bookings" />
            <Sidebar.Item icon={Clock} label="Classes" />
            <Sidebar.Item icon={Building2} label="Gyms" />
            <Sidebar.Item icon={Users} label="Climbers" />
            <Sidebar.Item icon={Settings} label="Settings" active />
          </div>
        </Sidebar>
      }
    >
      <PageContainer>
        <form
          className="space-y-6"
          aria-busy={loading || undefined}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {loading && (
            <p className="sr-only" role="status">
              Loading settings…
            </p>
          )}
          <PageHeader
            as="h1"
            title="Organisation settings"
            description="How your organisation appears to climbers, who can sign in, and how it is billed."
          />

          {state === 'empty' && (
            <AlertBanner intent="info" title="Welcome to Granite">
              Start with the basics. You can change all of this later in Settings.
            </AlertBanner>
          )}
          {summary.length > 0 && (
            <AlertBanner intent="danger" title="We couldn’t save your changes">
              Fix {summary.length} {summary.length === 1 ? 'field' : 'fields'} and try again:{' '}
              {summary.map((entry, i) => (
                <Fragment key={entry.key}>
                  {i > 0 && (i === summary.length - 1 ? ' and ' : ', ')}
                  <Link
                    variant="underline"
                    href={`#field-${entry.key}`}
                    onClick={(e) => {
                      e.preventDefault();
                      focusField(entry.key);
                    }}
                  >
                    {entry.label}
                  </Link>
                </Fragment>
              ))}{' '}
              {summary.length === 1 ? 'needs' : 'need'} attention.
            </AlertBanner>
          )}

          <StickyScrollNav sections={SECTIONS} />

          <Section
            id="general"
            title="General"
            description="How your organisation appears to climbers and in booking emails."
            icon={Globe}
            tone="blue"
          >
            <Rows>
              <FormRow label={copy.name.label} description={copy.name.help} className={ROW}>
                <Control loading={loading} field="name">
                  {/* Input is not a bare control: the row's label does not name it. */}
                  <Input
                    aria-label={COPY.name.label}
                    required
                    placeholder="e.g. Alpine Rock Collective"
                    value={values.name}
                    onChange={(e) => edit('name', e.target.value)}
                    error={errors.name}
                  />
                </Control>
              </FormRow>
              <FormRow
                label="Logo"
                description="Optional. Square image, at least 256 × 256 px."
                className={ROW}
              >
                {loading ? (
                  <Sk h="h-20" w="w-64" round="rounded-lg" />
                ) : (
                  <div id="field-logo">
                    <AvatarUploader
                      src={values.logo}
                      name={values.name || 'Organisation'}
                      uploadLabel={values.logo ? 'Change logo' : 'Upload logo'}
                      helperText="JPG or PNG, 1 MB max."
                      maxSizeMB={1}
                      error={errors.logo}
                      onUpload={(file) => edit('logo', URL.createObjectURL(file))}
                      onRemove={() => edit('logo', null)}
                    />
                  </div>
                )}
              </FormRow>
              <FormRow label={copy.slug.label} description={copy.slug.help} className={ROW}>
                <Control loading={loading} field="slug">
                  <Input
                    aria-label={COPY.slug.label}
                    required
                    prefix={BOOKING_HOST}
                    placeholder="your-gym-name"
                    value={values.slug}
                    onChange={(e) => edit('slug', e.target.value)}
                    error={errors.slug}
                  />
                </Control>
              </FormRow>
              <FormRow
                label="Time zone"
                description="Required. Class times are shown in this zone for all four gyms."
                className={ROW}
              >
                <Control loading={loading} field="timeZone">
                  <Select
                    aria-label="Time zone"
                    required
                    placeholder="Select a time zone"
                    options={TIME_ZONES}
                    value={values.timeZone}
                    onChange={(e) => edit('timeZone', e.target.value)}
                    error={errors.timeZone}
                  />
                </Control>
              </FormRow>
              <FormRow
                label="Default language"
                description="Used for emails until a climber picks their own."
                className={ROW}
              >
                <Control loading={loading} field="language">
                  <Select
                    aria-label="Default language"
                    placeholder="Pick a language"
                    options={LANGUAGES}
                    value={values.language}
                    onChange={(e) => edit('language', e.target.value)}
                    error={errors.language}
                  />
                </Control>
              </FormRow>
            </Rows>
          </Section>

          <Section
            id="members"
            title="Members"
            description={
              memberCount === 1
                ? '1 staff member. Invite your team by email.'
                : `${memberCount} staff across ${GYMS.length} gyms. Invite people by email.`
            }
            icon={Users}
            tone="violet"
          >
            {loading ? (
              <div className="space-y-4">
                <Sk h="h-ctrl-36" />
                <SkeletonTable rows={4} cols={4} />
              </div>
            ) : (
              <div className="space-y-4">
                <div id="field-invites">
                  <TagInput
                    label="Invite by email"
                    placeholder="Add an email, then Enter"
                    value={values.invites}
                    onChange={(list) => edit('invites', list)}
                    validate={(text) => /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(text)}
                    invalidMessage="That is not an email address."
                    error={errors.invites}
                  />
                  {values.invites.length > 0 && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="secondary" onClick={sendInvites}>
                        Send {values.invites.length}{' '}
                        {values.invites.length === 1 ? 'invite' : 'invites'}
                      </Button>
                    </div>
                  )}
                </div>
                {/* Sixty rows scroll inside the table, under a header that stays. */}
                <Table stickyHeader containerClassName="max-h-96">
                  <TableCaption className="sr-only">Members</TableCaption>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Member</TableHeaderCell>
                      <TableHeaderCell>Gym</TableHeaderCell>
                      <TableHeaderCell>Role</TableHeaderCell>
                      <TableHeaderCell>Last active</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={m.name} size="sm" />
                            <div className="min-w-0">
                              <p
                                title={m.name}
                                className="max-w-56 truncate font-medium text-[var(--color-text-primary)]"
                              >
                                <bdi>{m.name}</bdi>
                              </p>
                              <p
                                title={m.email}
                                className="max-w-56 truncate text-xs text-[var(--color-text-secondary)]"
                              >
                                <bdi>{m.email}</bdi>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span title={m.gym} className="block max-w-44 truncate">
                            <bdi>{m.gym}</bdi>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div id={`field-role-${m.id}`}>
                            <Select
                              size="sm"
                              fullWidth={false}
                              aria-label={`Role of ${m.name}`}
                              options={ROLES}
                              value={values.roles[m.id] ?? ''}
                              onChange={(e) => {
                                setValues((v) => ({
                                  ...v,
                                  roles: { ...v.roles, [m.id]: e.target.value },
                                }));
                                clearError(`role-${m.id}`);
                              }}
                              error={errors[`role-${m.id}`]}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{m.lastActive}</TableCell>
                      </TableRow>
                    ))}
                    {invited.map((email) => (
                      <TableRow key={email}>
                        <TableCell>
                          <span className="block max-w-56 truncate" title={email}>
                            <bdi>{email}</bdi>
                          </span>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>Staff</TableCell>
                        <TableCell>
                          <Badge intent="warning">Invited</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>

          <Section
            id="notifications"
            title="Notifications"
            description="Emails sent to staff."
            icon={Bell}
            tone="amber"
          >
            <Rows>
              {NOTIFICATIONS.map((n) => (
                <FormRow key={n.key} label={n.label} description={n.description} className={ROW}>
                  <Switch loading={loading}>
                    <Toggle checked={values[n.key]} onChange={(on) => edit(n.key, on)} />
                  </Switch>
                </FormRow>
              ))}
            </Rows>
          </Section>

          <Section
            id="billing"
            title="Billing"
            description="Plan and payment method."
            icon={CreditCard}
            tone="green"
          >
            <Rows>
              {/* The buttons open the app's own billing screens. */}
              <FormRow
                label="Plan"
                description="Four gyms, unlimited classes. Billed monthly."
                className={ROW}
              >
                <div className="flex items-center gap-3">
                  <Badge intent="brand">Club</Badge>
                  <span className="text-sm text-[var(--color-text-secondary)]">€320 / month</span>
                  <Button variant="secondary" size="sm">
                    Change plan
                  </Button>
                </div>
              </FormRow>
              <FormRow
                label="Payment method"
                description="Charged on the 1st of each month."
                className={ROW}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Visa ending 4242, expires 08/2028
                  </span>
                  <Button variant="secondary" size="sm">
                    Update
                  </Button>
                </div>
              </FormRow>
            </Rows>
          </Section>

          <Section
            id="security"
            title="Security"
            description="Sign-in rules for every staff account."
            icon={ShieldCheck}
            tone="blue"
          >
            <Rows>
              <FormRow
                label="Require two-step verification"
                description="Every staff account sets up an authenticator app at its next sign-in."
                className={ROW}
              >
                <Switch loading={loading}>
                  <Toggle checked={values.twoFactor} onChange={(on) => edit('twoFactor', on)} />
                </Switch>
              </FormRow>
              <FormRow label={copy.timeout.label} description={copy.timeout.help} className={ROW}>
                {loading ? (
                  <Sk h="h-ctrl-36" w="w-32" round="rounded-lg" />
                ) : (
                  // NumberInput has no `error` prop: the message sits under it, and names it.
                  <div id="field-timeout" className="flex flex-col items-start gap-1 sm:items-end">
                    <NumberInput
                      aria-label={COPY.timeout.label}
                      controls="stacked"
                      unit="min"
                      min={5}
                      max={480}
                      step={5}
                      value={values.timeout}
                      onChange={(minutes) => edit('timeout', minutes)}
                      aria-describedby={errors.timeout ? 'timeout-error' : undefined}
                    />
                    {errors.timeout && (
                      <p id="timeout-error" className="text-xs text-red-700 dark:text-red-400">
                        {errors.timeout}
                      </p>
                    )}
                  </div>
                )}
              </FormRow>
              <FormRow
                label="Password policy"
                description="Applies to every staff account."
                className={ROW}
              >
                <PasswordPolicyChecker
                  rules={[
                    { label: 'At least 12 characters', ok: true },
                    { label: 'A number', ok: true },
                    { label: 'A symbol', ok: true },
                  ]}
                />
              </FormRow>
            </Rows>
          </Section>

          <Section
            id="danger"
            title="Danger zone"
            description="Actions that cannot be undone."
            icon={AlertTriangle}
            tone="red"
          >
            <FormRow
              label="Delete organisation"
              description={`Permanently removes ${scenario.saved.name || 'this organisation'}, its gyms, its staff accounts and every upcoming booking.`}
            >
              {loading ? (
                <Sk h="h-ctrl-36" w="w-44" round="rounded-lg" />
              ) : (
                <Button intent="danger" onClick={() => setDeleteOpen(true)}>
                  Delete organisation
                </Button>
              )}
            </FormRow>
          </Section>

          {/* The save button is a StatefulSaveButton, so the footer's own submit is replaced. */}
          <FormFooter
            align="between"
            extra={note}
            className="sticky bottom-0 z-10 flex-wrap bg-[var(--color-bg-base)] pb-4"
          >
            <Button variant="secondary" onClick={cancel} disabled={loading || save === 'saving'}>
              Cancel
            </Button>
            {loading ? (
              <Button icon={Save} disabled>
                Save Changes
              </Button>
            ) : (
              <StatefulSaveButton
                state={save ?? (edited > 0 ? 'dirty' : 'idle')}
                onClick={submit}
              />
            )}
          </FormFooter>
        </form>

        <ConfirmationModal
          open={deleteOpen}
          intent="danger"
          title={`Delete ${scenario.saved.name || 'this organisation'}?`}
          message="This deletes the organisation, its gyms, its staff accounts and every upcoming booking. It cannot be undone."
          requireText={scenario.saved.name || 'this organisation'}
          discardLabel="Delete organisation"
          hideSave
          onClose={() => setDeleteOpen(false)}
          // The app deletes the organisation here.
          onDiscard={() => setDeleteOpen(false)}
        />
      </PageContainer>
    </Shell>
  );
};

// ── Stories: one per state ──────────────────────────────────────────────────

/** Three fields edited (name, booking URL, time zone): the footer counts them. */
export const Content: Story = {
  render: () => <SettingsScreen state="content" />,
};

/** A new organisation: the same screen, required fields empty, the footer counts what is left. */
export const Empty: Story = {
  render: () => <SettingsScreen state="empty" />,
};

/** The first load: skeletons where the values go, the sections and the footer present. */
export const Loading: Story = {
  render: () => <SettingsScreen state="loading" />,
};

/** The save failed: a summary with a link to each field, their messages, the button in error. */
export const LoadError: Story = {
  name: 'Error',
  render: () => <SettingsScreen state="error" />,
};

/** Long labels and help, long values, sixty members, every field invalid. */
export const ExtremeContent: Story = {
  render: () => <SettingsScreen state="extreme" />,
};

export const Phone: Story = {
  ...Content,
  globals: mobileViewport,
  play: async ({ canvasElement, canvas }) => {
    // The sections fold into a jump menu, and nothing makes the page scroll sideways.
    await expect(canvas.getByRole('combobox', { name: 'Jump to section' })).toBeVisible();
    expectNoHorizontalOverflow(canvasElement.querySelector('main') as HTMLElement);
  },
};

/** The delete confirmation, open on a phone. */
export const PhoneDeleteConfirm: Story = {
  render: () => <SettingsScreen state="content" defaultDeleteOpen />,
  globals: mobileViewport,
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog');
    await expect(
      within(dialog).getByRole('button', { name: 'Delete organisation' })
    ).toBeDisabled();
    expectNoHorizontalOverflow(dialog);
  },
};

// ── Hidden tests ────────────────────────────────────────────────────────────

const hidden = { tags: ['!dev', '!autodocs'] };

/** Content: three edits show in the footer and the save button asks to be pressed. */
export const ContentCountsEdits: Story = {
  ...Content,
  ...hidden,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Unsaved changes · 3 fields edited')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Organisation settings'
    );
  },
};

/** Empty: placeholders on the required fields, and the footer counts what is left. */
export const EmptyCountsRequiredFields: Story = {
  ...Empty,
  ...hidden,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3 required fields left')).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Organisation name' })).toHaveAttribute(
      'placeholder',
      'e.g. Alpine Rock Collective'
    );
    await expect(canvas.getByPlaceholderText('your-gym-name')).toHaveValue('');
    await expect(canvas.queryByText(/Unsaved changes/)).toBeNull();
  },
};

/** Loading: the form is busy, skeletons stand where the fields go, there is nothing to save. */
export const LoadingShowsSkeletons: Story = {
  ...Loading,
  ...hidden,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('form[aria-busy="true"]')).not.toBeNull();
    await expect(canvasElement.querySelectorAll('.animate-pulse').length).toBeGreaterThan(8);
    await expect(canvas.queryByRole('textbox', { name: 'Organisation name' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Danger zone' })).toBeVisible();
  },
};

/** Error: the summary names the fields, and each link moves the focus to its field. */
export const ErrorLinksFocusTheirField: Story = {
  ...LoadError,
  ...hidden,
  play: async ({ canvas }) => {
    const banner = canvas.getByRole('alert');
    await expect(within(banner).getByText('We couldn’t save your changes')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Error' })).toBeVisible();
    await expect(canvas.getByText('Nothing was saved.')).toBeVisible();
    await expect(
      canvas.getByText('That address is taken. Try alpine-rock-collective.')
    ).toBeVisible();

    const fields = [
      ['Organisation name', canvas.getByRole('textbox', { name: 'Organisation name' })],
      ['Booking URL', canvas.getByRole('textbox', { name: 'Booking URL' })],
      ['Session timeout', canvas.getByRole('spinbutton', { name: 'Session timeout' })],
    ] as const;
    for (const [linkName, field] of fields) {
      await userEvent.click(within(banner).getByRole('link', { name: linkName }));
      await expect(field).toHaveFocus();
    }
  },
};

/** Extreme: sixty members in a scrolling table, long names cut, the roles summed up in one link. */
export const ExtremeContentTruncates: Story = {
  ...ExtremeContent,
  ...hidden,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText(/^60 staff across 4 gyms/)).toBeVisible();
    // 60 members and the header row.
    await expect(
      within(canvas.getByRole('table', { name: 'Members' })).getAllByRole('row')
    ).toHaveLength(61);
    const name = canvas
      .getByText('Maximilian-Alexander Featherstonehaugh-Delacroix')
      .closest('p') as HTMLElement;
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(
      within(canvas.getByRole('alert')).getByRole('link', { name: 'Member roles (6)' })
    ).toBeVisible();
    expectNoHorizontalOverflow(canvasElement.querySelector('main') as HTMLElement);
  },
};

/** The confirmation of the delete asks for the organisation's name before it deletes. */
export const DeleteConfirmNeedsTheName: Story = {
  ...Content,
  ...hidden,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete organisation' }));
    const dialog = await within(document.body).findByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: 'Delete organisation' });
    await expect(confirm).toBeDisabled();

    const field = within(dialog).getByRole('textbox');
    await userEvent.type(field, 'Alpine Rock');
    await expect(confirm).toBeDisabled();
    await userEvent.type(field, ' Collective');
    await waitFor(() => expect(confirm).toBeEnabled());

    // Stay closes it without deleting anything.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Stay' }));
    await waitFor(() => expect(within(document.body).queryByRole('alertdialog')).toBeNull());
  },
};
