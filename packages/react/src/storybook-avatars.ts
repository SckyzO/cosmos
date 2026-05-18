/**
 * Deterministic placeholder avatar for stories and docs.
 *
 * Returns a `data:image/svg+xml;…` URL — fully local, no network fetch — that
 * renders the seed's initials over a Cosmos-accent background colour picked
 * deterministically from a stable hash of the seed.
 *
 * Use inside `*.stories.tsx` whenever a face is needed but a real user photo
 * is not desirable: avoids reliance on `i.pravatar.cc` / `images.unsplash.com`,
 * works offline, and produces no licensing concerns. Real apps should plug
 * their own avatar service for production data.
 *
 * @example
 * ```tsx
 * import { placeholderAvatar } from '@sckyzo/cosmos-react';
 *
 * <img src={placeholderAvatar('Aiden Park', 64)} alt="" className="size-8 rounded-full" />
 * ```
 */

// 10 Cosmos accent tones (background, foreground). Solid, slightly muted so
// the white initials stay highly legible on every variant.
const PALETTE: Array<[string, string]> = [
  ['#6366f1', '#ffffff'], // indigo
  ['#8b5cf6', '#ffffff'], // violet
  ['#0ea5e9', '#ffffff'], // sky
  ['#10b981', '#ffffff'], // emerald
  ['#f59e0b', '#1f2937'], // amber (dark text on warm bg)
  ['#f43f5e', '#ffffff'], // rose
  ['#14b8a6', '#ffffff'], // teal
  ['#ec4899', '#ffffff'], // pink
  ['#64748b', '#ffffff'], // slate
  ['#a855f7', '#ffffff'], // purple
];

const hashSeed = (seed: string): number => {
  // djb2 — small, fast, well-distributed across short string seeds.
  let h = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const extractInitials = (seed: string): string => {
  const cleaned = seed.replace(/[^\p{L}\p{N}\s'.-]/gu, ' ').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/[\s.'-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
};

const buildSvg = (initials: string, bg: string, fg: string, size: number): string => {
  // Use viewBox 0 0 100 100 so font sizing is independent of pixel size.
  const fontSize = initials.length === 1 ? 56 : 42;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" fill="${bg}"/>` +
    `<text x="50" y="50" font-family="ui-sans-serif,system-ui,sans-serif" ` +
    `font-size="${fontSize}" font-weight="600" fill="${fg}" ` +
    `text-anchor="middle" dominant-baseline="central">${initials}</text>` +
    `</svg>`
  );
};

export type PlaceholderAvatarOptions = {
  /** Override the auto-picked accent background (any CSS colour). */
  bg?: string;
  /** Override the foreground (initials) colour. */
  fg?: string;
};

/**
 * Build a deterministic placeholder avatar data URL.
 *
 * @param seed   The string used both to derive the initials and to pick the
 *               accent background. Same seed → same avatar.
 * @param size   Square pixel size (default `64`).
 * @param opts   Optional colour overrides.
 */
export const placeholderAvatar = (
  seed: string,
  size = 64,
  opts: PlaceholderAvatarOptions = {}
): string => {
  const initials = extractInitials(seed);
  const [defaultBg, defaultFg] = PALETTE[hashSeed(seed) % PALETTE.length]!;
  const bg = opts.bg ?? defaultBg;
  const fg = opts.fg ?? defaultFg;
  const svg = buildSvg(initials, bg, fg, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ── Landscape cover (blog headers, hero images, related-post tiles) ─────────

export type PlaceholderCoverOptions = {
  /** Override the two gradient stops. */
  from?: string;
  to?: string;
};

const buildCoverSvg = (
  seed: string,
  from: string,
  to: string,
  width: number,
  height: number
): string => {
  const h = hashSeed(seed);
  const angle = h % 180;
  // Three decorative circles placed deterministically from the hash.
  const cx1 = (h % 60) + 20;
  const cy1 = ((h >> 3) % 60) + 20;
  const r1 = ((h >> 5) % 35) + 25;
  const cx2 = ((h >> 7) % 60) + 20;
  const cy2 = ((h >> 9) % 60) + 20;
  const r2 = ((h >> 11) % 25) + 15;
  const gradientId = `g-${(h % 100000).toString(36)}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 100 100" preserveAspectRatio="none">` +
    `<defs><linearGradient id="${gradientId}" gradientTransform="rotate(${angle})">` +
    `<stop offset="0" stop-color="${from}"/>` +
    `<stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#${gradientId})"/>` +
    `<circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="rgba(255,255,255,0.08)"/>` +
    `<circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="rgba(0,0,0,0.10)"/>` +
    `</svg>`
  );
};

/**
 * Build a deterministic placeholder landscape cover data URL.
 *
 * Renders a brand-coherent SVG with a seed-derived gradient and two soft
 * decorative circles. Suitable for blog hero images, article tiles, and any
 * other "cover" slot where a real photo is not available.
 *
 * @example
 * ```tsx
 * <img src={placeholderCover('Cosmos release notes', 1600, 700)} alt="" />
 * ```
 */
export const placeholderCover = (
  seed: string,
  width = 1600,
  height = 700,
  opts: PlaceholderCoverOptions = {}
): string => {
  const h = hashSeed(seed);
  const [from] = PALETTE[h % PALETTE.length]!;
  const [to] = PALETTE[(h + 3) % PALETTE.length]!;
  const svg = buildCoverSvg(seed, opts.from ?? from, opts.to ?? to, width, height);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
