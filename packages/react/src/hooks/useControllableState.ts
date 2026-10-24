import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

/** The value to move to, or a function of the current one, as with `setState`. */
export type ControllableUpdate<T> = T | ((current: T) => T);

export type ControllableStateOptions<T, A extends unknown[] = []> = {
  /**
   * The value the host controls. Only `undefined` means uncontrolled: `null`, `false`, `0`
   * and `''` are controlled values.
   */
  value: T | undefined;
  /** Starting value while uncontrolled, read on the first render only. */
  defaultValue: T | (() => T);
  /**
   * Called on every set, controlled or not, with the value to move to and the setter's extra
   * arguments (a field passes its native event).
   */
  onChange?: (value: T, ...args: A) => void;
  /**
   * `Component.prop`, for the console warning when the host switches between controlled and
   * uncontrolled.
   */
  name: string;
};

/**
 * State a host may control. Returns the current value, a setter and whether the value is
 * controlled.
 *
 * The setter keeps its identity across renders and reads the latest `onChange` and value, so
 * effects and memoized handlers can depend on it without a stale closure. It updates the
 * internal state only while uncontrolled, and always calls `onChange`: a controlled
 * component shows the new value once the host passes it back.
 *
 * Internal to the package, not exported. `T` must not be a function type: a function passed
 * to the setter is an updater, as with `setState`.
 */
export function useControllableState<T, A extends unknown[] = []>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T, A>): [
  value: T,
  setValue: (next: ControllableUpdate<T>, ...args: A) => void,
  isControlled: boolean,
] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);
  const current = isControlled ? (value as T) : internal;

  // What the setter reads. Refreshed after each render, before any effect or event handler
  // can call the setter.
  const latest = useRef({ current, isControlled, onChange });
  useInsertionEffect(() => {
    latest.current = { current, isControlled, onChange };
  });

  const setValue = useCallback((next: ControllableUpdate<T>, ...args: A) => {
    const state = latest.current;
    const resolved = typeof next === 'function' ? (next as (current: T) => T)(state.current) : next;
    if (!state.isControlled) {
      // A second set in the same event builds on this one, as with setState.
      state.current = resolved;
      setInternal(resolved);
    }
    state.onChange?.(resolved, ...args);
  }, []);

  useModeSwitchWarning(isControlled, name);

  return [current, setValue, isControlled];
}

/**
 * Warns once per component when its value goes from controlled to uncontrolled or back,
 * usually a host passing `undefined` for an empty value. Not limited to development builds:
 * the package has no build flag to strip it, and it only fires on a host bug.
 */
function useModeSwitchWarning(isControlled: boolean, name: string) {
  const initial = useRef(isControlled);
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || initial.current === isControlled) return;
    warned.current = true;
    const from = initial.current ? 'controlled' : 'uncontrolled';
    const to = isControlled ? 'controlled' : 'uncontrolled';
    console.warn(
      `Cosmos: ${name} switched from ${from} to ${to}. Keep it one or the other for the ` +
        'life of the component: only `undefined` means uncontrolled.'
    );
  }, [isControlled, name]);
}
