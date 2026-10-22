import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Checks on the repo's supply-chain settings. They guard what reaches npm
// through publish.yml, and nothing else fails when one of them is dropped.

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

type Outputs = Record<string, string>;

/**
 * The `if:` of the workflow step named `step`, as a function of the
 * fetch-metadata outputs. Handles a one-line `if: ${{ … }}` and a folded
 * `if: >-` block; only the operators the workflow uses (== != && || ! and
 * parentheses) are translated.
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
    .replace(/([!=])=/g, '$1==');
  // Only those tokens reach the Function constructor, so the file can't run
  // anything else.
  const rest = js.replace(/o\['[\w-]+'\]|'[\w:.-]*'|===|!==|&&|\|\||[!()\s]/g, '');
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
  ];
  for (const [name, outputs, merges] of cases) {
    expect(enable(outputs), `${name}: enable`).toBe(merges);
    expect(disable(outputs), `${name}: disable`).toBe(!merges);
  }
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
