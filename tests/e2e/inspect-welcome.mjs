// Inspect the actual DOM state of the Welcome story in both themes.
// After the .mdx → .stories.tsx migration, decorators should now apply
// and `.dark` should toggle on the iframe <html>.
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

for (const theme of ['dark', 'light']) {
  await page.goto(
    `http://storybook:6006/?path=/story/welcome--default&globals=theme:${theme}`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await page.waitForTimeout(2500);

  const data = await page.evaluate(() => {
    const f = document.querySelector('iframe#storybook-preview-iframe');
    const fDoc = f?.contentDocument;
    const fRoot = fDoc?.documentElement;
    const fBody = fDoc?.body;
    const h1 = fDoc?.querySelector('h1');
    return {
      iframeHtmlClass: fRoot?.className,
      iframeBodyBg: fBody ? getComputedStyle(fBody).backgroundColor : null,
      h1Visible: !!h1,
      h1Text: h1?.textContent,
      h1Color: h1 ? getComputedStyle(h1).color : null,
    };
  });
  console.log(`\n=== theme=${theme} ===`);
  console.log(JSON.stringify(data, null, 2));
}
await browser.close();
