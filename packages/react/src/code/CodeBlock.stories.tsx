import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'Media/Code highlighting',
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

const Labelled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="mb-2 text-xs text-[var(--color-text-muted)]">{label}</p>
    {children}
  </div>
);

/** A short real snippet per language: [label, language, code]. */
const SNIPPETS: ReadonlyArray<readonly [string, string, string]> = [
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

const SHELL = `# Add the Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install the node-exporter chart
helm install node-exporter prometheus-community/prometheus-node-exporter \\
  --namespace monitoring --create-namespace`;

const DIFF = `
 services:
   web:
-    image: ghcr.io/sckyzo/cosmos:1.3.0
+    image: ghcr.io/sckyzo/cosmos:1.4.0
     ports:
       - '8080:80'`.slice(1);

const SESSION = `$ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
"prometheus-community" has been added to your repositories
$ kubectl get pods -n monitoring
NAME     READY   STATUS
node-1   1/1     Running`;

/** The tokens of a block: `<span>`s inside its `<code>` whose colour is a theme token. */
const tokens = (block: Element) => [...block.querySelectorAll('code span[style*="--color-code-"]')];

export const OutOfTheBox: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <Labelled label="No highlight prop, no setup: the language loads on demand">
          <CodeBlock language="yaml" code={SNIPPETS[2][2]} />
        </Labelled>
        <Labelled label="Shell">
          <CodeBlock language="bash" code={SHELL} />
        </Labelled>
        <Labelled label="PromQL, a grammar of our own">
          <CodeBlock language="promql" code={SNIPPETS[25][2]} />
        </Labelled>
        <Labelled label="Unknown language: plain text">
          <CodeBlock language="klingon" code={'nuqneH\nqapla!'} />
        </Labelled>
      </div>
    </Wrap>
  ),
};

export const OutOfTheBoxChecks: Story = {
  ...OutOfTheBox,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await waitFor(() => {
      expect(tokens(blocks[0]).length).toBeGreaterThan(0);
      expect(tokens(blocks[1]).length).toBeGreaterThan(0);
      expect(tokens(blocks[2]).length).toBeGreaterThan(0);
    });
    await expect(blocks.map((b) => b.textContent)).toEqual([
      SNIPPETS[2][2],
      SHELL,
      SNIPPETS[25][2],
      'nuqneH\nqapla!',
    ]);
    // A language with no grammar stays text.
    await expect(tokens(blocks[3])).toHaveLength(0);
  },
};

export const Languages: Story = {
  render: () => (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        {SNIPPETS.map(([label, language, code]) => (
          <Labelled key={language} label={`${label} (${language})`}>
            <CodeBlock language={language} code={code} />
          </Labelled>
        ))}
      </div>
    </Wrap>
  ),
};

export const LanguagesChecks: Story = {
  ...Languages,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const blocks = [...canvasElement.querySelectorAll('pre')];
    await expect(blocks).toHaveLength(SNIPPETS.length);
    // Every language has loaded and coloured its snippet, and the text is the code, whole.
    await waitFor(
      () => {
        for (const block of blocks) expect(tokens(block).length).toBeGreaterThan(1);
      },
      { timeout: 5000 }
    );
    await expect(blocks.map((b) => b.textContent)).toEqual(SNIPPETS.map(([, , code]) => code));
  },
};

export const Variants: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <Labelled label="filename, lineNumbers and highlightLines">
          <CodeBlock
            filename="deployment.yaml"
            language="yaml"
            code={SNIPPETS[2][2]}
            lineNumbers
            highlightLines={[3, '5-6']}
          />
        </Labelled>
        <Labelled label="diff">
          <CodeBlock filename="docker-compose.yaml" language="yaml" code={DIFF} diff />
        </Labelled>
        <Labelled label='variant="terminal": the commands are highlighted as shell'>
          <CodeBlock variant="terminal" code={SESSION} />
        </Labelled>
        <Labelled label="maxHeight and wrap">
          <CodeBlock language="bash" code={SHELL} maxHeight={96} wrap lineNumbers />
        </Labelled>
      </div>
    </Wrap>
  ),
};

export const VariantsChecks: Story = {
  ...Variants,
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

export const HostileSnippet: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <CodeBlock
          language="html"
          code={'<img src=x onerror=alert(1)>\n<script>alert(document.cookie)</script>'}
        />
        <CodeBlock language="bash" code={'echo "<img src=x onerror=alert(1)>"'} />
        <CodeBlock language="klingon" code={'<img src=x onerror=alert(1)>'} />
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

export const Mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <Wrap>
      <div className="space-y-4">
        <CodeBlock filename="values.yaml" language="yaml" code={SNIPPETS[2][2]} lineNumbers />
        <CodeBlock language="bash" code={SHELL} />
        <CodeBlock variant="terminal" code={SESSION} wrap />
      </div>
    </Wrap>
  ),
};

export const MobileChecks: Story = {
  ...Mobile,
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
      <CodeBlock
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
      <CodeBlock language="klingon" code={'nuqneH <b>qapla!</b>'} lineNumbers />
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
      <CodeBlock language="bash" code={'# comment\necho hi'} />
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
