import type { Meta, StoryObj } from '@storybook/react-vite';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { createCssVariablesTheme, createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from 'shiki/langs/bash.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import yaml from 'shiki/langs/yaml.mjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectMirrored,
  expectNoHorizontalOverflow,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { isFading, tokenMs, transitionMs } from '../storybook-motion';
import { CodeBlock as ShikiCodeBlock } from '../code/CodeBlock';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'Media/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { code: 'echo hello' },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const SHELL = `# Add the Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install the node-exporter chart
helm install node-exporter prometheus-community/prometheus-node-exporter \\
  --namespace monitoring --create-namespace`;

const TS = `export type Healthcheck = {
  endpoint: string;
  intervalMs: number;
  timeoutMs?: number;
};

export const ping = async (h: Healthcheck) => {
  const res = await fetch(h.endpoint, { signal: AbortSignal.timeout(h.timeoutMs ?? 2000) });
  return res.ok;
};`;

const YAML = `name: ci
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15 # keep CI fast`;

// ── Shiki wiring — what an app copies to colour CodeBlock ──────────────────
// Shiki's CSS variables theme points each token type at a variable; with this
// prefix they are the --color-code-* tokens @sckyzo/cosmos-theme defines per
// theme (contrast-checked), so highlighting follows light / sand / dark /
// deep-blue. Sync highlighter, JavaScript regex engine, one import per language.
const cosmosCodeTheme = createCssVariablesTheme({
  name: 'cosmos',
  variablePrefix: '--color-code-',
});

const shiki = createHighlighterCoreSync({
  themes: [cosmosCodeTheme],
  langs: [bash, typescript, yaml],
  engine: createJavaScriptRegexEngine(),
});

/** CodeBlock `highlight` prop: Shiki tokens as React elements, no innerHTML. */
const highlightWithShiki = (code: string, language?: string) => {
  const lang = language && shiki.getLoadedLanguages().includes(language) ? language : 'text';
  const [pre] = shiki.codeToHast(code, { lang, theme: 'cosmos' }).children;
  // CodeBlock renders its own <pre><code>: keep only Shiki's lines.
  const inner = pre?.type === 'element' ? pre.children[0] : undefined;
  if (inner?.type !== 'element') return code;
  return toJsxRuntime({ type: 'root', children: inner.children }, { Fragment, jsx, jsxs });
};

export const WithLanguage: Story = {
  render: () => (
    <Wrap>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">Shell snippet</p>
      <CodeBlock language="bash" code={SHELL} />
    </Wrap>
  ),
};

export const Plain: Story = {
  render: () => (
    <Wrap>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">
        No language bar — copy floats top-right on hover
      </p>
      <CodeBlock code={SHELL} />
    </Wrap>
  ),
};

export const TypeScript: Story = {
  render: () => (
    <Wrap>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">TypeScript</p>
      <CodeBlock language="typescript" code={TS} />
    </Wrap>
  ),
};

export const NoCopy: Story = {
  render: () => (
    <Wrap>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">
        Read-only snippet (showCopy=false)
      </p>
      <CodeBlock
        language="yaml"
        code={'name: ci\non:\n  push:\n    branches: [main]\n'}
        showCopy={false}
      />
    </Wrap>
  ),
};

/**
 * `@sckyzo/cosmos-react/code` exports a `CodeBlock` that is coloured with no setup (see "Code
 * highlighting"). To colour with any other highlighter, give it through `highlight`. Here Shiki
 * uses its CSS variables theme with the `--color-code-*` tokens of `@sckyzo/cosmos-theme`, so
 * the colours follow the toolbar theme; an app only pays for Shiki and the languages it imports.
 *
 * ```tsx
 * import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
 * import { Fragment } from 'react';
 * import { jsx, jsxs } from 'react/jsx-runtime';
 * import { createCssVariablesTheme, createHighlighterCoreSync } from 'shiki/core';
 * import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
 * import bash from 'shiki/langs/bash.mjs';
 *
 * const shiki = createHighlighterCoreSync({
 *   themes: [createCssVariablesTheme({ name: 'cosmos', variablePrefix: '--color-code-' })],
 *   langs: [bash],
 *   engine: createJavaScriptRegexEngine(),
 * });
 *
 * const highlight = (code: string, language?: string) => {
 *   const lang = language && shiki.getLoadedLanguages().includes(language) ? language : 'text';
 *   const [pre] = shiki.codeToHast(code, { lang, theme: 'cosmos' }).children;
 *   const inner = pre?.type === 'element' ? pre.children[0] : undefined;
 *   if (inner?.type !== 'element') return code;
 *   return toJsxRuntime({ type: 'root', children: inner.children }, { Fragment, jsx, jsxs });
 * };
 *
 * <CodeBlock language="bash" code={script} highlight={highlight} />
 * ```
 */
export const HighlightedWithShiki: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">Shell</p>
          <CodeBlock language="bash" code={SHELL} highlight={highlightWithShiki} />
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">TypeScript</p>
          <CodeBlock language="typescript" code={TS} highlight={highlightWithShiki} />
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">YAML</p>
          <CodeBlock language="yaml" code={YAML} highlight={highlightWithShiki} />
        </div>
      </div>
    </Wrap>
  ),
};

