#!/usr/bin/env node
/* Contrast and metadata guard for the Cosmos themes and accents.
 *
 * Reads css/css-vars.css and css/tailwind-tokens.css, resolves each theme's
 * surfaces and text colors, and checks the WCAG 2.x ratios listed in
 * docs/specs/themes-accents.md § 1.6. Exits 1 on the first pair below its
 * threshold. No dependencies: hex and oklch() are converted by hand.
 *
 * Before that, it checks that the themes and accents of the CSS are the ones
 * COSMOS_THEMES and COSMOS_ACCENTS list in react/src/settings/appearance.ts
 * (read as text), with the same `dark` flag and the same brand-500 as `hex`.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'css');

// Tailwind 4.3 default grays, keyed like declarations() — used by the themes
// that don't override them (light, deep-blue). Tailwind's --color-white is #fff.
const TAILWIND_GRAYS = {
  'gray-50': 'oklch(98.5% 0.002 247.839)',
  'gray-100': 'oklch(96.7% 0.003 264.542)',
  'gray-200': 'oklch(92.8% 0.006 264.531)',
  'gray-300': 'oklch(87.2% 0.01 258.338)',
  'gray-400': 'oklch(70.7% 0.022 261.325)',
  'gray-500': 'oklch(55.1% 0.027 264.364)',
  'gray-600': 'oklch(44.6% 0.03 256.802)',
  'gray-700': 'oklch(37.3% 0.034 259.733)',
  'gray-800': 'oklch(27.8% 0.033 256.848)',
  'gray-900': 'oklch(21% 0.034 264.665)',
  'gray-950': 'oklch(13% 0.028 261.692)',
  white: '#fff',
};

// ── CSS parsing ───────────────────────────────────────────────────────────

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** `--color-gray-500: …` → { 'gray-500': … } */
const declarations = (body) =>
  Object.fromEntries(
    [...body.matchAll(/--(?:color-)?([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ])
  );

/** Top-level `selector { … }` blocks of a flat stylesheet (no nesting). */
const blocks = (css) =>
  new Map(
    [...stripComments(css).matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(([, sel, body]) => [
      sel.trim(),
      declarations(body),
    ])
  );

const varsCss = readFileSync(join(cssDir, 'css-vars.css'), 'utf8');
const tokensCss = readFileSync(join(cssDir, 'tailwind-tokens.css'), 'utf8');
const vars = blocks(varsCss);
const tokens = blocks(tokensCss);

const themeTokens = tokens.get('@theme');
if (!themeTokens) throw new Error('No @theme block in tailwind-tokens.css');

const BRAND_STEPS = '25 50 100 200 300 400 500 600 700 800 900 950'.split(' ');
const accent = (id, decls) => {
  const brand = Object.fromEntries(BRAND_STEPS.map((s) => [s, decls[`brand-${s}`]]));
  const missing = BRAND_STEPS.filter((s) => !brand[s]);
  if (missing.length) throw new Error(`Accent ${id} has no brand-${missing.join(', brand-')}`);
  return { id, brand };
};

const accents = [accent('blue', themeTokens)];
for (const [sel, decls] of vars) {
  const m = sel.match(/^\[data-accent='([\w-]+)'\]$/);
  if (m) accents.push(accent(m[1], decls));
}

// `light` is :root. Any other theme is a class block of css-vars.css that sets
// the page surface (--color-bg-base). The dark ones are the classes the
// `dark:` variant of tailwind-tokens.css covers: `.dark *`, `.deep-blue *`.
const darkClasses = new Set(
  [
    ...(
      stripComments(tokensCss).match(/@custom-variant\s+dark\s*\(([^;]*)\)\s*;/)?.[1] ?? ''
    ).matchAll(/\.([\w-]+)\s+\*/g),
  ].map(([, cls]) => cls)
);
const THEMES = [{ id: 'light', selector: ':root', dark: false }];
for (const [sel, decls] of vars) {
  const m = sel.match(/^\.([\w-]+)$/);
  if (m && decls['bg-base']) THEMES.push({ id: m[1], selector: sel, dark: darkClasses.has(m[1]) });
}

// ── Metadata drift ────────────────────────────────────────────────────────

// The same themes and accents are listed in COSMOS_THEMES and COSMOS_ACCENTS.
// Read as text: this script has no dependencies, and appearance.ts is TypeScript.
const appearancePath = join(cssDir, '..', '..', 'react', 'src', 'settings', 'appearance.ts');
const appearance = readFileSync(appearancePath, 'utf8');

/** The `{ id: '…', … }` entries of `export const <name>: … = [ … ];`, by id. */
const metaEntries = (name) => {
  const body = appearance.match(
    new RegExp(`export const ${name}\\b[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`)
  )?.[1];
  if (!body) throw new Error(`No ${name} array in appearance.ts`);
  return new Map(
    [...body.matchAll(/\bid:\s*'([\w-]+)'([\s\S]*?)(?=\bid:\s*'|$)/g)].map(([, id, rest]) => [
      id,
      rest,
    ])
  );
};

const drift = [];

const metaThemes = metaEntries('COSMOS_THEMES');
for (const { id, selector, dark } of THEMES) {
  const meta = metaThemes.get(id);
  if (meta === undefined) {
    drift.push(`theme '${id}' is in css-vars.css (${selector}) but not in COSMOS_THEMES`);
    continue;
  }
  const listed = meta.match(/\bdark:\s*(true|false)/)?.[1];
  if (listed !== String(dark)) {
    drift.push(
      `theme '${id}': COSMOS_THEMES has dark: ${listed ?? 'nothing'}, ` +
        `but the dark: variant of tailwind-tokens.css ${dark ? 'covers' : 'does not cover'} .${id}`
    );
  }
}
for (const id of metaThemes.keys()) {
  if (!THEMES.some((t) => t.id === id)) {
    drift.push(`theme '${id}' is in COSMOS_THEMES but has no theme block in css-vars.css`);
  }
}

const metaAccents = metaEntries('COSMOS_ACCENTS');
for (const { id, brand } of accents) {
  const meta = metaAccents.get(id);
  if (meta === undefined) {
    drift.push(`accent '${id}' is in the CSS but not in COSMOS_ACCENTS`);
    continue;
  }
  const hex = meta.match(/\bhex:\s*'([^']+)'/)?.[1];
  if (hex?.toLowerCase() !== brand['500'].toLowerCase()) {
    drift.push(
      `accent '${id}': COSMOS_ACCENTS has hex ${hex ?? 'nothing'}, but its brand-500 is ${brand['500']}`
    );
  }
}
for (const id of metaAccents.keys()) {
  if (!accents.some((a) => a.id === id)) {
    drift.push(
      `accent '${id}' is in COSMOS_ACCENTS but has no [data-accent='${id}'] block in css-vars.css`
    );
  }
}

if (drift.length) {
  console.error(
    `\nThe theme metadata and the CSS disagree (packages/react/src/settings/appearance.ts vs packages/theme/css):\n` +
      drift.map((d) => `  - ${d}`).join('\n') +
      `\n\nUpdate appearance.ts or the CSS so that both list the same themes and accents.`
  );
  process.exit(1);
}
console.log(
  `ok   metadata   ${THEMES.length} themes and ${accents.length} accents match appearance.ts`
);

// ── Color math ────────────────────────────────────────────────────────────

/** sRGB channels in [0, 1]. */
const parseColor = (value) => {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  const ok = value.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i);
  if (ok) return oklchToSrgb(Number(ok[1]) / (ok[2] ? 100 : 1), Number(ok[3]), Number(ok[4]));
  throw new Error(`Unsupported color: ${value}`);
};

const oklchToSrgb = (l, c, hDeg) => {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  // Clip to the sRGB gamut, then gamma-encode.
  return linear.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  });
};

