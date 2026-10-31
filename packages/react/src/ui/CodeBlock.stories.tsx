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
