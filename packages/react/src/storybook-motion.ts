// Helpers for the stories that check motion: a window leaving, the scrim's look, reduced motion.
// Stories that watch a transition opt out of the story tests' 0 s reset with
// `parameters: { settleMotion: false }`; the others read end states.
import { expect } from 'storybook/test';

/** One animation frame. */
export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * `data-motion="reduced"` on `<html>`, as `applyAppearance({ motion: 'reduced' })` sets it: every
 * duration of the theme reads 0. Returns the function that puts the attribute back as it was.
 */
export const reduceMotion = () => {
  const root = document.documentElement;
  const before = root.getAttribute('data-motion');
  root.setAttribute('data-motion', 'reduced');
  return () => {
    if (before === null) root.removeAttribute('data-motion');
    else root.setAttribute('data-motion', before);
  };
};

/**
 * The computed colour of a theme variable (`--color-scrim-dim`), read through a probe: it is
 * what a computed `background-color` of the same variable reads, whatever the theme and the
 * colour format, so a story can compare the two without knowing the values.
 */
export const themeColor = (variable: string) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${variable})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
};

/**
 * What the scrim looks like, computed: its colour and its backdrop filter. `none` for a filter
 * means no blur.
 */
export const scrimLook = (scrim: Element) => {
  const style = getComputedStyle(scrim);
  return { colour: style.backgroundColor, filter: style.backdropFilter };
};

/** The computed duration of a transition, in ms (`transition-duration: 0.2s` reads 200). */
export const transitionMs = (element: Element) => {
  const [first = '0s'] = getComputedStyle(element).transitionDuration.split(',');
  const value = parseFloat(first);
  return Math.round(first.trim().endsWith('ms') ? value : value * 1000);
};

/**
 * The `animation-name` of a loop (a ping, a pulse, a spinner) as it is, and once reduced motion is
 * asked for with `data-motion="reduced"`: `motion-reduce:` follows it like the device's
 * `prefers-reduced-motion`, which `tests/e2e/specs/reduced-motion.spec.ts` checks in a real
 * browser. A decorative loop reads its keyframes, then `none`; a spinner keeps them.
 */
export const loopStops = (loop: Element) => {
  const running = getComputedStyle(loop).animationName;
  const restore = reduceMotion();
  try {
    return { running, reduced: getComputedStyle(loop).animationName };
  } finally {
    restore();
  }
};

/**
 * Whether `element`, or something in it, is playing a transition or an animation that will end:
 * a window that is fading out is. The browser starts the transition of a style change when it is
 * asked for the animations, so this is true right after the change, not a frame later.
 */
export const isFading = (element: Element) =>
  element
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation.playState === 'running' &&
        Number.isFinite(animation.effect?.getComputedTiming().endTime)
    );

/**
 * A duration token of the theme, in ms: `--cosmos-motion-base` reads 200 by default and 0 under
 * reduced motion. A built stylesheet is minified, which writes `200ms` as `.2s`: read both.
 */
export const tokenMs = (token: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return Math.round(parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000));
};

/**
 * The sliding marker of a `Tabs.List` or a `SegmentedControl` (what draws the accent line, the
 * pill or the segment fill behind the active option).
 */
export const indicatorOf = (host: Element) =>
  host.querySelector<HTMLElement>('[data-slot="indicator"]')!;

/**
 * How far a marker is from the option it should sit on or under: the gaps of its start and of its
 * size along the line (`inline`) and across it (`block`), in px, with the line's direction taken
 * from the host. All 0 when it is exactly there; a marker mid-slide has a gap.
 */
export const indicatorGap = (marker: Element, option: Element) => {
  const a = marker.getBoundingClientRect();
  const b = option.getBoundingClientRect();
  const rtl = getComputedStyle(marker).direction === 'rtl';
  return {
    start: Math.abs(rtl ? a.right - b.right : a.left - b.left),
    inline: Math.abs(a.width - b.width),
    blockStart: Math.abs(a.top - b.top),
    block: Math.abs(a.height - b.height),
  };
};

