import type { AfterEach, ProjectAnnotations, Renderer } from 'storybook/internal/types';
import { inject } from 'vitest';
import { page } from 'vitest/browser';

declare module 'vitest' {
  export interface ProvidedContext {
    /** `STORY_DIR`, checked by `vitest.config.ts`: the direction pass's direction, '' otherwise. */
    storyDir: string;
  }
}

/**
 * The direction of the direction pass (`STORY_DIR=rtl pnpm a11y:rtl`), or '' for the usual run,
 * where stories render without a `dir` attribute.
 */
export const PASS_DIRECTION = inject('storyDir');

const scrollsSideways = (root: HTMLElement) => root.scrollWidth > root.clientWidth;

/** The widths #453 names besides the one the story renders at: a phone and a desktop. */
const WIDTHS = [375, 1280];

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Fails a story whose page scrolls sideways under `dir="rtl"` while it does not in left to
 * right: the same DOM is measured both ways, so a story that already overflows in left to
 * right (a wide table in its own page) is not this pass's finding. It is measured at the width
 * the story renders at and at `WIDTHS`, the viewport put back afterwards. A story that pins
 * its own direction is measured as it is.
 */
const noRtlOverflow: AfterEach = async ({ id }) => {
  const root = document.documentElement;
  if (root.dir !== 'rtl') return;
  const { innerWidth, innerHeight } = window;
  const check = (width: number) => {
    if (!scrollsSideways(root)) return;
    root.dir = 'ltr';
    const alsoInLtr = scrollsSideways(root);
    root.dir = 'rtl';
    if (!alsoInLtr) {
      throw new Error(
        `${id} scrolls sideways in right to left at ${width}px and does not in left to right.`
      );
    }
  };
  try {
    check(innerWidth);
    for (const width of WIDTHS.filter((width) => width !== innerWidth)) {
      await page.viewport(width, innerHeight);
      await nextFrame();
      check(width);
    }
  } finally {
    if (window.innerWidth !== innerWidth) {
      await page.viewport(innerWidth, innerHeight);
      // axe runs after this hook: a component that measures itself (a ResizeObserver, then a
      // React render) must be back at the story's width first, or a table that scrolls at that
      // width is checked as the one that fit at 1280px, without its tab stop.
      await nextFrame();
      await nextFrame();
    }
  }
};

/**
 * The direction pass, after `preview.tsx` so it wins: every story renders under
 * `PASS_DIRECTION` (a story that pins `globals.direction` keeps its own), with every axe rule
 * and the play functions as usual, plus the overflow check above. Empty for the usual run.
 */
export const directionPassAnnotations: ProjectAnnotations<Renderer> = PASS_DIRECTION
  ? { initialGlobals: { direction: PASS_DIRECTION }, afterEach: noRtlOverflow }
  : {};
