// Data of the Settings recipe: "Granite", a booking app for the climbing gyms of the Alpine Rock
// Collective. Everything is fictional and fixed (no clock, no random), so a story renders the
// same every time.

import { placeholderAvatar } from '../../../../packages/react/src/storybook-avatars';

// ── The form ────────────────────────────────────────────────────────────────

/** What the page edits. Each key is also the id of the field (`field-<key>`) the error links reach. */
export type SettingsValues = {
  name: string;
  logo: string | null;
  slug: string;
  timeZone: string;
  language: string;
  invites: string[];
  /** Role of each member, by member id. */
  roles: Record<string, string>;
  notifyBookings: boolean;
  notifyWaitlist: boolean;
  notifyDigest: boolean;
  twoFactor: boolean;
  /** Minutes of inactivity before a staff member is signed out. */
  timeout: number;
};

/** Message of each invalid field, by field key; `role-<member id>` for a member's role. */
export type SettingsErrors = Record<string, string>;

export type SettingsState = 'content' | 'empty' | 'loading' | 'error' | 'extreme';

export type Member = {
  id: string;
  name: string;
  email: string;
  gym: string;
  lastActive: string;
};

export const ORG_NAME = 'Alpine Rock Collective';
export const BOOKING_HOST = 'book.granite.app/';

export const GYMS = [
  'Lyon Confluence',
  'Grenoble Bastille',
  'Annecy Vieux-Port',
  'Chambéry Centre',
] as const;

export const TIME_ZONES = [
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+02:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+01:00)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (UTC+02:00)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (UTC+02:00)' },
  { value: 'America/Montreal', label: 'America/Montreal (UTC−04:00)' },
];

export const LANGUAGES = [
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-CH', label: 'Deutsch (Schweiz)' },
  { value: 'it-IT', label: 'Italiano' },
];

export const ROLES = ['Owner', 'Admin', 'Manager', 'Route setter', 'Front desk', 'Staff'].map(
  (role) => ({ value: role, label: role })
);

export const NOTIFICATIONS = [
  {
    key: 'notifyBookings',
    label: 'Booking confirmations',
    description: 'Email the front desk of a gym when a class or a day pass is booked.',
  },
  {
    key: 'notifyWaitlist',
    label: 'Waiting list',
    description: 'Tell staff when a place opens on a full class.',
  },
  {
    key: 'notifyDigest',
    label: 'Weekly digest',
    description: 'Monday summary of bookings, attendance and cancellations for every gym.',
  },
] as const;

export const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'billing', label: 'Billing' },
  { id: 'security', label: 'Security' },
  { id: 'danger', label: 'Danger zone' },
];

/** Label and help of the fields whose text the extreme case stretches. */
export const COPY = {
  name: {
    label: 'Organisation name',
    help: 'Required. Shown on invoices and booking confirmations.',
  },
  slug: {
    label: 'Booking URL',
    help: 'Required. Where climbers book classes and day passes.',
  },
  timeout: {
    label: 'Session timeout',
    help: 'Minutes of inactivity before staff are signed out.',
  },
};

export const LONG_COPY: typeof COPY = {
  name: {
    label:
      'Legal name of the organisation as it must appear on invoices, contracts and booking confirmations sent to climbers',
    help: 'Required. Use the registered name, including the legal form. It is also printed on day-pass receipts and on the waiver every climber signs at the front desk of each of the four gyms.',
  },
  slug: {
    label:
      'Booking URL, the public address where climbers reserve classes, day passes and private route-setting sessions',
    help: 'Required. Letters, numbers and hyphens only. Changing it breaks links already shared on social media and in printed flyers.',
  },
  timeout: {
    label: 'Session timeout before a staff member who left a desk computer open is signed out',
    help: 'Minutes of inactivity. A shorter delay protects the front desk of a busy gym, a longer one spares route setters who keep the page open all day.',
  },
};

/** The label an error summary gives each field, in page order. */
export const FIELD_LABELS: Record<string, string> = {
  name: 'Organisation name',
  logo: 'Logo',
  slug: 'Booking URL',
  timeZone: 'Time zone',
  language: 'Default language',
  invites: 'Invitations',
  roles: 'Member roles',
  timeout: 'Session timeout',
};

/** Fields the page cannot be saved without. */
export const REQUIRED = ['name', 'slug', 'timeZone'] as const;

export const NAME_MAX = 80;

