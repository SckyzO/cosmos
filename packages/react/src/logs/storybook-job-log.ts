import { ANSI_COLORS } from './ansi';
import type { JobLogLine, JobLogStep } from './job-log';

// Fake job output for the stories: every line is a pure function of its index, so a story draws
// the same lines on every run and the live feed continues where the buffer ends. Internal to the
// package, not exported.

export const START = Date.parse('2026-01-15T09:30:00.000Z');

const ESC = '\x1b';
/** `text` in the SGR `code`, then reset. */
const sgr = (code: string, text: string) => `${ESC}[${code}m${text}${ESC}[0m`;

/** Lines of a step: each `[offset in ms from the start of the step, text]`. */
const stamped = (startedAt: number, specs: readonly (readonly [number, string])[]): JobLogLine[] =>
  specs.map(([at, text]) => ({ text, timestamp: startedAt + at }));

const SETUP_AT = START;
const INSTALL_AT = START + 3_000;
const TESTS_AT = START + 44_000;

/** A finished build: passed, failed and skipped steps, ANSI colours, a progress line and a link. */
export const BUILD_STEPS: readonly JobLogStep[] = [
  {
    id: 'set-up',
    name: 'Set up job',
    status: 'passed',
    duration: 3_000,
    startedAt: SETUP_AT,
    lines: stamped(SETUP_AT, [
      [0, 'Current runner version: 2.321.0'],
      [100, 'Operating system: Ubuntu 24.04.1 LTS'],
      [300, 'Runner image: ubuntu-24.04 (20260108.1)'],
      [900, `${sgr('2', 'Secret source: Actions')}`],
      [1_400, 'Prepare workflow directory'],
      [2_700, `Complete job name: ${sgr('1', 'test (node 24)')}`],
    ]),
  },
  {
    id: 'install',
    name: 'Install dependencies',
    status: 'passed',
    duration: 41_000,
    startedAt: INSTALL_AT,
    lines: stamped(INSTALL_AT, [
      [0, sgr('2', '$ pnpm install --frozen-lockfile')],
      [600, 'Lockfile is up to date, resolution step is skipped'],
      [
        1_800,
        'Progress: resolved 1, reused 0, downloaded 0, added 0\rProgress: resolved 312, reused 301, downloaded 11, added 120',
      ],
      [
        9_400,
        'Progress: resolved 1, reused 0\rProgress: resolved 698, reused 640, downloaded 58, added 698, done',
      ],
      [
        9_900,
        `${sgr('33', 'WARN')}  deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported`,
      ],
      [
        17_200,
        `${ESC}]8;;https://pnpm.io/errors${ESC}\\${sgr('4', 'Read the pnpm documentation')}${ESC}]8;;${ESC}\\`,
      ],
      [40_800, `Done in ${sgr('1;32', '40.8s')}`],
    ]),
  },
  {
    id: 'run-tests',
    name: 'Run tests',
    status: 'failed',
    duration: 72_000,
    startedAt: TESTS_AT,
    lines: stamped(TESTS_AT, [
      [0, sgr('2', '$ pnpm test')],
      [400, ` ${sgr('1;36', 'RUN')}  v3 /workspace`],
      [3_900, ` ${sgr('32', '✓')} src/table/csv.test.ts ${sgr('2', '(14 tests) 18ms')}`],
      [4_100, ` ${sgr('32', '✓')} src/table/columnVisibility.test.ts ${sgr('2', '(6 tests) 4ms')}`],
      [
        11_700,
        ` ${sgr('31', '✗')} src/table/pipeline.test.ts ${sgr('2', '(22 tests | 1 failed) 31ms')}`,
      ],
      [11_800, `   ${sgr('31', '✗')} sortRows ${sgr('2', '›')} keeps empty values last`],
      [
        11_900,
        sgr('31', '     AssertionError: expected [ 2, null, 1 ] to deeply equal [ 2, 1, null ]'),
      ],
      [12_000, sgr('2', '       at src/table/pipeline.test.ts:142:31')],
      [12_100, ''],
      [
        71_200,
        ` ${sgr('1', 'Test Files')}  ${sgr('1;31', '1 failed')} | ${sgr('32', '23 passed')} ${sgr('2', '(24)')}`,
      ],
      [
        71_300,
        ` ${sgr('1', '     Tests')}  ${sgr('1;31', '1 failed')} | ${sgr('32', '311 passed')} ${sgr('2', '(312)')}`,
      ],
      [71_800, sgr('33', ' WARN  1 test file took longer than 10 s, see slowest-tests.json')],
      [71_900, sgr('31', 'Process exited with code 1')],
    ]),
  },
  { id: 'build', name: 'Build', status: 'skipped', lines: [] },
  {
    id: 'post-cache',
    name: 'Post cache',
    status: 'passed',
    duration: 2_000,
    startedAt: START + 118_000,
    lines: stamped(START + 118_000, [
      [0, 'Post job cleanup.'],
      [800, 'Cache saved with key: pnpm-store-linux-9a1f3c'],
    ]),
  },
];

