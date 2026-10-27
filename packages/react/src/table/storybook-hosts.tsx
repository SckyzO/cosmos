import { useState } from 'react';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { StatusBadge } from '../status/StatusBadge';
import type { HealthStatus } from '../status/types';
import type { ColumnDef, ColumnEdit } from './types';

// The hosts the stories of expandable rows, pinned columns and inline editing share: fixed values,
// and a fake save that always refuses one of them. Stories only, not part of the package.

export type Host = {
  host: string;
  rack: string;
  dc: string;
  ip: string;
  cpu: number;
  memory: number;
  disk: number;
  owner: string;
  note: string;
  updated: string;
  status: HealthStatus;
};

const row = (
  host: string,
  rack: string,
  dc: string,
  ip: string,
  [cpu, memory, disk]: [number, number, number],
  owner: string,
  updated: string,
  status: HealthStatus,
  note = ''
): Host => ({ host, rack, dc, ip, cpu, memory, disk, owner, note, updated, status });

export const HOSTS: Host[] = [
  row('node-a01', 'R-12', 'PAR-1', '10.0.12.41', [34, 52, 48], 'Platform', '2 min ago', 'OK'),
  row(
    'node-a02',
    'R-12',
    'PAR-1',
    '10.0.12.42',
    [81, 77, 63],
    'Platform',
    '5 min ago',
    'WARN',
    'Fan 3 replaced on 10/24'
  ),
  row('node-b07', 'R-14', 'PAR-1', '10.0.14.17', [97, 91, 88], 'Storage', '1 min ago', 'CRIT'),
  row('node-b08', 'R-14', 'PAR-1', '10.0.14.18', [22, 40, 35], 'Storage', '9 min ago', 'OK'),
  row('node-c03', 'R-20', 'PAR-2', '10.0.20.13', [45, 61, 52], 'Compute', '3 min ago', 'OK'),
  row('node-c04', 'R-20', 'PAR-2', '10.0.20.14', [12, 28, 19], 'Compute', '12 min ago', 'OK'),
  row('node-c05', 'R-20', 'PAR-2', '10.0.20.15', [66, 70, 57], 'Compute', '4 min ago', 'WARN'),
];

export const OWNERS = ['Platform', 'Storage', 'Compute'];

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
    align: 'right',
    render: (r) => `${r.cpu}%`,
  },
  {
    key: 'memory',
    label: 'Memory',
    width: '100px',
    align: 'right',
    render: (r) => `${r.memory}%`,
  },
  { key: 'disk', label: 'Disk', width: '90px', align: 'right', render: (r) => `${r.disk}%` },
  { key: 'owner', label: 'Owner', width: '130px', render: (r) => r.owner },
  { key: 'updated', label: 'Updated', width: '130px', render: (r) => r.updated },
  {
    key: 'status',
    label: 'Status',
    width: '120px',
    render: (r) => <StatusBadge status={r.status} label={STATUS_LABEL[r.status]} />,
  },
];

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
