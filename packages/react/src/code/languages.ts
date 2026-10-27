import type { LanguageInput } from 'shiki/core';

// Every language is one dynamic import: a bundler splits each into a chunk of its own, and a page
// only downloads the ones its code blocks show. Keyed by the id Shiki knows the grammar by.
export const LOADERS = {
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  shellsession: () => import('shiki/langs/shellsession.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  ini: () => import('shiki/langs/ini.mjs'),
  docker: () => import('shiki/langs/docker.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  nginx: () => import('shiki/langs/nginx.mjs'),
  hcl: () => import('shiki/langs/hcl.mjs'),
  terraform: () => import('shiki/langs/terraform.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  promql: () => import('./promql'),
} satisfies Record<string, () => PromiseLike<{ default: LanguageInput }>>;

export type LanguageId = keyof typeof LOADERS;

/** The other names a language goes by in a code fence or a file name. */
const ALIASES: Record<string, LanguageId> = {
  bash: 'shellscript',
  sh: 'shellscript',
  shell: 'shellscript',
  zsh: 'shellscript',
  console: 'shellsession',
  yml: 'yaml',
  dockerfile: 'docker',
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  golang: 'go',
  tf: 'terraform',
  rs: 'rust',
  md: 'markdown',
  prometheus: 'promql',
};

/** The grammar behind a language name, or `undefined` for a language Cosmos has none for. */
export const languageId = (language?: string): LanguageId | undefined => {
  const name = language?.trim().toLowerCase();
  if (!name) return undefined;
  if (Object.hasOwn(LOADERS, name)) return name as LanguageId;
  return Object.hasOwn(ALIASES, name) ? ALIASES[name] : undefined;
};

/** The names the highlighter understands: the ids and their aliases. */
export const CODE_LANGUAGES: readonly string[] = [...Object.keys(LOADERS), ...Object.keys(ALIASES)];
