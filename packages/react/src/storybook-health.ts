import type { HealthCheck, HealthCheckGroup } from './status/health';
import type { HealthMatrixColumn, HealthMatrixRow } from './status/HealthMatrix';
import type { HealthStatus } from './status/types';

// Fixed data for the health stories: one moment, so every "30 s ago" reads the same on every run.

/** The moment the stories freeze their relative times at. */
export const HEALTH_NOW = Date.UTC(2026, 0, 15, 10, 0, 0);

const ago = (seconds: number) => HEALTH_NOW - seconds * 1000;

const check = (
  id: string,
  name: string,
  status: HealthStatus,
  extra: Partial<HealthCheck> = {}
): HealthCheck => ({ id, name, status, checkedAt: ago(30), ...extra });

/** Fourteen checks in four groups: two warnings, twelve OK. */
export const HEALTH_GROUPS: HealthCheckGroup[] = [
  {
    id: 'queue',
    name: 'Queue',
    checks: [
      check('jobs', 'Job queue', 'WARN', {
        target: 'redis://queue:6379/0',
        message: '312 jobs waiting (limit 200)',
        latency: 4,
        output: 'queue=default depth=312 oldest=94s\nworkers=4/4 busy  processed_1m=58',
      }),
    ],
  },
  {
    id: 'apis',
    name: 'External APIs',
    checks: [
      check('prometheus', 'Prometheus API', 'WARN', {
        target: 'http://prometheus:9090',
        message: 'p95 1.8 s, above 1 s',
        latency: 1820,
      }),
      check('alertmanager', 'Alertmanager', 'OK', {
        target: 'http://alertmanager:9093',
        latency: 42,
      }),
      check('smtp', 'SMTP relay', 'OK', { target: 'smtp://mail.example.test:587', latency: 120 }),
    ],
  },
  {
    id: 'db',
    name: 'Database',
    checks: [
      check('primary', 'Primary DB', 'OK', { message: 'Replication lag 0.2 s', latency: 3 }),
      check('replica', 'Replica DB', 'OK', { message: 'Replication lag 0.4 s', latency: 4 }),
      check('migrations', 'Migrations', 'OK', { message: 'Up to date' }),
    ],
  },
  {
    id: 'storage',
    name: 'Cache and storage',
    checks: [
      check('redis', 'Redis cache', 'OK', { message: 'Hit ratio 94%', latency: 1 }),
      check('objects', 'Object store', 'OK', { message: 'Bucket writable', latency: 36 }),
      check('disk-var', 'Disk /var', 'OK', { message: '61% used' }),
      check('disk-data', 'Disk /data', 'OK', { message: '48% used' }),
      check('backups', 'Backups', 'OK', { message: 'Last at 03:00' }),
      check('tls', 'TLS certificate', 'OK', { message: '62 days left' }),
      check('ntp', 'NTP', 'OK', { message: 'Offset 4 ms' }),
    ],
  },
];

/** One check per status, in no particular order. */
export const EVERY_STATUS: HealthCheck[] = [
  check('ok', 'Primary DB', 'OK', {
    target: 'postgres://db:5432',
    message: 'Reachable',
    latency: 3,
  }),
  check('info', 'Certificate renewal', 'INFO', {
    message: 'Renewal scheduled for Monday',
  }),
  check('unknown', 'Search index', 'UNKNOWN', {
    target: 'http://search:9200',
    message: 'The probe timed out, no result',
    checkedAt: ago(900),
  }),
  check('crit', 'Payment gateway', 'CRIT', {
    target: 'https://pay.example.test/health',
    message: 'HTTP 503 from the gateway',
    latency: 5000,
    output: 'HTTP/1.1 503 Service Unavailable\nretry-after: 30\n\nupstream connect error',
  }),
  check('warn', 'Job queue', 'WARN', { message: '312 jobs waiting (limit 200)', latency: 4 }),
];

/** Checks of one status, as many as asked, for a summary. */
export const checksOf = (counts: Partial<Record<HealthStatus, number>>): HealthCheck[] =>
  (Object.entries(counts) as [HealthStatus, number][]).flatMap(([status, n]) =>
    Array.from({ length: n }, (_, i) =>
      check(`${status}-${i}`, `${status} check ${i + 1}`, status, { latency: 10 + i })
    )
  );

