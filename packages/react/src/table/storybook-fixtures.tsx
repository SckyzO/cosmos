import { useState } from 'react';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import { placeholderAvatar } from '../storybook-avatars';
import { Badge } from '../ui/Badge';
import { TableIdentityCell } from './cells';
import type { ColumnDef, ColumnEdit } from './types';

// The rows and columns the table stories share, by domain: hosts, people and orders. Fixed values
// and generators with nothing random in them, so every run draws the same table. A story takes its
// rows from here and changes a variant with a column transform, instead of building a table of its
// own. Stories only, not part of the package.

// ── Column transforms ────────────────────────────────────────────────────────
// A variant of a table is its columns changed, not a table of its own.

const columnOf = <T,>(columns: ColumnDef<T>[], key: string): ColumnDef<T> => {
  const found = columns.find((c) => c.key === key);
  if (!found) throw new Error(`No column "${key}" among ${columns.map((c) => c.key).join(', ')}`);
  return found;
};

/** The columns with these keys, in the order given. */
export const pickColumns = <T,>(columns: ColumnDef<T>[], keys: string[]): ColumnDef<T>[] =>
  keys.map((key) => columnOf(columns, key));

/** The same columns with each key of `patches` changed: a label, a width, `defaultHidden`… */
export const patchColumns = <T,>(
  columns: ColumnDef<T>[],
  patches: Record<string, Partial<ColumnDef<T>>>
): ColumnDef<T>[] => {
  for (const key of Object.keys(patches)) columnOf(columns, key);
  return columns.map((c) => (c.key in patches ? { ...c, ...patches[c.key] } : c));
};

/**
 * Pins the columns of `start` to the start edge and those of `end` to the end edge. They move
 * there, in the order given: a pinned column keeps its place in the list, first or last.
 */
export const withPins = <T,>(
  columns: ColumnDef<T>[],
  { start = [], end = [] }: { start?: string[]; end?: string[] }
): ColumnDef<T>[] => {
  const pinned = new Set([...start, ...end]);
  return [
    ...start.map((key) => ({ ...columnOf(columns, key), pin: 'start' as const })),
    ...columns.filter((c) => !pinned.has(c.key)),
    ...end.map((key) => ({ ...columnOf(columns, key), pin: 'end' as const })),
  ];
};

/**
 * A 5rem minimum on every column. A table of percentage widths needs its smallest column over its
 * share (8rem at 12% is 1067px), so with the default minimum it scrolls in a docs page; with this
 * one it fits.
 */
export const narrowMins = <T,>(columns: ColumnDef<T>[]): ColumnDef<T>[] =>
  columns.map((c) => ({ ...c, minWidth: '5rem' }));

/** The Name column drawn as a person: a placeholder avatar, the name and the email under it. */
export const withIdentity = <T extends { name: string; email: string }>(
  columns: ColumnDef<T>[]
): ColumnDef<T>[] =>
  patchColumns(columns, {
    name: {
      render: (r) => (
        <TableIdentityCell title={r.name} subtitle={r.email} src={placeholderAvatar(r.name, 80)} />
      ),
    },
  });

// ── Hosts ────────────────────────────────────────────────────────────────────

export type Host = {
  host: string;
  rack: string;
  room: string;
  dc: string;
  ip: string;
  cpu: number;
  memory: number;
  disk: number;
  owner: string;
  note: string;
  updated: string;
  status: HealthStatus;
  /** What the host last raised an alert about. */
  metric: string;
};

