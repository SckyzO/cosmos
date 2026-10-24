import type { Ref, RefCallback } from 'react';

/** Point a ref (callback or object) at `node`. */
export function setRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/**
 * Combine several refs (callback or object) into one callback ref, so a
 * component can keep its own ref and still forward the consumer's.
 *
 * It returns a cleanup, as a React 19 callback ref may: React then calls that
 * cleanup on detach instead of the ref with `null`. The cleanup runs the ones
 * the refs returned, and resets the others (`null` to a callback without a
 * cleanup, `current = null` on an object ref).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return typeof cleanup === 'function' ? cleanup : () => ref(null);
      }
      setRef(ref, node);
      return () => setRef(ref, null);
    });
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
