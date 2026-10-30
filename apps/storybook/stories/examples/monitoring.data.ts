// The data of the Monitoring recipe: "Rackwatch" watching Atlas, the HPC cluster of a university
// research datacenter. Everything is fictional and fixed (no clock, no random), so a story reads
// the same on every run.

import type {
  Beat,
  HealthCheck,
  HealthCheckGroup,
  HealthMatrixColumn,
  HealthMatrixRow,
  HealthStatus,
  LogLine,
  UptimeDay,
} from '../../../../packages/react/src';

/** "Now" for every relative time of the screen: Thursday 29 October 2026, 14:32:19 UTC. */
export const NOW = Date.UTC(2026, 9, 29, 14, 32, 19);

const ago = (seconds: number) => NOW - seconds * 1000;

/** When Prometheus stopped answering: the error state shows the data it had until then. */
export const STALE_SINCE = ago(4 * 60);

// ── Nodes by rack ────────────────────────────────────────────────────────────

/** One letter per node: o OK, w warning, c critical, u unknown. */
const STATUS_OF: Record<string, HealthStatus> = { o: 'OK', w: 'WARN', c: 'CRIT', u: 'UNKNOWN' };

type RackSpec = {
  /** The row header. */
  label: string;
  /** The hostname prefix; a node is `<prefix>-<NN>`. */
  prefix: string;
  /** The status of each node, left to right. */
  pattern: string;
};

