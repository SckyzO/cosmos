import type { ReactNode } from 'react';
import type { Intent } from '../ui/intent';

/** A place on the map. The same array feeds `MapView` and `MapMarkerList`. */
export type MapMarker = {
  /** Identifies the marker in `selectedId` and in the list. Unique in the array. */
  id: string;
  /** `[longitude, latitude]`, in degrees (the GeoJSON order). A marker outside the range is not drawn. */
  position: readonly [lng: number, lat: number];
  /** The name: the accessible name of the pin, the title of the popup and the text of the list row. */
  label: string;
  /** Shown under the title in the popup and in the list. Plain React: markup in data is text. */
  description?: ReactNode;
  /** The pin's colour. Default `brand`. */
  intent?: Intent;
  /** An icon, or a short text such as a number, drawn in the pin. */
  icon?: ReactNode;
};