export const HighlightedWithShikiChecks: Story = {
  ...HighlightedWithShiki,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre code')];
    await expect(blocks).toHaveLength(3);
    // Highlighting only wraps the text: what is shown (and copied) is the code.
    await expect(blocks.map((b) => b.textContent)).toEqual([SHELL, TS, YAML]);
    // Tokens are coloured through the theme variables, which resolve.
    const comment = [...blocks[0].querySelectorAll('span[style]')].find(
      (el) => el.textContent === '# Add the Prometheus repo'
    ) as HTMLElement;
    await expect(comment.getAttribute('style')).toContain('--color-code-token-comment');
    const root = getComputedStyle(document.documentElement);
    await expect(root.getPropertyValue('--color-code-token-comment').trim()).not.toBe('');
    await expect(getComputedStyle(comment).color).not.toBe(getComputedStyle(blocks[0]).color);
  },
};

// ── Variants ────────────────────────────────────────────────────────────────
// They need no highlighter: these stories plug Shiki in only to read like an app's blocks.

const COMPOSE = `services:
  web:
    image: ghcr.io/sckyzo/cosmos:1.4.0
    ports:
      - '8080:80'
    environment:
      LOG_LEVEL: info
    restart: unless-stopped
  db:
    image: postgres:17
    volumes:
      - data:/var/lib/postgresql/data
volumes:
  data: {}`;

const DIFF = `
 services:
   web:
-    image: ghcr.io/sckyzo/cosmos:1.3.0
+    image: ghcr.io/sckyzo/cosmos:1.4.0
     ports:
       - '8080:80'
-    restart: always
+    restart: unless-stopped`.slice(1);

const SESSION = `$ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
"prometheus-community" has been added to your repositories
$ helm install node-exporter prometheus-community/prometheus-node-exporter \\
    --namespace monitoring --create-namespace
NAME: node-exporter
STATUS: deployed
$ kubectl get pods -n monitoring`;

const SESSION_COMMANDS = `helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install node-exporter prometheus-community/prometheus-node-exporter \\
    --namespace monitoring --create-namespace
kubectl get pods -n monitoring`;

const DIFF_COPY = DIFF.replace(/^./gm, '');

const Labelled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 text-xs text-[var(--color-text-muted)]">{label}</p>
    {children}
  </div>
);

export const LineNumbers: Story = {
  render: () => (
    <Wrap>
      <Labelled label="lineNumbers: a gutter that is neither selected nor copied">
        <CodeBlock language="yaml" code={YAML} highlight={highlightWithShiki} lineNumbers />
      </Labelled>
    </Wrap>
  ),
};

export const HighlightedLines: Story = {
  render: () => (
    <Wrap>
      <Labelled label="highlightLines={[2, '5-6']}">
        <CodeBlock
          language="typescript"
          code={TS}
          highlight={highlightWithShiki}
          lineNumbers
          highlightLines={[2, '5-6']}
        />
      </Labelled>
    </Wrap>
  ),
};

