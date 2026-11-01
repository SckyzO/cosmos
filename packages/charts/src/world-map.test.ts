import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { describe, expect, it } from 'vitest';
import world110 from 'world-atlas/countries-110m.json';
import world50 from 'world-atlas/countries-50m.json';
import {
  byValue,
  clamp,
  jump,
  keySizes,
  markerMaxRadius,
  markerRadius,
  positionLabel,
  ranked,
  resolveRoutes,
  routePath,
  routeWidth,
  scaleOf,
  STEPS,
  stepOf,
  stopsOf,
  usableMarkers,
  walk,
  type Position,
  type Stop,
} from './world-map';
import { NUMERIC_TO_ALPHA2 } from './world-map-codes';

// Fifteen values: three per step.
const FIFTEEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe('scaleOf', () => {
  it('cuts the sorted values in five steps of about as many values', () => {
    const scale = scaleOf(FIFTEEN);
    expect(scale?.thresholds).toEqual([4, 7, 10, 13]);
    const counts = Array.from({ length: STEPS }, () => 0);
    for (const value of FIFTEEN) counts[stepOf(value, scale!)]++;
    expect(counts).toEqual([3, 3, 3, 3, 3]);
  });

  it('does not depend on the order of the values', () => {
    expect(scaleOf([...FIFTEEN].reverse())).toEqual(scaleOf(FIFTEEN));
  });

  it('makes one large value take the top step without stretching the others', () => {
    const scale = scaleOf([10, 11, 12, 13, 14, 15, 16, 17, 18, 1_000_000]) as NonNullable<
      ReturnType<typeof scaleOf>
    >;
    expect(scale.thresholds).toEqual([12, 14, 16, 18]);
    expect(stepOf(1_000_000, scale)).toBe(4);
    expect(stepOf(10, scale)).toBe(0);
  });

  it('prints the lowest value, then each threshold, as the lower bounds of the legend', () => {
    expect(scaleOf(FIFTEEN)?.bounds).toEqual([1, 4, 7, 10, 13]);
  });

  it('leaves a step empty when values repeat', () => {
    const scale = scaleOf([5, 5, 5, 5, 5]) as NonNullable<ReturnType<typeof scaleOf>>;
    expect(scale.thresholds).toEqual([5, 5, 5, 5]);
    expect(stepOf(5, scale)).toBe(4);
  });

  it('puts a single value in the top step', () => {
    const scale = scaleOf([42]) as NonNullable<ReturnType<typeof scaleOf>>;
    expect(scale.bounds).toEqual([42, 42, 42, 42, 42]);
    expect(stepOf(42, scale)).toBe(4);
  });

  it('has no scale without a finite value', () => {
    expect(scaleOf([])).toBeUndefined();
    expect(scaleOf([Number.NaN, Infinity])).toBeUndefined();
  });

  it('ignores a value that is not finite', () => {
    expect(scaleOf([...FIFTEEN, Number.NaN])).toEqual(scaleOf(FIFTEEN));
  });

  describe('with min and max', () => {
    it('clamps the values before the quantiles are taken', () => {
      // 1 to 3 count as 4 and 13 to 15 as 12: the values left are 4 4 4 4 5 … 11 12 12 12 12.
      const scale = scaleOf(FIFTEEN, 4, 12) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(scale.thresholds).toEqual([4, 7, 10, 12]);
      expect(scale.bounds).toEqual([4, 4, 7, 10, 12]);
    });

    it('prints a pinned min as the first bound, even under every value', () => {
      expect(scaleOf(FIFTEEN, 0)?.bounds[0]).toBe(0);
      expect(scaleOf(FIFTEEN)?.bounds[0]).toBe(1);
    });

    it('gives a value outside the ends the step of the end', () => {
      const scale = scaleOf(FIFTEEN, 4, 12) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(stepOf(1, scale)).toBe(stepOf(4, scale));
      expect(stepOf(99, scale)).toBe(stepOf(12, scale));
      expect(stepOf(99, scale)).toBe(4);
    });

    it('swaps the ends when they come the wrong way round', () => {
      expect(scaleOf(FIFTEEN, 12, 4)).toEqual(scaleOf(FIFTEEN, 4, 12));
    });

    it('takes the ends even when there is no value left in them', () => {
      const scale = scaleOf([1, 2, 3], 10, 20) as NonNullable<ReturnType<typeof scaleOf>>;
      expect(scale.thresholds).toEqual([10, 10, 10, 10]);
      expect(stepOf(1, scale)).toBe(4);
    });
  });
});

