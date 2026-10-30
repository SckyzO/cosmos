// The data of the App shell recipe: "Lumen", a project workspace for a small product team.
// Everything is fixed (no clock, no randomness) so the stories render the same way every time;
// "today" is Thursday 29 October 2026. People and companies are fictional.
import {
  CircleHelp,
  CreditCard,
  FileText,
  Folder,
  House,
  Inbox,
  ListChecks,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type Icon = ComponentType<{ className?: string }>;

/** One row of the sidebar. `badge` is a ready-made label, so "999+" is data, not logic. */
export type NavEntry = { id: string; label: string; icon: Icon; badge?: string };

/** The colour a project wears in the sidebar and on its tasks. */
export type ProjectColor = 'brand' | 'green' | 'amber' | 'violet' | 'cyan' | 'pink';

export type Project = {
  id: string;
  name: string;
  color: ProjectColor;
  /** The sidebar badge (open tasks), when there is one. */
  badge?: string;
  description: string;
  /** Percentage done. */
  progress: number;
  updated: string;
  /** Names, for the avatar stack. */
  members: string[];
};

/** `soon` is due today or tomorrow, `later` is due further out. */
export type Due = { label: string; urgency: 'today' | 'soon' | 'later' };

export type Task = { id: string; title: string; project: string; color: ProjectColor; due: Due };

export type Activity = { id: string; who: string; what: string; when: string };

export type Workspace = {
  name: string;
  plan: string;
  main: NavEntry[];
  projects: Project[];
  /** The label of the "All projects" row: the badge is the workspace's total. */
  allProjects: NavEntry;
  workspace: NavEntry[];
  tasks: Task[];
  activity: Activity[];
  /** Unread notifications in the Topbar bell. */
  unread: number;
  /** Tasks due this week and reviews waiting, for the page header. */
  dueThisWeek: number;
  needReview: number;
};

export const USER = { name: 'Priya Raman', email: 'priya@fernhill.example' };

export const TODAY = 'Thursday, 29 October';

const MAIN = (counts: { tasks?: string; inbox?: string } = {}): NavEntry[] => [
  { id: 'home', label: 'Home', icon: House },
  { id: 'tasks', label: 'My tasks', icon: ListChecks, badge: counts.tasks },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: counts.inbox },
  { id: 'docs', label: 'Docs', icon: FileText },
];

const PROJECTS: Project[] = [
  {
    id: 'atlas',
    name: 'Atlas Redesign',
    color: 'brand',
    description: 'New marketing site and pricing pages for the Q4 launch.',
    progress: 72,
    updated: 'Updated 2 h ago',
    members: ['Daniel Okafor', 'Sofia Marchetti', 'Lena Hofmann'],
  },
  {
    id: 'mobile',
    name: 'Mobile App 2.0',
    color: 'green',
    description: 'Push notifications, offline mode and the new tab bar.',
    progress: 48,
    updated: 'Updated yesterday',
    members: ['Tomas Eriksen', 'Aiko Tanaka', 'Priya Raman'],
  },
  {
    id: 'billing',
    name: 'Billing Revamp',
    color: 'amber',
    description: 'Usage-based invoices, EU VAT and card retries.',
    progress: 91,
    updated: 'Updated 3 days ago',
    members: ['Sofia Marchetti', 'Omar Haddad', 'Daniel Okafor'],
  },
  {
    id: 'onboarding',
    name: 'Onboarding Flow',
    color: 'violet',
    description: 'A checklist and sample data for a workspace in its first week.',
    progress: 20,
    updated: 'Updated last week',
    members: ['Lena Hofmann', 'Priya Raman'],
  },
];

const WORKSPACE_NAV: NavEntry[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

const ALL_PROJECTS: NavEntry = { id: 'all-projects', label: 'All projects', icon: Folder };

const TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review pricing page copy',
    project: 'Atlas Redesign',
    color: 'brand',
    due: { label: 'Today', urgency: 'today' },
  },
  {
    id: 't2',
    title: 'Fix invoice rounding on EU plans',
    project: 'Billing Revamp',
    color: 'amber',
    due: { label: 'Today', urgency: 'today' },
  },
  {
    id: 't3',
    title: 'Write release notes for 2.4',
    project: 'Mobile App 2.0',
    color: 'green',
    due: { label: 'Tomorrow', urgency: 'soon' },
  },
  {
    id: 't4',
    title: 'Draft onboarding checklist spec',
    project: 'Onboarding Flow',
    color: 'violet',
    due: { label: 'Tomorrow', urgency: 'soon' },
  },
  {
    id: 't5',
    title: 'Sync with design on empty states',
    project: 'Atlas Redesign',
    color: 'brand',
    due: { label: 'Sat 31 Oct', urgency: 'later' },
  },
  {
    id: 't6',
    title: 'Archive Q3 research notes',
    project: 'Docs',
    color: 'cyan',
    due: { label: 'Sun 1 Nov', urgency: 'later' },
  },
];