export const WithFilename: Story = {
  render: () => (
    <Wrap>
      <Labelled label="filename: a header with the name, the language and the copy button">
        <CodeBlock
          filename="docker-compose.yaml"
          language="yaml"
          code={COMPOSE}
          highlight={highlightWithShiki}
        />
      </Labelled>
    </Wrap>
  ),
};

export const Wrapped: Story = {
  render: () => (
    <Wrap>
      {/* `grid-cols-1`: a column of `minmax(0, 1fr)`, so the block that scrolls sideways can't
          widen the page through it, as an implicit `auto` column did on a phone. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Labelled label="Default: scrolls sideways">
          <CodeBlock language="bash" code={SHELL} highlight={highlightWithShiki} />
        </Labelled>
        <Labelled label="wrap">
          <CodeBlock language="bash" code={SHELL} highlight={highlightWithShiki} wrap lineNumbers />
        </Labelled>
      </div>
    </Wrap>
  ),
};

export const MaxHeight: Story = {
  render: () => (
    <Wrap>
      <Labelled label="maxHeight={160}: scrolls inside; Tab reaches it, the arrow keys scroll it">
        <CodeBlock
          filename="docker-compose.yaml"
          language="yaml"
          code={COMPOSE}
          highlight={highlightWithShiki}
          maxHeight={160}
          lineNumbers
        />
      </Labelled>
    </Wrap>
  ),
};

export const Diff: Story = {
  render: () => (
    <Wrap>
      <Labelled label="diff: added and removed lines tinted and marked, the sign column is not copied">
        <CodeBlock
          filename="docker-compose.yaml"
          language="yaml"
          code={DIFF}
          highlight={highlightWithShiki}
          diff
        />
      </Labelled>
    </Wrap>
  ),
};

export const Terminal: Story = {
  render: () => (
    <Wrap>
      <Labelled label='variant="terminal": prompts and output apart, only the commands are copied'>
        <CodeBlock variant="terminal" code={SESSION} highlight={highlightWithShiki} />
      </Labelled>
    </Wrap>
  ),
};

// ── Interaction tests ───────────────────────────────────────────────────────

// `navigator.clipboard.writeText` rejects in the vitest browser sandbox: stub it to read back
// what the copy button wrote.
const captureClipboard = () => {
  const original = navigator.clipboard;
  const written: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        written.push(text);
        return Promise.resolve();
      },
    },
  });
  return {
    written,
    restore: () =>
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original }),
  };
};

const copyOf = async (canvas: HTMLElement) => {
  const clipboard = captureClipboard();
  try {
    await userEvent.click(canvas.querySelector('button[aria-label="Copy"]') as HTMLElement);
    await waitFor(() => expect(clipboard.written).toHaveLength(1));
    return clipboard.written[0];
  } finally {
    clipboard.restore();
  }
};

export const CopyLeavesOutLineNumbers: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock language="yaml" code={YAML} lineNumbers highlightLines={[1, '3-4']} />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    await expect(await copyOf(canvasElement)).toBe(YAML);
    const rows = [...canvasElement.querySelectorAll('[data-line]')];
    await expect(rows).toHaveLength(YAML.split('\n').length);
    // The gutter is there to read, and is hidden from assistive technology and from selection.
    const gutter = rows[0].firstElementChild as HTMLElement;
    await expect(gutter).toHaveTextContent('1');
    await expect(gutter).toHaveAttribute('aria-hidden', 'true');
    await expect(getComputedStyle(gutter).userSelect).toBe('none');
    // Emphasised lines: 1, 3 and 4.
    await expect(rows.map((r) => r.hasAttribute('data-highlighted'))).toEqual(
      YAML.split('\n').map((_, i) => [0, 2, 3].includes(i))
    );
  },
};

export const CopyLeavesOutDiffSigns: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock language="yaml" code={DIFF} diff />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    await expect(await copyOf(canvasElement)).toBe(DIFF_COPY);
    const rows = [...canvasElement.querySelectorAll('[data-line]')];
    await expect(rows.map((r) => r.getAttribute('data-kind'))).toEqual([
      'plain',
      'plain',
      'remove',
      'add',
      'plain',
      'plain',
      'remove',
      'add',
    ]);
    // Tinted AND marked: the sign is in the gutter, out of the selection.
    const sign = (row: Element) => row.querySelector('.select-none') as HTMLElement;
    await expect(sign(rows[2])).toHaveTextContent('−');
    await expect(sign(rows[3])).toHaveTextContent('+');
    await expect(getComputedStyle(sign(rows[3])).userSelect).toBe('none');
    const tint = (row: Element) => getComputedStyle(row).backgroundColor;
    await expect(tint(rows[3])).not.toBe(tint(rows[0]));
    await expect(tint(rows[2])).not.toBe(tint(rows[3]));
    // The code itself reads without the signs.
    await expect(rows[3]).toHaveTextContent('image: ghcr.io/sckyzo/cosmos:1.4.0');
  },
};

export const TerminalCopiesOnlyCommands: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock variant="terminal" code={SESSION} />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    await expect(await copyOf(canvasElement)).toBe(SESSION_COMMANDS);
    const rows = [...canvasElement.querySelectorAll('[data-line]')];
    await expect(rows.map((r) => r.getAttribute('data-kind'))).toEqual([
      'command',
      'output',
      'command',
      'continued',
      'output',
      'output',
      'command',
    ]);
    // The prompt is drawn apart, out of the selection; output has a style of its own.
    const prompt = rows[0].firstElementChild as HTMLElement;
    await expect(prompt).toHaveTextContent('$');
    await expect(getComputedStyle(prompt).userSelect).toBe('none');
    await expect(getComputedStyle(rows[1]).color).not.toBe(getComputedStyle(rows[0]).color);
  },
};

export const MaxHeightIsAKeyboardStop: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock filename="docker-compose.yaml" language="yaml" code={COMPOSE} maxHeight={120} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'docker-compose.yaml, code' });
    await expect(region.tagName).toBe('PRE');
    await expect(region).toHaveAttribute('tabindex', '0');
    // It scrolls inside, up to the height it was given.
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    await expect(region.clientHeight).toBeLessThanOrEqual(120);
    await expect(getComputedStyle(region).overflowY).toBe('auto');
    // Tab reaches it, with the focus ring. A focused scroller scrolls with the arrow keys (the
    // browser's own behaviour; the test's synthetic keys do not scroll, so this stops at the focus).
    await expectFocusRing(region, { inset: true });
  },
};

export const NoRegionWithoutMaxHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock language="yaml" code={COMPOSE} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // A block that does not scroll inside is not an extra stop in the tab order.
    await expect(canvas.queryByRole('region')).toBeNull();
    await expect(canvas.getByText(/image: postgres/).closest('pre')).not.toHaveAttribute(
      'tabindex'
    );
  },
};

const COMMENT = '/* a comment\n   over two lines */\nconst a = 1;';

export const LineVariantsKeepTheHighlighting: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <CodeBlock language="typescript" code={COMMENT} highlight={highlightWithShiki} lineNumbers />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll('[data-line]')];
    await expect(rows).toHaveLength(3);
    const text = (row: Element) => row.lastElementChild!.textContent;
    await expect(rows.map(text)).toEqual(COMMENT.split('\n'));
    // A comment spanning two lines is coloured as a comment on both, as it is in one pass.
    const colour = (row: Element) =>
      getComputedStyle(row.lastElementChild!.querySelector('[style]')!).color;
    await expect(colour(rows[0])).toBe(colour(rows[1]));
    await expect(colour(rows[2])).not.toBe(colour(rows[1]));
  },
};

