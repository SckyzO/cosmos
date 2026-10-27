import { clsx } from 'clsx';
import { MapPin as PinIcon, X } from 'lucide-react';
import type { Intent } from '../ui/intent';
import type { MapMarker } from './types';

// A pin is HTML, not a map layer: its colour is a class, so a theme or accent switch repaints it
// with no value read in JavaScript. Tailwind scans for whole class names.
const PIN_COLOR: Record<Intent, string> = {
  neutral: 'bg-gray-600 text-white',
  brand: 'bg-brand-500 text-white',
  info: 'bg-blue-600 text-white',
  success: 'bg-green-500 text-gray-900',
  warning: 'bg-amber-500 text-gray-900',
  danger: 'bg-red-600 text-white',
};

const PIN_BASE =
  'relative flex items-center justify-center rounded-full border-2 border-white text-xs font-semibold shadow-md transition-transform';

type PinProps = {
  marker: MapMarker;
  selected: boolean;
  /** `false` on a static map: the pin is a picture, with no button and no popup. */
  interactive: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** One marker, drawn inside the element MapLibre positions on the map. */
export const MapPin = ({ marker, selected, interactive, onSelect, onClose }: PinProps) => {
  const { id, label, description, intent = 'brand', icon } = marker;
  // A text icon (a number) is visible, so the name carries it too: axe checks that the visible text
  // is part of the name.
  const name = typeof icon === 'string' || typeof icon === 'number' ? `${label} ${icon}` : label;
  const face =
    icon != null ? (
      <span aria-hidden="true">{icon}</span>
    ) : (
      <PinIcon className="size-4" aria-hidden="true" />
    );
  const className = clsx(
    PIN_BASE,
    'size-8',
    PIN_COLOR[intent],
    selected ? 'ring-brand-500/40 scale-110 ring-4' : 'ring-0'
  );

  if (!interactive) {
    return (
      <span className={className} aria-hidden="true">
        {face}
      </span>
    );
  }

  return (
    <>
      {/* Tab stops are the map and the list: a pin is reachable by pointer, and by the list. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={name}
        aria-expanded={selected}
        className={clsx(className, 'focus-visible:focus-indicator cursor-pointer')}
        onClick={() => (selected ? onClose() : onSelect(id))}
      >
        {face}
      </button>
      {selected && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute bottom-full left-1/2 mb-3 w-max max-w-60 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3 pr-9 text-left text-sm text-[var(--color-text-base)] shadow-lg"
        >
          <p className="font-medium">{label}</p>
          {description != null && (
            <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</div>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="focus-visible:focus-indicator absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
};

type ClusterPinProps = { count: number; interactive: boolean; onOpen: () => void };

/** A group of markers too close to tell apart at this zoom: a counted circle. */
export const ClusterPin = ({ count, interactive, onOpen }: ClusterPinProps) => {
  const size = count < 10 ? 'size-9' : count < 100 ? 'size-11' : 'size-14';
  const className = clsx(
    'bg-brand-600 ring-brand-500/30 flex items-center justify-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-md ring-4',
    size
  );
  if (!interactive) {
    return (
      <span className={className} aria-hidden="true">
        {count}
      </span>
    );
  }
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`${count} places, zoom in`}
      className={clsx(className, 'focus-visible:focus-indicator cursor-pointer')}
      onClick={onOpen}
    >
      {count}
    </button>
  );
};