/** The rules the page checks before it saves. A save the server refuses comes back as `errors`. */
export const validate = (values: SettingsValues): SettingsErrors => {
  const errors: SettingsErrors = {};
  if (!values.name.trim()) errors.name = 'Enter an organisation name.';
  else if (values.name.length > NAME_MAX)
    errors.name = `Use ${NAME_MAX} characters or fewer (you typed ${values.name.length}).`;
  if (!values.slug) errors.slug = 'Enter a booking address.';
  else if (!/^[a-z0-9-]+$/.test(values.slug)) errors.slug = 'Letters, numbers and hyphens only.';
  if (!values.timeZone) errors.timeZone = 'Pick a time zone.';
  if (!values.language) errors.language = 'Pick a default language.';
  if (!(values.timeout >= 5 && values.timeout <= 480))
    errors.timeout = 'Enter a value between 5 and 480 minutes.';
  return errors;
};

// ── Members ─────────────────────────────────────────────────────────────────

const staff = (
  id: string,
  name: string,
  gym: string,
  lastActive: string,
  email = `${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ /g, '.')}@alpinerock.example`
): Member => ({ id, name, email, gym, lastActive });

export const MEMBERS: Member[] = [
  staff('m01', 'Camille Roux', 'All gyms', 'Oct 29, 09:12'),
  staff('m02', 'Hugo Bertrand', 'Lyon Confluence', 'Oct 29, 08:47'),
  staff('m03', 'Inès Marchetti', 'Grenoble Bastille', 'Oct 27, 18:30'),
  staff('m04', 'Théo Vasseur', 'Annecy Vieux-Port', 'Oct 28, 17:05'),
  staff('m05', 'Lena Okafor', 'Chambéry Centre', 'Oct 29, 07:58'),
  staff('m06', 'Noémie Perrin', 'Lyon Confluence', 'Oct 26, 12:20'),
  staff('m07', 'Rayan Kaddouri', 'Annecy Vieux-Port', 'Oct 28, 09:41'),
  staff('m08', 'Solène Girard', 'Chambéry Centre', 'Oct 29, 08:15'),
  staff('m09', 'Maël Dubois', 'Grenoble Bastille', 'Oct 24, 16:02'),
  staff('m10', 'Elsa Fontaine', 'Lyon Confluence', 'Oct 28, 19:37'),
  staff('m11', 'Jules Carpentier', 'Annecy Vieux-Port', 'Oct 25, 10:09'),
  staff('m12', 'Anaïs Lemoine', 'Chambéry Centre', 'Oct 29, 06:50'),
];

const ROLE_OF_MEMBER: Record<string, string> = {
  m01: 'Owner',
  m02: 'Admin',
  m03: 'Manager',
  m04: 'Route setter',
  m05: 'Front desk',
  m06: 'Staff',
  m07: 'Route setter',
  m08: 'Manager',
  m09: 'Staff',
  m10: 'Front desk',
  m11: 'Staff',
  m12: 'Front desk',
};

const rolesOf = (members: Member[]) =>
  Object.fromEntries(
    members.map((m, i) => [m.id, ROLE_OF_MEMBER[m.id] ?? ROLES[(i % 3) + 3]!.value])
  );

// 60 members for the extreme case: six whose names and gyms run long, then 54 of the usual size.
const FIRST = ['Adèle', 'Baptiste', 'Clara', 'Dorian', 'Eva', 'Félix', 'Gaëlle', 'Hector', 'Iris'];
const LAST = ['Aubert', 'Blanc', 'Chevalier', 'Duval', 'Esteve', 'Faure', 'Guillot'];

