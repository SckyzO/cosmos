import { describe, expect, it } from 'vitest';
import {
  arcPath,
  branches,
  findArc,
  isRelated,
  labelFits,
  labelPlacement,
  move,
  partition,
  percentLabel,
  polar,
  ringRadii,
  shadeOf,
  type Arc,
  type SunburstNode,
} from './sunburst';

const TAU = 2 * Math.PI;

// A company: 100 people in three divisions, one of them with two levels below it.
const ORG: SunburstNode[] = [
  {
    name: 'Engineering',
    children: [
      {
        name: 'Platform',
        children: [
          { name: 'Infra', value: 20 },
          { name: 'Data', value: 10 },
        ],
      },
      { name: 'Product', value: 20 },
    ],
  },
  {
    name: 'Sales',
    children: [
      { name: 'EMEA', value: 30 },
      { name: 'Americas', value: 10 },
    ],
  },
  { name: 'Legal', value: 10 },
];

const arcOf = (arcs: Arc[], ...path: string[]) => findArc(arcs, path) as Arc;

describe('partition', () => {
  it('gives the first ring the whole circle, each node the share its value holds', () => {
    const { arcs, total } = partition(ORG);
    expect(total).toBe(100);
    const ring = arcs.filter((arc) => arc.depth === 0);
    expect(ring.map((arc) => arc.name)).toEqual(['Engineering', 'Sales', 'Legal']);
    expect(ring[0].start).toBe(0);
    expect(ring[0].end).toBeCloseTo(TAU * 0.5);
    expect(ring[1].start).toBeCloseTo(TAU * 0.5);
    expect(ring[1].end).toBeCloseTo(TAU * 0.9);
    expect(ring[2].end).toBeCloseTo(TAU);
  });

  it('splits the arc of a node among its children by their values', () => {
    const { arcs } = partition(ORG);
    const platform = arcOf(arcs, 'Engineering', 'Platform');
    const infra = arcOf(arcs, 'Engineering', 'Platform', 'Infra');
    const data = arcOf(arcs, 'Engineering', 'Platform', 'Data');
    expect(platform.start).toBe(0);
    expect(platform.end).toBeCloseTo(TAU * 0.3);
    expect(infra.start).toBe(0);
    expect(infra.end).toBeCloseTo(TAU * 0.2);
    expect(data.start).toBeCloseTo(TAU * 0.2);
    expect(data.end).toBeCloseTo(TAU * 0.3);
    expect(arcOf(arcs, 'Engineering', 'Product').start).toBeCloseTo(TAU * 0.3);
  });

  it('gives a node the sum of its children, and ignores a value set on a node that has children', () => {
    const { arcs, total } = partition([
      {
        name: 'A',
        value: 999,
        children: [
          { name: 'a1', value: 1 },
          { name: 'a2', value: 3 },
        ],
      },
      { name: 'B', value: 4 },
    ]);
    expect(arcOf(arcs, 'A').value).toBe(4);
    expect(total).toBe(8);
    expect(arcOf(arcs, 'A').end).toBeCloseTo(TAU / 2);
  });

  it('keeps the value of a node whose list of children is empty', () => {
    const { arcs } = partition([
      { name: 'A', value: 3, children: [] },
      { name: 'B', value: 1 },
    ]);
    expect(arcOf(arcs, 'A').value).toBe(3);
  });

  it('leaves out what has no value to draw: zero, negative, not a number, or no value at all', () => {
    const { arcs, total } = partition([
      { name: 'A', value: 5 },
      { name: 'zero', value: 0 },
      { name: 'negative', value: -3 },
      { name: 'nan', value: Number.NaN },
      { name: 'infinite', value: Infinity },
      { name: 'none' },
      { name: 'empty branch', children: [{ name: 'x', value: 0 }] },
    ]);
    expect(arcs.map((arc) => arc.name)).toEqual(['A']);
    expect(total).toBe(5);
  });

  it('numbers each node by its place in the data, so the ones left out leave a gap', () => {
    const { arcs } = partition([
      { name: 'zero', value: 0 },
      { name: 'B', children: [{ name: 'skip' }, { name: 'b2', value: 2 }] },
    ]);
    const b2 = arcOf(arcs, 'B', 'b2');
    expect(b2.trail).toEqual([1, 1]);
    expect(b2.id).toBe('1.1');
    expect(b2.branch).toBe(1);
    expect(b2.parent).toBe('1');
    expect(b2.path).toEqual(['B', 'b2']);
    expect(b2.depth).toBe(1);
  });

  it('lists a node before its children, in the order of the circle', () => {
    const { arcs } = partition(ORG);
    expect(arcs.slice(0, 5).map((arc) => arc.name)).toEqual([
      'Engineering',
      'Platform',
      'Infra',
      'Data',
      'Product',
    ]);
  });

  it('counts the rings it draws', () => {
    expect(partition(ORG).rings).toBe(3);
    expect(partition([{ name: 'A', value: 1 }]).rings).toBe(1);
    expect(partition([]).rings).toBe(0);
  });

  it('shares the circle among the branches that are not hidden', () => {
    const { arcs, total } = partition(ORG, new Set([0]));
    expect(total).toBe(50);
    expect(arcs.map((arc) => arc.name)).toEqual(['Sales', 'EMEA', 'Americas', 'Legal']);
    expect(arcOf(arcs, 'Sales').start).toBe(0);
    expect(arcOf(arcs, 'Sales').end).toBeCloseTo(TAU * 0.8);
    // The branch keeps its index, so it keeps its color.
    expect(arcOf(arcs, 'Sales').branch).toBe(1);
  });

  it('has no arc for no data, or when every branch is hidden', () => {
    expect(partition([]).arcs).toEqual([]);
    expect(partition([{ name: 'A', value: 1 }], new Set([0])).arcs).toEqual([]);
  });

  it('fills the circle with a single node', () => {
    const { arcs } = partition([{ name: 'A', value: 7 }]);
    expect(arcs[0].start).toBe(0);
    expect(arcs[0].end).toBeCloseTo(TAU);
  });
});

