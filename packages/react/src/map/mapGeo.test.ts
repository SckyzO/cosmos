import { describe, expect, it } from 'vitest';
import { isDrawable, markerBounds, markersToGeoJSON } from './mapGeo';
import type { MapMarker } from './types';

const at = (id: string, lng: number, lat: number): MapMarker => ({
  id,
  label: id,
  position: [lng, lat],
});

describe('isDrawable', () => {
  it('accepts a position inside the range, edges included', () => {
    expect(isDrawable(at('a', 4.8, 45.7))).toBe(true);
    expect(isDrawable(at('b', -180, 90))).toBe(true);
    expect(isDrawable(at('c', 180, -90))).toBe(true);
  });

  it('refuses NaN, Infinity and out-of-range coordinates', () => {
    expect(isDrawable(at('a', NaN, 0))).toBe(false);
    expect(isDrawable(at('b', 0, Infinity))).toBe(false);
    expect(isDrawable(at('c', 181, 0))).toBe(false);
    expect(isDrawable(at('d', 0, -91))).toBe(false);
  });
});

describe('markersToGeoJSON', () => {
  it('makes one point per drawable marker, longitude first, keeping the id', () => {
    const data = markersToGeoJSON([at('a', 4.8, 45.7), at('bad', NaN, 1), at('b', 5, 46)]);
    expect(data.features.map((f) => f.properties.id)).toEqual(['a', 'b']);
    expect(data.features[0]!.geometry.coordinates).toEqual([4.8, 45.7]);
  });

  it('is an empty collection for no markers', () => {
    expect(markersToGeoJSON([]).features).toEqual([]);
  });
});

describe('markerBounds', () => {
  it('is the box around the markers, west and south first', () => {
    expect(markerBounds([at('a', 4.8, 45.9), at('b', 5.1, 45.7), at('c', 4.9, 45.8)])).toEqual([
      [4.8, 45.7],
      [5.1, 45.9],
    ]);
  });

  it('is a single point for one marker', () => {
    expect(markerBounds([at('a', 4.8, 45.7)])).toEqual([
      [4.8, 45.7],
      [4.8, 45.7],
    ]);
  });

  it('ignores a marker that cannot be drawn, and is null when none can', () => {
    expect(markerBounds([at('a', 4.8, 45.7), at('bad', 999, 0)])).toEqual([
      [4.8, 45.7],
      [4.8, 45.7],
    ]);
    expect(markerBounds([at('bad', 999, 0)])).toBeNull();
    expect(markerBounds([])).toBeNull();
  });
});
