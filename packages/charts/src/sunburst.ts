// The maths of SunburstChart: the angles of the arcs, their paths, the order
// the keyboard walks them in, and which labels fit. No DOM and no colors, so
// it runs in plain Node.

export type SunburstNode = {
  name: string;
  /** The value of a node with no children. A node with children takes the sum of theirs. */
  value?: number;
  children?: SunburstNode[];
};

/** One sector of the sunburst. Angles are in radians, clockwise from twelve o'clock. */
export type Arc = {
  /** The place of the node in the data, as `0.2.1`: first ring, third node, second child. A key that does not depend on names. */
  id: string;
  /** The same as numbers: the index in `data` at each level, whatever was left out. */
  trail: number[];
  /** The names from the first ring down to the node. */
  path: string[];
  name: string;
  /** 0 for the first ring. */
  depth: number;
  value: number;
  start: number;
  end: number;
  /** The index in `data` of the node of the first ring this one belongs to: what gives it its color. */
  branch: number;
  /** The `id` of the node it is a child of, none for the first ring. */
  parent?: string;
};

export type Partition = {
  /** Every node that has something to draw, a node before its children, in the order of the circle. */
  arcs: Arc[];
  /** The sum of the first ring: the whole circle. */
  total: number;
  /** How many rings the arcs fill. */
  rings: number;
};

const TAU = 2 * Math.PI;

/** What a node holds: the sum of its children, or its own value when it has none. Nothing for a value that is not a positive finite number. */
const valueOf = (node: SunburstNode): number => {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + valueOf(child), 0);
  }
  return typeof node.value === 'number' && Number.isFinite(node.value) && node.value > 0
    ? node.value
    : 0;
};

/**
 * The arcs of a hierarchy. The first ring shares the whole circle among its
 * nodes by their values, each node shares its arc among its children, and so
 * on outward. A node with children takes the sum of theirs, and a value set on
 * it is ignored. A node with no positive value, and one whose children have
 * none, has no arc: it could not be seen, hovered or focused. `hidden` holds
 * indices of the first ring to leave out, which gives their share to the
 * others (the legend toggles them); the nodes keep their `branch`, and so
 * their color.
 */
export const partition = (
  data: readonly SunburstNode[],
  hidden: ReadonlySet<number> = new Set()
): Partition => {
  const arcs: Arc[] = [];
  const place = (
    nodes: readonly SunburstNode[],
    from: number,
    to: number,
    depth: number,
    above: { trail: number[]; path: string[]; parent?: string }
  ) => {
    const values = nodes.map((node, i) => (depth === 0 && hidden.has(i) ? 0 : valueOf(node)));
    const sum = values.reduce((a, b) => a + b, 0);
    let start = from;
    nodes.forEach((node, i) => {
      if (values[i] <= 0) return;
      const end = start + ((to - from) * values[i]) / sum;
      const trail = [...above.trail, i];
      const path = [...above.path, node.name];
      const id = trail.join('.');
      arcs.push({
        id,
        trail,
        path,
        name: node.name,
        depth,
        value: values[i],
        start,
        end,
        branch: trail[0],
        parent: above.parent,
      });
      if (node.children && node.children.length > 0) {
        place(node.children, start, end, depth + 1, { trail, path, parent: id });
      }
      start = end;
    });
  };
  place(data, 0, TAU, 0, { trail: [], path: [] });
  return {
    arcs,
    total: arcs.filter((arc) => arc.depth === 0).reduce((sum, arc) => sum + arc.value, 0),
    rings: arcs.reduce((deepest, arc) => Math.max(deepest, arc.depth + 1), 0),
  };
};

/** The nodes of the first ring that have a value, with it: what the legend lists. `index` is the place in `data`. */
export const branches = (
  data: readonly SunburstNode[]
): { index: number; name: string; value: number }[] =>
  data.flatMap((node, index) => {
    const value = valueOf(node);
    return value > 0 ? [{ index, name: node.name, value }] : [];
  });

/** The arc of the node at `path`, the names from the first ring. Of two siblings with the same name, the first. */
export const findArc = (arcs: readonly Arc[], path: readonly string[]): Arc | undefined => {
  let found: Arc | undefined;
  for (const name of path) {
    found = arcs.find((arc) => arc.parent === found?.id && arc.name === name);
    if (!found) return undefined;
  }
  return found;
};

/** Whether the two arcs are on one line from the first ring: the same arc, or one is an ancestor of the other. */
export const isRelated = (a: Arc, b: Arc): boolean => {
  const [shorter, longer] = a.trail.length <= b.trail.length ? [a, b] : [b, a];
  return shorter.trail.every((index, level) => longer.trail[level] === index);
};

export type Move = 'next' | 'previous' | 'child' | 'parent' | 'first' | 'last';

/**
 * Where an arrow key goes from the arc `from`: the next or previous sibling
 * (clockwise), the first child (outward), the parent (inward), or the first
 * or last arc of the ring. It stays where it is when there is nowhere to go,
 * and it never crosses to a cousin. The first arc when `from` is not one.
 */
