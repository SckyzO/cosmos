import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Map as MapLibreMap } from 'maplibre-gl';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { Badge, Card } from '../ui';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { MapMarkerList } from './MapMarkerList';
import { MapView, type MapViewProps, type MapViewState } from './MapView';
import { CITY_DARK, CITY_LIGHT, CITY_STORES } from './storybook-map';
import type { MapMarker } from './types';

const meta = {
  title: 'Media/Map View',
  component: MapView,
  // `.storybook/preview.tsx` hands MapLibre its worker, bundled.
  parameters: { layout: 'padded', maplibre: true },
  tags: ['autodocs'],
  args: { markers: CITY_STORES, style: CITY_LIGHT, darkStyle: CITY_DARK, ariaLabel: 'Stores' },
} satisfies Meta<typeof MapView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Markers with a popup open. The base map is a local fictional city: Cosmos ships no tiles. */
export const MarkersAndPopups: Story = {
  args: { defaultSelectedId: 'central' },
};

/** Close markers group into a counted circle; a click on one zooms in to split it. */
export const Clusters: Story = {
  args: { fit: false, initialCenter: [4.86, 45.735], initialZoom: 10.8 },
};

/** `cluster={false}` draws every marker, however close. */
export const NoClusters: Story = {
  args: { fit: false, initialCenter: [4.86, 45.735], initialZoom: 10.8, cluster: false },
};

/** A fixed view for a card: no gesture, no zoom buttons, no focus stop, and the pins are pictures. */
export const StaticInACard: Story = {
  render: (args) => (
    <Card className="max-w-sm overflow-hidden">
      <MapView {...args} variant="static" height={180} className="rounded-none border-0" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-[var(--color-text-base)]">Delivery route</h3>
          <Badge intent="success">On time</Badge>
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Twelve stops between Harbour and Airport Road.
        </p>
      </div>
    </Card>
  ),
};

/** The markers as a list next to the map: choosing a row opens its popup. */
export const StoreLocator: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => <Locator {...args} />,
};

const Locator = (args: MapViewProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid gap-4 bg-[var(--color-bg-base)] p-6 md:grid-cols-[18rem_1fr]">
      <MapMarkerList
        markers={args.markers}
        selectedId={selected}
        onSelect={setSelected}
        ariaLabel="Stores"
      />
      <MapView {...args} selectedId={selected} onSelectedIdChange={setSelected} height={440} />
    </div>
  );
};

/** The map follows the theme: this story pins the dark one, so the host's dark style shows. */
export const DarkStyle: Story = {
  args: { defaultSelectedId: 'station' },
  globals: { theme: 'dark' },
};

/** At 375 px the list stacks under the map and the page does not scroll sideways. */
export const Mobile: Story = {
  globals: mobileViewport,
  parameters: { layout: 'fullscreen' },
  render: (args) => <Locator {...args} />,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const HOSTILE = '<img src=x onerror="window.__owned = 1"><script>window.__owned = 1</script>';

const Probe = (props: Partial<MapViewProps>) => {
  const [view, setView] = useState<MapViewState>();
  return (
    <>
      <MapView
        markers={CITY_STORES}
        style={CITY_LIGHT}
        darkStyle={CITY_DARK}
        onViewChange={setView}
        {...props}
      />
      <p data-testid="view" data-lng={view?.center[0]} data-zoom={view?.zoom}>
        {view ? 'moved' : 'not moved'}
      </p>
    </>
  );
};

const readView = (root: HTMLElement) => {
  const node = root.querySelector<HTMLElement>('[data-testid="view"]')!;
  return { lng: Number(node.dataset.lng), zoom: Number(node.dataset.zoom) };
};

const mapCanvas = async (root: HTMLElement) => {
  await waitFor(() => expect(root.querySelector('canvas.maplibregl-canvas')).not.toBeNull());
  return root.querySelector<HTMLCanvasElement>('canvas.maplibregl-canvas')!;
};

/**
 * A key press as the browser reports it. MapLibre reads `keyCode`, which the test library's
 * `userEvent.keyboard` leaves at 0, so the event is built here.
 */
const press = (target: HTMLElement, key: string, keyCode: number) => {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true })
  );
  target.dispatchEvent(
    new KeyboardEvent('keyup', { key, keyCode, bubbles: true, cancelable: true })
  );
};

