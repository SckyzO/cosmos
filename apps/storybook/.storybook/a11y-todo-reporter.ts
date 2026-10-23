import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import type {
  Reporter,
  SerializedError,
  TestModule,
  TestRunEndReason,
  TestSpecification,
  Vitest,
} from 'vitest/node';

import type { A11yTaskMeta } from './a11y-gate';

const TODO_PATH = fileURLToPath(new URL('./a11y-todo.json', import.meta.url));

type TodoList = Record<string, string[]>;

const byKey = ([a]: [string, unknown], [b]: [string, unknown]) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Rewrites `a11y-todo.json` from the axe results of a run of every story:
 * `pnpm --filter @cosmos/storybook a11y:todo`. The a11y gate puts each story's
 * violated rules in its task meta, failing stories included, so the file ends
 * up listing exactly the stories that violate a rule today, sorted by id.
 *
 * A story whose test failed before axe ran (play function, render error) keeps
 * the entry it had. A filtered run (files, `-t`), or one where a story file
 * failed to load, writes nothing: the entries of the stories it missed would
 * be lost.
 */
export default class A11yTodoReporter implements Reporter {
  private vitest: Vitest | undefined;
  private specifications: readonly TestSpecification[] = [];

  onInit(vitest: Vitest) {
    this.vitest = vitest;
  }

  onTestRunStart(specifications: readonly TestSpecification[]) {
    this.specifications = specifications;
  }

  async onTestRunEnd(
    testModules: readonly TestModule[],
    _unhandledErrors: readonly SerializedError[],
    reason: TestRunEndReason
  ) {
    if (reason === 'interrupted' || !this.vitest) return;
    const { logger, config } = this.vitest;

    // Every file of the run's project(s) ran? (The browser project is named
    // `storybook (chromium)`, after its instance.)
    const ran = new Set(this.specifications.map((s) => s.moduleId));
    const projects = [...new Set(this.specifications.map((s) => s.project))];
    const globbed = await Promise.all(projects.map((project) => project.globTestFiles()));
    const complete =
      ran.size > 0 && globbed.every(({ testFiles }) => testFiles.every((file) => ran.has(file)));
    if (config.testNamePattern || !complete) {
      throw new Error(
        'a11y-todo.json not written: it needs a run of every story, without a file or -t filter.'
      );
    }
    const broken = testModules.filter((module) => module.errors().length > 0);
    if (broken.length > 0) {
      throw new Error(
        `a11y-todo.json not written: ${broken.length} story files failed to load. Run it again.`
      );
    }

    const previous = JSON.parse(await readFile(TODO_PATH, 'utf8')) as TodoList;
    const next: TodoList = {};
    const notRun: string[] = [];
    for (const module of testModules) {
      for (const testCase of module.children.allTests()) {
        const { storyId, a11yViolations } = testCase.meta() as A11yTaskMeta;
        if (!storyId) continue;
        if (!a11yViolations && testCase.result().state === 'failed') notRun.push(storyId);
        const rules = a11yViolations ?? previous[storyId];
        if (rules && rules.length > 0) next[storyId] = rules;
      }
    }

    const sorted = Object.fromEntries(Object.entries(next).sort(byKey));
    const options = await resolveConfig(TODO_PATH);
    await writeFile(
      TODO_PATH,
      await format(JSON.stringify(sorted, null, 2), { ...options, filepath: TODO_PATH })
    );

    const removed = Object.keys(previous).filter((id) => !(id in next));
    const added = Object.keys(next).filter((id) => !(id in previous));
    logger.log(
      `a11y-todo.json: ${Object.keys(next).length} stories listed (${removed.length} removed, ${added.length} added).`
    );
    if (notRun.length > 0) {
      logger.log(
        `axe did not run for ${notRun.length} stories, entries kept: ${notRun.join(', ')}`
      );
    }
  }
}