describe('stepOf', () => {
  const scale = scaleOf(FIFTEEN) as NonNullable<ReturnType<typeof scaleOf>>;

  it('puts a value on a threshold in the higher step', () => {
    expect([3, 4, 6, 7, 9, 10, 12, 13].map((value) => stepOf(value, scale))).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4,
    ]);
  });

  it('puts the lowest value in step 0 and the highest in step 4', () => {
    expect(stepOf(1, scale)).toBe(0);
    expect(stepOf(15, scale)).toBe(4);
  });
});

describe('clamp', () => {
  it('keeps a value inside the ends, and leaves an end that is not given open', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
    expect(clamp(-9)).toBe(-9);
    expect(clamp(9, undefined, 3)).toBe(3);
  });
});

describe('ranked', () => {
  it('lists the countries with a value, largest first and by name for equal values', () => {
    const list = ranked([
      { name: 'Spain', value: 5 },
      { name: 'Chad' },
      { name: 'Italy', value: 9 },
      { name: 'France', value: 5 },
    ]);
    expect(list.map((country) => country.name)).toEqual(['Italy', 'France', 'Spain']);
  });

  it('keeps a value of 0', () => {
    expect(ranked([{ name: 'a', value: 0 }])).toHaveLength(1);
  });
});

const country = (key: string): Stop => ({ kind: 'country', key });
const marker = (key: string): Stop => ({ kind: 'marker', key });
const route = (key: string): Stop => ({ kind: 'route', key });

describe('walk', () => {
  const order = [country('US'), country('FR'), country('DE')];

  it('moves along the order and stops at the ends', () => {
    expect(walk(order, 'country:US', 1)?.key).toBe('FR');
    expect(walk(order, 'country:DE', -1)?.key).toBe('FR');
    expect(walk(order, 'country:DE', 1)?.key).toBe('DE');
    expect(walk(order, 'country:US', -1)?.key).toBe('US');
  });

  it('starts at the first stop when there is no current one', () => {
    expect(walk(order, undefined, 1)?.key).toBe('US');
    expect(walk(order, 'country:ZZ', -1)?.key).toBe('US');
  });

  it('has nowhere to go without stops', () => {
    expect(walk([], undefined, 1)).toBeUndefined();
  });

  it('tells a country from a marker or a route that has the same key', () => {
    const mixed = [country('FR'), marker('FR'), route('FR')];
    expect(walk(mixed, 'marker:FR', 1)).toEqual(route('FR'));
    expect(walk(mixed, 'marker:FR', -1)).toEqual(country('FR'));
  });
});

describe('stopsOf', () => {
  it('lists the countries, then the markers, then the routes, each in the order given', () => {
    expect(
      stopsOf({ countries: ['US', 'FR'], markers: ['rtm', 'sha'], routes: ['3', '0'] })
    ).toEqual([country('US'), country('FR'), marker('rtm'), marker('sha'), route('3'), route('0')]);
  });

  it('leaves a group out when it is empty', () => {
    expect(stopsOf({ countries: [], markers: ['a'], routes: [] })).toEqual([marker('a')]);
  });
});