/** Seven hosts with values of their own: the stories that name a host (`node-a02`) read these. */
export const HOSTS: Host[] = [
  {
    host: 'node-a01',
    rack: 'R-12',
    room: 'Room A',
    dc: 'PAR-1',
    ip: '10.0.12.41',
    cpu: 34,
    memory: 52,
    disk: 48,
    owner: 'Platform',
    note: '',
    updated: '2 min ago',
    status: 'OK',
    metric: 'cpu',
  },
  {
    host: 'node-a02',
    rack: 'R-12',
    room: 'Room A',
    dc: 'PAR-1',
    ip: '10.0.12.42',
    cpu: 81,
    memory: 77,
    disk: 63,
    owner: 'Platform',
    note: 'Fan 3 replaced on 10/24',
    updated: '5 min ago',
    status: 'WARN',
    metric: 'temp',
  },
  {
    host: 'node-b07',
    rack: 'R-14',
    room: 'Room B',
    dc: 'PAR-1',
    ip: '10.0.14.17',
    cpu: 97,
    memory: 91,
    disk: 88,
    owner: 'Storage',
    note: '',
    updated: '1 min ago',
    status: 'CRIT',
    metric: 'cpu',
  },
  {
    host: 'node-b08',
    rack: 'R-14',
    room: 'Room B',
    dc: 'PAR-1',
    ip: '10.0.14.18',
    cpu: 22,
    memory: 40,
    disk: 35,
    owner: 'Storage',
    note: '',
    updated: '9 min ago',
    status: 'OK',
    metric: 'disk',
  },
  {
    host: 'node-c03',
    rack: 'R-20',
    room: 'Room C',
    dc: 'PAR-2',
    ip: '10.0.20.13',
    cpu: 45,
    memory: 61,
    disk: 52,
    owner: 'Compute',
    note: '',
    updated: '3 min ago',
    status: 'OK',
    metric: 'memory',
  },
  {
    host: 'node-c04',
    rack: 'R-20',
    room: 'Room C',
    dc: 'PAR-2',
    ip: '10.0.20.14',
    cpu: 12,
    memory: 28,
    disk: 19,
    owner: 'Compute',
    note: '',
    updated: '12 min ago',
    status: 'OK',
    metric: 'network',
  },
  {
    host: 'node-c05',
    rack: 'R-20',
    room: 'Room C',
    dc: 'PAR-2',
    ip: '10.0.20.15',
    cpu: 66,
    memory: 70,
    disk: 57,
    owner: 'Compute',
    note: '',
    updated: '4 min ago',
    status: 'WARN',
    metric: 'power',
  },
];

export const OWNERS = ['Platform', 'Storage', 'Compute'];
const STATUSES: HealthStatus[] = ['OK', 'WARN', 'CRIT', 'INFO'];
const METRICS = ['cpu', 'memory', 'temp', 'power', 'disk', 'network'];
const DCS = ['PAR-1', 'PAR-2', 'LYS-1'];
const ROOMS = ['Room A', 'Room B', 'Room C'];

/**
 * `count` hosts named `node-00001`, `node-00002`…, for the stories that need a long list (60 rows to
 * page, 10,000 to window). Their values are a function of the row's index: the same list on every
 * run.
 */
export const makeHosts = (count: number): Host[] =>
  Array.from({ length: count }, (_, i) => {
    const rack = 10 + (i % 12);
    return {
      host: `node-${String(i + 1).padStart(5, '0')}`,
      rack: `R-${rack}`,
      room: ROOMS[i % ROOMS.length],
      dc: DCS[i % DCS.length],
      ip: `10.0.${rack}.${(i % 250) + 1}`,
      cpu: (i * 37) % 100,
      memory: (i * 53 + 11) % 100,
      disk: (i * 29 + 7) % 100,
      owner: OWNERS[i % OWNERS.length],
      note: '',
      updated: `${(i % 59) + 1} min ago`,
      status: STATUSES[i % STATUSES.length],
      metric: METRICS[i % METRICS.length],
    };
  });

const STATUS_LABEL: Record<HealthStatus, string> = {
  OK: 'Healthy',
  WARN: 'Warning',
  CRIT: 'Critical',
  UNKNOWN: 'Unknown',
  INFO: 'Info',
};

const textEditor = (initialValue: (r: Host) => string): ColumnEdit<Host> => ({
  initialValue,
  render: (e) => (
    <Input
      {...e.fieldProps}
      size="sm"
      value={e.value}
      onChange={(ev) => e.setValue(ev.target.value)}
    />
  ),
});

const ownerEditor: ColumnEdit<Host> = {
  initialValue: (r) => r.owner,
  render: (e) => (
    <Select
      {...e.fieldProps}
      size="sm"
      options={OWNERS.map((o) => ({ value: o, label: o }))}
      value={e.value}
      onChange={(ev) => e.setValue(ev.target.value)}
    />
  ),
};

/** The columns every hosts story starts from; none is pinned or editable. */
export const hostColumns: ColumnDef<Host>[] = [
  {
    key: 'host',
    label: 'Host',
    width: '150px',
    sortable: true,
    sortValue: (r) => r.host,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.host}</span>,
  },
  { key: 'rack', label: 'Rack', width: '120px', render: (r) => r.rack },
  { key: 'dc', label: 'Datacenter', width: '130px', render: (r) => r.dc },
  { key: 'ip', label: 'IP address', width: '140px', render: (r) => r.ip },
  {
    key: 'cpu',
    label: 'CPU',
    width: '90px',
    align: 'end',
    render: (r) => `${r.cpu}%`,
  },
  {
    key: 'memory',
    label: 'Memory',
    width: '100px',
    align: 'end',
    render: (r) => `${r.memory}%`,
  },
  { key: 'disk', label: 'Disk', width: '90px', align: 'end', render: (r) => `${r.disk}%` },
  { key: 'owner', label: 'Owner', width: '130px', render: (r) => r.owner },
  { key: 'updated', label: 'Updated', width: '130px', render: (r) => r.updated },
  {
    key: 'status',
    label: 'Status',
    width: '120px',
    render: (r) => <StatusBadge status={r.status} label={STATUS_LABEL[r.status]} />,
  },
];

