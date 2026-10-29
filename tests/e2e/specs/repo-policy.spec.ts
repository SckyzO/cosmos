import { readdirSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import ts from 'typescript';

// Checks on the repo's supply-chain settings. They guard what reaches npm
// through publish.yml, and nothing else fails when one of them is dropped.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

type Outputs = Record<string, string>;

/**
 * The `if:` of the workflow step named `step`, as a function of the
 * fetch-metadata outputs. Handles a one-line `if: ${{ … }}` and a folded
 * `if: >-` block; only the operators the workflow uses (== != && || ! and
 * parentheses) and `always()` are translated.
 */
const condition = (workflow: string, step: string): ((outputs: Outputs) => boolean) => {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => l.includes(`name: ${step}`));
  const at = lines.findIndex((l, i) => i > start && /^\s+if:/.test(l));
  const indent = lines[at].search(/\S/);
  let expr = lines[at].replace(/^\s+if:\s*/, '');
  if (expr === '>-') {
    const block = [];
    for (let i = at + 1; i < lines.length && lines[i].search(/\S/) > indent; i++)
      block.push(lines[i]);
    expr = block.join(' ');
  }
  const js = expr
    .trim()
    .replace(/^\$\{\{|\}\}$/g, '')
    .replace(/steps\.meta\.outputs\.([\w-]+)/g, "o['$1']")
    .replace(/\balways\(\)/g, 'true')
    .replace(/([!=])=/g, '$1==');
  // Only those tokens reach the Function constructor, so the file can't run
  // anything else.
  const rest = js.replace(/o\['[\w-]+'\]|'[\w:.-]*'|\btrue\b|===|!==|&&|\|\||[!()\s]/g, '');
  if (rest !== '') throw new Error(`unexpected tokens in the ${step} condition: ${rest}`);
  return new Function('o', `return (${js});`) as (outputs: Outputs) => boolean;
};

