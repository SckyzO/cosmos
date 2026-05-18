// Quick smoke test for TailAdmin analysis pipeline.
// Usage: docker compose run --rm playwright node scripts/analyze-tailadmin-test.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('./tailadmin-snapshots');
const URLS = ['https://demo.tailadmin.com/buttons', 'https://demo.tailadmin.com/badge'];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const url of URLS) {
    const slug = url.split('/').pop();
    console.log(`→ ${slug}`);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Structured summary — headings, buttons, links, form controls.
      // Markdown to make the report compilation step trivial.
      const summary = await page.evaluate(() => {
        const sel = (q) => Array.from(document.querySelectorAll(q));
        const text = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
        return {
          title: document.title,
          h1: sel('h1').map(text),
          h2: sel('h2').map(text),
          h3: sel('h3').map(text),
          h4: sel('h4').map(text),
          buttons: sel('button')
            .slice(0, 80)
            .map((el) => text(el) || '(icon)'),
          links: sel('a')
            .slice(0, 40)
            .map((el) => text(el))
            .filter(Boolean),
          inputs: sel('input,textarea,select')
            .slice(0, 40)
            .map((el) => ({
              type: el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : ''),
              placeholder: el.placeholder || el.getAttribute('aria-label') || '',
            })),
          tables: sel('table').length,
          dialogs: sel('[role="dialog"], dialog').length,
          tabs: sel('[role="tab"]').length,
        };
      });
      await fs.writeFile(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(summary, null, 2));

      console.log(
        `  ✓ ${slug} — h2=${summary.h2.length} h3=${summary.h3.length} buttons=${summary.buttons.length} inputs=${summary.inputs.length}`
      );
    } catch (err) {
      console.error(`  ✗ ${slug} — ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