/**
 * The columns of an alerts list, the table a page of the docs shows: sortable, filterable and
 * searchable by name. Percentage widths with a narrow minimum, so the table fits the docs page.
 */
export const alertColumns = narrowMins<Host>([
  {
    key: 'status',
    label: 'Severity',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.status,
    filterValue: (r) => r.status,
    render: (r) => <StatusBadge status={r.status} size="md" />,
  },
  {
    key: 'host',
    label: 'Name',
    width: '20%',
    sortable: true,
    sortValue: (r) => r.host,
    searchValue: (r) => r.host,
    render: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.host}</span>,
  },
  {
    key: 'metric',
    label: 'Type',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.metric,
    filterValue: (r) => r.metric,
    render: (r) => r.metric,
  },
  {
    key: 'dc',
    label: 'Location',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.dc,
    filterValue: (r) => r.dc,
    render: (r) => r.dc,
  },
  {
    key: 'rack',
    label: 'Rack',
    width: '12%',
    sortable: true,
    sortValue: (r) => r.rack,
    render: (r) => r.rack,
  },
  {
    key: 'room',
    label: 'Room',
    width: '12%',
    sortable: true,
    filterable: true,
    sortValue: (r) => r.room,
    filterValue: (r) => r.room,
    render: (r) => r.room,
  },
]);

/** The columns of the editing stories: Rack, Owner and Note take an editor. */
export const editableColumns: ColumnDef<Host>[] = [
  hostColumns[0],
  { ...hostColumns[1], width: '170px', edit: textEditor((r) => r.rack) },
  { ...hostColumns[7], width: '190px', edit: ownerEditor },
  {
    key: 'note',
    label: 'Note',
    render: (r) => r.note || '—',
    edit: textEditor((r) => r.note),
  },
  hostColumns[9],
  hostColumns[8],
];

/** The host whose save the fake server always refuses. */
export const REFUSED_HOST = 'node-b08';

/**
 * A fake save: it takes `delay` ms, applies the change to the state, and rejects for
 * `REFUSED_HOST`. Returns the table's rows and the two save handlers.
 */
export const useFakeSaves = (delay = 40) => {
  const [rows, setRows] = useState(HOSTS);
  const apply = (host: string, changes: Record<string, string>) =>
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (host === REFUSED_HOST) {
          reject(new Error('Not saved: the server refused the change.'));
          return;
        }
        setRows((prev) => prev.map((r) => (r.host === host ? { ...r, ...changes } : r)));
        resolve();
      }, delay);
    });
  return {
    rows,
    onCellEdit: (r: Host, key: string, value: string) => apply(r.host, { [key]: value }),
    onRowEdit: (r: Host, changes: Record<string, string>) => apply(r.host, changes),
  };
};

// ── People ───────────────────────────────────────────────────────────────────

export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  city: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastSeen: string;
};

const PEOPLE_ROWS: [string, string, string, string, Person['status'], string][] = [
  ['Ada Lovelace', 'Engineer', 'Core', 'London', 'Active', '2 min ago'],
  ['Grace Hopper', 'Admiral', 'Navy', 'New York', 'Active', '1 h ago'],
  ['Linus Torvalds', 'Engineer', 'Kernel', 'Portland', 'Suspended', '3 weeks ago'],
  ['Margaret Hamilton', 'Director', 'Core', 'Boston', 'Active', 'yesterday'],
  ['Alan Turing', 'Researcher', 'Crypto', 'Manchester', 'Invited', 'never'],
  ['Zoë Kowalski', 'Engineer', 'Core', 'Kraków', 'Active', '5 min ago'],
  ['Edsger Dijkstra', 'Engineer', 'Core', 'Eindhoven', 'Active', '4 h ago'],
  ['Barbara Liskov', 'Engineer', 'Core', 'Boston', 'Invited', 'never'],
  ['Ken Thompson', 'Engineer', 'Core', 'New Orleans', 'Suspended', '3 days ago'],
  ['Dennis Ritchie', 'Engineer', 'Core', 'Bronxville', 'Active', '2 days ago'],
  ['Donald Knuth', 'Engineer', 'Core', 'Milwaukee', 'Invited', 'never'],
  ['Tim Berners-Lee', 'Engineer', 'Web', 'London', 'Active', '12 min ago'],
];