describe('branches', () => {
  it('lists the first ring with the value of each, the ones with nothing to draw left out', () => {
    expect(branches([...ORG, { name: 'Empty', value: 0 }])).toEqual([
      { index: 0, name: 'Engineering', value: 50 },
      { index: 1, name: 'Sales', value: 40 },
      { index: 2, name: 'Legal', value: 10 },
    ]);
  });

  it('keeps the index of a branch after one that is left out', () => {
    expect(
      branches([
        { name: 'zero', value: 0 },
        { name: 'B', value: 2 },
      ])
    ).toEqual([{ index: 1, name: 'B', value: 2 }]);
  });
});

describe('findArc', () => {
  const { arcs } = partition(ORG);

  it('finds a node by the names from the first ring', () => {
    expect(findArc(arcs, ['Engineering', 'Platform', 'Data'])?.value).toBe(10);
    expect(findArc(arcs, ['Legal'])?.value).toBe(10);
  });

  it('finds nothing for a path that is not there, or an empty one', () => {
    expect(findArc(arcs, ['Engineering', 'Legal'])).toBeUndefined();
    expect(findArc(arcs, ['Nope'])).toBeUndefined();
    expect(findArc(arcs, [])).toBeUndefined();
  });

  it('takes the first of two siblings with the same name', () => {
    const twin = partition([
      { name: 'A', value: 1 },
      { name: 'A', value: 2 },
    ]);
    expect(findArc(twin.arcs, ['A'])?.value).toBe(1);
  });
});

describe('isRelated', () => {
  const { arcs } = partition(ORG);
  const platform = arcOf(arcs, 'Engineering', 'Platform');

  it('holds for a node, its ancestors and its descendants', () => {
    expect(isRelated(platform, platform)).toBe(true);
    expect(isRelated(platform, arcOf(arcs, 'Engineering'))).toBe(true);
    expect(isRelated(arcOf(arcs, 'Engineering'), platform)).toBe(true);
    expect(isRelated(platform, arcOf(arcs, 'Engineering', 'Platform', 'Infra'))).toBe(true);
  });

  it('does not hold for a sibling, a cousin or an unrelated branch', () => {
    expect(isRelated(platform, arcOf(arcs, 'Engineering', 'Product'))).toBe(false);
    expect(isRelated(platform, arcOf(arcs, 'Sales'))).toBe(false);
    expect(isRelated(platform, arcOf(arcs, 'Sales', 'EMEA'))).toBe(false);
  });

  it('does not take 1 for an ancestor of 10', () => {
    const many = partition([
      ...Array.from({ length: 11 }, (_, i) => ({ name: `n${i}`, value: 1 })),
    ]);
    expect(isRelated(many.arcs[1], many.arcs[10])).toBe(false);
  });
});