export const WrapBreaksLongLines: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <CodeBlock language="bash" code={SHELL} wrap lineNumbers />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const pre = canvasElement.querySelector('pre') as HTMLElement;
    await expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth);
    expectNoHorizontalOverflow();
  },
};

export const LongLineIsAKeyboardStop: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <CodeBlock language="bash" code={SHELL} />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The first line is longer than the screen: the block scrolls sideways, so it takes a stop (#450).
    const region = await canvas.findByRole('region', { name: 'bash, code' });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(region).toHaveAttribute('tabindex', '0');
    await expectFocusRing(region, { inset: true });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * Code reads left to right whatever the page does: the lines, their number gutter and the scroll
 * origin stay put. The title bar follows the page, so the file name starts it and the copy button
 * ends it, and so does the floating copy button of a block with no title bar.
 */
export const CodeKeepsItsOrderAndChromeFollowsThePage: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-4">
        <CodeBlock
          code={'first line\nsecond line'}
          language="bash"
          filename="deploy.sh"
          lineNumbers
        />
        <CodeBlock code="no title bar" />
      </div>
    )),
  play: ({ canvasElement }) => {
    const gutters: number[] = [];
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const [titled, bare] = [...box.querySelectorAll<HTMLElement>('pre')].map(
        (pre) => pre.parentElement!
      ) as [HTMLElement, HTMLElement];
      const pre = titled.querySelector('pre')!;
      expect(getComputedStyle(pre).direction, `${dir}: the code`).toBe('ltr');
      const row = pre.querySelector<HTMLElement>('[data-line="1"]')!;
      const gutter = row.firstElementChild!;
      expect(gutter.getBoundingClientRect().left, `${dir}: gutter before text`).toBeLessThan(
        row.lastElementChild!.getBoundingClientRect().left
      );
      gutters.push(gutter.getBoundingClientRect().left - box.getBoundingClientRect().left);
      const copy = within(titled).getByRole('button', { name: 'Copy' });
      expect(endOffset(copy, titled), `${dir}: copy ends the title bar`).toBeLessThan(
        startOffset(copy, titled)
      );
      const floating = within(bare).getByRole('button', { name: 'Copy' });
      expect(endOffset(floating, bare), `${dir}: floating copy`).toBeLessThan(
        startOffset(floating, bare)
      );
    }
    expect(gutters[1]).toBeCloseTo(gutters[0]!, 0);
    expectMirrored(canvasElement, (box) => within(box).getByText('deploy.sh'));
    expectMirrored(canvasElement, (box) => within(box).getAllByRole('button', { name: 'Copy' })[0]);
  },
};

