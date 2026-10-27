import { Spinner } from '../ui/Spinner';

// The spinner of a DataTable that reloads with rows on screen. Internal: not re-exported.
//
// The rows stay, dimmed and inert, under it; the spinner is the visual half, and the table's own
// `aria-busy` and "Loading…" status are what assistive technology gets, so it is hidden from them.

/** Only the spinner, centred: dimming what is under it is the caller's job (`DIMMED`, `inert`). */
export const LoadingVeil = ({ sticky = false }: { sticky?: boolean }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-20 flex justify-center print:hidden"
  >
    {/* Over a list taller than the screen, the middle of the list is out of sight: the spinner
        follows the middle of the screen while the list is in it. */}
    <div className={sticky ? 'sticky top-1/2 h-fit -translate-y-1/2' : 'self-center'}>
      <Spinner />
    </div>
  </div>
);

// Rows that wait for the next page: still readable, not clickable (the caller adds `inert`).
export const DIMMED = 'opacity-50 transition-opacity';
