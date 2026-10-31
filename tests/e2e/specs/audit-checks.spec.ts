import { test, expect, type Page } from '@playwright/test';
import { auditPage, watchConsole } from '../captures/audit-checks';

// The automated checks of `make audit-captures` (captures/audit-checks.ts), on
// small synthetic pages: each defect is reported, its harmless look-alike is
// not, and a clean page reports nothing. No Storybook needed.

test.use({ viewport: { width: 400, height: 600 } });

const BASE = `<style>body{margin:8px;font:14px/20px sans-serif}</style>`;

/** Loads a page and returns the rules reported, sorted, without repeats. */
const rulesOf = async (page: Page, html: string) => {
  const watcher = watchConsole(page);
  await page.setContent(BASE + html);
  const findings = [...(await auditPage(page)), ...watcher.findings()];
  return [...new Set(findings.map((f) => f.rule))].sort();
};

test('a clean page reports nothing', async ({ page }) => {
  const rules = await rulesOf(
    page,
    `<h1 style="margin:0 0 8px">Title</h1>
     <p style="width:300px">A sentence with <a href="#">an inline link</a> in the middle of it,
       which wraps onto a second line without any problem.</p>
     <button style="width:120px;height:40px">Save</button>
     <div style="display:flex;gap:8px;width:300px"><svg width="24" height="24"></svg>
       <span style="min-width:0">Label</span></div>
     <input type="checkbox" id="c" style="width:16px;height:16px"><label for="c"
       style="display:inline-block;padding:8px 12px">Remember me</label>`
  );
  expect(rules).toEqual([]);
});

test('reports a page that scrolls sideways', async ({ page }) => {
  const rules = await rulesOf(page, `<div style="width:900px;height:20px;background:#ccc"></div>`);
  expect(rules).toContain('sideways-scroll');
});

test.describe('text cut off or running out of its box', () => {
  const TEXT = 'A label far too long for the box it sits in';

  test('reports text cut by overflow hidden', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="width:80px;overflow:hidden;white-space:nowrap">${TEXT}</div>`
    );
    expect(rules).toContain('text-cut-off');
  });

  test('reports text running out of a box that does not clip', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="width:80px;white-space:nowrap;border:1px solid #888">${TEXT}</div>`
    );
    expect(rules).toContain('text-cut-off');
  });

  test('accepts an ellipsis, a line clamp and a scroller: the cut is intended', async ({
    page,
  }) => {
    const rules = await rulesOf(
      page,
      `<div style="width:80px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${TEXT}</div>
       <div style="width:120px;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;
         -webkit-line-clamp:2">${TEXT} ${TEXT} ${TEXT}</div>
       <div style="width:80px;overflow:auto;white-space:nowrap">${TEXT}</div>`
    );
    expect(rules).toEqual([]);
  });

  test('accepts text hidden whole: a collapsed panel, a visually hidden label', async ({
    page,
  }) => {
    const rules = await rulesOf(
      page,
      `<div style="height:0;overflow:hidden">${TEXT}</div>
       <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">${TEXT}</span>`
    );
    expect(rules).toEqual([]);
  });
});

test('reports text drawn over other text', async ({ page }) => {
  const rules = await rulesOf(
    page,
    `<div style="position:relative;height:40px">
       <span style="position:absolute;top:0;left:0">First label</span>
       <span style="position:absolute;top:2px;left:10px">Second label</span>
     </div>`
  );
  expect(rules).toContain('text-overlap');
});

test('accepts text over text in a layer of its own: a dialog over the page', async ({ page }) => {
  const rules = await rulesOf(
    page,
    `<p style="margin:0">Page text behind the dialog, long enough to sit under it.</p>
     <div role="dialog" style="position:fixed;top:0;left:8px;background:#fff;padding:0">
       <span>Dialog text</span></div>`
  );
  expect(rules).toEqual([]);
});

test.describe('squeezed boxes', () => {
  test('reports an icon a flex row has shrunk', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="display:flex;width:100px"><svg width="24" height="24"></svg>
         <span style="white-space:nowrap">A label that is wider than the row</span></div>`
    );
    expect(rules).toContain('squeezed');
  });

  test('reports a column with content squeezed to no width', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="display:flex;width:300px">
         <div style="width:0;overflow:visible"><span style="display:inline-block;width:40px;height:20px;background:#ccc"></span> Side</div>
         <div style="flex:1">Main</div></div>`
    );
    expect(rules).toContain('squeezed');
  });

  test('accepts an icon that is not allowed to shrink, and a collapsed hidden column', async ({
    page,
  }) => {
    const rules = await rulesOf(
      page,
      `<div style="display:flex;width:100px"><svg width="24" height="24" style="flex-shrink:0"></svg>
         <span style="white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis">A label wider than the row</span></div>
       <div style="display:flex;width:300px"><nav aria-hidden="true" style="width:0;overflow:hidden">Menu</nav>
         <div style="flex:1">Main</div></div>`
    );
    expect(rules).toEqual([]);
  });
});

test.describe('touch targets', () => {
  test('reports a 16px button next to another', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<button aria-label="a" style="width:16px;height:16px;padding:0"></button><button
         aria-label="b" style="width:16px;height:16px;padding:0"></button>`
    );
    expect(rules).toContain('small-target');
  });

  test('accepts a 24px target, a small one with room around it, and a link in a sentence', async ({
    page,
  }) => {
    const rules = await rulesOf(
      page,
      `<button aria-label="a" style="width:24px;height:24px;padding:0"></button>
       <button aria-label="b" style="width:16px;height:16px;padding:0;margin:40px"></button>
       <p style="width:300px">Read <a href="#" style="font-size:11px">the notes</a> first.</p>
       <button disabled style="width:12px;height:12px;padding:0;margin:12px"></button>`
    );
    expect(rules).toEqual([]);
  });
});

test('reports console errors and warnings, not logs', async ({ page }) => {
  expect(await rulesOf(page, `<script>console.log('fine'); console.info('fine')</script>`)).toEqual(
    []
  );
  expect(await rulesOf(page, `<script>console.error('boom')</script>`)).toEqual(['console']);
  expect(await rulesOf(page, `<script>console.warn('careful')</script>`)).toEqual(['console']);
});