const ACTIVITY: Activity[] = [
  {
    id: 'a1',
    who: 'Daniel Okafor',
    what: 'commented on Pricing page copy',
    when: '12 minutes ago',
  },
  {
    id: 'a2',
    who: 'Sofia Marchetti',
    what: 'completed Export invoices as CSV',
    when: '1 hour ago',
  },
  {
    id: 'a3',
    who: 'Tomas Eriksen',
    what: 'moved Push notification opt-in to In review',
    when: '3 hours ago',
  },
  {
    id: 'a4',
    who: 'Lena Hofmann',
    what: 'assigned you Review pricing page copy',
    when: 'Yesterday, 11:05',
  },
  {
    id: 'a5',
    who: 'Aiko Tanaka',
    what: 'uploaded Q4 roadmap v3 to Docs',
    when: 'Yesterday, 16:40',
  },
  { id: 'a6', who: 'Omar Haddad', what: 'joined Fernhill Studio', when: 'Mon 26 Oct' },
];

/** The everyday workspace: a few projects, a few tasks due. */
export const WORKSPACE: Workspace = {
  name: 'Fernhill Studio',
  plan: 'Lumen · Team plan',
  main: MAIN({ tasks: '12', inbox: '5' }),
  projects: PROJECTS.slice(0, 4),
  allProjects: { ...ALL_PROJECTS, badge: '14' },
  workspace: WORKSPACE_NAV,
  tasks: TASKS,
  activity: ACTIVITY,
  unread: 8,
  dueThisWeek: 6,
  needReview: 2,
};

/** A workspace created a minute ago: nothing in it yet. */
export const NEW_WORKSPACE: Workspace = {
  name: 'Fernhill Studio',
  plan: 'Lumen · Free plan',
  main: MAIN(),
  projects: [],
  allProjects: ALL_PROJECTS,
  workspace: WORKSPACE_NAV,
  tasks: [],
  activity: [],
  unread: 0,
  dueThisWeek: 0,
  needReview: 0,
};

/** A big company's workspace: long names, counts past the badge width, a nav taller than the screen. */
export const BUSY_WORKSPACE: Workspace = {
  name: 'Fernhill Studio International Product and Design Division',
  plan: 'Lumen · Business plan · 1,204 members',
  main: MAIN({ tasks: '999+', inbox: '999+' }),
  projects: [
    { ...PROJECTS[0], badge: '99+' },
    PROJECTS[1],
    {
      ...PROJECTS[2],
      id: 'q4-onboarding',
      name: 'Q4 Enterprise Onboarding Experience Overhaul',
      badge: '999+',
    },
    { ...PROJECTS[2], id: 'billing' },
    {
      ...PROJECTS[3],
      id: 'playbook',
      name: 'Customer Success Playbook Localisation (EMEA and APAC)',
    },
    PROJECTS[3],
    { ...PROJECTS[0], id: 'portal', name: 'Partner Portal', color: 'cyan' },
    { ...PROJECTS[1], id: 'security', name: 'Security Questionnaire Automation', color: 'pink' },
    { ...PROJECTS[0], id: 'tokens', name: 'Design Tokens Migration' },
    { ...PROJECTS[1], id: 'roadmap', name: 'Public Roadmap' },
    { ...PROJECTS[2], id: 'macros', name: 'Helpdesk Macros' },
    { ...PROJECTS[3], id: 'pricing', name: 'Usage-based Pricing Experiments' },
  ],
  allProjects: { ...ALL_PROJECTS, badge: '1,204' },
  workspace: [
    { id: 'members', label: 'Members', icon: Users, badge: '1,204' },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'audit', label: 'Audit log', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
    { id: 'help', label: 'Help centre', icon: CircleHelp },
  ],
  tasks: [],
  activity: [],
  unread: 12345,
  dueThisWeek: 0,
  needReview: 0,
};

export const BUSY_USER = {
  name: 'Alexandrina Wolfeschlegelstein-Montgomery',
  email: 'alexandrina.wolfeschlegelstein-montgomery@fernhill-international.example',
};

/** The page of the extreme state: one task under review, with a long title and a long thread. */
export const REVIEW_PAGE = {
  title: 'Review and approve the pricing page copy for the Q4 enterprise launch across all regions',
  topbarTitle: 'Copy review round 3 · Pricing page · Marketing site',
  trail: [
    { label: BUSY_WORKSPACE.name },
    { label: 'Marketing site' },
    { label: 'Pricing page' },
    { label: 'Copy review round 3' },
  ],
  due: 'Due Monday, 2 November 2026',
  comments: '999+ comments',
  threads: [
    {
      id: 'c1',
      who: 'Lena Hofmann',
      title:
        'Can we keep the annual toggle default-on for the enterprise tier in every region, including regulated markets?',
      due: { label: 'Today', urgency: 'today' },
      replies: '999+',
    },
    {
      id: 'c2',
      who: 'Daniel Okafor',
      title: 'Headline is too long on mobile',
      due: { label: 'Tomorrow', urgency: 'soon' },
      replies: '48',
    },
    {
      id: 'c3',
      who: 'Sofia Marchetti',
      title: 'Confirm the euro price points with finance before the copy freeze on Monday morning',
      due: { label: 'Mon 2 Nov', urgency: 'later' },
      replies: '112',
    },
    {
      id: 'c4',
      who: 'Tomas Eriksen',
      title: 'Footnote 3 contradicts the cancellation policy',
      due: { label: 'Mon 2 Nov', urgency: 'later' },
      replies: '7',
    },
  ] satisfies Array<{ id: string; who: string; title: string; due: Due; replies: string }>,
};