describe('move', () => {
  const { arcs } = partition(ORG);
  const id = (...path: string[]) => arcOf(arcs, ...path).id;
  const name = (arc?: Arc) => arc?.path.join('/');

  it('goes to the next and the previous sibling, clockwise', () => {
    expect(name(move(arcs, id('Engineering'), 'next'))).toBe('Sales');
    expect(name(move(arcs, id('Sales'), 'previous'))).toBe('Engineering');
    expect(name(move(arcs, id('Engineering', 'Platform'), 'next'))).toBe('Engineering/Product');
  });

  it('stays at the first and the last sibling', () => {
    expect(name(move(arcs, id('Legal'), 'next'))).toBe('Legal');
    expect(name(move(arcs, id('Engineering'), 'previous'))).toBe('Engineering');
  });

  it('does not cross to a cousin', () => {
    expect(name(move(arcs, id('Engineering', 'Product'), 'next'))).toBe('Engineering/Product');
  });

  it('goes out to the first child, and back in to the parent', () => {
    expect(name(move(arcs, id('Engineering'), 'child'))).toBe('Engineering/Platform');
    expect(name(move(arcs, id('Engineering', 'Platform', 'Data'), 'parent'))).toBe(
      'Engineering/Platform'
    );
  });

  it('stays on the first ring going in, and on a node with no child going out', () => {
    expect(name(move(arcs, id('Sales'), 'parent'))).toBe('Sales');
    expect(name(move(arcs, id('Legal'), 'child'))).toBe('Legal');
  });

  it('goes to the first and the last node of the ring', () => {
    expect(name(move(arcs, id('Engineering', 'Product'), 'first'))).toBe('Engineering/Platform');
    expect(name(move(arcs, id('Engineering', 'Platform'), 'last'))).toBe('Sales/Americas');
    expect(name(move(arcs, id('Sales'), 'first'))).toBe('Engineering');
    expect(name(move(arcs, id('Sales'), 'last'))).toBe('Legal');
  });

  it('starts at the first node when it is not on one', () => {
    expect(name(move(arcs, undefined, 'next'))).toBe('Engineering');
    expect(name(move(arcs, 'nope', 'child'))).toBe('Engineering');
  });

  it('has nowhere to go without arcs', () => {
    expect(move([], undefined, 'next')).toBeUndefined();
  });
});

describe('polar', () => {
  it('puts angle 0 at twelve o clock and turns clockwise', () => {
    const [x0, y0] = polar(100, 100, 50, 0);
    expect([x0, y0]).toEqual([100, 50]);
    const [x1, y1] = polar(100, 100, 50, Math.PI / 2);
    expect(x1).toBeCloseTo(150);
    expect(y1).toBeCloseTo(100);
    const [x2, y2] = polar(100, 100, 50, Math.PI);
    expect(x2).toBeCloseTo(100);
    expect(y2).toBeCloseTo(150);
  });
});