const PUSHED = ['api', 'web', 'worker'];

/** The line `index` (from 0) of a running image build: a fixed script, then a repeating one. */
const buildLine = (index: number): JobLogLine => {
  const startedAt = START + 100_000;
  const script = [
    sgr('2', '$ docker buildx bake --push'),
    `${sgr('1;36', '[+] Building')} 12.4s (9/14)`,
    ` ${sgr('35', '=> [api internal]')} load build definition from Dockerfile`,
    ` ${sgr('35', '=> [api 2/6]')} COPY package.json pnpm-lock.yaml ./ ${sgr('32', 'CACHED')}`,
    ` ${sgr('35', '=> [api 4/6]')} RUN pnpm build ${sgr('2', '8.1s')}`,
    sgr('33', ' WARN  deprecated: the --platform flag of RUN is ignored'),
  ];
  const text =
    script[index] ??
    ` ${sgr('35', `=> [${PUSHED[index % PUSHED.length]} pushing]`)} layer ${index % 9}/9 ${sgr('2', `${(index * 7) % 90}.${index % 10} MB`)}`;
  return { text, timestamp: startedAt + index * 700 };
};

/** The steps of a running deploy: the build step has `lines` lines, and the next one waits. */
export const runningSteps = (lines: number): JobLogStep[] => [
  {
    id: 'checkout',
    name: 'Checkout',
    status: 'passed',
    duration: 2_000,
    startedAt: START + 80_000,
    lines: stamped(START + 80_000, [
      [0, 'Syncing repository: SckyzO/cosmos'],
      [1_200, `HEAD is now at ${sgr('33', '9b07e3c')} release/2.4`],
    ]),
  },
  {
    id: 'install',
    name: 'Install dependencies',
    status: 'passed',
    duration: 44_000,
    startedAt: START + 82_000,
    lines: stamped(START + 82_000, [
      [0, sgr('2', '$ pnpm install --frozen-lockfile')],
      [43_800, `Done in ${sgr('1;32', '43.8s')}`],
    ]),
  },
  {
    id: 'build',
    name: 'Build images',
    status: 'running',
    duration: lines * 700,
    startedAt: START + 100_000,
    lines: Array.from({ length: lines }, (_, i) => buildLine(i)),
  },
  { id: 'roll-out', name: 'Roll out', status: 'queued', lines: [] },
];

