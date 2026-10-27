import { useCallback, useSyncExternalStore } from 'react';
import { subscribeTicker } from '../data/ticker';
import { toTimestamp } from '../data/time';

const noopSubscribe = () => () => {};

/**
 * What `read(now)` returns, recomputed as time passes: `delay(now)` says how long until it may
 * change (`null`: never again), and the component re-renders only when the value does, so
 * `read` returns a string or a number and not an object. Every caller shares one timer.
 *
 * With `now` set, time is frozen at it: no timer runs. `read` and `delay` must keep their
 * identity between renders (`useCallback`), or the subscription restarts each time.
 *
 * Internal to the package, not exported.
 */
export const useTicker = <T extends string | number>(
  read: (now: number) => T,
  delay: (now: number) => number | null,
  now?: Date | number
): T => {
  const frozen = now === undefined ? undefined : toTimestamp(now);
  const subscribe = useCallback(
    (onChange: () => void) =>
      frozen !== undefined ? noopSubscribe() : subscribeTicker(() => delay(Date.now()), onChange),
    [frozen, delay]
  );
  const getSnapshot = useCallback(() => read(frozen ?? Date.now()), [read, frozen]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
