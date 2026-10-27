import type { StyleSpecification } from 'maplibre-gl';
import type { MapMarker } from './types';

// A fictional city for the stories and the tests: drawn by hand and by loops, never copied from a
// tile provider. A MapLibre style with one GeoJSON source and no glyphs, sprite or tile server,
// so a story never leaves Storybook's origin.

const W = 4.8;
const S = 45.7;
const COLS = 8;
const ROWS = 6;
const STEP_X = 0.015;
const STEP_Y = 0.0125;
const STREET = 0.0016;

type Feature = {
  type: 'Feature';
  properties: { kind: string };
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'LineString'; coordinates: number[][] };
};

const rect = (x0: number, y0: number, x1: number, y1: number): number[][][] => [
  [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ],
];

const polygon = (kind: string, coordinates: number[][][]): Feature => ({
  type: 'Feature',
  properties: { kind },
  geometry: { type: 'Polygon', coordinates },
});

const line = (kind: string, coordinates: number[][]): Feature => ({
  type: 'Feature',
  properties: { kind },
  geometry: { type: 'LineString', coordinates },
});

const features = (): Feature[] => {
  const out: Feature[] = [];
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const x = W + col * STEP_X;
      const y = S + row * STEP_Y;
      const park = (col === 2 && row === 3) || (col === 5 && row === 1) || (col === 6 && row === 4);
      out.push(
        polygon(
          park ? 'park' : 'block',
          rect(x + STREET, y + STREET, x + STEP_X - STREET, y + STEP_Y - STREET)
        )
      );
    }
  }
  const east = W + COLS * STEP_X;
  const north = S + ROWS * STEP_Y;
  for (let col = 0; col <= COLS; col += 1) {
    const x = W + col * STEP_X;
    out.push(
      line(col % 4 === 0 ? 'avenue' : 'street', [
        [x, S],
        [x, north],
      ])
    );
  }
  for (let row = 0; row <= ROWS; row += 1) {
    const y = S + row * STEP_Y;
    out.push(
      line(row % 3 === 0 ? 'avenue' : 'street', [
        [W, y],
        [east, y],
      ])
    );
  }
  // A river across the south-east corner, and a pond.
  out.push(
    polygon('water', [
      [
        [W + 0.07, S - 0.004],
        [W + 0.09, S - 0.004],
        [W + 0.128, S + 0.03],
        [east + 0.004, S + 0.05],
        [east + 0.004, S + 0.062],
        [W + 0.12, S + 0.042],
        [W + 0.07, S - 0.004],
      ],
    ]),
    polygon('water', rect(W + 0.034, S + 0.044, W + 0.046, S + 0.052))
  );
  return out;
};

const source = {
  type: 'geojson',
  data: { type: 'FeatureCollection', features: features() },
  attribution: 'Fictional map data',
} as const;

const palette = (c: {
  background: string;
  block: string;
  park: string;
  water: string;
  street: string;
  avenue: string;
}): StyleSpecification => ({
  version: 8,
  sources: { city: source },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': c.background } },
    {
      id: 'blocks',
      type: 'fill',
      source: 'city',
      filter: ['==', ['get', 'kind'], 'block'],
      paint: { 'fill-color': c.block },
    },
    {
      id: 'parks',
      type: 'fill',
      source: 'city',
      filter: ['==', ['get', 'kind'], 'park'],
      paint: { 'fill-color': c.park },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'city',
      filter: ['==', ['get', 'kind'], 'water'],
      paint: { 'fill-color': c.water },
    },
    {
      id: 'streets',
      type: 'line',
      source: 'city',
      filter: ['==', ['get', 'kind'], 'street'],
      paint: { 'line-color': c.street, 'line-width': 2 },
    },
    {
      id: 'avenues',
      type: 'line',
      source: 'city',
      filter: ['==', ['get', 'kind'], 'avenue'],
      paint: { 'line-color': c.avenue, 'line-width': 4 },
    },
  ],
});

export const CITY_LIGHT = palette({
  background: '#eef0f4',
  block: '#e0e4ea',
  park: '#cde6d0',
  water: '#bcd7ee',
  street: '#ffffff',
  avenue: '#ffffff',
});

export const CITY_DARK = palette({
  background: '#12151c',
  block: '#1b202b',
  park: '#1a2d25',
  water: '#16293d',
  street: '#262d3b',
  avenue: '#2f3849',
});

const at = (col: number, row: number): [number, number] => [
  W + (col + 0.5) * STEP_X,
  S + (row + 0.5) * STEP_Y,
];

/** Twelve stores: a dense group downtown (it clusters when zoomed out) and a few outliers. */
export const CITY_STORES: MapMarker[] = [
  { id: 'harbour', label: 'Harbour', position: at(1, 1), description: '12 quay street' },
  { id: 'market', label: 'Market Hall', position: at(2, 2), description: '4 market square' },
  { id: 'central', label: 'Central', position: at(3, 2), intent: 'success', icon: 3 },
  { id: 'cathedral', label: 'Cathedral', position: at(3, 3) },
  { id: 'station', label: 'Station', position: at(4, 2), intent: 'warning' },
  { id: 'university', label: 'University', position: at(4, 3), intent: 'info' },
  { id: 'old-town', label: 'Old Town', position: at(2, 4) },
  { id: 'riverside', label: 'Riverside', position: at(6, 1), intent: 'danger' },
  { id: 'gardens', label: 'Gardens', position: at(5, 4), intent: 'success' },
  { id: 'airport-road', label: 'Airport Road', position: at(7, 5) },
  { id: 'north-gate', label: 'North Gate', position: at(0, 5) },
  { id: 'lakeside', label: 'Lakeside', position: at(1, 0), intent: 'info' },
];
