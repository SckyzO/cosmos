import type { Ref, RefCallback } from 'react';

/**
 * Combine several refs (callback or object) into one callback ref, so a
 * component can keep its own ref and still forward the consumer's.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
  };
}
