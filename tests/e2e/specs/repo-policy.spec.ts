import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
// ones, group by group as each Storybook group is converted (#453).

/** The Storybook groups whose components are converted. A group is added when its PR lands. */
const RTL_GROUPS: string[] = ['Atoms', 'Actions', 'Forms', 'Data', 'Lists', 'Feedback', 'Overlays'];

/**
 * Component sources the story-title rule cannot find: a stories file whose component has
 * another name, or a helper module the converted components share.
 */
const RTL_EXTRA_FILES = [
  'packages/react/src/ui/Button.tsx', // Buttons.stories.tsx
  'packages/react/src/forms/fieldRecipe.ts', // the padding and icon places of every field
  'packages/react/src/forms/RequiredMark.tsx', // the asterisk after a label
  'packages/react/src/forms/tagField.tsx', // the box and input of MultiSelect and TagInput
  'packages/react/src/comments/Comment.tsx', // what CommentThread draws
  'packages/react/src/comments/CommentComposer.tsx', // the reply and edit fields of a Comment
  'packages/react/src/data/TimeLabel.tsx', // the `<time>` of DateTime and RelativeTime
  'packages/react/src/feedback/Skeleton.tsx', // Sk.stories.tsx, and the presets
  'packages/react/src/feedback/StateLayout.tsx', // what EmptyState, ErrorState and LoadingState draw
  'packages/react/src/ui/Dialog.tsx', // the panel of Modal and ConfirmationModal
  'packages/react/src/ui/FloatingPanel.tsx', // the panel of every popover, menu and picker
  'packages/react/src/ui/intent.ts', // the edge colour AlertBanner draws on its start side
];

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
];

/**
 * Component sources of a converted group that wait for later, with the reason (another branch
 * is changing them). They are left out of the check. An entry fails once its file is no longer
 * in a converted group or holds no physical utility any more: the list only shrinks.
 */
const RTL_DEFERRED: { file: string; reason: string }[] = [
  {
    file: 'packages/react/src/editor/RichTextEditor.tsx',
    reason: 'editor/ is converted after #486, which is changing FormattingToolbar and LinkForm',
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

/** The component sources of `RTL_GROUPS`: their stories' components and `RTL_EXTRA_FILES`. */
const groupFiles = () => {
  const root = 'packages/react/src';
  const files = new Set(RTL_GROUPS.length > 0 ? RTL_EXTRA_FILES : []);
  const stories = readdirSync(new URL(`../../../${root}`, import.meta.url), {
    recursive: true,
    encoding: 'utf8',
  }).filter((path) => path.endsWith('.stories.tsx'));
  for (const story of stories) {
    const group = /\btitle:\s*'([^/']+)\//.exec(read(`${root}/${story}`))?.[1];
    if (!group || !RTL_GROUPS.includes(group)) continue;
    const component = `${root}/${story.replace('.stories.tsx', '.tsx')}`;
    // Not every stories file sits next to a component of its name: RTL_EXTRA_FILES has those.
    if (existsSync(new URL(`../../../${component}`, import.meta.url))) files.add(component);
  }
  return [...files].sort();
};

/** The sources the check reads: those of the groups, less the deferred ones. */
const convertedFiles = () =>
  groupFiles().filter((file) => !RTL_DEFERRED.some((deferred) => deferred.file === file));

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

test('the converted groups use logical utilities only', () => {
  const files = convertedFiles();
  // A group holds components, so an empty list means the story titles stopped matching.
  expect(files.length > 0, 'converted component files').toBe(RTL_GROUPS.length > 0);

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

test('the deferred files are still in a converted group and still need converting', () => {
  const inGroups = groupFiles();
  for (const { file, reason } of RTL_DEFERRED) {
    expect(reason, file).not.toBe('');
    expect(inGroups, `RTL_DEFERRED entry not in a converted group: ${file}`).toContain(file);
    expect(
      physicalUtilities(read(file)).length > 0,
      `RTL_DEFERRED entry no longer needed: ${file}`
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

/**
 * Types of the Feedback and Overlays groups, which keep their physical names until the branch
 * that renames them lands (#453). The list only shrinks: an entry fails once its type is
 * renamed, so the branch that renames it deletes its line.
 */
const SIDE_DEFERRED: { file: string; holder: string; reason: string }[] = [
  {
    file: 'packages/react/src/ui/Drawer.tsx',
    holder: 'DrawerSide',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/Dropdown.tsx',
    holder: 'DropdownProps.align',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/Menu.tsx',
    holder: 'Ctx.align',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/Menu.tsx',
    holder: 'MenuProps.align',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/NotificationsPanel.tsx',
    holder: 'Ctx.align',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/NotificationsPanel.tsx',
    holder: 'NotificationsPanelProps.align',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/Popover.tsx',
    holder: 'PopoverPosition',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/Tooltip.tsx',
    holder: 'TooltipPosition',
    reason: 'renamed by the Feedback and Overlays branch',
  },
  {
    file: 'packages/react/src/ui/UserMenu.tsx',
    holder: 'UserMenuProps.align',
    reason: 'renamed by the Feedback and Overlays branch',
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
      .filter((hit) => !matches(SIDE_ALLOWED)(hit) && !matches(SIDE_DEFERRED)(hit))
      .map(({ file, holder }) => `${file}: ${holder}`),
    'name the side start or end, or add a SIDE_ALLOWED entry with the reason it must stay physical (`top` and `bottom` are fine)'
  ).toEqual([]);

  for (const [list, name] of [
    [SIDE_ALLOWED, 'SIDE_ALLOWED'],
    [SIDE_DEFERRED, 'SIDE_DEFERRED'],
  ] as const) {
    for (const entry of list) {
      expect(entry.reason, `${name}: ${entry.file}: ${entry.holder}`).not.toBe('');
      expect(
        found.some(matches([entry])),
        `${name} entry no longer needed: ${entry.file}: ${entry.holder}`
      ).toBe(true);
    }
  }
});
