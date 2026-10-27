import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { textOf } from '../ui/codeLines';
import { highlight, isLanguageLoaded, loadLanguage } from './highlighter';
import { CODE_LANGUAGES, languageId } from './languages';

// A short real snippet per language, to prove each grammar loads and tokenises with the
// JavaScript regex engine (the one the entry uses, no WebAssembly).
const SNIPPETS: Record<string, string> = {
  bash: 'for f in *.log; do\n  gzip "$f" && echo "done: $f"\ndone',
  shellsession: '$ ls -l\ntotal 0',
  yaml: 'name: ci\non:\n  push:\n    branches: [main]',
  json: '{ "name": "cosmos", "ok": true, "n": [1, 2.5, null] }',
  toml: '[package]\nname = "cosmos"\nversion = "0.1.0"',
  ini: '[server]\nlisten = 0.0.0.0:8080\n; comment',
  dockerfile: 'FROM node:22-slim\nRUN pnpm install --frozen-lockfile\nCMD ["node", "server.js"]',
  sql: "SELECT id, name FROM users WHERE created_at > '2026-01-01' ORDER BY id LIMIT 10;",
  typescript: 'export const ping = async (url: string): Promise<boolean> => (await fetch(url)).ok;',
  javascript: 'const sum = (a, b) => a + b;\nconsole.log(sum(1, 2));',
  tsx: 'export const A = ({ n }: { n: number }) => <b>{n}</b>;',
  jsx: 'export const A = ({ n }) => <b>{n}</b>;',
  python: 'def add(a: int, b: int) -> int:\n    """Add."""\n    return a + b',
  go: 'func main() {\n\tfmt.Println("hello")\n}',
  html: '<!doctype html>\n<div class="a"><script>let x = 1</script></div>',
  xml: '<?xml version="1.0"?>\n<root><item id="1">a</item></root>',
  css: '.a:hover > b { color: var(--x, #fff); margin: 0 auto; }',
  diff: '--- a/f\n+++ b/f\n@@ -1 +1 @@\n-old\n+new',
  nginx: 'server {\n  listen 80;\n  location / { proxy_pass http://app:3000; }\n}',
  hcl: 'resource "aws_s3_bucket" "b" {\n  bucket = "x"\n}',
  terraform: 'variable "name" {\n  type = string\n}',
  rust: 'fn main() {\n    let v: Vec<u8> = Vec::new();\n    println!("{}", v.len());\n}',
  java: 'public class A {\n  public static void main(String[] args) { System.out.println("hi"); }\n}',
  php: '<?php\nfunction add($a, $b) { return $a + $b; }\necho add(1, 2);',
  markdown: '# Title\n\nSome **bold** text and `code`.\n\n- item\n\n```ts\nconst a = 1;\n```',
  promql: 'sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))',
};

const colours = (node: unknown) => {
  const found = new Set<string>();
  const walk = (n: unknown) => {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === 'object' && 'props' in n) {
      const { props } = n as ReactElement<{ style?: { color?: string }; children?: unknown }>;
      if (props.style?.color) found.add(props.style.color);
      walk(props.children);
    }
  };
  walk(node);
  return found;
};

describe('languageId', () => {
  it('maps names and aliases, case-insensitively, to a grammar', () => {
    expect(languageId('bash')).toBe('shellscript');
    expect(languageId('YML')).toBe('yaml');
    expect(languageId('Dockerfile')).toBe('docker');
    expect(languageId('tf')).toBe('terraform');
    expect(languageId('promql')).toBe('promql');
  });

  it('knows no grammar for an unknown name', () => {
    expect(languageId('klingon')).toBeUndefined();
    expect(languageId('constructor')).toBeUndefined();
    expect(languageId('')).toBeUndefined();
    expect(languageId(undefined)).toBeUndefined();
  });

  it('lists every language of the issue', () => {
    for (const name of Object.keys(SNIPPETS)) expect(CODE_LANGUAGES).toContain(name);
  });
});

describe('highlight', () => {
  it('returns the code as text until its language has loaded', () => {
    expect(highlight('echo hi', 'bash')).toBe('echo hi');
    expect(isLanguageLoaded('bash')).toBe(false);
  });

  it('renders an unknown language as text, and loadLanguage says so', async () => {
    expect(await loadLanguage('klingon')).toBe(false);
    expect(highlight('qapla', 'klingon')).toBe('qapla');
    expect(highlight('plain')).toBe('plain');
  });

  it.each(Object.entries(SNIPPETS))(
    '%s: loads, keeps the text and colours it',
    async (id, code) => {
      expect(await loadLanguage(id)).toBe(true);
      expect(isLanguageLoaded(id)).toBe(true);
      const node = highlight(code, id);
      expect(textOf(node)).toBe(code);
      const used = [...colours(node)];
      expect(used.length).toBeGreaterThan(1);
      // Every colour is a theme token: nothing is a literal that ignores the theme.
      for (const colour of used) expect(colour).toMatch(/^var\(--color-code-[a-z-]+\)$/);
    }
  );

  it('colours through an alias once the language has loaded', () => {
    expect(colours(highlight('echo hi # c', 'sh')).size).toBeGreaterThan(1);
  });
});
