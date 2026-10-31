import type { Page } from '@playwright/test';

// The automated checks of `make audit-captures` (pass 1 of #494): what a person
// would see wrong on a story at one width, found by measuring the page. Every
// rule is written to stay quiet on a layout that is meant: a false alarm costs
// more reading than a missed edge case saves. Run on small synthetic pages by
// specs/audit-checks.spec.ts, and on the stories by audit.spec.ts.

export const RULES = [
  'sideways-scroll',
  'text-cut-off',
  'text-overlap',
  'squeezed',
  'small-target',
  'console',
] as const;
export type Rule = (typeof RULES)[number];

export type Finding = {
  rule: Rule;
  /** What was measured, for a person to find it again. */
  detail: string;
  /** The element, as `parent > tag#id.class "start of its text"`. */
  target: string;
};

/**
 * Measures the page in the browser. It runs in the page, so it takes nothing
 * from this module: helpers are declared inside. The rules, one by one:
 *
 * sideways-scroll
 *   The document is wider than the viewport (`scrollWidth > clientWidth`, the
 *   test `expectNoHorizontalOverflow` makes). The detail names the elements
 *   that reach furthest out, those not inside a clipping or scrolling box and
 *   not fixed (a closed drawer parked off screen does not widen the page).
 *
 * text-cut-off
 *   Works on the lines of each visible text node, so the page is read as drawn.
 *   a. Cut: an ancestor clips with `overflow: hidden|clip` and the node is
 *      partly in view, either one line sticks out of the box (1.5px of
 *      tolerance across, 30% of the font size along: the glyph box is taller
 *      than a tight line height) or some lines are in and others out. A text
 *      wholly outside is not reported (a collapsed panel, a slide off to the
 *      side, a visually hidden label), nor one under `text-overflow: ellipsis`
 *      or `line-clamp` (the cut is the design), nor in a scroller.
 *   b. Run out: no ancestor clips, and a line sticks out of the border box of
 *      the block that holds it (a `nowrap` label in a fixed width, a long word),
 *      starting inside it.
 *
 * text-overlap
 *   Two lines from different text nodes whose visible parts (clipped by their
 *   scrollers) overlap by more than half of the shorter one's height and 30% of
 *   the smaller area. Two texts in different layers (a dialog, a popover, a
 *   sticky or fixed bar, a tooltip) are meant to overlap and are left alone.
 *
 * squeezed
 *   a. An icon, image, video or canvas of a flex row that the row shrank: it
 *      measures again with `flex-shrink: 0` and grows, to 64px at most (a
 *      full-width image is meant to shrink). Inside a collapsed box (no width,
 *      clipped) it is left alone.
 *   b. A flex or grid item with no width and content that needs 12px or more,
 *      in a parent 120px wide or more. A subtree that is `aria-hidden`,
 *      `hidden` or `inert` is a collapsed one, not a squeezed one.
 *
 * small-target
 *   A link, button, field or ARIA control under 24x24 CSS px (WCAG 2.5.8), not
 *   disabled. The criterion's exceptions that can be measured: a link inside
 *   a sentence; a native control left to the browser (`appearance: auto`); a
 *   field whose label is 24x24 or more; spacing, when a 24px circle on the
 *   target meets no other target (its box, or the circle of another small one).
 *   Not seen: a hit area widened by a pseudo-element, or another target that
 *   does the same.
 */
