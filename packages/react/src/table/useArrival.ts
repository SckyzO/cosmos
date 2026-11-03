import { useState, type RefObject } from 'react';
import { useExitTransition } from '../hooks/useExitTransition';

// Internal to the table: how a block that comes and goes with the data arrives and leaves.

/**
 * Whether a block is on screen, and whether it moves in as it arrives. It is on screen while
 * `open`, and after it closed until its exit has played (`useExitTransition`, on `ref`). A block
 * that is open from the very first render (a row expanded by default, a selection restored) is
 * simply there; once it has been absent, it moves in each time it comes.
 */
export function useArrival(open: boolean, ref: RefObject<HTMLElement | null>) {
  const present = useExitTransition(open, ref);
  const [arrives, setArrives] = useState(false);
  if (!present && !arrives) setArrives(true);
  return { present, arrives };
}
