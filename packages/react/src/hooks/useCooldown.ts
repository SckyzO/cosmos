import { useCallback, useEffect, useRef, useState } from 'react';

/** Whole seconds left before `deadline`, rounded up, never below 0. Times are in milliseconds. */
export const secondsLeft = (deadline: number, now: number) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));

/** Seconds as `m:ss` ("0:30", "2:05"). */
export const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// How often the deadline is read. The count comes from the clock, not from the number of ticks, so
// a throttled background tab catches up and the second never drifts.
const POLL_MS = 250;

/**
 * A wait of `seconds` that restarts on demand, for a button that cannot be pressed again at once
 * (resending a code). It starts on mount when `seconds` is above 0; `remaining` counts down to 0
 * and `onEnd` fires once when it gets there. `restart()` starts it over.
 *
 * Time is read from the clock against a deadline, so it holds up when the tab is throttled. Only
 * the whole second shows in `remaining`: the component renders once a second.
 *
 * Internal to the package, not exported.
 */
export const useCooldown = (seconds: number, onEnd?: () => void) => {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0;
  const [deadline, setDeadline] = useState(() => (total > 0 ? Date.now() + total * 1000 : 0));
  const [remaining, setRemaining] = useState(total);

  const latestOnEnd = useRef(onEnd);
  useEffect(() => {
    latestOnEnd.current = onEnd;
  });

  useEffect(() => {
    if (deadline === 0) return;
    const timer = setInterval(() => {
      const left = secondsLeft(deadline, Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        latestOnEnd.current?.();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  const restart = useCallback(() => {
    setRemaining(total);
    setDeadline(total > 0 ? Date.now() + total * 1000 : 0);
  }, [total]);

  return { remaining, restart };
};