describe('jump', () => {
  const order = [country('US'), country('FR'), marker('a'), marker('b'), route('0')];

  it('goes to the first stop of the next group', () => {
    expect(jump(order, 'country:US', 1)).toEqual(marker('a'));
    expect(jump(order, 'country:FR', 1)).toEqual(marker('a'));
    expect(jump(order, 'marker:b', 1)).toEqual(route('0'));
  });

  it('stays on the last group', () => {
    expect(jump(order, 'route:0', 1)).toEqual(route('0'));
  });

  it('goes to the first stop of the previous group', () => {
    expect(jump(order, 'route:0', -1)).toEqual(marker('a'));
    expect(jump(order, 'marker:b', -1)).toEqual(country('US'));
  });

  it('goes to the first stop from the first group', () => {
    expect(jump(order, 'country:FR', -1)).toEqual(country('US'));
  });

  it('starts at the first stop when there is no current one', () => {
    expect(jump(order, undefined, 1)).toEqual(country('US'));
    expect(jump([], undefined, -1)).toBeUndefined();
  });
});

describe('markerMaxRadius', () => {
  it('is a sixtieth of the width of the map, between 6 and 16px', () => {
    expect(markerMaxRadius(600)).toBe(10);
    expect(markerMaxRadius(375)).toBeCloseTo(6.25);
    expect(markerMaxRadius(343)).toBe(6);
    expect(markerMaxRadius(960)).toBe(16);
    expect(markerMaxRadius(3000)).toBe(16);
  });
});

describe('markerRadius', () => {
  it('gives the largest value the largest radius', () => {
    expect(markerRadius(500, 500, 12)).toBe(12);
  });

  it('makes the area, not the radius, follow the value', () => {
    expect(markerRadius(250, 1000, 16)).toBeCloseTo(8);
    expect(markerRadius(1000, 1000, 16) / markerRadius(250, 1000, 16)).toBeCloseTo(2);
  });

  it('never goes under 3px, and gives a marker with no value that size', () => {
    expect(markerRadius(1, 1000, 16)).toBe(3);
    expect(markerRadius(undefined, 1000, 16)).toBe(3);
    expect(markerRadius(0, 1000, 16)).toBe(3);
    expect(markerRadius(-5, 1000, 16)).toBe(3);
  });

  it('has no scale to read a value against when nothing is positive', () => {
    expect(markerRadius(5, 0, 16)).toBe(3);
  });
});

describe('routeWidth', () => {
  it('goes from 1.2px for the smallest to 3.6px for the largest value', () => {
    expect(routeWidth(1000, 1000)).toBeCloseTo(3.6);
    expect(routeWidth(500, 1000)).toBeCloseTo(2.4);
    expect(routeWidth(0, 1000)).toBeCloseTo(1.2);
  });

  it('gives a route with no value, or nothing to compare to, the smallest width', () => {
    expect(routeWidth(undefined, 1000)).toBeCloseTo(1.2);
    expect(routeWidth(5, 0)).toBeCloseTo(1.2);
  });
});

describe('usableMarkers', () => {
  const at = (id: string, coordinates: Position) => ({ id, coordinates });

  it('keeps the markers with a position on the globe', () => {
    const list = [at('a', [2.35, 48.86]), at('b', [-180, -90]), at('c', [180, 90])];
    expect(usableMarkers(list)).toEqual(list);
  });

  it('drops a marker whose position is not finite or has no such latitude', () => {
    const list = [
      at('nan', [Number.NaN, 10]),
      at('inf', [10, Infinity]),
      at('pole', [0, 91]),
      at('short', [1] as unknown as Position),
      at('ok', [1, 2]),
    ];
    expect(usableMarkers(list).map((m) => m.id)).toEqual(['ok']);
  });

  it('keeps the first of two markers with the same id', () => {
    const list = [at('a', [1, 1]), at('a', [2, 2]), at('b', [3, 3])];
    expect(usableMarkers(list)).toEqual([at('a', [1, 1]), at('b', [3, 3])]);
  });
});

