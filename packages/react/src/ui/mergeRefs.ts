import type { Ref, RefCallback } from 'react';

/** Point a ref (callback or object) at `node`. */
export function setRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/**
 * Combine several refs (callback or object) into one callback ref, so a
 * component can keep its own ref and still forward the consumer's.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}