/** A step of `count` lines, a warning every 50th and an error every 400th: for the windowed log. */
export const longSteps = (count: number): JobLogStep[] => {
  const startedAt = START + 5_000;
  return [
    {
      id: 'set-up',
      name: 'Set up job',
      status: 'passed',
      duration: 5_000,
      startedAt: START,
      lines: stamped(START, [
        [0, 'Current runner version: 2.321.0'],
        [200, 'Prepare workflow directory'],
      ]),
    },
    {
      id: 'compile',
      name: 'Compile',
      status: 'passed',
      duration: count * 40,
      startedAt,
      lines: Array.from({ length: count }, (_, i) => ({
        text:
          i % 400 === 399
            ? sgr(
                '31',
                `error TS2322: Type 'string' is not assignable to type 'number' (module ${i})`
              )
            : i % 50 === 49
              ? sgr('33', `warning: module ${i} uses a deprecated API`)
              : `${sgr('2', `[${String(i % 100).padStart(2, '0')}%]`)} compiling module ${i} of ${count}`,
        timestamp: startedAt + i * 40,
      })),
    },
    { id: 'package', name: 'Package', status: 'queued', lines: [] },
  ];
};

const WORDS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'black'];
const label = (color: string) =>
  WORDS.includes(color)
    ? color
    : `bright ${color.replace('bright', '').replace(/^./, (c) => c.toLowerCase())}`;

/** The SGR code of colour `i` of `ANSI_COLORS`: 30 to 37 and 90 to 97, plus 10 for a background. */
const colorCode = (i: number, background = false) =>
  (i < 8 ? 30 + i : 82 + i) + (background ? 10 : 0);

/** Every ANSI colour as a foreground and as a background, the attributes, 256 colours and truecolor. */
export const ANSI_STEPS: readonly JobLogStep[] = [
  {
    id: 'foreground',
    name: 'Foreground colours',
    status: 'passed',
    lines: ANSI_COLORS.map((_, i) => sgr(String(colorCode(i)), `${label(ANSI_COLORS[i]!)} text`)),
  },
  {
    id: 'background',
    name: 'Background colours',
    status: 'passed',
    lines: ANSI_COLORS.map((_, i) =>
      sgr(String(colorCode(i, true)), ` ${label(ANSI_COLORS[i]!)} background `)
    ),
  },
  {
    id: 'attributes',
    name: 'Attributes and other codes',
    status: 'passed',
    lines: [
      `${sgr('1', 'bold')} ${sgr('2', 'dim')} ${sgr('3', 'italic')} ${sgr('4', 'underline')} ${sgr('1;3;4;32', 'all together')}`,
      `256 colours: ${sgr('38;5;196', 'index 196')} ${sgr('38;5;46', 'index 46')} ${sgr('38;5;21', 'index 21')} ${sgr('48;5;226', sgr('38;5;16', 'index 226'))}`,
      `Truecolor: ${sgr('38;2;255;100;0', 'orange')} ${sgr('38;2;40;180;99', 'green')} ${sgr('38;2;120;120;255', 'blue')}`,
      `Dropped: ${ESC}[2K${ESC}[1G${ESC}]0;window title\x07cursor moves and titles leave no trace`,
      'Progress 10%\rProgress 60%\rProgress 100%, only the last segment stays',
    ],
  },
];

/** The worst cases for contrast: each colour on a background of the same colour, and each dimmed. */
export const CONTRAST_STEP: JobLogStep = {
  id: 'contrast',
  name: 'Colours on colours',
  status: 'passed',
  lines: [
    ...ANSI_COLORS.map((color, i) =>
      sgr(`${colorCode(i)};${colorCode(i, true)}`, ` ${label(color)} on ${label(color)} `)
    ),
    ...ANSI_COLORS.map((color, i) => sgr(`2;${colorCode(i)}`, `dim ${label(color)}`)),
  ],
};

/** Lines that are not what they look like: markup and escape-looking text stay text. */
export const HOSTILE_STEP: JobLogStep = {
  id: 'hostile',
  name: 'Hostile lines',
  status: 'failed',
  lines: [
    '<img src=x onerror="window.__jobLogPwned = true">',
    '<script>window.__jobLogPwned = true</script>',
    `<a href="javascript:alert(1)">${sgr('31', 'click me')}</a>`,
    '&lt;b&gt;not bold&lt;/b&gt; &amp; entities stay as typed',
  ],
};
