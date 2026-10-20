import { test } from '@playwright/test';

// Manual visual review: one PNG per story in screenshots/. The list comes from
// Storybook's own index, so it can't point at a renamed story the way the old
// hand-written capture lists did. Narrow it with an id substring:
//   STORIES=overlays- make screenshots
type IndexEntry = { id: string; type: 'story' | 'docs' };

test('capture stories', async ({ page }) => {
  test.setTimeout(0);
  const filter = process.env.STORIES ?? '';
  const res = await page.request.get('/index.json');
  const { entries } = (await res.json()) as { entries: Record<string, IndexEntry> };
  const ids = Object.values(entries)
    .filter((e) => e.type === 'story' && e.id.includes(filter))
    .map((e) => e.id);

  for (const id of ids) {
    await page.goto(`/iframe.html?viewMode=story&id=${id}`);
    // Storybook flags the body once the story has rendered (or failed to).
    await page.locator('body.sb-show-main, body.sb-show-errordisplay').waitFor();
    await page.screenshot({ path: `../../screenshots/${id}.png` });
  }
});
