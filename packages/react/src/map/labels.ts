// The English the map components write, their part of `CosmosLabels`. The `/map` entry is built
// apart from the rest of the package, so `englishLabels` does not hold these: `MAP_VIEW_LABELS`
// and `MAP_MARKER_LIST_LABELS` are exported from `@sckyzo/cosmos-react/map`.

export type MapViewLabels = {
  /** Name of the map when the host gives no `ariaLabel`. Default `Map`. */
  map: string;
  /** Shown in place of the map when the browser cannot draw it, when the host gives no `unavailableMessage`. Default `The map could not be displayed.` */
  unavailable: string;
  /** Name of the zoom in button. Default `Zoom in`. */
  zoomIn: string;
  /** Name of the zoom out button. Default `Zoom out`. */
  zoomOut: string;
  /** Name of the button that closes a pin's popup. Default `Close`. */
  close: string;
  /** Name of a cluster of markers, from how many it groups. Default `12 places, zoom in`. */
  cluster: (count: number) => string;
};

export type MapMarkerListLabels = {
  /** Name of the list when the host gives no `ariaLabel`. Default `Places`. */
  places: string;
};

export const MAP_VIEW_LABELS: MapViewLabels = {
  map: 'Map',
  unavailable: 'The map could not be displayed.',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  close: 'Close',
  cluster: (count) => `${count} places, zoom in`,
};

export const MAP_MARKER_LIST_LABELS: MapMarkerListLabels = { places: 'Places' };