/**
 * Whether anything in `element` is running a transition that moves or resizes a box: the slide of
 * a marker. The browser reports the logical `inset-inline-start` and `inline-size` it was given as
 * the physical property they resolve to (`left` or `right`, `width`), so those are matched too.
 */
export const isSliding = (element: Element) =>
  element
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation.playState === 'running' &&
        'transitionProperty' in animation &&
        /^(inset|left$|right$|top$|bottom$|width$|height$|inline-size$|block-size$)/.test(
          String(animation.transitionProperty)
        )
    );

/**
 * The values a running transition of `property` goes through, from its first keyframe to its last
 * (`translate` of a banner that comes in: where it starts, then `none`). Empty when nothing runs
 * for that property. For the end a transition is heading to when the test cannot wait for it.
 */
export const transitionValues = (element: Element, property: string) => {
  const animation = element
    .getAnimations()
    .find((a) => 'transitionProperty' in a && a.transitionProperty === property);
  const frames = (animation?.effect as KeyframeEffect | null | undefined)?.getKeyframes() ?? [];
  return frames.map((frame) => String((frame as Record<string, unknown>)[property]));
};

/**
 * The month-change animations react-day-picker is playing in `root`: the CSS animations of the
 * `animate` option (`rdp-slide_in_right`, `rdp-fade_out`…), with the length and the easing they run
 * at. A calendar at rest has none. The easing is the element's `animation-timing-function`: a CSS
 * animation applies it between its keyframes, and the timing of its effect stays `linear`.
 */
export const monthAnimations = (root: Element) =>
  root
    .getAnimations({ subtree: true })
    .filter((animation): animation is CSSAnimation => 'animationName' in animation)
    .filter((animation) => animation.animationName.startsWith('rdp-'))
    .map((animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      return {
        name: animation.animationName,
        duration: Number(effect?.getTiming().duration ?? 0),
        easing: effect?.target ? getComputedStyle(effect.target).animationTimingFunction : '',
      };
    });

/**
 * The two slides of a month change, as the page reads them: the next month comes in from the end
 * of the line and pushes the old one out toward the start, the previous month the other way round.
 * `rdp-slide_in_right` and `rdp-slide_out_left` in left to right, the same swapped in right to left.
 */
export const monthSlideNames = (root: Element, change: 'next' | 'previous') => {
  const rtl = getComputedStyle(root).direction === 'rtl';
  const fromEnd = change === 'next';
  const incoming = fromEnd !== rtl ? 'right' : 'left';
  const outgoing = fromEnd !== rtl ? 'left' : 'right';
  return [`rdp-slide_in_${incoming}`, `rdp-slide_out_${outgoing}`];
};

/**
 * What the style rules of the page declare for `element` while `pseudo` (`:active`, `:hover`,
 * `:focus-visible`) holds: every rule whose selector ends in that pseudo-class and matches the
 * element without it, in a media query that applies. A play function cannot press the pointer down
 * or hover for real, so the rule itself is read. `pseudoElement` (`::after`) reads the rules of
 * that pseudo-element of the element instead. Later rules win over earlier ones; specificity is
 * not weighed, which suits the single-class rules of the utilities.
 */
export const declaredWhile = (element: Element, pseudo: string, pseudoElement = '') => {
  const declared = new Map<string, string>();
  // The pseudo-class itself, not the same letters in an escaped class name (`.active\:x`).
  const state = new RegExp(`(?<!\\\\)${pseudo}(?![\\w-])`, 'g');
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.conditionText).matches) visit(rule.cssRules);
      } else if (rule instanceof CSSStyleRule) {
        const withoutState = rule.selectorText.replace(state, '');
        if (withoutState === rule.selectorText) continue;
        const endsIn = /::(?:before|after)$/.exec(withoutState)?.[0] ?? '';
        if (endsIn !== pseudoElement) continue;
        let applies = false;
        try {
          applies = element.matches(withoutState.slice(0, withoutState.length - endsIn.length));
        } catch {
          // A selector that is not valid without its pseudo-class cannot match the element.
        }
        if (!applies) continue;
        for (const name of Array.from(rule.style)) {
          declared.set(name, rule.style.getPropertyValue(name));
        }
      } else if ('cssRules' in rule) visit(rule.cssRules as CSSRuleList);
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  return declared;
};