describe('resolveRoutes', () => {
  const markers = [
    { id: 'rtm', coordinates: [4.48, 51.92] as Position, label: 'Rotterdam' },
    { id: 'nyc', coordinates: [-74.0, 40.7] as Position, label: 'New York' },
  ];

  it('reads the ends of a route from the markers it names', () => {
    expect(resolveRoutes(markers, [{ from: 'rtm', to: 'nyc', value: 7 }])).toEqual([
      {
        index: 0,
        from: [4.48, 51.92],
        to: [-74.0, 40.7],
        fromName: 'Rotterdam',
        toName: 'New York',
        value: 7,
        label: undefined,
      },
    ]);
  });

  it('takes a position as it is, and names it by its coordinates', () => {
    const [resolved] = resolveRoutes(markers, [{ from: [2.35, 48.86], to: 'nyc' }]);
    expect(resolved.from).toEqual([2.35, 48.86]);
    expect(resolved.fromName).toBe('48.9°N, 2.4°E');
    expect(resolved.toName).toBe('New York');
  });

  it('keeps the index the route has in the list it was given, and its label', () => {
    const list = resolveRoutes(markers, [
      { from: 'rtm', to: 'zzz' },
      { from: 'nyc', to: 'rtm', label: 'Return leg' },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].index).toBe(1);
    expect(list[0].label).toBe('Return leg');
  });

  it('leaves out a route that names a marker that is not there', () => {
    expect(resolveRoutes(markers, [{ from: 'rtm', to: 'zzz' }])).toEqual([]);
    expect(resolveRoutes([], [{ from: 'rtm', to: 'nyc' }])).toEqual([]);
  });

  it('leaves out a route with a position that is not on the globe, or that goes nowhere', () => {
    expect(resolveRoutes(markers, [{ from: [Number.NaN, 0], to: 'nyc' }])).toEqual([]);
    expect(resolveRoutes(markers, [{ from: [0, 120], to: 'nyc' }])).toEqual([]);
    expect(resolveRoutes(markers, [{ from: 'rtm', to: 'rtm' }])).toEqual([]);
    expect(resolveRoutes(markers, [{ from: 'rtm', to: [4.48, 51.92] }])).toEqual([]);
  });

  it('counts a value that is not a finite number as none', () => {
    const [resolved] = resolveRoutes(markers, [{ from: 'rtm', to: 'nyc', value: Number.NaN }]);
    expect(resolved.value).toBeUndefined();
  });
});

describe('byValue', () => {
  it('puts the largest value first, ties by label, and what has no value last', () => {
    const list = byValue([
      { label: 'Delta' },
      { label: 'Bravo', value: 5 },
      { label: 'Alpha', value: 5 },
      { label: 'Charlie', value: 9 },
      { label: 'Echo', value: Number.NaN },
      { label: 'Zero', value: 0 },
    ]);
    expect(list.map((item) => item.label)).toEqual([
      'Charlie',
      'Alpha',
      'Bravo',
      'Zero',
      'Delta',
      'Echo',
    ]);
  });

  it('leaves the list it was given as it was', () => {
    const list = [
      { label: 'b', value: 1 },
      { label: 'a', value: 2 },
    ];
    byValue(list);
    expect(list.map((item) => item.label)).toEqual(['b', 'a']);
  });
});

describe('positionLabel', () => {
  it('writes latitude then longitude, to a tenth of a degree, with the hemisphere', () => {
    expect(positionLabel([2.35, 48.86])).toBe('48.9°N, 2.4°E');
    expect(positionLabel([-74, -33.87])).toBe('33.9°S, 74.0°W');
    expect(positionLabel([0, 0])).toBe('0.0°N, 0.0°E');
  });
});

describe('keySizes', () => {
  it('gives the largest value, and the quarter and sixteenth of it that the radius can tell apart', () => {
    // 6, 3 and 1.5px: the last is under the 3px floor, so it would look like the second.
    expect(keySizes(6000, 6)).toEqual([1500, 6000]);
    expect(keySizes(6000, 16)).toEqual([380, 1500, 6000]);
  });

  it('rounds the smaller ones to two figures and keeps the largest as it is', () => {
    expect(keySizes(4823, 16)).toEqual([300, 1200, 4823]);
  });

  it('has no key without a positive value', () => {
    expect(keySizes(0, 16)).toEqual([]);
    expect(keySizes(Number.NaN, 16)).toEqual([]);
  });
});