export const KeyboardPansAndZooms: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe fit={false} initialCenter={[4.86, 45.74]} initialZoom={12} />,
  play: async ({ canvasElement, canvas }) => {
    // The map is one focus stop, and it has a name.
    const surface = await mapCanvas(canvasElement);
    expect(surface).toHaveAttribute('tabindex', '0');
    expect(surface).toHaveAttribute('aria-label', 'Map');
    await canvas.findByRole('button', { name: 'Zoom in' });
    surface.focus();
    expect(surface).toHaveFocus();

    press(surface, 'ArrowRight', 39);
    await waitFor(() => expect(readView(canvasElement).lng).toBeGreaterThan(4.86));
    const east = readView(canvasElement).lng;
    press(surface, 'ArrowLeft', 37);
    press(surface, 'ArrowLeft', 37);
    await waitFor(() => expect(readView(canvasElement).lng).toBeLessThan(east));

    const zoom = readView(canvasElement).zoom;
    press(surface, '=', 187);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeGreaterThan(zoom));
    const closer = readView(canvasElement).zoom;
    press(surface, '-', 189);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeLessThan(closer));
  },
};

export const ZoomButtonsHaveNames: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe fit={false} initialCenter={[4.86, 45.74]} initialZoom={12} />,
  play: async ({ canvasElement, canvas }) => {
    await mapCanvas(canvasElement);
    const zoomIn = await canvas.findByRole('button', { name: 'Zoom in' });
    const zoomOut = canvas.getByRole('button', { name: 'Zoom out' });
    await userEvent.click(zoomIn);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeCloseTo(13, 1));
    await userEvent.click(zoomOut);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeCloseTo(12, 1));
    await userEvent.click(zoomOut);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeCloseTo(11, 1));
  },
};

const Listed = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <MapMarkerList markers={CITY_STORES} selectedId={selected} onSelect={setSelected} />
      <MapView
        markers={CITY_STORES}
        style={CITY_LIGHT}
        cluster={false}
        selectedId={selected}
        onSelectedIdChange={setSelected}
      />
    </>
  );
};

