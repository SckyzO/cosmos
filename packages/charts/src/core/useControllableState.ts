import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

// The same hook as `packages/react/src/hooks/useControllableState.ts`, without
// the updater form and the extra arguments: this package imports nothing from
// `@sckyzo/cosmos-react`, so a chart whose host may own a piece of its state
// carries its own copy.

type ControllableStateOptions<T> = {
  /** The value the host controls. Only `undefined` means uncontrolled: `[]` and `''` are controlled values. */
  value: T | undefined;
  /** Starting value while uncontrolled, read on the first render only. */
  defaultValue: T;
  /** Called on every set, controlled or not, with the value to move to. */
  onChange?: (value: T) => void;
  /** `Component.prop`, for the console warning when the host switches between controlled and uncontrolled. */
  name: string;
};

/**
 * State a host may control: the current value, and a setter that keeps its
 * identity. The setter updates the internal state only while uncontrolled,
 * and always calls `onChange`: a controlled chart shows the new value once the
 * host passes it back.
 */
export const useControllableState = <T>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T>): [value: T, setValue: (next: T) => void] => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);
  const current = isControlled ? value : internal;

  // What the setter reads: refreshed after each render, before any handler can call it.
  const latest = useRef({ isControlled, onChange });
  useInsertionEffect(() => {
    latest.current = { isControlled, onChange };
  });

  const setValue = useCallback((next: T) => {
    if (!latest.current.isControlled) setInternal(next);
    latest.current.onChange?.(next);
  }, []);

  useModeSwitchWarning(isControlled, name);
  return [current, setValue];
};

// Typed here: the package depends on no Node types.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether the host app is a production build. Bundlers replace
 * `process.env.NODE_ENV` at build time, as React's own warnings rely on;
 * without a bundler `process` does not exist, and the ReferenceError means
 * "not a production build".
 */
const isProductionBuild = (() => {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
})();

/** Warns once when the value goes from controlled to uncontrolled or back, usually a host passing `undefined` for an empty value. Development builds only. */
const useModeSwitchWarning = (isControlled: boolean, name: string) => {
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
};
