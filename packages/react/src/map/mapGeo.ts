import type { MapMarker } from './types';

export type Bounds = [[west: number, south: number], [east: number, north: number]];

/** A position MapLibre can place: finite, longitude in -180..180, latitude in -90..90. */
export const isDrawable = ({ position: [lng, lat] }: MapMarker): boolean =>
  Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;

/** The markers as a GeoJSON source: one point each, carrying its `id`. */
export const markersToGeoJSON = (markers: readonly MapMarker[]) => ({
  type: 'FeatureCollection' as const,
  features: markers.filter(isDrawable).map(({ id, position }) => ({
    type: 'Feature' as const,
    properties: { id },
    geometry: { type: 'Point' as const, coordinates: [position[0], position[1]] },
  })),
});

/** The smallest box around the drawable markers, or `null` when there is none. */
export const markerBounds = (markers: readonly MapMarker[]): Bounds | null => {
  const drawable = markers.filter(isDrawable);
  if (drawable.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const {
    position: [lng, lat],
  } of drawable) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
};