/** The eight racks of Atlas, twelve nodes each: 96 nodes. */
const RACKS: RackSpec[] = [
  { label: 'A01', prefix: 'cn-a01', pattern: 'oooooooooooo' },
  { label: 'A02', prefix: 'cn-a02', pattern: 'oooooowooooo' },
  { label: 'A03', prefix: 'cn-a03', pattern: 'oooowooooooc' },
  { label: 'A04', prefix: 'cn-a04', pattern: 'oooooooooouo' },
  { label: 'B01', prefix: 'gpu-b01', pattern: 'ooocoooooooo' },
  { label: 'B02', prefix: 'gpu-b02', pattern: 'owoooooooooo' },
  { label: 'C01', prefix: 'oss-c01', pattern: 'oocwoooooooo' },
  { label: 'C02', prefix: 'mds-c02', pattern: 'oooooooowooo' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** What a probe said about the nodes that are not fine. */
const PROBLEMS: Record<string, { message: string; latency?: number }> = {
  'cn-a02-07': { message: 'Load average 97 on 64 cores for 15 minutes', latency: 640 },
  'cn-a03-05': { message: 'Memory 93% used, swapping', latency: 410 },
  'cn-a03-12': { message: 'node_exporter did not answer: context deadline exceeded' },
  'cn-a04-11': { message: 'Added to Prometheus 2 minutes ago, no sample yet' },
  'gpu-b01-04': { message: 'Xid 79: GPU 3 has fallen off the bus' },
  'gpu-b02-02': { message: 'GPU 5 at 86 °C, above 83 °C', latency: 120 },
  'oss-c01-03': { message: 'Lustre OST0012 is not responding' },
  'oss-c01-04': { message: '14 clients evicted in the last 5 minutes', latency: 880 },
  'mds-c02-09': { message: 'Metadata queue at 312 requests, limit 200', latency: 950 },
};

/** The columns of the matrix: the position of a node in its rack, 01 to the node count. */
export const columnsOf = (count: number): HealthMatrixColumn[] =>
  Array.from({ length: count }, (_, i) => ({ id: pad(i + 1), label: pad(i + 1) }));

export const NODE_COLUMNS = columnsOf(12);

export type Cluster = {
  /** One row per rack, one cell per node: for the matrix. */
  rows: HealthMatrixRow[];
  /** One check per node, in rack order: for the summary. */
  checks: HealthCheck[];
};

/**
 * The matrix rows and the summary's checks of the same nodes, so the counts of one are the cells
 * of the other. `checkedAt` is when the probes last ran.
 */
const buildCluster = (
  racks: { label: string; prefix: string; statuses: HealthStatus[] }[],
  checkedAt: number
): Cluster => {
  const checks: HealthCheck[] = [];
  const rows = racks.map(({ label, prefix, statuses }) => ({
    id: label,
    label,
    cells: Object.fromEntries(
      statuses.map((status, i) => {
        const host = `${prefix}-${pad(i + 1)}`;
        const problem = PROBLEMS[host];
        const cell = { status, checkedAt, ...problem };
        checks.push({ id: host, name: host, target: `${host}:9100`, ...cell });
        return [pad(i + 1), cell];
      })
    ),
  }));
  return { rows, checks };
};

const atlas = (checkedAt: number) =>
  buildCluster(
    RACKS.map(({ label, prefix, pattern }) => ({
      label,
      prefix,
      statuses: [...pattern].map((letter) => STATUS_OF[letter]!),
    })),
    checkedAt
  );

/** The cluster as the probes saw it 12 seconds ago. */
export const CLUSTER = atlas(ago(12));

/** The same nodes, as of the last answer Prometheus gave before it went down. */
export const STALE_CLUSTER = atlas(STALE_SINCE);

// ── Extreme content: 2,048 nodes ─────────────────────────────────────────────

export const EXTREME_COLUMNS = columnsOf(32);

// mulberry32: a small seeded generator, so the same nodes are warning on every run.
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Two racks named after their whole path, for a row header that will not fit.
const LONG_RACKS: Record<number, string> = {
  2: 'rack-a03-hall-north-row-2-position-14.atlas.rc.halden-university.example',
  44: 'gpu-rack-b07-hall-south-row-5.atlas.rc.halden-university.example',
};

const extremeCluster = (): Cluster => {
  const racks = 64;
  const perRack = EXTREME_COLUMNS.length;
  const statuses: HealthStatus[] = Array(racks * perRack).fill('OK');
  // The failover took 300 neighbouring nodes down at once: nine racks and a part of a tenth.
  const lost = 40 * perRack;
  for (let i = lost; i < lost + 300; i++) statuses[i] = 'CRIT';
  // Warnings and unknowns anywhere else, 214 and 102 of them.
  const random = seeded(2041);
  const rest = statuses.map((_, i) => i).filter((i) => statuses[i] === 'OK');
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  rest.slice(0, 214).forEach((i) => (statuses[i] = 'WARN'));
  rest.slice(214, 316).forEach((i) => (statuses[i] = 'UNKNOWN'));

  return buildCluster(
    Array.from({ length: racks }, (_, r) => {
      const hall = 'ABCDEFGH'[Math.floor(r / 8)]!;
      const label = LONG_RACKS[r] ?? `${hall}${pad((r % 8) + 1)}`;
      return {
        label,
        prefix: `n-${hall.toLowerCase()}${pad((r % 8) + 1)}`,
        statuses: statuses.slice(r * perRack, (r + 1) * perRack),
      };
    }),
    ago(12)
  );
};

export const EXTREME_CLUSTER = extremeCluster();

// ── Services ─────────────────────────────────────────────────────────────────

/** Beats from a pattern, oldest first, one letter each: u up, g degraded, d down. */
const beatsFrom = (pattern: string, everySeconds = 60, endAt = NOW): Beat[] =>
  [...pattern].map((letter, i) => {
    const status = letter === 'u' ? 'up' : letter === 'g' ? 'degraded' : 'down';
    return {
      time: endAt - (pattern.length - 1 - i) * everySeconds * 1000,
      status,
      latency: status === 'up' ? 150 + ((i * 37) % 80) : status === 'degraded' ? 1400 : 5003,
      message: status === 'degraded' ? 'Slow response: above 1 s' : undefined,
    };
  });

export type Service = {
  id: string;
  name: string;
  /** What the monitor checks: `TCP`, `HTTP`, `keyword`… */
  type: string;
  beats: Beat[];
  /** Uptime over 24 hours, 0 to 1. */
  uptime: number;
  /** Milliseconds. */
  latency: number;
};

const UP = 'u'.repeat(60);

export const SERVICES: Service[] = [
  {
    id: 'slurmctld',
    name: 'slurmctld',
    type: 'TCP',
    beats: beatsFrom(UP),
    uptime: 0.99998,
    latency: 4,
  },
  {
    id: 'lustre',
    name: 'Parallel filesystem',
    type: 'keyword',
    // The metadata server has been slow since the Lustre target went away.
    beats: beatsFrom('u'.repeat(40) + 'ugugggggggggggggggg' + 'g'),
    uptime: 0.9941,
    latency: 212,
  },
  {
    id: 'scheduler-api',
    name: 'Scheduler API',
    type: 'HTTP',
    beats: beatsFrom('u'.repeat(24) + 'g' + 'u'.repeat(35)),
    uptime: 0.9997,
    latency: 38,
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    type: 'HTTP',
    beats: beatsFrom(UP),
    uptime: 1,
    latency: 12,
  },
];

/** The same monitors as of the last check before Prometheus went down. */
export const STALE_SERVICES: Service[] = SERVICES.map((service) => ({
  ...service,
  beats: service.beats.slice(0, -4),
}));

/** Two monitors whose names fill the row and whose uptime has a lot of nines. */
export const EXTREME_SERVICES: Service[] = [
  {
    id: 'slurmctld-failover',
    name: 'slurmctld-backup-primary-failover.atlas.rc.halden-university.example',
    type: 'TCP',
    beats: beatsFrom(UP),
    // Reads 99.99%: an uptime is cut, never rounded up to 100%.
    uptime: 0.99999,
    latency: 3,
  },
  {
    id: 'lustre-mgs',
    name: 'lustre-mgs-mds-metadata-cluster-atlas-hall-c.rc.halden-university.example',
    type: 'keyword',
    beats: beatsFrom(UP),
    uptime: 0.99999,
    latency: 5,
  },
  SERVICES[2]!,
  SERVICES[3]!,
];

// ── The scheduler ────────────────────────────────────────────────────────────

/** 30 days of the scheduler, today last. The 12th day back had a restart. */
export const SCHEDULER_DAYS: UptimeDay[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(NOW - (29 - i) * 24 * 3_600_000).toISOString().slice(0, 10);
  return i === 17 ? { date, uptime: 0.9941, incidents: 1 } : { date, uptime: 1 };
});

const HOUR = 3_600_000;
export const SCHEDULER_PERIODS = [
  { label: '24 hours', uptime: 0.99998, duration: 24 * HOUR },
  { label: '7 days', uptime: 0.99994, duration: 7 * 24 * HOUR },
  { label: '30 days', uptime: 0.99981, duration: 30 * 24 * HOUR },
];

// ── Power ────────────────────────────────────────────────────────────────────

/** Cluster power in kW, one sample every two minutes, the newest last. */
export const POWER_TRACE = [
  405, 407, 404, 409, 412, 411, 415, 418, 416, 421, 424, 422, 427, 431, 429, 433, 436, 434, 438,
  441, 439, 443, 446, 444, 448, 450, 447, 451, 449, 452,
];

// ── Events ───────────────────────────────────────────────────────────────────

const at = (time: string) => `2026-10-29T${time}Z`;

/** Recent events, oldest first; the viewer shows the newest on top. */
export const EVENTS: LogLine[] = [
  {
    id: 1,
    time: at('14:31:57.102'),
    level: 'debug',
    source: 'api',
    message: 'GET /v1/nodes?rack=B01 200 in 21 ms',
  },
  {
    id: 2,
    time: at('14:31:58.774'),
    level: 'info',
    source: 'slurmctld',
    message: 'backfill: completed, 412 jobs tested',
  },
  {
    id: 3,
    time: at('14:32:00.250'),
    level: 'info',
    source: 'api',
    message: 'POST /v1/jobs 201 in 38 ms',
  },
  {
    id: 4,
    time: at('14:32:02.007'),
    level: 'warn',
    source: 'prometheus',
    message: 'scrape cn-a03-12:9100 failed: context deadline exceeded',
  },
  {
    id: 5,
    time: at('14:32:04.118'),
    level: 'error',
    source: 'gpu-b01-04',
    message: 'NVRM: Xid 79, GPU has fallen off the bus',
    fields: { gpu: 3, pci: '0000:8a:00', jobs_lost: 0 },
  },
  {
    id: 6,
    time: at('14:32:05.331'),
    level: 'info',
    source: 'slurmctld',
    message: 'sched: Allocate JobId=884561 NodeList=cn-a02-[03-06]',
  },
  {
    id: 7,
    time: at('14:32:06.980'),
    level: 'warn',
    source: 'slurmctld',
    message: 'Job 884213 requeued: node gpu-b01-04 set to DRAIN',
  },
  {
    id: 8,
    time: at('14:32:07.412'),
    level: 'error',
    source: 'lustre',
    message: 'OST0012 (oss-c01-03) not responding, evicting 14 clients',
    fields: { target: 'atlas-OST0012', clients: 14, rc: -107 },
  },
];

/** Three lines that do not fit on one: long sources, long messages. */
export const EXTREME_EVENTS: LogLine[] = [
  {
    id: 1,
    time: at('03:12:41.907'),
    level: 'fatal',
    source: 'mds-c02-001.fs.atlas.rc.halden-university.example',
    message:
      'LustreError 11-0: atlas-MDT0000 lost quorum after the failover, rc = -107, evicting 300 clients; in-flight jobs will be requeued by slurmctld',
  },
  {
    id: 2,
    time: at('03:12:42.350'),
    level: 'error',
    source: 'slurmctld',
    message:
      'error: node gpu-b01-04.rack-b01.hall-north.atlas.rc.halden-university.example registered with Invalid argument, setting state DRAIN',
  },
  {
    id: 3,
    time: at('03:12:44.018'),
    level: 'warn',
    source: 'prometheus',
    message:
      'scrape of 300 targets failed: context deadline exceeded after 10 s, retrying with exponential backoff',
  },
];

// ── The incident ─────────────────────────────────────────────────────────────

export const INCIDENT = {
  id: 'INC-2041',
  title: 'Lustre OST0012 is offline on oss-c01-03',
  detail: '14 jobs are stalled. Started 09:41.',
};

export const EXTREME_INCIDENT = {
  id: 'INC-2041',
  title:
    'parallel filesystem metadata servers lost quorum after the 03:12 power-feed failover on halls B and C, 300 nodes are unreachable and the scheduler is draining every partition except debug-short',
  detail: 'Started 03:12.',
};

// ── One node, for the phone ──────────────────────────────────────────────────

/** The health checks of gpu-b01-04, grouped as the node exporter reports them. */
export const NODE_CHECKS: HealthCheckGroup[] = [
  {
    id: 'gpu',
    name: 'GPU',
    checks: [
      {
        id: 'xid',
        name: 'GPU 3 · Xid errors',
        status: 'CRIT',
        message: 'Xid 79: GPU has fallen off the bus',
        checkedAt: ago(12),
        output:
          'NVRM: Xid (PCI:0000:8a:00): 79, GPU has fallen off the bus.\nnvidia-smi: Unable to determine the device handle for GPU3',
      },
      { id: 'temp', name: 'GPU temperature', status: 'OK', message: '61 °C', checkedAt: ago(12) },
      { id: 'ecc', name: 'ECC errors', status: 'OK', message: 'None', checkedAt: ago(12) },
      { id: 'mem', name: 'GPU memory', status: 'OK', message: '3% used', checkedAt: ago(12) },
    ],
  },
  {
    id: 'slurm',
    name: 'Slurm',
    checks: [
      {
        id: 'state',
        name: 'Node state',
        status: 'WARN',
        message: 'DRAIN: Xid 79 on GPU 3, 0 jobs left',
        checkedAt: ago(11),
      },
    ],
  },
  {
    id: 'system',
    name: 'System',
    checks: ['CPU load', 'Memory', 'Disk /scratch', 'Disk /var', 'NTP', 'IPMI'].map((name) => ({
      id: name,
      name,
      status: 'OK' as const,
      checkedAt: ago(14),
    })),
  },
  {
    id: 'network',
    name: 'Network',
    checks: ['InfiniBand ib0', 'InfiniBand ib1', 'Ethernet eth0', 'DNS'].map((name) => ({
      id: name,
      name,
      status: 'OK' as const,
      checkedAt: ago(14),
    })),
  },
];

export const NODE_FACTS: { label: string; value: string }[] = [
  { label: 'Rack', value: 'B01 · slot 04' },
  { label: 'Hardware', value: '8 × A100 80 GB' },
  { label: 'Partition', value: 'gpu-long' },
  { label: 'Running jobs', value: '0 (drained)' },
];

// ── The empty state's steps ──────────────────────────────────────────────────

export const SETUP_STEPS: { title: string; text: string; code: string }[] = [
  {
    title: 'Install node_exporter',
    text: 'On one compute node, for example cn-a01-01.',
    code: 'sudo systemctl enable --now node_exporter',
  },
  {
    title: 'Add it to Prometheus',
    text: 'Put the node in a scrape job, then reload.',
    code: "- targets: ['cn-a01-01:9100']",
  },
  {
    title: 'Connect Rackwatch',
    text: 'Paste the URL of your Prometheus server.',
    code: 'http://prom-01.rc.halden.example:9090',
  },
];
