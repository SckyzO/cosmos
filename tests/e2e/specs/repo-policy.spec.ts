import { readdirSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

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
