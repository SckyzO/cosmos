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

test('accepts rotated text: its box is not where its glyphs are', async ({ page }) => {
  const rules = await rulesOf(
    page,
    `<div style="position:relative;height:120px;width:200px;overflow:hidden">
       <span style="position:absolute;top:40px;left:0;transform:rotate(-90deg);white-space:nowrap">Axis title text</span>
       <span style="position:absolute;top:40px;left:20px;transform:rotate(-45deg);white-space:nowrap">Slanted label</span>
     </div>`
  );
  expect(rules).toEqual([]);
});

test('accepts text reached by scrolling, and a caption hidden with clip', async ({ page }) => {
  const rules = await rulesOf(
    page,
    `<div style="width:100px;overflow:hidden">
       <div style="width:60px;overflow-x:auto;white-space:nowrap">A tab list wider than its scroller</div></div>
     <table><caption style="clip:rect(0,0,0,0);position:absolute;overflow:hidden;width:1px;height:1px;
       padding:0 16px">Members</caption><tr><td>Cell</td></tr></table>`
  );
  expect(rules).toEqual([]);
});

// What the review of the first full run (#494) found to be false alarms. Each
// keeps a real defect of the same kind reported next to it.
test.describe('false alarms of the first run', () => {
  test('accepts a visually hidden file input and the links of a log', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div><input type="file" aria-label="File" style="position:absolute;width:1px;height:1px;
         overflow:hidden;clip:rect(0,0,0,0);margin:0;padding:0;border:0"><button
         style="width:80px;height:32px">Upload</button></div>
       <div role="log" style="font:12px/16px monospace">
         <div><a href="#l1" style="display:inline-block;width:20px">1</a><span>step started</span></div>
         <div><a href="#l2" style="display:inline-block;width:20px">2</a><span>step done</span></div></div>`
    );
    expect(rules).toEqual([]);
  });

  test('accepts a gradient heading and a label placed over its neighbours', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<h1 style="margin:0;font:italic 32px/32px serif;background:linear-gradient(90deg,#00f,#f0f);
         -webkit-background-clip:text;background-clip:text;color:transparent;width:max-content">Welcome f</h1>
       <div style="position:relative;height:40px;width:200px">
         <span style="position:absolute;left:0;width:12px;white-space:nowrap">January</span></div>`
    );
    expect(rules).toEqual([]);
  });

  test('still reports a nowrap label running out of a box in the flow', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="width:60px;white-space:nowrap">A label running out</div>`
    );
    expect(rules).toContain('text-cut-off');
  });

  test('accepts a chart tooltip and a button laid over the text', async ({ page }) => {
    const rules = await rulesOf(
      page,
      `<div style="position:relative;width:300px">
         <p style="margin:0">Line one of the log, long enough to sit under the button</p>
         <button style="position:absolute;top:0;left:20px;height:24px">Jump to latest</button>
         <div class="recharts-tooltip-wrapper" style="position:absolute;top:0;left:120px">
           <span>Tooltip text</span></div></div>`
    );
    expect(rules).toEqual([]);
  });

  test('accepts a glyph that is not square in a square box, reports a real squeeze', async ({
    page,
  }) => {
    const glyph = await rulesOf(
      page,
      `<div style="display:flex;width:60px;gap:0"><svg width="32" height="32"></svg>
         <span style="flex:none;width:32px"></span></div>`
    );
    expect(glyph).toEqual([]);
    const squeezed = await rulesOf(
      page,
      `<div style="display:flex;width:40px;gap:0"><svg width="32" height="32"></svg>
         <span style="flex:none;width:28px"></span></div>`
    );
    expect(squeezed).toContain('squeezed');
  });

  test("ignores Storybook's store warning, the cut YouTube frame and WebGL notes", async ({
    page,
  }) => {
    const rules = await rulesOf(
      page,
      `<script>
         console.warn('Accessing the Story Store is deprecated and will be removed in 9.0');
         console.warn("Failed to execute 'postMessage' on 'DOMWindow': The target origin provided " +
           "('http://127.0.0.1:1') does not match the recipient window's origin ('https://www.youtube-nocookie.com').");
         console.warn('[.WebGL-0x1]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels');
       </script>`
    );
    expect(rules).toEqual([]);
  });
});