// ── Highlighting with the /code entry ───────────────────────────────────────
//
// The same block, coloured with no setup by the Shiki highlighter of the optional
// `@sckyzo/cosmos-react/code` entry. It is a separate entry so the root one never imports Shiki
// (`react-dist.spec.ts` guards that); the stories of both live on this page.

const CodeLabelled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="mb-2 text-xs text-[var(--color-text-muted)]">{label}</p>
    {children}
  </div>
);

/** A short real snippet per language: [label, language, code]. */
const CODE_SNIPPETS: ReadonlyArray<readonly [string, string, string]> = [
  ['Shell', 'bash', 'for f in *.log; do\n  gzip "$f" && echo "done: $f"\ndone'],
  [
    'Shell session',
    'shellsession',
    '$ kubectl get pods -n monitoring\nNAME     READY   STATUS\nnode-1   1/1     Running',
  ],
  [
    'YAML',
    'yaml',
    'name: ci\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest # fast',
  ],
  [
    'JSON',
    'json',
    '{\n  "name": "cosmos",\n  "private": false,\n  "keywords": ["design", "react"],\n  "size": 12.5\n}',
  ],
  ['TOML', 'toml', '[package]\nname = "cosmos"\nversion = "0.1.0"\nfeatures = ["a", "b"]'],
  ['INI', 'ini', '[server]\nlisten = 0.0.0.0:8080\nworkers = 4\n; comment'],
  [
    'Dockerfile',
    'dockerfile',
    'FROM node:22-slim AS build\nWORKDIR /app\nRUN pnpm install --frozen-lockfile\nCMD ["node", "server.js"]',
  ],
  [
    'SQL',
    'sql',
    "SELECT id, name\nFROM users\nWHERE created_at > '2026-01-01'\nORDER BY id\nLIMIT 10;",
  ],
  [
    'TypeScript',
    'typescript',
    'export const ping = async (url: string): Promise<boolean> => {\n  const res = await fetch(url);\n  return res.ok;\n};',
  ],
  ['JavaScript', 'javascript', 'const sum = (a, b) => a + b;\nconsole.log(sum(1, 2));'],
  [
    'TSX',
    'tsx',
    'export const Hello = ({ name }: { name: string }) => (\n  <p className="font-bold">Hello {name}</p>\n);',
  ],
  ['JSX', 'jsx', 'export const Hello = ({ name }) => <p className="font-bold">Hello {name}</p>;'],
  [
    'Python',
    'python',
    'def add(a: int, b: int) -> int:\n    """Add two numbers."""\n    return a + b',
  ],
  ['Go', 'go', 'func main() {\n\tfmt.Println("hello")\n}'],
  ['HTML', 'html', '<!doctype html>\n<div class="card">\n  <script>let x = 1</script>\n</div>'],
  ['XML', 'xml', '<?xml version="1.0"?>\n<root>\n  <item id="1">a</item>\n</root>'],
  ['CSS', 'css', '.card:hover > b {\n  color: var(--brand, #465fff);\n  margin: 0 auto;\n}'],
  ['Diff', 'diff', '--- a/app.yaml\n+++ b/app.yaml\n@@ -1,2 +1,2 @@\n-replicas: 2\n+replicas: 3'],
  [
    'nginx',
    'nginx',
    'server {\n  listen 80;\n  location / {\n    proxy_pass http://app:3000;\n  }\n}',
  ],
  [
    'HCL',
    'hcl',
    'resource "aws_s3_bucket" "logs" {\n  bucket = "cosmos-logs"\n  tags   = { env = "prod" }\n}',
  ],
  ['Terraform', 'terraform', 'variable "region" {\n  type    = string\n  default = "eu-west-3"\n}'],
  [
    'Rust',
    'rust',
    'fn main() {\n    let v: Vec<u8> = Vec::new();\n    println!("{}", v.len());\n}',
  ],
  [
    'Java',
    'java',
    'public class App {\n  public static void main(String[] args) {\n    System.out.println("hi");\n  }\n}',
  ],
  ['PHP', 'php', '<?php\nfunction add($a, $b) {\n    return $a + $b;\n}\necho add(1, 2);'],
  [
    'Markdown',
    'markdown',
    '# Title\n\nSome **bold** text, `code` and a [link](https://example.com).\n\n- item',
  ],
  [
    'PromQL',
    'promql',
    '# 5xx ratio per job\nsum by (job) (rate(http_requests_total{code=~"5.."}[5m]))\n  / sum by (job) (rate(http_requests_total[5m])) > 0.05',
  ],
];