test('Dependabot auto-merges minor and patch npm updates only', () => {
  const workflow = read('.github/workflows/dependabot-auto-merge.yml');
  const enable = condition(workflow, 'Enable auto-merge');
  const disable = condition(workflow, 'Disable auto-merge');
  const update = (ecosystem: string, type: string, maintainerChanges = 'false'): Outputs => ({
    'package-ecosystem': ecosystem,
    'update-type': `version-update:semver-${type}`,
    'maintainer-changes': maintainerChanges,
  });

  const cases: [string, Outputs, boolean][] = [
    ['npm minor', update('npm_and_yarn', 'minor'), true],
    ['npm patch', update('npm_and_yarn', 'patch'), true],
    ['npm major', update('npm_and_yarn', 'major'), false],
    ['npm minor, new maintainer', update('npm_and_yarn', 'minor', 'true'), false],
    // Actions and images run in publish.yml, next to the npm OIDC token.
    ['GitHub Actions patch', update('github_actions', 'patch'), false],
    ['Docker minor', update('docker', 'minor'), false],
    // fetch-metadata failed: no outputs, so disarm.
    ['no metadata', {}, false],
  ];
  for (const [name, outputs, merges] of cases) {
    expect(enable(outputs), `${name}: enable`).toBe(merges);
    expect(disable(outputs), `${name}: disable`).toBe(!merges);
  }
  // Without a status function GitHub adds success(), and the disarm step would
  // be skipped after a failed fetch-metadata, leaving an earlier arming on.
  expect(workflow).toMatch(/name: Disable auto-merge[^\n]*\n\s+if: >-\n\s+\$\{\{ always\(\) && /);
  // Only on Dependabot's own PRs, in a run Dependabot triggered.
  expect(workflow).toMatch(/github\.event\.pull_request\.user\.login == 'dependabot\[bot\]'/);
  expect(workflow).toMatch(/github\.actor == 'dependabot\[bot\]'/);
});

test('new releases wait before pnpm or Dependabot adopt them', () => {
  const age = Number(/^minimumReleaseAge:\s*(\d+)/m.exec(read('pnpm-workspace.yaml'))?.[1] ?? 0);
  expect(age, 'pnpm minimumReleaseAge, in minutes').toBeGreaterThanOrEqual(1440);

  // Dependabot must not propose a version pnpm would refuse.
  const ecosystems = read('.github/dependabot.yml')
    .split(/^\s*- package-ecosystem:/m)
    .slice(1);
  expect(ecosystems.length).toBeGreaterThan(0);
  for (const block of ecosystems) {
    const days = Number(/cooldown:\s*\n\s*default-days:\s*(\d+)/.exec(block)?.[1] ?? 0);
    expect(days * 1440, `${block.split('\n')[0].trim()} cooldown`).toBeGreaterThanOrEqual(age);
  }
});

test('pnpm refuses trust downgrades and exotic subdependencies', () => {
  const workspace = read('pnpm-workspace.yaml');
  expect(workspace).toMatch(/^trustPolicy: no-downgrade$/m);
  expect(workspace).toMatch(/^blockExoticSubdeps: true$/m);
});

test('a dependency with an unreviewed install script fails the install', () => {
  const workspace = read('pnpm-workspace.yaml');
  expect(workspace).toMatch(/^strictDepBuilds: true$/m);
  // Only esbuild has one; allowing another package is a review decision.
  const allowed = /^allowBuilds:\n((?: {2}.+\n)+)/m.exec(workspace)?.[1] ?? '';
  expect(
    allowed
      .trim()
      .split('\n')
      .map((l) => l.trim())
  ).toEqual(['esbuild: true']);
});

test('CI scans the whole git history for secrets', () => {
  // The upstream gitleaks hook scans staged changes, and a CI checkout has
  // none: it passed with a token committed in the PR.
  expect(read('.pre-commit-config.yaml')).toMatch(
    /alias: gitleaks-history[\s\S]*?entry: gitleaks git\b/
  );
  const workflow = read('.github/workflows/pre-commit.yml');
  expect(workflow).toMatch(/fetch-depth: 0\b/);
  expect(workflow).toMatch(/pre-commit run --hook-stage manual gitleaks-history\b/);
});

test('SECURITY.md points to private vulnerability reporting', () => {
  expect(read('SECURITY.md')).toContain('https://github.com/SckyzO/cosmos/security/advisories/new');
});

test('the publish job restores no cache', () => {
  // Caches are written by every workflow on main; this job holds the npm
  // OIDC token.
  expect(read('.github/workflows/publish.yml')).not.toMatch(/^\s*cache:/m);
});

test('only the publish job holds the npm OIDC token, and it runs nothing but npm', () => {
  const workflow = read('.github/workflows/publish.yml');
  expect(workflow, 'workflow-level permissions').toMatch(/^permissions: \{\}$/m);
  const jobs = workflow
    .slice(workflow.indexOf('\njobs:'))
    .split(/^ {2}(?=[\w-]+:\s*$)/m)
    .slice(1);
  const withToken = jobs.filter((job) => /id-token: write/.test(job));
  expect(withToken.map((job) => job.split(':')[0])).toEqual(['publish']);
  // Install, build and checkout run in the job without the token.
  expect(withToken[0]).not.toMatch(/pnpm |actions\/checkout|cache:/);
});

test('the Claude review only runs on an `@claude review` comment from a maintainer', () => {
  const review = read('.github/workflows/claude-code-review.yml');
  const on = review.slice(review.indexOf('\non:'), review.indexOf('\njobs:'));
  expect(on).toMatch(/issue_comment:/);
  expect(on).not.toMatch(/pull_request(_target)?:/);
  expect(review).toMatch(/startsWith\(github\.event\.comment\.body, '@claude review'\)/);
  expect(review).toMatch(/author_association/);
  // It holds a token: never check out the PR head (a PR could ship .claude/ hooks).
  expect(review).not.toMatch(/ref:|refs\/pull/);
  // claude.yml must not answer the same comment.
  expect(read('.github/workflows/claude.yml')).toMatch(
    /!startsWith\(github\.event\.comment\.body, '@claude review'\)/
  );
});

test('claude.yml starts a runner only for the owner, members and collaborators', () => {
  const workflow = read('.github/workflows/claude.yml');
  const condition = workflow.slice(workflow.indexOf('    if: |'), workflow.indexOf('    runs-on'));
  // One clause per event, and every clause checks who wrote the mention.
  const clauses = condition.split('\n').filter((l) => l.includes('github.event_name =='));
  expect(clauses.length).toBe(4);
  for (const clause of clauses) {
    expect(clause).toMatch(
      /contains\(fromJSON\('\["OWNER","MEMBER","COLLABORATOR"\]'\), github\.event\.(comment|review|issue)\.author_association\)/
    );
  }
  // `assigned` never fires without `assignee_trigger`.
  expect(workflow).not.toMatch(/assigned/);
});

test('the Claude review uses the job token, not the Claude app token', () => {
  const review = read('.github/workflows/claude-code-review.yml');
  // Without github_token the action exchanges an OIDC token for a write token
  // of the Claude GitHub app; a review only needs to comment on the PR.
  expect(review).toMatch(/github_token: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  expect(review).not.toMatch(/id-token:/);
  expect(review).toMatch(/^\s+contents: read$/m);
  expect(review).toMatch(/^\s+pull-requests: write\b/m);
});

test('only the Storybook deploy job can write Pages or fetch an OIDC token', () => {
  const workflow = read('.github/workflows/deploy-storybook.yml');
  const jobsAt = workflow.indexOf('\njobs:');
  expect(workflow.slice(0, jobsAt), 'workflow-level permissions').not.toMatch(
    /pages: write|id-token:/
  );
  const jobs = workflow
    .slice(jobsAt)
    .split(/^ {2}(?=[\w-]+:\s*$)/m)
    .slice(1);
  const names = (re: RegExp) => jobs.filter((job) => re.test(job)).map((job) => job.split(':')[0]);
  expect(names(/pages: write/)).toEqual(['deploy']);
  expect(names(/id-token: write/)).toEqual(['deploy']);
});

test('no checkout leaves the GITHUB_TOKEN in the repo config', () => {
  // A later step (a build script, an agent) could read the persisted token.
  // None of the workflows pushes with the checkout's credentials.
  const workflows = readdirSync(new URL('../../../.github/workflows/', import.meta.url)).filter(
    (name) => name.endsWith('.yml')
  );
  expect(workflows.length).toBeGreaterThan(0);
  for (const name of workflows) {
    const lines = read(`.github/workflows/${name}`).split('\n');
    lines.forEach((line, i) => {
      if (!line.includes('uses: actions/checkout@')) return;
      const step = lines.slice(i, i + 6).join('\n');
      expect(step, `${name}:${i + 1}`).toMatch(/persist-credentials: false/);
    });
  }
});

test('the dev image pins what it installs as root', () => {
  const dockerfile = read('config/docker/Dockerfile.dev');
  expect(dockerfile, 'base image by digest').toMatch(/^FROM \S+@sha256:[0-9a-f]{64}$/m);
  const code = dockerfile
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
  expect(code, 'corepack version').toMatch(/corepack@\d+\.\d+\.\d+/);
  expect(code, 'playwright version').toMatch(/playwright@\d+\.\d+\.\d+ install-deps/);
  expect(code).not.toMatch(/@latest\b/);
});

test('the CI jobs that open a browser run in the Playwright image the dev image matches', () => {
  // No apt in CI (`install --with-deps` hit the job timeout on a slow mirror),
  // and Chromium gets the system libraries the dev image installs for `make ci`.
  const version = read('config/docker/Dockerfile.dev').match(
    /playwright@(\d+\.\d+\.\d+) install-deps/
  )?.[1];
  expect(version, 'dev image playwright version').toBeTruthy();
  const tag = `v${version?.replaceAll('.', '\\.')}-noble`;
  const jobs = read('.github/workflows/ci.yml')
    .split(/\n(?= {2}[\w-]+:\n)/)
    .filter((job) => job.includes('exec playwright install'));
  expect(jobs.length, 'jobs that install a browser').toBeGreaterThan(0);
  for (const job of jobs) {
    const name = job.match(/^ {2}([\w-]+):/)?.[1];
    expect(job, `${name}: image`).toMatch(
      new RegExp(`\\n {6}image: mcr\\.microsoft\\.com/playwright:${tag}@sha256:[0-9a-f]{64}\\n`)
    );
    expect(job, `${name}: apt`).not.toContain('--with-deps');
  }
});

test('the aggregator job waits for every other CI job', () => {
  // The "Lint + typecheck + test + build" check is the one branch protection requires: a job it
  // does not list could fail and the merge would go through.
  const workflow = read('.github/workflows/ci.yml');
  const jobs = workflow
    .slice(workflow.indexOf('\njobs:\n'))
    .split(/\n(?= {2}[\w-]+:\n)/)
    .map((job) => job.match(/^ {2}([\w-]+):/)?.[1])
    .filter((name): name is string => !!name && name !== 'ci');
  const needs = workflow.match(/^ {4}needs: \[([^\]]*)\]$/m)?.[1];
  expect(jobs.length, 'CI jobs').toBeGreaterThan(1);
  expect(
    needs
      ?.split(',')
      .map((name) => name.trim())
      .sort()
  ).toEqual([...jobs].sort());
});

test('the dev container cannot write the repo metadata', () => {
  // Code running in the container could otherwise plant a hook in .git that
  // git runs on the host.
  for (const file of ['Makefile', 'devctl']) {
    const runs = read(file)
      .split('\n')
      .filter((line) => /^\s*DOCKER_RUN\w* ?[:=]/.test(line));
    expect(runs.length, `${file}: docker run lines`).toBeGreaterThan(0);
    for (const line of runs)
      expect(line, file).toMatch(/\/\.git:\$[({]?WORKSPACE[)}]?\/\.git:ro\b/);
  }
  const compose = read('docker-compose.yml');
  const workspace = compose.match(/- \.\/:\/workspace$/gm) ?? [];
  const metadata = compose.match(/- \.\/\.git:\/workspace\/\.git:ro$/gm) ?? [];
  expect(workspace.length).toBeGreaterThan(0);
  expect(metadata.length).toBe(workspace.length);
});

// ── Right to left ───────────────────────────────────────────────────────────

// A component mirrors under `dir="rtl"` through logical utilities (`ms-`, `ps-`, `inset-s-`,
// `text-start`, `border-s`, `rounded-s`…) and the `rtl:` variant. This refuses the physical
// ones in every source file of `packages/react/src` (#453).

/**
 * The few physical utilities that must stay: `file`, the exact `token` and why, so each
 * exception is a decision and not a leftover. An entry that no longer matches fails too.
 */
const RTL_ALLOWED: { file: string; token: string; reason: string }[] = [
  ...['left-[calc(50%_-_var(--anchor-shift,0px))]', 'left-full', 'right-full'].map((token) => ({
    file: 'packages/react/src/ui/Tooltip.tsx',
    token,
    reason:
      'the arrow sits on the edge that faces the trigger, picked by the side the viewport left the box on (a screen side, flipped by room), and --anchor-shift is a distance to the right',
  })),
  ...['right:', 'left:', 'right :'].map((token) => ({
    file: 'packages/react/src/hooks/useAnchorPosition.ts',
    token,
    reason:
      'screen geometry: the opposite of a side the viewport cut the panel on, the keys of a DOMRect, and the `left` of the fixed style the panel is placed with, all measured from the left edge of the screen',
  })),
  {
    file: 'packages/react/src/ui/VideoEmbed.tsx',
    token: 'ml-0.5',
    reason:
      'the play triangle points right in both directions, as the time of a video runs from the left, so its optical offset toward the point is a screen side',
  },
];

// A utility that names a side of the screen, with its variants in front (`sm:`, `dark:`,
// `[&>button:first-child]:`), or an inline-style key that does: `left: 0`, `marginRight`.
const PHYSICAL_UTILITY =
  /(?<![\w-])-?(?:(?:scroll-)?[mp][lr]-|(?:left|right)-|border-[lr](?![a-z])|rounded-(?:[lr]|[tb][lr])(?![a-z])|text-(?:left|right)(?![a-z-])|(?:float|clear)-(?:left|right))[^\s'"`]*|\b(?:margin|padding|border)(?:Left|Right)\b|\b(?:left|right)\s*:/g;

const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

const physicalUtilities = (source: string) => [
  ...new Set(withoutComments(source).match(PHYSICAL_UTILITY) ?? []),
];

/**
 * The sources the check reads: every module of the package but its stories, its tests and the
 * helpers its stories share (`storybook-*`), which are not shipped.
 */
const packageSources = () =>
  readdirSync(new URL('../../../packages/react/src', import.meta.url), {
    recursive: true,
    encoding: 'utf8',
  })
    .filter(
      (path) =>
        /\.tsx?$/.test(path) &&
        !/\.(?:stories\.tsx|test\.ts)$/.test(path) &&
        !/(?:^|\/)storybook-[^/]*$/.test(path)
    )
    .map((path) => `packages/react/src/${path}`)
    .sort();

test('the physical-utility check sees what it must and lets the logical forms through', () => {
  const classes = (...names: string[]) => `className="${names.join(' ')}"`;
  for (const physical of [
    'ml-2',
    '-ml-px',
    'mr-auto',
    'pl-3',
    'pr-[calc(1rem+2px)]',
    'left-0',
    '-right-12',
    'left-1/2',
    'border-l',
    'border-r-2',
    'rounded-l-lg',
    'rounded-tr-[inherit]',
    'rounded-br',
    'text-left',
    'text-right',
    'float-right',
    'scroll-ml-4',
  ]) {
    expect(physicalUtilities(classes('flex', physical)), physical).toEqual([physical]);
    expect(physicalUtilities(classes(`sm:${physical}`)), `sm:${physical}`).toEqual([physical]);
  }
  expect(physicalUtilities("{ marginLeft: 4, right: 0 } position === 'left'")).toEqual([
    'marginLeft',
    'right:',
  ]);
  const logical = classes(
    'ms-2 -ms-px me-auto ps-3 pe-4 start-0 -end-12 inset-s-0 border-s border-e-2 rounded-s-lg',
    'rounded-ss-lg rounded-ee-[inherit] text-start text-end rtl:-scale-x-100 rtl:translate-x-1',
    'mx-auto px-4 pt-2 pb-1 mt-3 mb-2 inset-x-0 top-0 bottom-0 border-t border-b rounded-t-lg',
    'rounded-lg rounded-full text-left-ish border-lime-500 bottom-left text-center space-x-2'
  );
  expect(physicalUtilities(logical)).toEqual([]);
  // Words in a comment are not utilities.
  expect(physicalUtilities('// the left edge, a `pl-2` example\nconst a = 1;')).toEqual([]);
  expect(physicalUtilities('/* mr-2 and right: 0 */ const a = 1;')).toEqual([]);
});

test('the package uses logical utilities only', () => {
  const files = packageSources();
  expect(files.length, 'source files').toBeGreaterThan(100);

  const found = files.flatMap((file) =>
    physicalUtilities(read(file)).map((token) => ({ file, token }))
  );
  const allowed = (hit: { file: string; token: string }) =>
    RTL_ALLOWED.some(({ file, token }) => file === hit.file && token === hit.token);
  expect(
    found.filter((hit) => !allowed(hit)).map(({ file, token }) => `${file}: ${token}`),
    'physical utilities: use the logical form (ms-, pe-, inset-s-, text-start, border-s, rounded-s…), or the rtl: variant, or add an RTL_ALLOWED entry with the reason'
  ).toEqual([]);

  for (const { file, token, reason } of RTL_ALLOWED) {
    expect(reason, `${file}: ${token}`).not.toBe('');
    expect(
      found.some((hit) => hit.file === file && hit.token === token),
      `RTL_ALLOWED entry no longer needed: ${file}: ${token}`
    ).toBe(true);
  }
});

// ── Inline sides in prop types ──────────────────────────────────────────────

// A prop that names a side of the line takes `start` and `end` (CONTRIBUTING, "Component API"):
// the side follows the reading direction, and `'left'` or `'right'` would not. `top` and
// `bottom` stay physical. This refuses a `'left'` or `'right'` string literal (alone or in a
// corner such as `'top-right'`) in a type of `packages/react/src`, stories and tests apart (#453).

/**
 * Types that name a physical side on purpose: `file`, the `holder` (the type alias, interface
 * or property that holds the literal) and why, so each exception is a decision. An entry that
 * no longer matches fails.
 */
const SIDE_ALLOWED: { file: string; holder: string; reason: string }[] = [
  {
    file: 'packages/react/src/hooks/useAnchorPosition.ts',
    holder: 'AnchorSide',
    reason:
      'the side of the trigger rect the panel opens on, in screen coordinates; the logical `align` sits next to it',
  },
  {
    file: 'packages/react/src/hooks/useAnchorPosition.ts',
    holder: 'AnchorRect',
    reason: 'the keys of a DOMRect, which are physical by definition',
  },
];

const SIDE_LITERAL = /(?:^|-)(?:left|right)(?:-|$)/;

/** The sources the check reads: every module of the package but its stories and tests. */
const sideSources = () =>
  readdirSync(new URL('../../../packages/react/src', import.meta.url), {
    recursive: true,
    encoding: 'utf8',
  })
    .filter((path) => /\.tsx?$/.test(path) && !/\.(?:stories\.tsx|test\.ts)$/.test(path))
    .map((path) => `packages/react/src/${path}`)
    .sort();

/**
 * The `'left'` and `'right'` literal types of `source`, each as the name of what holds it: the
 * nearest property or parameter, after the type alias or interface around it (`NavbarMenuProps.align`).
 */
const sideLiterals = (file: string, source: string) => {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const holders = new Set<string>();
  const nameOf = (node: ts.Node) =>
    'name' in node && node.name && ts.isIdentifier(node.name as ts.Node)
      ? (node.name as ts.Identifier).text
      : undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isLiteralTypeNode(node) &&
      ts.isStringLiteral(node.literal) &&
      SIDE_LITERAL.test(node.literal.text)
    ) {
      const names: string[] = [];
      for (let up = node.parent; up; up = up.parent) {
        if (
          ts.isPropertySignature(up) ||
          ts.isParameter(up) ||
          ts.isPropertyDeclaration(up) ||
          ts.isTypeAliasDeclaration(up) ||
          ts.isInterfaceDeclaration(up)
        ) {
          const name = nameOf(up);
          if (name) names.unshift(name);
        }
      }
      holders.add(names.join('.') || '(anonymous)');
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return [...holders];
};

test('the side check sees a physical side in a type and lets start and end through', () => {
  const found = (code: string) => sideLiterals('x.tsx', code);
  expect(found("export type Side = 'left' | 'right';")).toEqual(['Side']);
  expect(found("type Props = { align?: 'start' | 'left' };")).toEqual(['Props.align']);
  expect(found("export type Corner = 'top-right' | 'bottom-left';")).toEqual(['Corner']);
  expect(found('interface P { icon: { place: "right" } }')).toEqual(['P.icon.place']);
  expect(found("const f = (side: 'left' | 'right') => side;")).toEqual(['side']);
  expect(found("export type Edge = 'start' | 'end' | 'top' | 'bottom' | 'center';")).toEqual([]);
  // A value is not a type, and a word that holds `left` is not a side.
  expect(found("const align = side === 'left' ? 'start' : 'end'; type K = 'leftover';")).toEqual(
    []
  );
});

test('no prop type names a physical side of the line', () => {
  const found = sideSources().flatMap((file) =>
    sideLiterals(file, read(file)).map((holder) => ({ file, holder }))
  );
  const matches =
    (list: { file: string; holder: string }[]) => (hit: { file: string; holder: string }) =>
      list.some(({ file, holder }) => file === hit.file && holder === hit.holder);
  expect(
    found
      .filter((hit) => !matches(SIDE_ALLOWED)(hit))
      .map(({ file, holder }) => `${file}: ${holder}`),
    'name the side start or end, or add a SIDE_ALLOWED entry with the reason it must stay physical (`top` and `bottom` are fine)'
  ).toEqual([]);

  for (const entry of SIDE_ALLOWED) {
    expect(entry.reason, `SIDE_ALLOWED: ${entry.file}: ${entry.holder}`).not.toBe('');
    expect(
      found.some(matches([entry])),
      `SIDE_ALLOWED entry no longer needed: ${entry.file}: ${entry.holder}`
    ).toBe(true);
  }
});

// ── Corner radius ───────────────────────────────────────────────────────────

// `data-radius` rescales Tailwind's `--radius-*` variables (`rounded-sm` … `rounded-4xl` read them),
// so a corner follows the page's radius only if it goes through the scale. Three things escape it:
// a utility that compiles to a literal (a bare `rounded`, `rounded-t`, `rounded-ss`… are a fixed
// 0.25rem in Tailwind 4), an arbitrary `rounded-[…]`, and a radius written in a style (#455).
// `rounded-none` and `rounded-full` are fine: the first is square, the second round at every step.

/**
 * The few radii that stay out of the scale: `file`, the exact `token` and why, so each exception
 * is a decision and not a leftover. `in` narrows an entry to the lines that contain it, for a
 * word that is not a class. An entry that no longer matches fails too.
 */
const RADIUS_ALLOWED: { file: string; token: string; in?: string; reason: string }[] = [
  {
    file: 'packages/react/src/ui/ProgressBar.tsx',
    token: 'rounded-[3px]',
    reason:
      'the 10px swatch of the legend: a 3px corner is a softened square, and a scale on it would move it by a pixel',
  },
  ...['rounded-[1px]', 'rounded-[2px]', 'rounded-[3px]'].map((token) => ({
    file: 'packages/react/src/uptime/HeartbeatBar.tsx',
    token,
    reason:
      'the bars, cells and crosses of a heartbeat strip are 5 to 12px wide: a 1 to 3px corner only softens them, and a large radius would turn the strip into dots',
  })),
  {
    file: 'packages/react/src/uptime/UptimeBars.tsx',
    token: 'rounded-[2px]',
    reason: 'the thin bars and 12px legend cells of an uptime strip, as in HeartbeatBar',
  },
  {
    file: 'packages/react/src/status/HealthMatrix.tsx',
    token: 'rounded-[2px]',
    reason: 'the 12px cell of the matrix: a 2px corner only softens it',
  },
  ...['packages/react/src/ui/Button.tsx', 'packages/react/src/logs/LogToolbar.tsx'].map((file) => ({
    file,
    token: 'rounded',
    in: "'rounded'",
    reason:
      'the `rounded` value of the `shape` prop (the Button default), not a class: its class is `rounded-lg`',
  })),
];

const BARE_RADIUS = /(?<![\w-])rounded(?:-(?:t|b|s|e|l|r|tl|tr|bl|br|ss|se|es|ee))?(?![\w[-])/g;
const ARBITRARY_RADIUS =
  /(?<![\w-])rounded(?:-(?:t|b|s|e|l|r|tl|tr|bl|br|ss|se|es|ee))?-(?:\[([^\]\s]*)\]|\(([^)\s]*)\))/g;
const CSS_RADIUS = /\bborder(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\b/g;
const STYLE_RADIUS = /^border(?:(?:Top|Bottom|Start|End)(?:Left|Right|Start|End))?Radius$/;

type RadiusHit = { file: string; token: string; line: string };

/**
 * What of `source` takes a corner out of the scale: a bare `rounded` utility or an arbitrary one
 * that does not read `var(--radius-…)` in a string, a radius in CSS text, or a `borderRadius`
 * key. Comments and types are not code that renders.
 */
const radiusEscapes = (file: string, source: string): RadiusHit[] => {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines = source.split('\n');
  const hits: RadiusHit[] = [];
  const add = (node: ts.Node, token: string) =>
    hits.push({
      file,
      token,
      line: lines[tree.getLineAndCharacterOfPosition(node.getStart(tree)).line] ?? '',
    });
  const scan = (node: ts.Node, text: string) => {
    for (const [token] of text.matchAll(BARE_RADIUS)) add(node, token);
    for (const [token, bracket, paren] of text.matchAll(ARBITRARY_RADIUS)) {
      const value = bracket ?? paren ?? '';
      if (value !== 'inherit' && !value.includes('var(--radius-')) add(node, token);
    }
    for (const [token] of text.matchAll(CSS_RADIUS)) add(node, token);
  };
  const visit = (node: ts.Node) => {
    if (
      ts.isLiteralTypeNode(node) ||
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      return;
    }
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      // A property name is a key, not a class: `rounded: 'rounded-lg'`.
      if (!(ts.isPropertyAssignment(node.parent) && node.parent.name === node))
        scan(node, node.text);
    }
    if (
      (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      STYLE_RADIUS.test(node.name.text)
    ) {
      add(node, node.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return hits;
};

test('the radius check sees a corner that leaves the scale and lets the scale through', () => {
  const found = (code: string) => radiusEscapes('x.tsx', code).map((hit) => hit.token);
  for (const bare of [
    'rounded',
    'rounded-t',
    'rounded-b',
    'rounded-s',
    'rounded-e',
    'rounded-tl',
  ]) {
    expect(found(`<a className="flex ${bare} p-2" />`), bare).toEqual([bare]);
    expect(found(`<a className="flex sm:${bare} p-2" />`), `sm:${bare}`).toEqual([bare]);
    expect(found(`<a className="[&_code]:${bare}" />`), `[&_code]:${bare}`).toEqual([bare]);
  }
  expect(found('const a = clsx(x && "rounded", `rounded-ss ${y}`);')).toEqual([
    'rounded',
    'rounded-ss',
  ]);
  expect(found('<i className="size-3 rounded-[3px] before:rounded-[10px]" />')).toEqual([
    'rounded-[3px]',
    'rounded-[10px]',
  ]);
  expect(found('<i className="rounded-t-[4px] rounded-(--corner)" />')).toEqual([
    'rounded-t-[4px]',
    'rounded-(--corner)',
  ]);
  expect(found('<div style={{ borderRadius: 4, borderStartStartRadius: 2 }} />')).toEqual([
    'borderRadius',
    'borderStartStartRadius',
  ]);
  expect(found('const css = "border-radius: 4px";')).toEqual(['border-radius']);
  const scale = [
    'rounded-xs rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-3xl rounded-4xl',
    'rounded-t-lg rounded-s-md rounded-ee-xl rounded-tl-sm sm:rounded-lg dark:rounded-xl',
    'rounded-none rounded-full rounded-t-none rounded-e-full rounded-[inherit] rounded-se-[inherit]',
    'rounded-[calc(var(--radius-lg)*1.25)] before:rounded-[inherit]',
  ].join(' ');
  expect(found(`<a className="${scale}" />`)).toEqual([]);
  // Prose, keys, types, imports and comments are not classes.
  expect(found("type Shape = 'rounded' | 'pill'; const x = { rounded: 'rounded-lg' };")).toEqual(
    []
  );
  expect(
    found("const rounded = true; // rounded corners\n/* rounded */ f(rounded && 'rounded-xl');")
  ).toEqual([]);
  expect(found("import { rounded } from './rounded'; const t = 'unrounded roundedness';")).toEqual(
    []
  );
});

test('every corner of the package goes through the radius scale', () => {
  const files = packageSources();
  expect(files.length, 'source files').toBeGreaterThan(100);

  const found = files.flatMap((file) => radiusEscapes(file, read(file)));
  const matches = (entry: (typeof RADIUS_ALLOWED)[number]) => (hit: RadiusHit) =>
    entry.file === hit.file && entry.token === hit.token && hit.line.includes(entry.in ?? '');
  expect(
    found
      .filter((hit) => !RADIUS_ALLOWED.some((entry) => matches(entry)(hit)))
      .map(({ file, token, line }) => `${file}: ${token}  (${line.trim().slice(0, 100)})`),
    'a bare rounded (rounded, rounded-t…) is a fixed 0.25rem: write rounded-sm (rounded-t-sm…); an arbitrary rounded-[…] reads var(--radius-…) or goes in RADIUS_ALLOWED with the reason; a borderRadius is a class instead'
  ).toEqual([]);

  for (const entry of RADIUS_ALLOWED) {
    expect(entry.reason, `${entry.file}: ${entry.token}`).not.toBe('');
    expect(
      found.some(matches(entry)),
      `RADIUS_ALLOWED entry no longer needed: ${entry.file}: ${entry.token}`
    ).toBe(true);
  }
});
