import type { StyleSpecification } from 'maplibre-gl';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import type { MapMarker } from './types';

// A fictional city for the stories and the tests: drawn by hand and by loops, never copied from a
// tile provider. A MapLibre style with one GeoJSON source and no glyphs, sprite or tile server,
// so a story never leaves Storybook's origin. The world view is the same idea with the country
// outlines of `world-atlas` (Natural Earth), read from the package, not from the network.

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

// ── The world ───────────────────────────────────────────────────────────────

// The countries as GeoJSON, once: `world-atlas` is TopoJSON, which MapLibre does not read.
const countries = feature(
  world as unknown as Parameters<typeof feature>[0],
  (world as unknown as { objects: { countries: Parameters<typeof feature>[1] } }).objects.countries
);

const worldPalette = (c: { ocean: string; land: string; border: string }): StyleSpecification => ({
  version: 8,
  sources: {
    countries: { type: 'geojson', data: countries, attribution: 'Natural Earth' },
  },
  layers: [
    { id: 'ocean', type: 'background', paint: { 'background-color': c.ocean } },
    { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': c.land } },
    {
      id: 'borders',
      type: 'line',
      source: 'countries',
      paint: { 'line-color': c.border, 'line-width': 0.75 },
    },
  ],
});

export const WORLD_LIGHT = worldPalette({ ocean: '#dbe8f4', land: '#f4f5f7', border: '#c3cad6' });

export const WORLD_DARK = worldPalette({ ocean: '#0d1117', land: '#1b202b', border: '#2f3849' });

/** Twelve sites across the world: Paris, London and Frankfurt cluster when the view is wide. */
export const WORLD_SITES: MapMarker[] = [
  { id: 'london', label: 'London', position: [-0.13, 51.51], description: 'Edge, 4 racks' },
  { id: 'paris', label: 'Paris', position: [2.35, 48.86], intent: 'success', icon: 3 },
  { id: 'frankfurt', label: 'Frankfurt', position: [8.68, 50.11], intent: 'warning' },
  { id: 'new-york', label: 'New York', position: [-74.0, 40.71], description: 'Primary region' },
  { id: 'chicago', label: 'Chicago', position: [-87.63, 41.88], intent: 'info' },
  { id: 'sao-paulo', label: 'São Paulo', position: [-46.63, -23.55] },
  { id: 'lagos', label: 'Lagos', position: [3.38, 6.52], intent: 'danger' },
  { id: 'dubai', label: 'Dubai', position: [55.27, 25.2], intent: 'success' },
  { id: 'mumbai', label: 'Mumbai', position: [72.88, 19.08] },
  { id: 'singapore', label: 'Singapore', position: [103.85, 1.29], intent: 'info' },
  { id: 'tokyo', label: 'Tokyo', position: [139.69, 35.69] },
  { id: 'sydney', label: 'Sydney', position: [151.21, -33.87], intent: 'warning' },
];