const inspect = (): Finding[] => {
  const out: Finding[] = [];
  const doc = document.documentElement;
  const css = (el: Element) => getComputedStyle(el);

  const describe = (el: Element) => {
    const cls =
      typeof el.className === 'string'
        ? el.className
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((c) => `.${c}`)
            .join('')
        : '';
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
    const own = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}${text ? ` "${text}"` : ''}`;
    return el.parentElement && el.parentElement !== document.body
      ? `${el.parentElement.tagName.toLowerCase()} > ${own}`
      : own;
  };
  const add = (rule: Rule, el: Element, detail: string) =>
    out.push({ rule, detail, target: describe(el) });
  const round = (n: number) => Math.round(n * 10) / 10;

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'OPTION', 'TITLE']);
  // Storybook's own elements (loader, error display) are not the story.
  const roots = Array.from(document.body.children).filter(
    (el) =>
      !SKIP.has(el.tagName) &&
      !(typeof el.className === 'string' && /(^|\s)sb-/.test(el.className)) &&
      !el.closest('[id^="storybook-docs"]')
  );
  const elements: Element[] = roots.flatMap((root) => [
    root,
    ...Array.from(root.querySelectorAll('*')),
  ]);
  const seen = (el: Element) =>
    !SKIP.has(el.tagName) && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });

  type Box = { l: number; t: number; r: number; b: number };
  const box = (r: DOMRect): Box => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  const clientBox = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const s = css(el);
    return {
      l: r.left + parseFloat(s.borderLeftWidth),
      t: r.top + parseFloat(s.borderTopWidth),
      r: r.right - parseFloat(s.borderRightWidth),
      b: r.bottom - parseFloat(s.borderBottomWidth),
    };
  };

  type Clipper = { el: Element; x: boolean; y: boolean; hard: boolean };
  /** The boxes that clip (hidden, clip) or scroll (auto, scroll) their content, from `el` up. */
  const clippers = (el: Element, withSelf = false): Clipper[] => {
    const list: Clipper[] = [];
    for (
      let a = withSelf ? el : el.parentElement;
      a && a !== document.body && a !== doc;
      a = a.parentElement
    ) {
      const s = css(a);
      const hard = (v: string) => v === 'hidden' || v === 'clip';
      const soft = (v: string) => v === 'auto' || v === 'scroll';
      const x = hard(s.overflowX) || soft(s.overflowX);
      const y = hard(s.overflowY) || soft(s.overflowY);
      if (x || y) list.push({ el: a, x, y, hard: hard(s.overflowX) || hard(s.overflowY) });
    }
    return list;
  };

  // ── sideways-scroll ──────────────────────────────────────────────────────
  if (doc.scrollWidth > doc.clientWidth) {
    const reach = elements
      .filter((el) => seen(el))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= doc.clientWidth + 1) return false;
        for (let a: Element | null = el; a && a !== doc; a = a.parentElement) {
          if (css(a).position === 'fixed') return false;
        }
        return clippers(el).every((c) => !c.x);
      })
      .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
    const culprits: Element[] = [];
    for (const el of reach) {
      if (culprits.length < 3 && !culprits.some((c) => c.contains(el) || el.contains(c))) {
        culprits.push(el);
      }
    }
    const names = culprits
      .map((el) => `${describe(el)} to ${round(el.getBoundingClientRect().right)}px`)
      .join('; ');
    out.push({
      rule: 'sideways-scroll',
      detail: `the page is ${doc.scrollWidth}px wide in a ${doc.clientWidth}px viewport${names ? `: ${names}` : ''}`,
      target: culprits[0] ? describe(culprits[0]) : 'html',
    });
  }

  // ── text: cut off, running out, overlapping ──────────────────────────────
  type Line = Box & { node: Text; el: Element; layer: Element | null };
  const lines: Line[] = [];

  const layerOf = (el: Element): Element | null => {
    for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
      const position = css(a).position;
      let popover = false;
      try {
        popover = a.matches('dialog[open], [popover]:popover-open');
      } catch {
        // an engine without :popover-open has no popover to find
      }
      if (
        position === 'fixed' ||
        position === 'sticky' ||
        popover ||
        /^(dialog|alertdialog|menu|listbox|tooltip)$/.test(a.getAttribute('role') ?? '')
      ) {
        return a;
      }
    }
    return null;
  };

  const intended = (from: Element, to: Element) => {
    // Ellipsis and line clamp are a cut by design, anywhere between the text and the box.
    for (let a: Element | null = from; a; a = a.parentElement) {
      const s = css(a);
      const clamp = s.getPropertyValue('-webkit-line-clamp');
      if (s.textOverflow === 'ellipsis' || (clamp !== '' && clamp !== 'none')) return true;
      if (a === to) break;
    }
    return false;
  };

  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      const el = n.parentElement;
      if (!el || !n.data.trim() || !seen(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0.5 && r.height > 0.5
      );
      if (rects.length === 0) continue;
      const own = clippers(el, true);
      // A box a pixel or two wide that clips is how a visually hidden label is made.
      if (own.some((c) => c.hard && clientBox(c.el).r - clientBox(c.el).l <= 2)) continue;
      const fontSize = parseFloat(css(el).fontSize);
      const tolY = 0.3 * fontSize;
      const here = rects.map(box);
      const label = n.data.trim().replace(/\s+/g, ' ').slice(0, 40);

      // a. cut by a clipping ancestor
      let flagged = false;
      for (const c of own) {
        if (!c.hard || intended(el, c.el)) continue;
        const cr = clientBox(c.el);
        const s = css(c.el);
        const xs = s.overflowX === 'hidden' || s.overflowX === 'clip';
        const ys = s.overflowY === 'hidden' || s.overflowY === 'clip';
        let inside = 0;
        let cut = 0;
        let outside = 0;
        for (const l of here) {
          const meetsX = !xs || (l.r > cr.l + 0.5 && l.l < cr.r - 0.5);
          const meetsY = !ys || (l.b > cr.t + 0.5 && l.t < cr.b - 0.5);
          if (!meetsX || !meetsY) outside++;
          else if (
            (xs && (l.r > cr.r + 1.5 || l.l < cr.l - 1.5)) ||
            (ys && (l.b > cr.b + tolY || l.t < cr.t - tolY))
          ) {
            cut++;
          } else inside++;
        }
        if (cut > 0 || (inside > 0 && outside > 0)) {
          add(
            'text-cut-off',
            el,
            `"${label}" is cut by ${describe(c.el)} (${round(cr.r - cr.l)}x${round(cr.b - cr.t)}px)`
          );
          flagged = true;
          break;
        }
      }

      // b. running out of the block that holds it
      if (!flagged && !el.closest('svg')) {
        let holder: Element | null = el;
        while (holder && ['inline', 'contents'].includes(css(holder).display))
          holder = holder.parentElement;
        if (
          holder &&
          holder !== document.body &&
          holder !== doc &&
          css(holder).overflowX === 'visible'
        ) {
          const hb = box(holder.getBoundingClientRect());
          const out2 = here.some(
            (l) =>
              (l.r > hb.r + 2 && l.l < hb.r - 1) ||
              (l.l < hb.l - 2 && l.r > hb.l + 1) ||
              (l.b > hb.b + tolY && l.t < hb.b - 1)
          );
          if (out2) {
            add(
              'text-cut-off',
              el,
              `"${label}" runs out of ${describe(holder)} (${round(hb.r - hb.l)}x${round(hb.b - hb.t)}px)`
            );
          }
        }
      }

      // lines for the overlap rule: the part of each that is in view
      const layer = layerOf(el);
      for (const l of here) {
        let { l: left, t: top, r: right, b: bottom } = l;
        for (const c of own) {
          const cr = clientBox(c.el);
          if (c.x) {
            left = Math.max(left, cr.l);
            right = Math.min(right, cr.r);
          }
          if (c.y) {
            top = Math.max(top, cr.t);
            bottom = Math.min(bottom, cr.b);
          }
        }
        if (right - left >= 3 && bottom - top >= 3) {
          lines.push({ l: left, t: top, r: right, b: bottom, node: n, el, layer });
        }
      }
    }
  }

  lines.sort((a, b) => a.t - b.t);
  const reported = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];
    for (let j = i + 1; j < lines.length && lines[j].t < a.b; j++) {
      const b = lines[j];
      if (a.node === b.node || a.layer !== b.layer) continue;
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      const smaller = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
      if (w <= 2 || h <= 0.5 * Math.min(a.b - a.t, b.b - b.t) || w * h <= 0.3 * smaller) continue;
      const key = `${a.node.data}|${b.node.data}|${Math.round(a.l)}|${Math.round(a.t)}`;
      if (reported.has(key)) continue;
      reported.add(key);
      add(
        'text-overlap',
        a.el,
        `"${a.node.data.trim().slice(0, 30)}" overlaps "${b.node.data.trim().slice(0, 30)}" by ${round(w)}x${round(h)}px`
      );
    }
  }

  // ── squeezed ─────────────────────────────────────────────────────────────
  const collapsed = (el: Element) => {
    let up = 0;
    for (let a = el.parentElement; a && a !== doc && up < 6; a = a.parentElement, up++) {
      if (a.getBoundingClientRect().width <= 1 && css(a).overflowX !== 'visible') return true;
    }
    return false;
  };
  const media = elements.filter(
    (el) =>
      /^(svg|img|video|canvas)$/i.test(el.tagName) &&
      !el.parentElement?.closest('svg') &&
      el.checkVisibility({ checkVisibilityCSS: true }) &&
      /flex/.test(css(el.parentElement ?? el).display) &&
      parseFloat(css(el).flexShrink) > 0 &&
      !collapsed(el)
  ) as (HTMLElement | SVGElement)[];
  const before = media.map((el) => el.getBoundingClientRect());
  const kept = media.map((el) => el.style.getPropertyValue('flex-shrink'));
  const keptPriority = media.map((el) => el.style.getPropertyPriority('flex-shrink'));
  media.forEach((el) => el.style.setProperty('flex-shrink', '0', 'important'));
  const after = media.map((el) => el.getBoundingClientRect());
  media.forEach((el, i) =>
    kept[i] === ''
      ? el.style.removeProperty('flex-shrink')
      : el.style.setProperty('flex-shrink', kept[i], keptPriority[i])
  );
  media.forEach((el, i) => {
    const was = before[i];
    const free = after[i];
    if (
      (free.width > was.width + 0.75 || free.height > was.height + 0.75) &&
      free.width <= 64 &&
      free.height <= 64
    ) {
      add(
        'squeezed',
        el,
        `${round(was.width)}x${round(was.height)}px in a row that leaves it ${round(free.width)}x${round(free.height)}px`
      );
    }
  });
  for (const el of elements) {
    const parent = el.parentElement;
    if (!parent || !/(flex|grid)/.test(css(parent).display) || css(el).position === 'absolute')
      continue;
    if (el.getBoundingClientRect().width > 1 || parent.getBoundingClientRect().width < 120)
      continue;
    if (
      el.scrollWidth < 12 ||
      !el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })
    )
      continue;
    if (el.closest('[aria-hidden="true"], [hidden], [inert]')) continue;
    if (!(el.textContent ?? '').trim() && !el.querySelector('svg, img, video, canvas')) continue;
    add(
      'squeezed',
      el,
      `no width in a ${round(parent.getBoundingClientRect().width)}px row, its content needs ${el.scrollWidth}px`
    );
  }

  // ── small-target ─────────────────────────────────────────────────────────
  const TARGET =
    'a[href], button, input:not([type="hidden"]), select, summary, ' +
    '[role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], ' +
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], ' +
    '[role="slider"], [role="combobox"], [role="treeitem"]';
  type Target = { el: Element; r: Box; w: number; h: number; size: number };
  const targets: Target[] = [];
  for (const el of elements) {
    if (!el.matches(TARGET) || !seen(el)) continue;
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    targets.push({ el, r: box(r), w: r.width, h: r.height, size: 24 });
  }
  const small = targets.filter((t) => {
    if (t.w >= 23.5 && t.h >= 23.5) return false;
    const el = t.el;
    // A link inside a sentence.
    if (el.matches('a') && css(el).display === 'inline') {
      const parent = el.parentElement;
      const around = Array.from(parent?.childNodes ?? []).some(
        (c) => c !== el && c.nodeType === Node.TEXT_NODE && (c.textContent ?? '').trim() !== ''
      );
      if (around) return false;
    }
    // A control the browser draws.
    if (
      el.matches('input[type="checkbox"], input[type="radio"], input[type="range"], select') &&
      css(el).appearance === 'auto'
    )
      return false;
    // A field the person presses through its label.
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      const best = Array.from(el.labels ?? []).map((l) => l.getBoundingClientRect());
      if (best.some((r) => r.width >= 23.5 && r.height >= 23.5)) return false;
    }
    return true;
  });
  const centre = (t: Target) => ({ x: (t.r.l + t.r.r) / 2, y: (t.r.t + t.r.b) / 2 });
  const isSmall = new Set(small);
  for (const t of small) {
    const c = centre(t);
    const crowded = targets.some((o) => {
      if (o === t || o.el.contains(t.el) || t.el.contains(o.el)) return false;
      if (isSmall.has(o)) {
        const oc = centre(o);
        return Math.hypot(c.x - oc.x, c.y - oc.y) < 24;
      }
      const dx = Math.max(o.r.l - c.x, 0, c.x - o.r.r);
      const dy = Math.max(o.r.t - c.y, 0, c.y - o.r.b);
      return Math.hypot(dx, dy) < 12;
    });
    if (crowded)
      add(
        'small-target',
        t.el,
        `${round(t.w)}x${round(t.h)}px, under 24x24 with another target within 24px`
      );
  }

  return out;
};

export const auditPage = (page: Page): Promise<Finding[]> => page.evaluate(inspect);

type Message = { type: string; text: string; url: string };

/**
 * Collects what the page prints as an error or a warning, and what it throws.
 * Attach it before the page loads. A failed request to another origin than the
 * page's is not reported: the captures cut every third party on purpose.
 */
export const watchConsole = (page: Page) => {
  let messages: Message[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const url = m.location().url;
    const cut =
      /^Failed to load resource/.test(m.text()) &&
      (!url || new URL(url, 'http://x').origin !== safeOrigin(page));
    if (!cut) messages.push({ type: m.type(), text: m.text(), url });
  });
  page.on('pageerror', (e) => messages.push({ type: 'error', text: e.message, url: '' }));
  return {
    /** What was printed since the last call, one finding per distinct message. */
    findings: (): Finding[] => {
      const seenText = new Set<string>();
      const found: Finding[] = [];
      for (const m of messages) {
        const key = `${m.type}|${m.text}`;
        if (seenText.has(key)) continue;
        seenText.add(key);
        found.push({
          rule: 'console',
          detail: `${m.type}: ${m.text.slice(0, 300)}`,
          target: m.url,
        });
      }
      messages = [];
      return found;
    },
  };
};

const safeOrigin = (page: Page) => {
  try {
    return new URL(page.url()).origin;
  } catch {
    return '';
  }
};