const CODE_SHELL = `# Add the Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install the node-exporter chart
helm install node-exporter prometheus-community/prometheus-node-exporter \\
  --namespace monitoring --create-namespace`;

const CODE_DIFF = `
 services:
   web:
-    image: ghcr.io/sckyzo/cosmos:1.3.0
+    image: ghcr.io/sckyzo/cosmos:1.4.0
     ports:
       - '8080:80'`.slice(1);

const CODE_SESSION = `$ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
"prometheus-community" has been added to your repositories
$ kubectl get pods -n monitoring
NAME     READY   STATUS
node-1   1/1     Running`;

/** The tokens of a block: `<span>`s inside its `<code>` whose colour is a theme token. */
const tokens = (block: Element) => [...block.querySelectorAll('code span[style*="--color-code-"]')];

/**
 * `ShikiCodeBlock` is `CodeBlock` from `@sckyzo/cosmos-react/code`: the same props, coloured with
 * no `highlight` prop and no setup. The language loads on demand, and until it has (or for a
 * language with no grammar) the block shows plain text. It needs the optional peer `shiki`.
 */
export const CodeOutOfTheBox: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <CodeLabelled label="No highlight prop, no setup: the language loads on demand">
          <ShikiCodeBlock language="yaml" code={CODE_SNIPPETS[2][2]} />
        </CodeLabelled>
        <CodeLabelled label="Shell">
          <ShikiCodeBlock language="bash" code={CODE_SHELL} />
        </CodeLabelled>
        <CodeLabelled label="PromQL, a grammar of our own">
          <ShikiCodeBlock language="promql" code={CODE_SNIPPETS[25][2]} />
        </CodeLabelled>
        <CodeLabelled label="Unknown language: plain text">
          <ShikiCodeBlock language="klingon" code={'nuqneH\nqapla!'} />
        </CodeLabelled>
      </div>
    </Wrap>
  ),
};