/** A message long enough to wrap on a narrow screen, with an unbreakable URL in it. */
export const LONG_MESSAGE =
  'The upstream answered with an invalid certificate chain: the intermediate authority expired two days ago and the gateway has refused every connection since then. See https://status.example.test/incidents/2026-01-13/certificate-chain-expired for the timeline and the rollback steps that were tried.';

/** A dependency tree: the API, what it needs, and what those need. */
export const DEPENDENCY_TREE: HealthCheckGroup[] = [
  {
    id: 'api',
    name: 'API',
    checks: [check('api-http', 'HTTP endpoint', 'OK', { target: 'https://api.example.test' })],
    groups: [
      {
        id: 'db',
        name: 'Database',
        checks: [check('db-primary', 'Primary', 'OK', { latency: 3 })],
        groups: [
          {
            id: 'storage',
            name: 'Block storage',
            checks: [
              check('disk-data', 'Volume /data', 'WARN', { message: '91% used', latency: 12 }),
            ],
          },
        ],
      },
      {
        id: 'auth',
        name: 'Identity provider',
        checks: [
          check('idp', 'OIDC discovery', 'CRIT', {
            target: 'https://idp.example.test/.well-known/openid-configuration',
            message: 'Connection refused',
          }),
        ],
      },
      {
        id: 'cache',
        name: 'Cache',
        checks: [check('redis', 'Redis', 'OK', { latency: 1 })],
      },
    ],
  },
];

/** Many checks, grouped by a team: the same shape repeated, a few failing. */
export const MANY_GROUPS: HealthCheckGroup[] = ['Edge', 'Core', 'Data', 'Jobs'].map((name, g) => ({
  id: name.toLowerCase(),
  name,
  checks: Array.from({ length: 8 }, (_, i) => {
    const n = g * 8 + i;
    const status: HealthStatus =
      n % 11 === 4 ? 'WARN' : n === 19 ? 'CRIT' : n === 26 ? 'UNKNOWN' : 'OK';
    return check(`${name}-${i}`, `${name} service ${i + 1}`, status, {
      target: `http://${name.toLowerCase()}-${i + 1}.internal:8080`,
      latency: 5 + ((n * 37) % 120),
      checkedAt: ago(10 + ((n * 13) % 50)),
    });
  }),
}));

const NODES = [
  'par-1a',
  'par-1b',
  'par-1c',
  'par-2a',
  'par-2b',
  'par-2c',
  'fra-1a',
  'fra-1b',
  'fra-1c',
  'ams-1a',
  'ams-1b',
  'ams-1c',
  'lon-1a',
  'lon-1b',
  'lon-1c',
  'lon-2a',
  'mad-1a',
  'mad-1b',
  'osl-1a',
  'osl-1b',
];
const SERVICES = ['API', 'Scheduler', 'Collector', 'Database', 'Cache', 'Web UI'];

const ODD: Record<string, HealthStatus> = {
  '0-4': 'WARN',
  '1-9': 'UNKNOWN',
  '2-6': 'CRIT',
  '2-7': 'WARN',
  '4-12': 'WARN',
  '5-3': 'UNKNOWN',
  '3-15': 'INFO',
  '0-17': 'CRIT',
};

const MESSAGES: Partial<Record<HealthStatus, string>> = {
  WARN: 'p95 latency 1.4 s, above 1 s',
  CRIT: 'No answer for 3 checks in a row',
  UNKNOWN: 'The node is not reporting',
  INFO: 'Maintenance window tonight',
};

/** The matrix columns: twenty nodes. */
export const MATRIX_COLUMNS: HealthMatrixColumn[] = NODES.map((node) => ({
  id: node,
  label: node,
}));

/** The matrix rows: six services on twenty nodes, with a few cells that are not OK. */
export const MATRIX_ROWS: HealthMatrixRow[] = SERVICES.map((label, r) => ({
  id: label.toLowerCase().replace(/\s/g, '-'),
  label,
  cells: Object.fromEntries(
    NODES.map((node, c) => {
      const status = ODD[`${r}-${c}`] ?? 'OK';
      return [
        node,
        {
          status,
          message: MESSAGES[status],
          checkedAt: ago(30),
          latency: 8 + ((r * 31 + c * 7) % 90),
        },
      ];
    })
  ),
}));