export const EXTREME_MEMBERS: Member[] = [
  staff('x01', 'Camille Roux', 'All gyms', 'Oct 29, 09:12'),
  staff(
    'x02',
    'Maximilian-Alexander Featherstonehaugh-Delacroix',
    'Grenoble Bastille and Grenoble Presqu’île annex',
    'Oct 28, 21:44',
    'maximilian-alexander.featherstonehaugh-delacroix@alpine-rock-collective.example'
  ),
  staff('x03', 'Théo Vasseur', 'Annecy Vieux-Port', 'Oct 28, 17:05'),
  staff('x04', 'Marie-Charlotte de La Tour-d’Auvergne', 'Chambéry Centre', 'Oct 27, 14:30'),
  staff('x05', 'Rayan Kaddouri', 'Annecy Vieux-Port', 'Oct 28, 09:41'),
  staff('x06', 'Solène Girard', 'Chambéry Centre', 'Oct 29, 08:15'),
  ...Array.from({ length: 54 }, (_, i) =>
    staff(
      `x${String(i + 7).padStart(2, '0')}`,
      `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
      GYMS[i % GYMS.length]!,
      `Oct ${29 - (i % 9)}, ${String(8 + (i % 11)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`
    )
  ),
];

/** The only member of a new organisation. */
export const NEW_MEMBERS: Member[] = [staff('n01', 'Camille Roux', 'All gyms', 'Oct 29, 09:12')];

// ── One scenario per state ──────────────────────────────────────────────────

export type Scenario = {
  members: Member[];
  /** What the server holds: the baseline the edits are counted against. */
  saved: SettingsValues;
  /** What the form starts with. */
  initial: SettingsValues;
  /** Messages shown from the start: a save the server refused. */
  errors: SettingsErrors;
  /** The save has already failed. */
  failed: boolean;
};

const SAVED: SettingsValues = {
  name: ORG_NAME,
  logo: placeholderAvatar('Alpine Rock', 128),
  slug: 'alpine-rock-collective',
  timeZone: 'Europe/Paris',
  language: 'en-GB',
  invites: [],
  roles: rolesOf(MEMBERS),
  notifyBookings: true,
  notifyWaitlist: true,
  notifyDigest: false,
  twoFactor: false,
  timeout: 60,
};

const NEW_ORGANISATION: SettingsValues = {
  ...SAVED,
  name: '',
  logo: null,
  slug: '',
  timeZone: '',
  roles: rolesOf(NEW_MEMBERS),
  notifyDigest: true,
};

const LONG_NAME =
  'Alpine Rock and Bouldering Collective of the Rhône-Alpes Region, Société coopérative';

const EXTREME: SettingsValues = {
  ...SAVED,
  name: LONG_NAME,
  slug: 'alpine-rock-and-bouldering-collective_2026!',
  timeZone: '',
  language: '',
  invites: [
    'lea.fontaine@alpinerock.example',
    'marco.silva@alpine-rock-collective-staff.example',
    'not-an-email',
    'front.desk.chambery.centre.reception.team@alpine-rock-collective.example',
  ],
  roles: rolesOf(EXTREME_MEMBERS),
  timeout: 0,
};

const FAILED_SAVE: SettingsValues = { ...SAVED, name: '', slug: 'alpine-rock', timeout: 0 };

export const SCENARIOS: Record<SettingsState, Scenario> = {
  // Three fields edited: the footer counts them.
  content: {
    members: MEMBERS,
    saved: SAVED,
    initial: {
      ...SAVED,
      name: 'Alpine Rock Collective SCOP',
      slug: 'alpine-rock',
      timeZone: 'Europe/London',
    },
    errors: {},
    failed: false,
  },
  empty: {
    members: NEW_MEMBERS,
    saved: NEW_ORGANISATION,
    initial: NEW_ORGANISATION,
    errors: {},
    failed: false,
  },
  loading: { members: [], saved: SAVED, initial: SAVED, errors: {}, failed: false },
  // The server refused the address; the name and the timeout fail the page's own rules.
  error: {
    members: MEMBERS,
    saved: SAVED,
    initial: FAILED_SAVE,
    errors: {
      ...validate(FAILED_SAVE),
      slug: 'That address is taken. Try alpine-rock-collective.',
    },
    failed: true,
  },
  extreme: {
    members: EXTREME_MEMBERS,
    saved: { ...EXTREME, name: ORG_NAME, slug: 'alpine-rock-collective' },
    initial: EXTREME,
    errors: {
      ...validate(EXTREME),
      logo: 'File too large: 1 MB max.',
      invites: '2 of the 4 addresses are not valid.',
      'role-x02': 'An organisation needs at least one owner.',
      'role-x04': 'Route setters cannot manage billing.',
      'role-x05': 'Pick a role for this member.',
      'role-x06': 'Route setters cannot manage billing.',
      'role-x07': 'An organisation needs at least one owner.',
      'role-x08': 'Pick a role for this member.',
    },
    failed: true,
  },
};

/** Fields whose value differs from the saved one. */
export const countEdited = (values: SettingsValues, saved: SettingsValues): number =>
  (Object.keys(values) as (keyof SettingsValues)[]).reduce((count, key) => {
    if (key === 'roles') {
      const roles = values.roles;
      return count + Object.keys(roles).filter((id) => roles[id] !== saved.roles[id]).length;
    }
    return JSON.stringify(values[key]) === JSON.stringify(saved[key]) ? count : count + 1;
  }, 0);

/** The error summary: one entry per field, member roles grouped under the first invalid one. */
export const summarise = (errors: SettingsErrors): { key: string; label: string }[] => {
  const keys = Object.keys(errors);
  const roleKeys = keys.filter((k) => k.startsWith('role-'));
  return Object.keys(FIELD_LABELS).flatMap((key) => {
    if (key === 'roles')
      return roleKeys.length > 0
        ? [{ key: roleKeys[0]!, label: `${FIELD_LABELS.roles} (${roleKeys.length})` }]
        : [];
    return errors[key] ? [{ key, label: FIELD_LABELS[key]! }] : [];
  });
};