/**
 * The computed value of `property` for `element` while `pseudo` holds, from the rules
 * `declaredWhile` reads, put on a probe: the initial value (`none` for `translate`) when no rule
 * applies, as it is for a disabled button the `enabled:` variant leaves out.
 */
export const valueWhile = (
  element: Element,
  pseudo: string,
  property: string,
  pseudoElement = ''
) => {
  const probe = document.createElement('div');
  for (const [name, value] of declaredWhile(element, pseudo, pseudoElement)) {
    probe.style.setProperty(name, value);
  }
  document.body.append(probe);
  const value = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return value;
};

/**
 * Puts `element` in the state of `pseudo` for real: its rules, and those of its `::after`, are
 * applied to it (inline for the element, in a style sheet for the pseudo-element), so what the
 * state changes can be measured and hit-tested. Returns the function that puts it back.
 */
export const holdState = (element: HTMLElement, pseudo: string) => {
  const style = element.getAttribute('style');
  for (const [name, value] of declaredWhile(element, pseudo)) {
    element.style.setProperty(name, value);
  }
  element.setAttribute('data-held-state', '');
  const sheet = document.createElement('style');
  sheet.textContent = `[data-held-state]::after { ${[...declaredWhile(element, pseudo, '::after')]
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ')} }`;
  document.head.append(sheet);
  return () => {
    sheet.remove();
    element.removeAttribute('data-held-state');
    if (style === null) element.removeAttribute('style');
    else element.setAttribute('style', style);
  };
};

/** What `translate` reads on a card lifted by 2px (see `ui/cardLift.ts`). */
export const LIFTED = '0px -2px';

/**
 * A card that can be clicked rises 2px with a soft shadow under the pointer. At rest it is where
 * it is; the rule of `:hover` is read (a hover cannot be forced), and says `LIFTED` and a shadow.
 */
export const expectLiftsOnHover = (card: HTMLElement) => {
  expect(getComputedStyle(card).translate).toBe('none');
  expect(valueWhile(card, ':hover', 'translate')).toBe(LIFTED);
  expect(valueWhile(card, ':hover', 'box-shadow')).toContain('0px 4px 6px');
};

/** A card that cannot be clicked never moves under the pointer. */
export const expectStaysUnderHover = (card: HTMLElement) => {
  expect(getComputedStyle(card).translate).toBe('none');
  expect(valueWhile(card, ':hover', 'translate')).toBe('none');
};

/**
 * The lifted card keeps the place it had under the pointer. The hover rule is put on the card for
 * real, so it can be measured and hit-tested: the card is 2px higher, the pointer on its old
 * lower edge still finds it (it would find what is under it, with the lift alone: the card and
 * the pointer would take turns), and a pointer clear of that edge finds something else.
 */
export const expectKeepsItsPlace = (card: HTMLElement) => {
  const rest = card.getBoundingClientRect();
  const x = rest.left + rest.width / 2;
  const release = holdState(card, ':hover');
  try {
    const lifted = card.getBoundingClientRect();
    expect(rest.top - lifted.top).toBe(2);
    expect(rest.height).toBe(lifted.height);
    expect(card.contains(document.elementFromPoint(x, rest.bottom - 0.5))).toBe(true);
    expect(card.contains(document.elementFromPoint(x, rest.bottom + 1.5))).toBe(false);
  } finally {
    release();
  }
};

/** Whether `element` transitions each of `properties`: by name, or all of them with `all`. */
export const transitions = (element: Element, ...properties: string[]) => {
  const named = getComputedStyle(element)
    .transitionProperty.split(',')
    .map((property) => property.trim());
  return named.includes('all') || properties.every((property) => named.includes(property));
};