export const ListMatchesMarkers: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Listed />,
  play: async ({ canvasElement, canvas }) => {
    const list = canvas.getByRole('list', { name: 'Places' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(
      CITY_STORES.map((store) => expect.stringContaining(store.label))
    );
    // Every marker of the list is a pin on the map, by the same name.
    const map = canvasElement.querySelector<HTMLElement>('.maplibregl-map')!;
    for (const store of CITY_STORES) {
      await waitFor(() =>
        expect(
          within(map).getByRole('button', { name: new RegExp(`^${store.label}`) })
        ).toBeTruthy()
      );
    }

    await userEvent.click(within(list).getByRole('button', { name: /Station/ }));
    const popup = await canvas.findByRole('dialog', { name: 'Station' });
    expect(popup).toBeVisible();
    expect(within(list).getByRole('button', { name: /Station/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    // Escape closes it from inside the popup.
    within(popup).getByRole('button', { name: 'Close' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
  },
};

const HOSTILE_MARKERS: MapMarker[] = [
  {
    id: 'hostile',
    label: HOSTILE,
    description: HOSTILE,
    position: [4.86, 45.74],
    icon: HOSTILE,
  },
];

export const PopupRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <MapView
      markers={HOSTILE_MARKERS}
      style={CITY_LIGHT}
      ariaLabel="Hostile"
      defaultSelectedId="hostile"
    />
  ),
  play: async ({ canvas }) => {
    const popup = await canvas.findByRole('dialog');
    // The markup of the data shows as written: nothing was parsed.
    expect(popup.textContent).toContain(HOSTILE);
    expect(popup.querySelector('img, script')).toBeNull();
    expect(document.querySelector('.maplibregl-marker img, .maplibregl-marker script')).toBeNull();
    expect((window as { __owned?: number }).__owned).toBeUndefined();
  },
};

export const StaticHasNoFocusStop: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe variant="static" height={200} markers={CITY_STORES.slice(0, 1)} />,
  play: async ({ canvasElement, canvas }) => {
    const surface = await mapCanvas(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.maplibregl-marker').length).toBe(1)
    );
    expect(surface).not.toHaveAttribute('tabindex');
    expect(surface).toHaveAttribute('role', 'img');
    expect(canvas.queryByRole('button')).toBeNull();
    // Nothing in the map can take the focus.
    const stops = canvasElement.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(stops).toHaveLength(0);
    // A gesture does not move it.
    await userEvent.keyboard('{ArrowRight}');
    expect(canvas.getByTestId('view')).toHaveTextContent('not moved');
  },
};

export const ClusterZoomsIn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe fit={false} initialCenter={[4.86, 45.735]} initialZoom={10.8} />,
  play: async ({ canvasElement, canvas }) => {
    await mapCanvas(canvasElement);
    const group = await canvas.findAllByRole('button', { name: /places, zoom in$/ });
    const before = readView(canvasElement).zoom || 10.8;
    await userEvent.click(group[0]!);
    await waitFor(() => expect(readView(canvasElement).zoom).toBeGreaterThan(before));
  },
};

export const SelectionIsControlled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe cluster={false} selectedId="harbour" />,
  play: async ({ canvas }) => {
    const popup = await canvas.findByRole('dialog', { name: 'Harbour' });
    // A controlled selection does not move until the host says so.
    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    expect(canvas.getByRole('dialog', { name: 'Harbour' })).toBeVisible();
  },
};

export const PinsFollowTheAccent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe cluster={false} />,
  play: async ({ canvas }) => {
    const pin = await canvas.findByRole('button', { name: 'Harbour' });
    const root = document.documentElement;
    const before = getComputedStyle(pin).backgroundColor;
    const accent = root.dataset.accent;
    root.dataset.accent = 'teal';
    try {
      await waitFor(() => expect(getComputedStyle(pin).backgroundColor).not.toBe(before));
    } finally {
      if (accent === undefined) delete root.dataset.accent;
      else root.dataset.accent = accent;
    }
  },
};

export const StyleFollowsTheTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Probe fit={false} initialCenter={[4.86, 45.735]} initialZoom={10.8} />,
  play: async ({ canvasElement, canvas }) => {
    const setStyle = spyOn(MapLibreMap.prototype, 'setStyle');
    const root = document.documentElement;
    const themeClasses = root.className;
    // The run may start in any theme (the contrast passes use light, sand and deep-blue): start
    // from plain light, with no theme class, so each step below is a change the map has to answer.
    // `useCosmosTheme` takes the first theme class it finds, so `sand` must go before `dark` comes.
    const startsDark = root.classList.contains('dark') || root.classList.contains('deep-blue');
    try {
      await mapCanvas(canvasElement);
      await canvas.findAllByRole('button', { name: /places, zoom in$/ });
      root.classList.remove('sand', 'dark', 'deep-blue');
      if (startsDark) {
        await waitFor(() => expect(setStyle).toHaveBeenLastCalledWith(CITY_LIGHT, { diff: false }));
      }
      // A dark theme swaps in the dark style, and the light theme swaps it back.
      root.classList.add('dark');
      await waitFor(() => expect(setStyle).toHaveBeenLastCalledWith(CITY_DARK, { diff: false }));
      root.classList.remove('dark');
      await waitFor(() => expect(setStyle).toHaveBeenLastCalledWith(CITY_LIGHT, { diff: false }));

      // The markers survive the swap: zooming in still splits the groups.
      const groups = (await canvas.findAllByRole('button', { name: /places, zoom in$/ })).length;
      const pins = canvasElement.querySelectorAll('.maplibregl-marker button').length;
      await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }));
      await waitFor(() =>
        expect(canvasElement.querySelectorAll('.maplibregl-marker button').length).toBeGreaterThan(
          pins
        )
      );
      expect(groups).toBeGreaterThan(0);
    } finally {
      setStyle.mockRestore();
      root.className = themeClasses;
    }
  },
};
