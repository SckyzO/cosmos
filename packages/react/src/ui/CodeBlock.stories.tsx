import type { Meta, StoryObj } from '@storybook/react-vite';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { createCssVariablesTheme, createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from 'shiki/langs/bash.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import yaml from 'shiki/langs/yaml.mjs';
import { expect } from 'storybook/test';
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
 * Colour with any highlighter through `highlight`. Here Shiki uses its CSS
 * variables theme with the `--color-code-*` tokens of `@sckyzo/cosmos-theme`, so
 * the colours follow the toolbar theme. Cosmos ships no highlighter: an app only
 * pays for Shiki and the languages it imports.
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

/** A line wider than the block scrolls it sideways, and a keyboard can focus it. */
export const LongLineScrolls: Story = {
  args: {
    language: 'json',
    code: `{ "stack": "${'at PromClient.query (prom/client.py:118) '.repeat(12)}" }`,
  },
  render: (args) => (
    <div className="max-w-md">
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const region = await canvas.findByRole('region', { name: 'json code' });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(region).toHaveAttribute('tabindex', '0');
  },
};

/** A block that fits keeps no tab stop. */
export const ShortCodeIsNotATabStop: Story = {
  tags: ['!dev', '!autodocs'],
  args: { code: 'echo hello' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('pre')).not.toHaveAttribute('tabindex');
  },
};