export const CodeOutOfTheBoxChecks: Story = {
  ...CodeOutOfTheBox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await waitFor(() => {
      expect(tokens(blocks[0]).length).toBeGreaterThan(0);
      expect(tokens(blocks[1]).length).toBeGreaterThan(0);
      expect(tokens(blocks[2]).length).toBeGreaterThan(0);
    });
    await expect(blocks.map((b) => b.textContent)).toEqual([
      CODE_SNIPPETS[2][2],
      CODE_SHELL,
      CODE_SNIPPETS[25][2],
      'nuqneH\nqapla!',
    ]);
    // A language with no grammar stays text.
    await expect(tokens(blocks[3])).toHaveLength(0);
  },
};

/** A short real snippet in each of the languages the entry knows. */
export const CodeLanguages: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        {CODE_SNIPPETS.map(([label, language, code]) => (
          <CodeLabelled key={language} label={`${label} (${language})`}>
            <ShikiCodeBlock language={language} code={code} />
          </CodeLabelled>
        ))}
      </div>
    </Wrap>
  ),
};

export const CodeLanguagesChecks: Story = {
  ...CodeLanguages,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await expect(blocks).toHaveLength(CODE_SNIPPETS.length);
    // Every language has loaded and coloured its snippet, and the text is the code, whole.
    await waitFor(
      () => {
        for (const block of blocks) expect(tokens(block).length).toBeGreaterThan(1);
      },
      { timeout: 5000 }
    );
    await expect(blocks.map((b) => b.textContent)).toEqual(CODE_SNIPPETS.map(([, , code]) => code));
  },
};

/** The variants of the plain block, highlighted: filename, line numbers, diff, terminal, height. */
export const CodeVariants: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <CodeLabelled label="filename, lineNumbers and highlightLines">
          <ShikiCodeBlock
            filename="deployment.yaml"
            language="yaml"
            code={CODE_SNIPPETS[2][2]}
            lineNumbers
            highlightLines={[3, '5-6']}
          />
        </CodeLabelled>
        <CodeLabelled label="diff">
          <ShikiCodeBlock filename="docker-compose.yaml" language="yaml" code={CODE_DIFF} diff />
        </CodeLabelled>
        <CodeLabelled label='variant="terminal": the commands are highlighted as shell'>
          <ShikiCodeBlock variant="terminal" code={CODE_SESSION} />
        </CodeLabelled>
        <CodeLabelled label="maxHeight and wrap">
          <ShikiCodeBlock language="bash" code={CODE_SHELL} maxHeight={96} wrap lineNumbers />
        </CodeLabelled>
      </div>
    </Wrap>
  ),
};

export const CodeVariantsChecks: Story = {
  ...CodeVariants,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await waitFor(() => {
      for (const block of blocks) expect(tokens(block).length).toBeGreaterThan(0);
    });
    // The prompts and the output are not tokens: only the commands are coloured.
    const rows = [...blocks[2].querySelectorAll('[data-kind]')];
    await expect(rows.map((r) => tokens(r).length > 0)).toEqual([true, false, true, false, false]);
  },
};

export const CodeHostileSnippet: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <ShikiCodeBlock
          language="html"
          code={'<img src=x onerror=alert(1)>\n<script>alert(document.cookie)</script>'}
        />
        <ShikiCodeBlock language="bash" code={'echo "<img src=x onerror=alert(1)>"'} />
        <ShikiCodeBlock language="klingon" code={'<img src=x onerror=alert(1)>'} />
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await waitFor(() => {
      expect(tokens(blocks[0]).length).toBeGreaterThan(0);
      expect(tokens(blocks[1]).length).toBeGreaterThan(0);
    });
    // Rendered as text, never as markup.
    await expect(canvasElement.querySelector('pre img, pre script')).toBeNull();
    await expect(blocks[0].textContent).toContain('<img src=x onerror=alert(1)>');
    await expect(blocks[1].textContent).toBe('echo "<img src=x onerror=alert(1)>"');
    await expect(blocks[2].textContent).toBe('<img src=x onerror=alert(1)>');
  },
};