describe('routePath', () => {
  // The projection of the map, at any scale: the paths are only compared with each other.
  const path = geoPath(geoNaturalEarth1().scale(150).translate([480, 250]));
  const points = (d: string | null) =>
    [...(d ?? '').matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(
      ([, x, y]) => [Number(x), Number(y)] as const
    );
  const pieces = (d: string | null) => (d ?? '').split('M').length - 1;

  it('is one line for a route that stays on the map', () => {
    expect(pieces(routePath(path, [2.35, 48.86], [13.4, 52.52]))).toBe(1);
  });

  it('follows the great circle: between London and New York it bends north', () => {
    const london: Position = [-0.13, 51.5];
    const newYork: Position = [-74, 40.7];
    const line = points(routePath(path, london, newYork));
    const ends = [
      path.centroid({ type: 'Point', coordinates: london })[1],
      path.centroid({ type: 'Point', coordinates: newYork })[1],
    ];
    // The y axis points down: the north is a smaller y.
    expect(Math.min(...line.map(([, y]) => y))).toBeLessThan(Math.min(...ends) - 5);
  });

  it('is cut at the antimeridian: Shanghai to Los Angeles leaves by one edge and comes in by the other', () => {
    const d = routePath(path, [121.47, 31.23], [-118.24, 34.05]);
    expect(pieces(d)).toBe(2);
    const xs = points(d).map(([x]) => x);
    // Neither piece crosses the map: the line never runs from one edge to the other.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(600);
    const [first, second] = (d ?? '')
      .split('M')
      .slice(1)
      .map((piece) => points(`M${piece}`));
    for (const piece of [first, second]) {
      const x = piece.map(([px]) => px);
      expect(Math.max(...x) - Math.min(...x)).toBeLessThan(300);
    }
  });
});

describe('NUMERIC_TO_ALPHA2', () => {
  const idsOf = (topology: typeof world110) =>
    (topology.objects.countries.geometries as { id?: string }[]).flatMap((geometry) =>
      geometry.id === undefined ? [] : [geometry.id]
    );

  it.each([
    ['250', 'FR'],
    ['840', 'US'],
    ['076', 'BR'],
    ['036', 'AU'],
    ['826', 'GB'],
    ['276', 'DE'],
    ['392', 'JP'],
    ['356', 'IN'],
    ['710', 'ZA'],
    ['484', 'MX'],
    ['410', 'KR'],
    ['528', 'NL'],
  ])('maps %s to %s', (numeric, alpha2) => {
    expect(NUMERIC_TO_ALPHA2[numeric]).toBe(alpha2);
  });

  it('has an entry for every feature id of countries-110m', () => {
    const ids = idsOf(world110);
    expect(ids.length).toBeGreaterThan(170);
    expect(ids.filter((id) => !(id in NUMERIC_TO_ALPHA2))).toEqual([]);
  });

  it('has an entry for every feature id of countries-50m', () => {
    const ids = idsOf(world50 as unknown as typeof world110);
    expect(ids.length).toBeGreaterThan(230);
    expect(ids.filter((id) => !(id in NUMERIC_TO_ALPHA2))).toEqual([]);
  });

  it('is made of three-digit numeric codes and upper-case alpha-2 codes, each used once', () => {
    const entries = Object.entries(NUMERIC_TO_ALPHA2);
    expect(entries).toHaveLength(249);
    for (const [numeric, alpha2] of entries) {
      expect(numeric).toMatch(/^\d{3}$/);
      expect(alpha2).toMatch(/^[A-Z]{2}$/);
    }
    expect(new Set(entries.map(([, alpha2]) => alpha2)).size).toBe(entries.length);
  });
});
