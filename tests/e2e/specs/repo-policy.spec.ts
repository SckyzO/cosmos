import { spawnSync } from 'node:child_process';
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

test('a documentation-only change skips the heavy CI jobs, and nothing else does', () => {
  // The heavy jobs wait for `changes` and run only when it found more than documentation. A
  // workflow-level path filter would leave the required check missing, so none is allowed.
  const workflow = read('.github/workflows/ci.yml');
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  expect(triggers, 'workflow path filter').not.toMatch(/\bpaths(-ignore)?:/);
  const jobs = workflow
    .slice(workflow.indexOf('\njobs:\n'))
    .split(/\n(?= {2}[\w-]+:\n)/)
    .filter((job) => /^ {2}[\w-]+:/.test(job));
  const name = (job: string) => job.match(/^ {2}([\w-]+):/)?.[1];
  const heavy = jobs.filter((job) => !['changes', 'ci'].includes(name(job) ?? ''));
  expect(heavy.length, 'heavy jobs').toBeGreaterThan(1);
  for (const job of heavy) {
    expect(job, `${name(job)}: needs`).toMatch(/^ {4}needs: changes$/m);
    expect(job, `${name(job)}: if`).toMatch(/^ {4}if: needs\.changes\.outputs\.code == 'true'$/m);
  }
  expect(workflow, 'aggregator runs when a job fails').toMatch(
    /\n {2}ci:\n(?:(?! {2}\w).*\n)*? {4}if: always\(\)\n/
  );
});