/**
 * Twelve people, in this order: `user-1` is Ada Lovelace. Seven are active, three invited and two
 * suspended; five engineers of the Core team have an "o" in their name (Zoë Kowalski, Ken
 * Thompson, Donald Knuth, Barbara Liskov, Ada Lovelace).
 */
export const PEOPLE: Person[] = PEOPLE_ROWS.map(
  ([name, role, team, city, status, lastSeen], i) => ({
    id: `user-${i + 1}`,
    name,
    email: `${name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(' ', '.')}@example.com`,
    role,
    team,
    city,
    status,
    lastSeen,
  })
);

const PERSON_STATUS_INTENT = { Active: 'success', Invited: 'info', Suspended: 'danger' } as const;

/**
 * The columns of a people list: Name (sortable, searched), Email, Role (sortable, filterable),
 * Team and Status (filterable), City and Last seen.
 */
export const peopleColumns: ColumnDef<Person>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    sortValue: (p) => p.name,
    searchValue: (p) => p.name,
    render: (p) => <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>,
  },
  { key: 'email', label: 'Email', render: (p) => p.email },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    filterable: true,
    sortValue: (p) => p.role,
    filterValue: (p) => p.role,
    render: (p) => p.role,
  },
  {
    key: 'team',
    label: 'Team',
    filterable: true,
    filterValue: (p) => p.team,
    render: (p) => p.team,
  },
  { key: 'city', label: 'City', render: (p) => p.city },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    filterValue: (p) => p.status,
    render: (p) => <Badge intent={PERSON_STATUS_INTENT[p.status]}>{p.status}</Badge>,
  },
  { key: 'lastSeen', label: 'Last seen', render: (p) => p.lastSeen },
];

// ── Orders ───────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  customer: string;
  status: 'Pending' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  /** In euros. */
  total: number;
};

/** Every status an order goes through, in the order of the flow. */
export const ORDER_STATUSES: Order['status'][] = [
  'Pending',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

// The eight orders with values of their own: the stories that name one (`BK-20420`) read these.
const ORDERS_HEAD: [string, Order['status'], Order['payment'], number][] = [
  ['Maya Lindqvist', 'Pending', 'Pending', 64.8],
  ['Tomás Herrera', 'Packed', 'Paid', 18.5],
  ['Aiko Tanaka', 'Packed', 'Paid', 112.3],
  ['Oliver Brandt', 'Shipped', 'Paid', 39],
  ['Fatima Okonkwo', 'Packed', 'Paid', 87.4],
  ['Lucas Moreau', 'Delivered', 'Paid', 24.9],
  ['Sofia Petrov', 'Cancelled', 'Failed', 41.6],
  ['Daniel Whitfield', 'Delivered', 'Paid', 143.2],
];

/**
 * `count` orders, the newest first: `BK-20421`, `BK-20420`… The first eight are the ones with
 * values of their own (Maya Lindqvist is `BK-20421`); the others cycle through the same customers,
 * with statuses and totals that are a function of the row's index, so every run gets the same
 * list: 8 to select from, 10,000 for a server to page.
 */
export const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, i) => {
    const id = `BK-${20421 - i}`;
    const head = ORDERS_HEAD[i];
    if (head) {
      const [customer, status, payment, total] = head;
      return { id, customer, status, payment, total };
    }
    const status = ORDER_STATUSES[(i * 3 + Math.floor(i / 7)) % ORDER_STATUSES.length];
    return {
      id,
      customer: ORDERS_HEAD[(i * 5) % ORDERS_HEAD.length][0],
      status,
      payment:
        status === 'Pending'
          ? 'Pending'
          : status !== 'Cancelled'
            ? 'Paid'
            : i % 2
              ? 'Refunded'
              : 'Failed',
      total: ((i * 7919) % 49_900) / 100 + 5,
    };
  });

/** The columns of an orders list: sortable order number, customer and total; filterable status and payment. */
export const orderColumns: ColumnDef<Order>[] = [
  {
    key: 'id',
    label: 'Order',
    mobile: 'title',
    sortable: true,
    sortValue: (r) => r.id,
    render: (r) => r.id,
  },
  {
    key: 'customer',
    label: 'Customer',
    sortable: true,
    sortValue: (r) => r.customer,
    searchValue: (r) => r.customer,
    render: (r) => r.customer,
  },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    filterValue: (r) => r.status,
    render: (r) => r.status,
  },
  {
    key: 'payment',
    label: 'Payment',
    filterable: true,
    filterValue: (r) => r.payment,
    render: (r) => r.payment,
  },
  {
    key: 'total',
    label: 'Total',
    align: 'end',
    sortable: true,
    sortValue: (r) => r.total,
    render: (r) => `€${r.total.toFixed(2)}`,
  },
];
