import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

/**
 * The value to move to, or a function of the current one, as with `setState`. `S` is the
 * state, which may be empty (`undefined`) before the first set; `T` is what a set moves to.
 */
export type ControllableUpdate<T, S = T> = T | ((current: S) => T);

export type ControllableStateOptions<T, A extends unknown[] = [], D extends T | undefined = T> = {
  /**
   * The value the host controls. Only `undefined` means uncontrolled: `null`, `false`, `0`
   * and `''` are controlled values.
   */
  value: T | undefined;
  /**
   * Starting value while uncontrolled, read on the first render only. May be `undefined` for
   * a state that starts empty (no option picked yet): the state then reads `T | undefined`,
   * while the setter and `onChange` keep to `T`.
   */
  defaultValue: D | (() => D);
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
export function useControllableState<T, A extends unknown[] = [], D extends T | undefined = T>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T, A, D>): [
  value: T | D,
  setValue: (next: ControllableUpdate<T, T | D>, ...args: A) => void,
  isControlled: boolean,
] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T | D>(defaultValue);
  const current = isControlled ? value : internal;

  // What the setter reads. Refreshed after each render, before any effect or event handler
  // can call the setter.
  const latest = useRef({ current, isControlled, onChange });
  useInsertionEffect(() => {
    latest.current = { current, isControlled, onChange };
  });

  const setValue = useCallback((next: ControllableUpdate<T, T | D>, ...args: A) => {
    const state = latest.current;
    const resolved =
      typeof next === 'function' ? (next as (current: T | D) => T)(state.current) : next;
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

// Typed here: the package depends on no Node types.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether the host app is a production build. Bundlers (Vite, webpack, Next) replace
 * `process.env.NODE_ENV` at build time, as React's own warnings rely on; without a bundler
 * `process` doesn't exist, and the ReferenceError means "not a production build".
 */
const isProductionBuild = (() => {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
})();

/**
 * Warns once per component when its value goes from controlled to uncontrolled or back,
 * usually a host passing `undefined` for an empty value. Development builds only, like
 * React's warnings.
 */
function useModeSwitchWarning(isControlled: boolean, name: string) {
  const initial = useRef(isControlled);
  const warned = useRef(false);
  useEffect(() => {
    if (isProductionBuild || warned.current || initial.current === isControlled) return;
    warned.current = true;
    const from = initial.current ? 'controlled' : 'uncontrolled';
    const to = isControlled ? 'controlled' : 'uncontrolled';
    console.warn(
      `Cosmos: ${name} switched from ${from} to ${to}. Keep it one or the other for the ` +
        'life of the component: only `undefined` means uncontrolled.'
    );
  }, [isControlled, name]);
}
