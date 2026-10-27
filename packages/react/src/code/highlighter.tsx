import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { LOADERS, languageId } from './languages';

const THEME = 'cosmos';

// Shiki's FontStyle bit flags.
const ITALIC = 1;
const BOLD = 2;
const UNDERLINE = 4;

const missingShiki = (cause: unknown) =>
  new Error(
    '@sckyzo/cosmos-react/code needs the optional peer dependency "shiki". Install it with `pnpm add shiki` (or `npm install shiki`).',
    { cause }
  );

let core: HighlighterCore | undefined;
let pending: Promise<HighlighterCore> | undefined;

/**
 * The Shiki core, created on the first use: its colours are the `--color-code-*` tokens of the
 * theme, so a theme, accent or text size switch repaints on its own, and its regex engine is the
 * JavaScript one (no WebAssembly to load). No language is loaded yet.
 */
const loadCore = () =>
  (pending ??= (async () => {
    let shiki: typeof import('shiki/core');
    let engine: typeof import('shiki/engine/javascript');
    try {
      [shiki, engine] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
      ]);
    } catch (error) {
      throw missingShiki(error);
    }
    core = await shiki.createHighlighterCore({
      themes: [shiki.createCssVariablesTheme({ name: THEME, variablePrefix: '--color-code-' })],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    });
    return core;
  })());

const loading = new Map<string, Promise<boolean>>();

/**
 * Loads the grammar of `language`: resolves `true` once the highlighter colours it, and `false`
 * for a language Cosmos has no grammar for (the block shows plain text). Rejects when `shiki` is
 * not installed. Loads each language once.
 */
export const loadLanguage = (language?: string): Promise<boolean> => {
  const id = languageId(language);
  if (!id) return Promise.resolve(false);
  let promise = loading.get(id);
  if (!promise) {
    promise = (async () => {
      const highlighter = await loadCore();
      if (!highlighter.getLoadedLanguages().includes(id)) {
        await highlighter.loadLanguage(await LOADERS[id]());
      }
      return true;
    })();
    // A failed load (no network, no shiki) is tried again on the next ask.
    promise.catch(() => loading.delete(id));
    loading.set(id, promise);
  }
  return promise;
};

/** Whether `highlight` colours `language` right now. */
export const isLanguageLoaded = (language?: string) => {
  const id = languageId(language);
  return Boolean(id && core?.getLoadedLanguages().includes(id));
};

const tokenStyle = (color: string | undefined, fontStyle: number | undefined) => {
  const style: CSSProperties = {};
  if (color) style.color = color;
  if (fontStyle && fontStyle > 0) {
    if (fontStyle & ITALIC) style.fontStyle = 'italic';
    if (fontStyle & BOLD) style.fontWeight = 'bold';
    if (fontStyle & UNDERLINE) style.textDecoration = 'underline';
  }
  return style;
};

/**
 * `CodeBlock`'s `highlight` prop, ready to use: Shiki tokens as React elements (nothing goes
 * through `innerHTML`). It colours the languages that have loaded, and returns `code` as plain
 * text for the others, so a block shows its text first and its colours once
 * `loadLanguage(language)` has resolved. `CodeBlock` of this entry does both.
 */
export const highlight = (code: string, language?: string): ReactNode => {
  const id = languageId(language);
  if (!core || !id || !core.getLoadedLanguages().includes(id)) return code;
  const { tokens } = core.codeToTokens(code, { lang: id, theme: THEME });
  return tokens.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && '\n'}
      {line.map((token, j) => (
        <span key={j} style={tokenStyle(token.color, token.fontStyle)}>
          {token.content}
        </span>
      ))}
    </Fragment>
  ));
};