describe('arcPath', () => {
  it('draws a quarter of a ring from the outer edge out to the inner edge back', () => {
    expect(arcPath(0, 0, 50, 100, 0, Math.PI / 2)).toBe(
      'M0 -100A100 100 0 0 1 100 0L50 0A50 50 0 0 0 0 -50Z'
    );
  });

  it('flags an arc of more than half a turn as large', () => {
    expect(arcPath(0, 0, 50, 100, 0, (3 * Math.PI) / 2)).toMatch(/A100 100 0 1 1 .*A50 50 0 1 0/);
    expect(arcPath(0, 0, 50, 100, 0, Math.PI)).toMatch(/A100 100 0 0 1 .*A50 50 0 0 0/);
  });

  it('draws a full turn as two half circles, since one arc cannot start where it ends', () => {
    const d = arcPath(0, 0, 50, 100, 0, TAU);
    expect(d.match(/A100 100/g)).toHaveLength(2);
    expect(d.match(/A50 50/g)).toHaveLength(2);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it('closes on the center when there is no inner edge', () => {
    expect(arcPath(0, 0, 0, 100, 0, Math.PI / 2)).toBe('M0 -100A100 100 0 0 1 100 0L0 0Z');
  });

  it('rounds the coordinates to a hundredth', () => {
    const d = arcPath(0, 0, 50, 100, 0, 1);
    for (const n of d.match(/-?\d+\.\d+/g) ?? [])
      expect(n.split('.')[1].length).toBeLessThanOrEqual(2);
  });
});

describe('ringRadii', () => {
  it('leaves a hole for the text, and rings of the same thickness out to the edge', () => {
    const { hole, outer, thickness } = ringRadii(300, 3);
    expect(outer).toBe(146);
    expect(hole).toBeCloseTo(146 * 0.31);
    expect(thickness).toBeCloseTo((outer - hole) / 3);
  });

  it('has a thicker ring with fewer rings', () => {
    expect(ringRadii(300, 1).thickness).toBeGreaterThan(ringRadii(300, 3).thickness);
  });

  it('draws one ring at least', () => {
    expect(ringRadii(300, 0).thickness).toBeCloseTo(ringRadii(300, 1).thickness);
  });
});

describe('shadeOf', () => {
  it('is the full color for the first ring, then lighter steps, the last one for every ring after it', () => {
    expect([0, 1, 2, 3, 4].map(shadeOf)).toEqual([100, 76, 56, 56, 56]);
  });
});

describe('labelFits', () => {
  it('holds when the whole name fits along the arc, in a ring thick enough for text', () => {
    expect(labelFits('Sales', 120, 30)).toBe(true);
  });

  it('does not hold when the name is longer than the arc', () => {
    expect(labelFits('Engineering and Platform', 120, 30)).toBe(false);
  });

  it('does not hold in a ring too thin for a line of text', () => {
    expect(labelFits('Sales', 400, 12)).toBe(false);
  });

  it('does not hold for an empty name', () => {
    expect(labelFits('', 400, 30)).toBe(false);
  });
});

describe('labelPlacement', () => {
  it('puts the text on the middle of the arc, along it', () => {
    const { x, y, rotate } = labelPlacement(100, 100, 50, 0, Math.PI / 2);
    expect(x).toBeCloseTo(100 + 50 * Math.sin(Math.PI / 4));
    expect(y).toBeCloseTo(100 - 50 * Math.cos(Math.PI / 4));
    expect(rotate).toBeCloseTo(45);
  });

  it('turns the text over on the lower half so it never reads upside down', () => {
    expect(labelPlacement(0, 0, 50, Math.PI * 0.75, Math.PI * 1.25).rotate).toBeCloseTo(0);
    // The middle of the arc is at 126 degrees: the text turns 180 to read from the left.
    expect(labelPlacement(0, 0, 50, Math.PI * 0.6, Math.PI * 0.8).rotate).toBeCloseTo(-54);
    expect(labelPlacement(0, 0, 50, Math.PI * 1.2, Math.PI * 1.6).rotate).toBeCloseTo(72);
  });

  it('keeps the text upright on the upper half', () => {
    expect(labelPlacement(0, 0, 50, -Math.PI / 4, Math.PI / 4).rotate).toBeCloseTo(0);
    expect(labelPlacement(0, 0, 50, 0.1, 0.3).rotate).toBeCloseTo((0.2 * 180) / Math.PI);
  });
});

describe('percentLabel', () => {
  it('writes a share in whole percents', () => {
    expect(percentLabel(1, 3)).toBe('33%');
    expect(percentLabel(2, 3)).toBe('67%');
    expect(percentLabel(5, 5)).toBe('100%');
  });

  it('never rounds what is there down to 0, nor what is missing up to 100', () => {
    expect(percentLabel(1, 1000)).toBe('<1%');
    expect(percentLabel(0, 10)).toBe('0%');
    expect(percentLabel(999, 1000)).toBe('99%');
  });

  it('is 0% with nothing to share', () => {
    expect(percentLabel(0, 0)).toBe('0%');
  });
});