/** At 375px a long line scrolls inside its block. */
const codeMobile: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <ShikiCodeBlock
          filename="values.yaml"
          language="yaml"
          code={CODE_SNIPPETS[2][2]}
          lineNumbers
        />
        <ShikiCodeBlock language="bash" code={CODE_SHELL} />
        <ShikiCodeBlock variant="terminal" code={CODE_SESSION} wrap />
      </div>
    </Wrap>
  ),
};

export const CodeMobileChecks: Story = {
  ...codeMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(tokens(canvasElement.querySelector('pre')!).length).toBeGreaterThan(0)
    );
    // A long line scrolls inside its block; the page does not.
    expectNoHorizontalOverflow();
    expectNoHorizontalOverflow(canvasElement.querySelectorAll('pre')[2] as HTMLElement);
  },
};

// ── Tests ───────────────────────────────────────────────────────────────────

export const HighlightPropOverridesTheBuiltIn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <ShikiCodeBlock
        language="yaml"
        code={'a: 1'}
        highlight={(code, language) => <mark data-language={language}>{code}</mark>}
      />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector('pre mark') as HTMLElement;
    await expect(mark).toHaveTextContent('a: 1');
    await expect(mark.dataset.language).toBe('yaml');
    // The built-in highlighter stays out: give it time to load, nothing of its own appears.
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(tokens(canvasElement)).toHaveLength(0);
  },
};

export const UnknownLanguageRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <ShikiCodeBlock language="klingon" code={'nuqneH <b>qapla!</b>'} lineNumbers />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('pre b')).toBeNull();
    await expect(canvasElement.querySelector('[data-line]')).toHaveTextContent(
      'nuqneH <b>qapla!</b>'
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(tokens(canvasElement)).toHaveLength(0);
  },
};

export const ColoursFollowTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <ShikiCodeBlock language="bash" code={'# comment\necho hi'} />
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(tokens(canvasElement).length).toBeGreaterThan(0));
    const comment = tokens(canvasElement).find((t) => t.textContent === '# comment') as HTMLElement;
    // The colour is the theme token, not a literal: change the token and the block repaints.
    await expect(comment.getAttribute('style')).toContain('var(--color-code-token-comment)');
    const root = document.documentElement;
    root.style.setProperty('--color-code-token-comment', 'rgb(1, 2, 3)');
    try {
      await expect(getComputedStyle(comment).color).toBe('rgb(1, 2, 3)');
    } finally {
      root.style.removeProperty('--color-code-token-comment');
    }
  },
};

// ── Copy button ──────────────────────────────────────────────────────────────

const copyIcons = (button: Element) => {
  const [copy, check] = Array.from(button.querySelectorAll('svg'));
  return { copy, check };
};

/**
 * Copying turns the icon of the button into a check with a cross-fade, over the fast duration,
 * and back after its 1.5 seconds: in the block and in the one of `/code` with its highlighter,
 * which share the button. The button keeps its size, since both icons are in it.
 */
export const CopyButtonSwapsItsIcon: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => (
    <Wrap>
      <div className="flex flex-col gap-4">
        <CodeBlock language="yaml" code="a: 1" />
        <ShikiCodeBlock language="yaml" code="b: 2" filename="values.yaml" />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const clipboard = captureClipboard();
    try {
      const buttons = canvas.getAllByRole('button', { name: 'Copy' });
      await expect(buttons).toHaveLength(2);
      for (const button of buttons) {
        const { copy, check } = copyIcons(button);
        await expect(transitionMs(copy)).toBe(tokenMs('--cosmos-motion-fast'));
        const box = button.getBoundingClientRect().toJSON();
        const shown = () => [getComputedStyle(copy).opacity, getComputedStyle(check).opacity];
        await expect(shown()).toEqual(['1', '0']);
        await userEvent.click(button);
        await expect(isFading(check)).toBe(true);
        await waitFor(() => expect(shown()).toEqual(['0', '1']));
        await expect(button.getBoundingClientRect().toJSON()).toEqual(box);
        // Back after the 1.5 s of the button, the icon that was there.
        await waitFor(() => expect(shown()).toEqual(['1', '0']), { timeout: 3000 });
      }
      await expect(clipboard.written).toEqual(['a: 1', 'b: 2']);
    } finally {
      clipboard.restore();
    }
  },
};
