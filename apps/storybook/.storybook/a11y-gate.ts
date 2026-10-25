import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import type { AfterEach } from 'storybook/internal/types';
import { inject, type TestContext } from 'vitest';

import todoList from './a11y-todo.json';

declare module 'vitest' {
  export interface ProvidedContext {
    /** `A11Y_THEME`, checked by `vitest.config.ts`: the contrast pass's theme, '' otherwise. */
    a11yTheme: string;
  }
}

/**
 * The Vitest task meta `a11y-todo-reporter.ts` reads: `storyId`, set by
 * addon-vitest on every story test, and `a11yViolations`, set here whenever
 * axe ran (rule ids, sorted). `TaskMeta` itself lives in `@vitest/runner`,
 * which this app can't resolve to augment.
 */
export type A11yTaskMeta = { storyId?: string; a11yViolations?: string[] };

/**
 * The theme of the contrast pass (`A11Y_THEME=light pnpm a11y:contrast`), or
 * '' for the usual run, where axe checks every rule in the default theme.
 */
export const CONTRAST_THEME = inject('a11yTheme');

/**
 * Story id → the axe rules it still violates. Only ever shrinks. It lists
 * what axe finds in the default theme: the contrast pass ignores it.
 */
const A11Y_TODO: Readonly<Record<string, readonly string[]>> = CONTRAST_THEME ? {} : todoList;

const TODO_FILE = 'apps/storybook/.storybook/a11y-todo.json';

type AxeNode = {
  target?: unknown[];
  any?: { data?: { messageKey?: string; contrastRatio?: number } | null }[];
};
type A11yResult = {
  violations?: { id: string }[];
  incomplete?: { id: string; nodes?: AxeNode[] }[];
};

/**
 * The rules axe flagged in this run, or undefined if axe did not run (or
 * crashed). On violations in `'error'` mode the addon adds a second a11y
 * report, `{ error }`, after the one holding the results.
 */
const violatedRules = (reports: { type: string; result: unknown }[]) => {
  const violations = reports
    .filter((r) => r.type === 'a11y')
    .map((r) => (r.result as A11yResult | undefined)?.violations)
    .find((v) => v !== undefined);
  return violations && [...new Set(violations.map((v) => v.id))].sort();
};

/**
 * The selectors whose `color-contrast` axe could not decide because foreground
 * and background are the same color (`equalRatio`, a 1:1 ratio). axe files
 * that under `incomplete`, not `violations`, so the addon never fails on it,
 * yet it is what a state painted white on white looks like.
 */
const equalContrastTargets = (reports: { type: string; result: unknown }[]) =>
  reports
    .filter((r) => r.type === 'a11y')
    .flatMap((r) => (r.result as A11yResult | undefined)?.incomplete ?? [])
    .filter((rule) => rule.id === 'color-contrast')
    .flatMap((rule) => rule.nodes ?? [])
    .filter((node) =>
      node.any?.some((c) => c.data?.messageKey === 'equalRatio' || c.data?.contrastRatio === 1)
    )
    .map((node) => String(node.target?.[0] ?? 'unknown element'));

const list = (rules: readonly string[]) => rules.join(', ');

/** The rules found per story id, until `recordA11yViolations` moves them to the task. */
const foundByStory = new Map<string, string[]>();

/**
 * The addon's `afterEach`, run per story with the mode the todo list gives it:
 *
 * - a story in `a11y-todo.json` runs with `a11y.test: 'todo'`: its violations
 *   are warnings in the Storybook UI and don't fail the run;
 * - every other story keeps `preview.tsx`'s `'error'`: any violation fails it.
 *
 * Then the ratchet: a listed story must violate exactly its listed rules. A
 * rule that no longer fires fails the run until its entry is trimmed, and a
 * new rule fails it too (an entry never grows), so the list can only shrink.
 *
 * A `color-contrast` result axe leaves incomplete because the ratio is 1:1
 * fails too, in every story and whatever the todo list says.
 *
 * Wrapping the addon's hook keeps the story's parameters untouched and does
 * not depend on the order Storybook runs project `afterEach` hooks in (last
 * annotation first).
 */
const a11yGate: AfterEach = async (context) => {
  const listed = A11Y_TODO[context.id];
  const { a11y } = context.parameters;
  const parameters =
    listed && a11y?.test !== 'off'
      ? { ...context.parameters, a11y: { ...a11y, test: 'todo' } }
      : context.parameters;

  let found: string[] | undefined;
  try {
    await a11yAddonAnnotations.afterEach({ ...context, parameters });
  } finally {
    found = violatedRules(context.reporting.reports);
    if (found) foundByStory.set(context.id, found);
  }

  const equal = equalContrastTargets(context.reporting.reports);
  if (equal.length > 0) {
    throw new Error(
      `${context.id} has text with a 1:1 contrast ratio (same color as its background; axe reports it as incomplete, not as a violation): ${list(equal)}.`
    );
  }

  if (!listed || !found) return;
  if (found.length === 0) {
    throw new Error(
      `${context.id} has no axe violations any more: delete its entry from ${TODO_FILE}.`
    );
  }
  const fixed = listed.filter((rule) => !found.includes(rule));
  const added = found.filter((rule) => !listed.includes(rule));
  if (fixed.length === 0 && added.length === 0) return;
  throw new Error(
    [
      `${context.id} does not match its entry in ${TODO_FILE}.`,
      fixed.length > 0 && `Fixed, remove from the entry: ${list(fixed)}.`,
      added.length > 0 &&
        `New violations, fix them (an entry never grows): ${list(added)}. Details in the a11y panel.`,
    ]
      .filter(Boolean)
      .join('\n')
  );
};

/** The addon's annotations, with its `afterEach` behind the todo list. */
export const a11yGateAnnotations = { ...a11yAddonAnnotations, afterEach: a11yGate };

/**
 * The contrast pass, after `preview.tsx` so it wins: every story renders in
 * `CONTRAST_THEME` (a story that pins `globals.theme` keeps its own) and axe
 * runs only `color-contrast`. With no todo list, any violation fails. Play
 * functions run as usual: they open the panels and menus whose contrast is
 * checked, and none depends on the theme.
 */
export const contrastPassAnnotations = CONTRAST_THEME
  ? {
      initialGlobals: { theme: CONTRAST_THEME },
      parameters: {
        a11y: { options: { runOnly: { type: 'rule', values: ['color-contrast'] } } },
      },
    }
  : {};

/**
 * Vitest `afterEach`: copies the rules the gate found into the task meta,
 * failing tests included (addon-vitest only copies its reports on success),
 * for `pnpm a11y:todo` to rewrite the list from.
 */
export const recordA11yViolations = ({ task }: TestContext) => {
  const meta = task.meta as A11yTaskMeta;
  if (!meta.storyId) return;
  const found = foundByStory.get(meta.storyId);
  foundByStory.delete(meta.storyId);
  if (found) meta.a11yViolations = found;
};
