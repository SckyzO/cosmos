import { useEffect } from 'react';

/**
 * Stops the page from scrolling behind an overlay while `locked`, and puts `overflow` back as it
 * found it when `locked` turns false or the component unmounts.
 *
 * Internal to the package, not exported.
 */
export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
};