export const move = (
  arcs: readonly Arc[],
  from: string | undefined,
  direction: Move
): Arc | undefined => {
  const current = arcs.find((arc) => arc.id === from);
  if (!current) return arcs[0];
  const siblings = arcs.filter((arc) => arc.parent === current.parent);
  const ring = arcs.filter((arc) => arc.depth === current.depth);
  const index = siblings.indexOf(current);
  switch (direction) {
    case 'next':
      return siblings[Math.min(index + 1, siblings.length - 1)];
    case 'previous':
      return siblings[Math.max(index - 1, 0)];
    case 'child':
      return arcs.find((arc) => arc.parent === current.id) ?? current;
    case 'parent':
      return arcs.find((arc) => arc.id === current.parent) ?? current;
    case 'first':
      return ring[0];
    case 'last':
      return ring[ring.length - 1];
  }
};

// ── Geometry ──────────────────────────────────────────────────────────────────

/** A point at `radius` from the center, `angle` clockwise from twelve o'clock. */
export const polar = (cx: number, cy: number, radius: number, angle: number): [number, number] => [
  cx + radius * Math.sin(angle),
  cy - radius * Math.cos(angle),
];

// A hundredth of a pixel is more than an SVG shows, and keeps the paths short.
const fmt = (n: number) => String(Math.round(n * 100) / 100);
const point = ([x, y]: [number, number]) => `${fmt(x)} ${fmt(y)}`;

/**
 * The path of a sector of a ring: out along the outer edge from `start` to
 * `end`, in along the end, back along the inner edge, closed. A turn of a
 * full circle is two half circles, since one arc cannot end where it starts;
 * its inner edge goes the other way round, so the fill leaves the hole. With
 * no inner edge (`inner` 0) the sector is a wedge to the center.
 */
export const arcPath = (
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number
): string => {
  if (end - start >= TAU - 1e-6) {
    const circle = (radius: number, sweep: 0 | 1) =>
      `M${point(polar(cx, cy, radius, 0))}A${radius} ${radius} 0 1 ${sweep} ${point(polar(cx, cy, radius, Math.PI))}` +
      `A${radius} ${radius} 0 1 ${sweep} ${point(polar(cx, cy, radius, 0))}Z`;
    return circle(outer, 1) + (inner > 0 ? circle(inner, 0) : '');
  }
  const large = end - start > Math.PI ? 1 : 0;
  return (
    `M${point(polar(cx, cy, outer, start))}A${outer} ${outer} 0 ${large} 1 ${point(polar(cx, cy, outer, end))}` +
    (inner > 0
      ? `L${point(polar(cx, cy, inner, end))}A${inner} ${inner} 0 ${large} 0 ${point(polar(cx, cy, inner, start))}Z`
      : `L${fmt(cx)} ${fmt(cy)}Z`)
  );
};

// Room left around the outer ring for the outline of a ring or a selection.
const MARGIN = 4;
// The hole, as a share of the outer radius: room for a figure and a name.
const HOLE = 0.31;

/** The radii of a sunburst `size` pixels across with `rings` rings: a hole in the middle, then rings of one thickness out to the edge. */
export const ringRadii = (
  size: number,
  rings: number
): { hole: number; outer: number; thickness: number } => {
  const outer = size / 2 - MARGIN;
  const hole = outer * HOLE;
  return { hole, outer, thickness: (outer - hole) / Math.max(rings, 1) };
};

// The first ring is the color of its branch, the rings after it lighter mixes
// with the card: a share of the color.
const SHADES = [100, 76, 56];

/** How much of the branch's color a ring has, in percent: all of it for the first, then lighter steps, the last for every ring after it. */
export const shadeOf = (depth: number): number => SHADES[Math.min(depth, SHADES.length - 1)];

// An arc label is 12px text: about this wide a letter, with room at both ends.
const CHAR_WIDTH = 7;
const LABEL_PAD = 5;
// A ring thinner than this holds no line of text.
const LABEL_MIN_THICKNESS = 18;

/** Whether the whole of `name` fits along an arc `length` pixels long, in a ring `thickness` pixels thick. A name is never cut. */
export const labelFits = (name: string, length: number, thickness: number): boolean =>
  name.length > 0 &&
  thickness >= LABEL_MIN_THICKNESS &&
  length >= name.length * CHAR_WIDTH + 2 * LABEL_PAD;

/**
 * Where the label of an arc goes: the middle of the arc, and the rotation in
 * degrees that lays the text along it. Text on the lower half is turned over,
 * so it never reads upside down: the rotation is between -90 and 90.
 */
export const labelPlacement = (
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number
): { x: number; y: number; rotate: number } => {
  const middle = (start + end) / 2;
  const [x, y] = polar(cx, cy, radius, middle);
  const degrees = (middle * 180) / Math.PI;
  return { x, y, rotate: ((degrees + 90) % 180) - 90 };
};

/** `part` as a share of `whole` in whole percents, `<1%` for what is there but too small to round to 1. */
export const percentLabel = (part: number, whole: number): string => {
  if (!(whole > 0) || !(part > 0)) return '0%';
  const share = (part / whole) * 100;
  if (share < 1) return '<1%';
  return `${Math.min(Math.round(share), 99 + Number(share >= 100))}%`;
};
