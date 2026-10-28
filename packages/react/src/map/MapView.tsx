import { useEffect, useInsertionEffect, useRef, useState, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { Minus, Plus } from 'lucide-react';
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  StyleSpecification,
} from 'maplibre-gl';
import { useControllableState } from '../hooks/useControllableState';
import { useCosmosTheme } from '../settings/useCosmosTheme';
import { ClusterPin, MapPin } from './MapPin';
import { isDrawable, markerBounds, markersToGeoJSON } from './mapGeo';
import type { MapMarker } from './types';

type MapLibre = typeof import('maplibre-gl');

export type MapViewState = {
  /** `[longitude, latitude]` of the middle of the map. */
  center: [lng: number, lat: number];
  zoom: number;
};

export type MapViewProps = {
  /** The places to show. Define it once (state, memo or a constant): a new array redraws the pins. */
  markers: readonly MapMarker[];
  /**
   * The light map style: a MapLibre style URL or object. Cosmos ships none, since a tile server has
   * its own terms and sees every visitor. Pass a constant, not a new object on each render.
   */
  style: string | StyleSpecification;
  /** The style under the dark themes (`.dark`, `.deep-blue`). Without it the light one is kept. */
  darkStyle?: string | StyleSpecification;
  /**
   * `interactive` pans and zooms, takes the focus and shows the zoom buttons. `static` is a fixed
   * view for a card or a detail page: no gesture, no focus stop, no popup, and the pins are
   * pictures, so give the places to assistive technology with a `MapMarkerList`.
   */
  variant?: 'interactive' | 'static';
  /** Names the map for assistive technology. Default `Map`. */
  ariaLabel?: string;
  /** Height of the map, in pixels or any CSS length. Default 360. */
  height?: number | string;
  /** Frame the markers on the first draw, and again when the set of markers changes. Default `true`. */
  fit?: boolean;
  /** The view when `fit` is off or there is no marker. Not controlled: the map owns it afterwards. */
  initialCenter?: [lng: number, lat: number];
  initialZoom?: number;
  /** Group the markers that are close at the current zoom into a counted circle. Default `true`. */
  cluster?: boolean;
  /** The marker whose popup is open, `null` for none. */
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  /** The view after each pan or zoom, however it was triggered (pointer, keyboard, buttons). */
  onViewChange?: (view: MapViewState) => void;
  /** Shown in place of the map when the browser cannot draw it (no WebGL). */
  unavailableMessage?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

const SOURCE = 'cosmos-markers';
const CLUSTER_RADIUS = 48;
const CLUSTER_MAX_ZOOM = 14;
const FIT = { padding: 56, maxZoom: CLUSTER_MAX_ZOOM } as const;

const missingMapLibre = (cause: unknown) =>
  new Error(
    '@sckyzo/cosmos-react/map needs the optional peer dependency "maplibre-gl". Install it with `pnpm add maplibre-gl` (or `npm install maplibre-gl`).',
    { cause }
  );

let pending: Promise<MapLibre> | undefined;

/** MapLibre, imported on the first map: it touches `window` on load, so never at module level. */
const loadMapLibre = () =>
  (pending ??= import('maplibre-gl').then(
    // A CommonJS build of the library comes back as `default`.
    (mod) => (mod as unknown as { default?: MapLibre }).default ?? mod,
    (error: unknown) => {
      pending = undefined;
      throw missingMapLibre(error);
    }
  ));

/** MapLibre owns these elements, so React cannot style them: the open pin goes above the others. */
const raise = (el: HTMLElement, on: boolean) => {
  el.style.zIndex = on ? '2' : '';
};

/** What is on screen: a marker, or a group of them. `el` is the element MapLibre positions. */
type Visible = {
  key: string;
  el: HTMLElement;
  position: [lng: number, lat: number];
  marker: string | null;
  cluster: { id: number; count: number } | null;
};

/**
 * An interactive map of places, drawn with MapLibre GL JS (the optional peer `maplibre-gl`): pins
 * in Cosmos colours with an icon or a number, a popup per pin, clusters, zoom buttons and a fit to
 * the markers. Load MapLibre's stylesheet once in the app: `import 'maplibre-gl/dist/maplibre-gl.css'`.
 *
 * The pins, popups and buttons are React and HTML, so a title or description with markup shows as
 * text and the theme repaints them on its own. Only the base map (`style` / `darkStyle`) comes from
 * the host.
 */
export const MapView = ({
  markers,
  style,
  darkStyle,
  variant = 'interactive',
  ariaLabel = 'Map',
  height = 360,
  fit = true,
  initialCenter,
  initialZoom,
  cluster = true,
  selectedId: selectedIdProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  onViewChange,
  unavailableMessage = 'The map could not be displayed.',
  className,
  ref,
}: MapViewProps) => {
  const interactive = variant === 'interactive';
  const theme = useCosmosTheme();
  const wantedStyle = theme === 'dark' && darkStyle ? darkStyle : style;
  const [selectedId, setSelectedId] = useControllableState<string | null>({
    value: selectedIdProp,
    defaultValue: defaultSelectedId,
    onChange: onSelectedIdChange,
    name: 'MapView.selectedId',
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedStyle = useRef(wantedStyle);
  const ariaLabelRef = useRef(ariaLabel);
  const reveal = useRef<(id: string) => void>(undefined);
  const refit = useRef<() => void>(undefined);
  const [visible, setVisible] = useState<Visible[]>([]);
  const [failure, setFailure] = useState<unknown>();
  const [unavailable, setUnavailable] = useState(false);

  // What the long-lived map callbacks read: the latest props, never a stale closure.
  const latest = useRef({ markers, fit, initialCenter, initialZoom, onViewChange, selectedId });
  useInsertionEffect(() => {
    latest.current = { markers, fit, initialCenter, initialZoom, onViewChange, selectedId };
  });

  // The map lives as long as its variant and clustering do; everything else is pushed into it.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let map: MapLibreMap | undefined;
    const pins = new Map<string, { marker: MapLibreMarker; el: HTMLElement }>();

    (async () => {
      let ml: MapLibre;
      try {
        ml = await loadMapLibre();
      } catch (error) {
        if (!disposed) setFailure(error);
        return;
      }
      if (disposed) return;

      const {
        markers: initial,
        fit: fitFirst,
        initialCenter: center,
        initialZoom: zoom,
      } = latest.current;
      const bounds = fitFirst ? markerBounds(initial) : null;
      try {
        map = new ml.Map({
          container,
          style: appliedStyle.current,
          interactive,
          attributionControl: { compact: false },
          ...(bounds ? { bounds, fitBoundsOptions: FIT } : { center, zoom }),
        });
      } catch {
        // No WebGL: the list next to the map still gives every place.
        if (!disposed) setUnavailable(true);
        return;
      }
      const current = map;
      mapRef.current = current;

      // The canvas is the map's focus stop: it carries the name, and a static map has none.
      const canvas = current.getCanvas();
      canvas.setAttribute('aria-label', ariaLabelRef.current);
      if (!interactive) {
        canvas.removeAttribute('tabindex');
        canvas.setAttribute('role', 'img');
      }

      const addSource = () => {
        if (current.getSource(SOURCE)) return;
        current.addSource(SOURCE, {
          type: 'geojson',
          data: markersToGeoJSON(latest.current.markers),
          cluster,
          clusterRadius: CLUSTER_RADIUS,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
        });
        // A source nothing draws is never tiled, and the pins are read from its tiles.
        current.addLayer({
          id: SOURCE,
          type: 'circle',
          source: SOURCE,
          paint: { 'circle-radius': 0, 'circle-opacity': 0 },
        });
      };

      // Pins are HTML elements MapLibre moves with the map; React fills them (portals below).
      const sync = () => {
        if (!current.getSource(SOURCE)) return;
        const next = new Map<string, Omit<Visible, 'el'>>();
        for (const feature of current.querySourceFeatures(SOURCE)) {
          const { cluster_id: clusterId, point_count: count, id } = feature.properties;
          const [lng, lat] = (feature.geometry as unknown as { coordinates: number[] }).coordinates;
          const isCluster = clusterId !== undefined;
          const key = isCluster ? `c:${clusterId}` : `m:${id}`;
          next.set(key, {
            key,
            position: [lng!, lat!],
            marker: isCluster ? null : String(id),
            cluster: isCluster ? { id: clusterId, count } : null,
          });
        }
        for (const [key, pin] of pins) {
          if (next.has(key)) continue;
          pin.marker.remove();
          pins.delete(key);
        }
        const shown: Visible[] = [];
        for (const [key, entry] of next) {
          let pin = pins.get(key);
          if (!pin) {
            const el = document.createElement('div');
            const marker = new ml.Marker({ element: el }).setLngLat(entry.position).addTo(current);
            // MapLibre labels its marker element a button; the pin inside is the control.
            el.removeAttribute('role');
            el.removeAttribute('aria-label');
            pin = { marker, el };
            pins.set(key, pin);
          }
          shown.push({ ...entry, el: pin.el });
        }
        setVisible(shown);
      };

      current.on('style.load', () => {
        addSource();
        sync();
      });
      current.on('sourcedata', (event) => {
        if (event.sourceId === SOURCE && event.isSourceLoaded) sync();
      });
      current.on('moveend', () => {
        sync();
        const { lng, lat } = current.getCenter();
        latest.current.onViewChange?.({ center: [lng, lat], zoom: current.getZoom() });
      });

      reveal.current = (id) => {
        const target = latest.current.markers.find((m) => m.id === id);
        if (!target || !isDrawable(target)) return;
        // A marker inside a cluster is not on screen yet: go in far enough to separate it.
        const separate = !pins.has(`m:${id}`);
        current.easeTo({
          center: [target.position[0], target.position[1]],
          zoom: separate ? Math.max(current.getZoom(), CLUSTER_MAX_ZOOM + 1) : current.getZoom(),
          // The popup opens above the pin: keep the pin low enough for it to fit.
          offset: [0, 56],
        });
      };
      refit.current = () => {
        const box = markerBounds(latest.current.markers);
        if (box) current.fitBounds(box, FIT);
      };
      if (latest.current.selectedId) reveal.current(latest.current.selectedId);
    })();

    return () => {
      disposed = true;
      reveal.current = undefined;
      refit.current = undefined;
      for (const { marker } of pins.values()) marker.remove();
      pins.clear();
      map?.remove();
      mapRef.current = null;
      setVisible([]);
    };
  }, [interactive, cluster]);

  // The accessible name follows the prop without rebuilding the map.
  useEffect(() => {
    ariaLabelRef.current = ariaLabel;
    mapRef.current?.getCanvas().setAttribute('aria-label', ariaLabel);
  }, [ariaLabel]);

  // Light and dark styles: the theme class on <html> reaches us through `useCosmosTheme`.
  useEffect(() => {
    if (appliedStyle.current === wantedStyle) return;
    appliedStyle.current = wantedStyle;
    // A full swap: the marker source is added again on `style.load`.
    mapRef.current?.setStyle(wantedStyle, { diff: false });
  }, [wantedStyle]);

  // New markers: feed the source, and frame them when the set (not just a field) changed.
  const ids = markers.map((m) => m.id).join('\u0000');
  const framed = useRef(ids);
  useEffect(() => {
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(markersToGeoJSON(markers));
  }, [markers]);
  useEffect(() => {
    if (framed.current === ids) return;
    framed.current = ids;
    if (fit) refit.current?.();
  }, [ids, fit]);

  // A marker chosen from the list or by code: bring it into view and open it.
  useEffect(() => {
    if (selectedId) reveal.current?.(selectedId);
  }, [selectedId]);

  // The open pin goes above its neighbours, so its popup is not covered.
  useEffect(() => {
    for (const v of visible) raise(v.el, v.marker === selectedId);
  }, [visible, selectedId]);

  // Thrown while rendering, so an error boundary catches it: a missing peer names the package.
  if (failure) throw failure;

  const byId = new Map(markers.map((m) => [m.id, m]));
  const zoomBy = (delta: 1 | -1) =>
    delta > 0 ? mapRef.current?.zoomIn() : mapRef.current?.zoomOut();

  return (
    <div
      ref={ref}
      className={clsx(
        'relative isolate w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)]',
        className
      )}
      style={{ height }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && selectedId) {
          event.stopPropagation();
          setSelectedId(null);
        }
      }}
    >
      <div ref={containerRef} className="size-full" />

      {unavailable && (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[var(--color-text-secondary)]"
        >
          {unavailableMessage}
        </p>
      )}

      {visible.map((v) => {
        const content = v.cluster ? (
          <ClusterPin
            count={v.cluster.count}
            interactive={interactive}
            onOpen={() => {
              const map = mapRef.current;
              const source = map?.getSource(SOURCE) as GeoJSONSource | undefined;
              const group = v.cluster;
              if (!map || !source || !group) return;
              // Zoom to the level that splits this group, centred on it.
              source.getClusterExpansionZoom(group.id).then(
                (zoom) => map.easeTo({ center: v.position, zoom }),
                () => undefined
              );
            }}
          />
        ) : (
          v.marker !== null &&
          byId.has(v.marker) && (
            <MapPin
              marker={byId.get(v.marker)!}
              selected={v.marker === selectedId}
              interactive={interactive}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          )
        );
        return content ? createPortal(content, v.el, v.key) : null;
      })}

      {interactive && !unavailable && (
        <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomBy(1)}
            className="focus-visible:focus-indicator size-ctrl-36 flex cursor-pointer items-center justify-center text-[var(--color-text-base)] hover:bg-gray-100 focus-visible:ring-inset dark:hover:bg-white/10"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomBy(-1)}
            className="focus-visible:focus-indicator size-ctrl-36 flex cursor-pointer items-center justify-center border-t border-[var(--color-border)] text-[var(--color-text-base)] hover:bg-gray-100 focus-visible:ring-inset dark:hover:bg-white/10"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
