import { clsx } from 'clsx';
import { Spinner } from '../ui/Spinner';

// The spinner of a DataTable that reloads with rows on screen. Internal: not re-exported.
//
// The rows stay, dimmed and inert, under it; the spinner is the visual half, and the table's own
// `aria-busy` and "Loading…" status are what assistive technology gets, so it is hidden from them.
//
// A reload that answers at once shows neither the dimming nor the spinner: both wait 150 ms, then
// fade in over `--cosmos-motion-fast`. It is a wait in the CSS of the transition, so there is no
// timer to clean up, and it is not a movement: with the reduced setting the fade is 0 ms and the
// wait stays, so a short reload still flashes nothing.

/** The wait before the dimming and the spinner show, as a `transition-delay` utility. */
const WAIT = 'delay-150';

/** Only the spinner, centred: dimming what is under it is the caller's job (`DIMMED`, `inert`). */
export const LoadingVeil = ({ sticky = false }: { sticky?: boolean }) => (
  <div
    aria-hidden
    className={clsx(
      'pointer-events-none absolute inset-0 z-20 flex justify-center print:hidden',
      // Mounted with the reload, invisible until the wait is over, then faded in.
      'transition-opacity duration-(--cosmos-motion-fast) ease-(--cosmos-ease-out) starting:opacity-0',
      WAIT
    )}
  >
    {/* Over a list taller than the screen, the middle of the list is out of sight: the spinner
        follows the middle of the screen while the list is in it. */}
    <div className={sticky ? 'sticky top-1/2 h-fit -translate-y-1/2' : 'self-center'}>
      <Spinner />
    </div>
  </div>
);

// Rows that wait for the next page: still readable, not clickable (the caller adds `inert`). They
// dim after the wait, and come back to full opacity at once and quickly when the rows arrive.
// Exclusive with `UNDIMMED`, which holds the transition of the rest.
export const DIMMED = clsx(
  'opacity-50 transition-opacity duration-(--cosmos-motion-fast) ease-(--cosmos-ease-out)',
  WAIT
);
export const UNDIMMED =
  'transition-opacity duration-(--cosmos-motion-exit) ease-(--cosmos-ease-in)';