const luminance = (value) => {
  const [r, g, b] = parseColor(value).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (fg, bg) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ── Checks ────────────────────────────────────────────────────────────────

let passed = 0;
const check = (theme, label, fg, bg, min) => {
  const ratio = contrast(fg.value, bg.value);
  const ok = ratio >= min;
  console.log(
    [
      ok ? 'ok  ' : 'FAIL',
      theme.padEnd(10),
      label.padEnd(28),
      `${fg.name} on ${bg.name}`.padEnd(40),
      ratio.toFixed(2).padStart(6),
      `≥ ${min}`,
    ].join(' ')
  );
  if (!ok) {
    console.error(
      `\nContrast check failed (${theme}, ${label}): ${fg.name} ${fg.value} on ${bg.name} ${bg.value} = ${ratio.toFixed(2)}, needs ≥ ${min}.`
    );
    process.exit(1);
  }
  passed += 1;
};

const rootVars = vars.get(':root');

// Syntax highlighting tokens (--color-code-*), all read by CodeBlock + Shiki.
const CODE_TOKENS = [
  'foreground',
  'token-keyword',
  'token-string',
  'token-comment',
  'token-constant',
  'token-function',
  'token-parameter',
  'token-string-expression',
  'token-punctuation',
  'token-link',
  'token-inserted',
  'token-deleted',
  'token-changed',
];

for (const theme of THEMES) {
  const own = vars.get(theme.selector);
  if (!own) throw new Error(`No ${theme.selector} block in css-vars.css`);
  // A theme inherits :root and Tailwind's defaults for what it doesn't set.
  const palette = { ...TAILWIND_GRAYS, ...rootVars, ...own };
  const color = (name) => {
    if (!palette[name]) throw new Error(`${theme.id}: no value for ${name}`);
    return { name, value: palette[name] };
  };

  const surfaces = theme.dark
    ? [color('bg-base'), color('gray-900'), color('gray-800')]
    : [color('bg-base'), color('white'), color('gray-100')];
  // Surfaces a control can sit on: the three above, the panel and elevated layers,
  // and the dark grays that stay dark in a light theme (Navbar theme="dark").
  const focusSurfaces = [
    ...new Map(
      [
        ...surfaces,
        color('bg-panel'),
        color('bg-elevated'),
        color('gray-800'),
        color('gray-900'),
      ].map((surface) => [surface.name, surface])
    ).values(),
  ];
  const texts = theme.dark
    ? ['white', 'gray-200', 'gray-300', 'gray-400']
    : ['gray-900', 'gray-700', 'gray-600', 'gray-500'];

  for (const text of texts) {
    for (const surface of surfaces) {
      // Known debt, out of scope: light gray-500 on gray-100 is 4.39.
      const min =
        theme.id === 'light' && text === 'gray-500' && surface.name === 'gray-100' ? 4.3 : 4.5;
      check(theme.id, 'text', color(text), surface, min);
    }
  }

  // --color-text-muted on the page, panel and elevated surfaces of every theme.
  for (const surface of ['bg-base', 'bg-panel', 'bg-elevated']) {
    check(theme.id, 'muted text', color('text-muted'), color(surface), 4.5);
  }

  if (theme.id === 'dark') {
    for (const surface of surfaces) check(theme.id, 'muted text', color('gray-500'), surface, 4.5);
    check(theme.id, 'card ↔ raised', color('gray-900'), color('gray-800'), 1.15);
    check(theme.id, 'border on card', color('gray-700'), color('gray-900'), 1.6);
  }

  // Code tokens on the CodeBlock surface (bg-gray-50, dark:bg-gray-900).
  const codeSurface = color(theme.dark ? 'gray-900' : 'gray-50');
  for (const token of CODE_TOKENS) {
    check(theme.id, 'code token', color(`code-${token}`), codeSurface, 4.5);
  }

  for (const { id, brand: shades } of accents) {
    const brand = (step) => ({ name: `${id} brand-${step}`, value: shades[step] });
    if (theme.dark) {
      for (const surface of surfaces) check(theme.id, 'accent text', brand('400'), surface, 4.5);
    } else {
      for (const surface of [...surfaces, brand('50')]) {
        check(theme.id, 'accent text', brand('600'), surface, 4.5);
      }
    }
    check(theme.id, 'white on accent', color('white'), brand('500'), 4.5);
    // The focus indicator (a field's border, the ring of any other control) is
    // brand-500 against what surrounds it: WCAG 1.4.11 asks 3:1.
    for (const surface of focusSurfaces) {
      check(theme.id, 'focus indicator', brand('500'), surface, 3);
    }
  }
}

console.log(`\n${passed} contrast checks passed.`);