test('the aggregator accepts a skipped job only after a documentation-only change', () => {
  const workflow = read('.github/workflows/ci.yml');
  const step = workflow.slice(workflow.indexOf('      - name: Require every job to pass'));
  const script = step
    .slice(step.indexOf('        run: |\n') + '        run: |\n'.length)
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  const passes = (changes: string, code: string, ...results: string[]) =>
    spawnSync('bash', ['-c', script], {
      env: { PATH: process.env.PATH, CHANGES: changes, CODE: code, RESULTS: results.join(' ') },
    }).status === 0;
  const skipped = ['skipped', 'skipped', 'skipped', 'skipped', 'skipped'];
  const green = ['success', 'success', 'success', 'success', 'success'];
  expect(passes('success', 'false', 'success', ...skipped), 'docs only, jobs skipped').toBe(true);
  expect(passes('success', 'true', 'success', ...green), 'code, jobs passed').toBe(true);
  expect(passes('success', 'true', 'success', ...skipped), 'code, jobs skipped').toBe(false);
  expect(passes('success', '', 'success', ...skipped), 'no verdict, jobs skipped').toBe(false);
  expect(passes('success', 'false', 'success', 'failure', ...skipped.slice(1))).toBe(false);
  expect(passes('success', 'false', 'success', 'cancelled', ...skipped.slice(1))).toBe(false);
  expect(passes('success', 'true', 'success', 'failure', ...green.slice(1))).toBe(false);
  expect(passes('failure', '', 'failure', ...skipped), 'changes failed').toBe(false);
  expect(passes('cancelled', 'false', 'cancelled', ...skipped), 'changes cancelled').toBe(false);
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
  {
    file: 'packages/react/src/status/nodeGridModel.ts',
    holder: 'Box',
    reason:
      'the keys of a DOMRect: the up and down keys pick a mark by its rendered column, in screen coordinates',
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

// ── Stories on a docs page ──────────────────────────────────────────────────

// A docs page renders its inline stories in one document, so a story that pins `globals.theme`
// rewrites the class of the `<html>` the whole page shares: the chrome follows the toolbar and the
// examples follow whichever story rendered last (#612). A story that only tests takes
// `!autodocs`; one that stays visible draws its own surface, or its own iframe. A story in an
// iframe of its own (`portalDocsParams`, `inline: false`) pins that iframe's theme and nothing
// else, so it is not listed.
const STORY_THEME_ALLOWED: { file: string; story: string; reason: string }[] = [];

type Props = { known: Map<string, ts.Node>; opaque: boolean };

const unwrapped = (node: ts.Expression): ts.Expression => {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  )
    current = current.expression;
  return current;
};

const keyOf = (property: ts.ObjectLiteralElementLike) =>
  property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ? property.name.text
    : undefined;

/**
 * What a stories file says about each story, read as Storybook reads it at run time, next to what
 * its static indexer reads. The indexer (`index.json`: sidebar, docs page, tag filters) looks at
 * the properties written in the object a story is exported as and skips a `...Base` or a
 * `...helper()` in it, so a story that gets its `tags` from one is listed as visible while it
 * runs hidden. `known` holds the properties a spread, a name or a helper call in the file gives;
 * `opaque` is set when something the file does not declare could add more.
 */
const readStories = (file: string, source: string) => {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values = new Map<string, ts.Expression>();
  const returned = new Map<string, ts.Expression>();
  const exported: { name: string; value: ts.Expression }[] = [];
  let metaValue: ts.Expression | undefined;

  /** What a function returns: the body of an arrow, or the last `return` of a block. */
  const returnOf = (node: ts.Node) => {
    if (!ts.isArrowFunction(node) && !ts.isFunctionDeclaration(node)) return undefined;
    if (node.body && !ts.isBlock(node.body)) return node.body;
    return node.body?.statements.filter(ts.isReturnStatement).at(-1)?.expression;
  };
  for (const statement of tree.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const value = returnOf(statement);
      if (value) returned.set(statement.name.text, value);
    } else if (ts.isVariableStatement(statement)) {
      const isExported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const { name, initializer } of statement.declarationList.declarations) {
        if (!ts.isIdentifier(name) || !initializer) continue;
        values.set(name.text, initializer);
        const value = returnOf(unwrapped(initializer));
        if (value) returned.set(name.text, value);
        if (isExported) exported.push({ name: name.text, value: initializer });
      }
    } else if (ts.isExportAssignment(statement)) {
      metaValue = statement.expression;
    }
  }
  if (metaValue && ts.isIdentifier(metaValue)) metaValue = values.get(metaValue.text);

  /** The properties of what an expression evaluates to, as far as this file declares it. */
  const propsOf = (expression: ts.Expression, depth = 0): Props => {
    const node = unwrapped(expression);
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
      return { known: new Map(), opaque: false };
    if (!ts.isObjectLiteralExpression(node)) {
      const next = ts.isIdentifier(node)
        ? values.get(node.text)
        : ts.isCallExpression(node) && ts.isIdentifier(node.expression)
          ? returned.get(node.expression.text)
          : undefined;
      return next && depth < 8 ? propsOf(next, depth + 1) : { known: new Map(), opaque: true };
    }
    const props: Props = { known: new Map(), opaque: false };
    for (const property of node.properties) {
      const inner: Props | undefined = ts.isSpreadAssignment(property)
        ? propsOf(property.expression, depth + 1)
        : keyOf(property) === undefined
          ? { known: new Map(), opaque: true }
          : undefined;
      if (inner) {
        // Something unknown may overwrite what came before it.
        if (inner.opaque) props.known.clear();
        props.opaque ||= inner.opaque;
        for (const [key, value] of inner.known) props.known.set(key, value);
      } else {
        props.known.set(
          keyOf(property)!,
          ts.isPropertyAssignment(property) ? property.initializer : property
        );
      }
    }
    return props;
  };

  /** The strings of an array literal, of a name that holds one, or of a spread of either. */
  const stringsOf = (node: ts.Node, depth = 0): string[] | undefined => {
    if (!ts.isExpression(node) || depth > 8) return undefined;
    const expression = unwrapped(node);
    if (ts.isIdentifier(expression) && values.has(expression.text))
      return stringsOf(values.get(expression.text)!, depth + 1);
    if (!ts.isArrayLiteralExpression(expression)) return undefined;
    const strings: string[] = [];
    for (const element of expression.elements) {
      const inner = ts.isSpreadElement(element)
        ? stringsOf(element.expression, depth + 1)
        : ts.isStringLiteralLike(element)
          ? [element.text]
          : undefined;
      if (!inner) return undefined;
      strings.push(...inner);
    }
    return strings;
  };

  /** Storybook's `combineTags`: a `!tag` takes `tag` away, whatever came before it. */
  const combined = (...lists: string[][]) => {
    const tags = new Set<string>();
    for (const tag of lists.flat()) {
      if (tag.startsWith('!')) tags.delete(tag.slice(1));
      else tags.add(tag);
    }
    return tags;
  };

  const meta = metaValue ? propsOf(metaValue) : { known: new Map<string, ts.Node>(), opaque: true };
  const metaTags = meta.known.has('tags') ? stringsOf(meta.known.get('tags')!) : [];

  return exported.map(({ name, value }) => {
    const props = propsOf(value);
    const tags = props.known.has('tags')
      ? stringsOf(props.known.get('tags')!)
      : props.opaque
        ? undefined
        : [];
    const written = unwrapped(value);
    const indexed = ts.isObjectLiteralExpression(written)
      ? written.properties.find(
          (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && keyOf(p) === 'tags'
        )
      : undefined;
    const settings = (key: string) =>
      [meta.known.get(key), props.known.get(key)].filter((node): node is ts.Node => !!node);
    return {
      name,
      /** Every tag the story ends up with, or `undefined` when something hides some from the file. */
      tags: metaTags && tags ? combined(metaTags, tags) : undefined,
      /** The `!tag`s the story adds, at run time and in the object the indexer reads. */
      hides: (tags ?? []).filter((tag) => tag.startsWith('!')),
      indexedHides: ((indexed && stringsOf(indexed.initializer)) ?? []).filter((tag) =>
        tag.startsWith('!')
      ),
      pinsTheme: settings('globals').some(
        (node) => ts.isExpression(node) && propsOf(node).known.has('theme')
      ),
      ownIframe: /\bportalDocsParams\b|\binline:\s*false\b/.test(
        settings('parameters')
          .map((node) => node.getText())
          .join('\n')
      ),
    };
  });
};

/**
 * The stories of `source` that break a docs page: one that pins the theme while it is on the page,
 * and one hidden by a spread or a call that the indexer does not read, so it stays in the sidebar
 * and the docs.
 */
const storyHazards = (file: string, source: string) =>
  readStories(file, source).flatMap((story) => {
    const hits: { story: string; problem: string }[] = [];
    if (story.pinsTheme && story.tags?.has('autodocs') && !story.ownIframe) {
      hits.push({ story: story.name, problem: 'pins globals.theme and is on the docs page' });
    }
    const unseen = story.hides.filter((tag) => !story.indexedHides.includes(tag));
    if (unseen.length > 0) {
      hits.push({
        story: story.name,
        problem: `gets ${unseen.join(', ')} from a spread or a call the indexer does not read`,
      });
    }
    return hits;
  });

const storySources = () =>
  ['packages/react/src', 'packages/charts/src', 'apps/storybook/stories']
    .flatMap((root) =>
      readdirSync(new URL(`../../../${root}`, import.meta.url), {
        recursive: true,
        encoding: 'utf8',
      }).map((path) => `${root}/${path}`)
    )
    .filter((path) => path.endsWith('.stories.tsx'))
    .sort();

test('the story check sees what breaks a docs page and lets the rest through', () => {
  const hazards = (body: string, meta = "{ title: 'A/B', tags: ['autodocs'] }") =>
    storyHazards('A.stories.tsx', `const meta = ${meta}; export default meta;\n${body}`);
  const pins = (story: string) => ({
    story,
    problem: 'pins globals.theme and is on the docs page',
  });
  const unread = (story: string, tags: string) => ({
    story,
    problem: `gets ${tags} from a spread or a call the indexer does not read`,
  });

  // A theme pinned by a story that stays on the docs page, in each way of writing it.
  for (const body of [
    "export const Light = { globals: { theme: 'light' } };",
    "export const Light = { tags: ['!dev'], globals: { theme: 'light' } };",
    "export const Light = { globals: { ...PHONE, theme: 'light' } };",
    "const BASE = { theme: 'light' };\nexport const Light = { globals: BASE };",
    "const Base = { globals: { theme: 'light' } };\nexport const Light = { ...Base, args: {} };",
    "const themed = (theme: string) => ({ globals: { theme } });\nexport const Light = themed('light');",
    "const themed = (theme: string) => { return { globals: { theme } }; };\nexport const Light = themed('light');",
  ]) {
    expect(hazards(body), body).toEqual([pins('Light')]);
  }
  // A story gets the theme its meta pins, and a story of a page without `autodocs` is on no page
  // unless it asks for it.
  expect(
    hazards('export const Light = {};', "{ tags: ['autodocs'], globals: { theme: 'sand' } }")
  ).toEqual([pins('Light')]);
  expect(
    hazards("export const Light = { tags: ['autodocs'], globals: { theme: 'sand' } };", '{}')
  ).toEqual([pins('Light')]);

  // Hidden from the docs, in an iframe of its own, on no docs page, or not a theme: nothing to flag.
  for (const [body, meta] of [
    ["export const Light = { tags: ['!dev', '!autodocs'], globals: { theme: 'light' } };"],
    [
      "const HIDDEN = ['!dev', '!autodocs'];\nexport const Light = { tags: HIDDEN, globals: { theme: 'light' } };",
    ],
    ["export const Light = { parameters: portalDocsParams.sm(), globals: { theme: 'light' } };"],
    [
      "export const Light = { parameters: { docs: { story: { inline: false } } }, globals: { theme: 'light' } };",
    ],
    ["export const Light = { globals: { theme: 'light' } };", "{ title: 'A/B' }"],
    ["export const Light = { globals: { viewport: 'mobile' } };"],
    ["export const Light = { args: { theme: 'light' } };"],
    // A spread of what the file does not declare may carry tags: nothing can be said.
    ["export const Light = { ...imported, globals: { theme: 'light' } };"],
  ] as [string, string?][]) {
    expect(hazards(body, meta), body).toEqual([]);
  }

  // Tags the indexer cannot read: a helper's result, a spread of another story, and a spread that
  // takes over the `tags` written before it.
  const helper = "const at = (n: number) => ({ tags: ['!dev', '!autodocs'], args: { n } });\n";
  const base = "export const Base = { tags: ['!dev', '!autodocs'] };\n";
  for (const body of [
    `${helper}export const Hidden = at(2);`,
    `${helper}export const Hidden = { ...at(2), name: 'x' };`,
    `${base}export const Hidden = { ...Base, args: {} };`,
  ]) {
    expect(hazards(body), body).toEqual([unread('Hidden', '!dev, !autodocs')]);
  }
  expect(hazards(`${base}export const Hidden = { tags: ['!dev'], ...Base };`)).toEqual([
    unread('Hidden', '!autodocs'),
  ]);
  expect(
    hazards(`${helper}export const Hidden = { ...at(2), tags: ['!dev'] };`),
    "a literal `tags` replaces the helper's"
  ).toEqual([]);
  // Written at the export, the indexer reads them.
  for (const body of [
    "const at = () => ({ args: {} });\nexport const Hidden = { ...at(), tags: ['!dev', '!autodocs'] };",
    "const HIDE = ['!dev', '!autodocs'];\nexport const Hidden = { ...Other, tags: HIDE };",
    "export const Hidden = { tags: ['!dev', '!autodocs'], render: () => null };",
    'export const Visible = { ...Other, args: {} };',
    'export const Visible = other();',
    "export const Visible = { ...Base, args: {} };\nexport const Base = { tags: ['no-capture'] };",
  ]) {
    expect(hazards(body), body).toEqual([]);
  }
});

test('no story pins the theme on a docs page, and every hidden story says so where the indexer reads it', () => {
  const files = storySources();
  expect(files.length, 'stories files').toBeGreaterThan(200);

  const found = files.flatMap((file) =>
    storyHazards(file, read(file)).map((hit) => ({ file, ...hit }))
  );
  const allowed = (hit: { file: string; story: string; problem: string }) =>
    hit.problem.startsWith('pins') &&
    STORY_THEME_ALLOWED.some(({ file, story }) => file === hit.file && story === hit.story);
  expect(
    found.filter((hit) => !allowed(hit)).map((hit) => `${hit.file}: ${hit.story} ${hit.problem}`),
    'a story on a docs page that sets globals.theme turns the whole page into that theme: tag it `!autodocs`, or give it a surface (a wrapper carrying the theme class) or an iframe of its own (portalDocsParams); a hidden story takes its `!dev` and `!autodocs` in a literal `tags` at the export, or the sidebar and the docs list it'
  ).toEqual([]);

  for (const { file, story, reason } of STORY_THEME_ALLOWED) {
    expect(reason, `${file}: ${story}`).not.toBe('');
    expect(
      found.some((hit) => hit.file === file && hit.story === story),
      `STORY_THEME_ALLOWED entry no longer needed: ${file}: ${story}`
    ).toBe(true);
  }
});

// A viewport in a file's `meta` applies to every story of the file, in the canvas and on the docs
// page: the reader can no longer widen the frame from the toolbar, and a screen built to fill a
// wide window stays at the preset's width (Examples/Monitoring and Examples/List were held at
// 1280px). A story that needs a size sets it itself (`globals: mobileViewport`).
const metaBlock = (source: string) => {
  const start = source.search(/\bconst meta\b[^=]*=\s*\{/);
  if (start === -1) return '';
  const end = source.indexOf('\nexport default', start);
  return source.slice(start, end === -1 ? undefined : end);
};
const pinsViewport = (block: string) =>
  /globals\s*:\s*\{[^}]*\bviewport\b/.test(block) || /globals\s*:\s*\w+Viewport\b/.test(block);

test('the viewport check sees a pin in the meta and lets a story pin its own', () => {
  for (const meta of [
    "const meta = {\n  title: 'A/B',\n  globals: { viewport: { value: 'tw-xl', isRotated: false } },\n} satisfies Meta;\nexport default meta;",
    "const meta: Meta<typeof X> = { title: 'A/B', globals: mobileViewport };\nexport default meta;",
  ]) {
    expect(pinsViewport(metaBlock(meta)), meta).toBe(true);
  }
  for (const source of [
    "const meta = { title: 'A/B', globals: { theme: 'light' } } satisfies Meta;\nexport default meta;\nexport const Phone = { globals: mobileViewport };",
    "const meta = { title: 'A/B' } satisfies Meta;\nexport default meta;\nexport const Wide = { globals: { viewport: { value: 'tw-2xl' } } };",
  ]) {
    expect(pinsViewport(metaBlock(source)), source).toBe(false);
  }
});

test('no stories file pins a viewport for every story it holds', () => {
  const files = storySources();
  expect(files.length, 'stories files').toBeGreaterThan(200);
  expect(
    files.filter((file) => pinsViewport(metaBlock(read(file)))),
    'a viewport in the meta holds every story of the file at that size, in the canvas and the docs: set it on the stories that need it'
  ).toEqual([]);
});
