import { clsx } from 'clsx';
import { MapPin } from 'lucide-react';
import type { MapMarker } from './types';

export type MapMarkerListProps = {
  /** The same array as the map's `markers`. */
  markers: readonly MapMarker[];
  /** The marker that is open on the map. Pass the map's `selectedId`. */
  selectedId?: string | null;
  /** A row was chosen: set the map's `selectedId` to it. */
  onSelect?: (id: string) => void;
  /** Names the list. Default `Places`. */
  ariaLabel?: string;
  className?: string;
};

/**
 * The markers as a list of buttons, next to the map. A map alone cannot be used with a screen
 * reader or a keyboard beyond panning, so the list is the way to reach each place: choosing a row
 * opens its popup on the map.
 */
export const MapMarkerList = ({
  markers,
  selectedId = null,
  onSelect,
  ariaLabel = 'Places',
  className,
}: MapMarkerListProps) => (
  <ul aria-label={ariaLabel} className={clsx('flex flex-col gap-1', className)}>
    {markers.map(({ id, label, description }) => {
      const selected = id === selectedId;
      return (
        <li key={id}>
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect?.(id)}
            className={clsx(
              'focus-visible:focus-indicator py-row-8 flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 text-start text-sm',
              selected
                ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10'
                : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
            )}
          >
            <MapPin
              className={clsx(
                'mt-0.5 size-4 shrink-0',
                selected
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-[var(--color-text-secondary)]'
              )}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block font-medium text-[var(--color-text-base)]">
                <bdi>{label}</bdi>
              </span>
              {description != null && (
                <span className="block text-xs text-[var(--color-text-secondary)]">
                  {description}
                </span>
              )}
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);
