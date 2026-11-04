import { useEffect, useRef } from 'react';

/**
 * Returns a ref for a heading. When `screen` changes after the first render, the focus moves to
 * that heading, so a keyboard or screen reader user who submitted a form finds themselves at the
 * start of the screen that replaced it, not on `<body>`.
 *
 * The first render never takes the focus: a heading focused on mount would scroll the page, or a
 * docs page embedding the form, down to where it sits. Focus the person had already moved to
 * somewhere else on the page is left alone: only focus that fell to `<body>` with the screen it
 * was on is taken. The heading must have `tabIndex={-1}`. Internal to the package, not exported.
 */
export const useFocusOnSwitch = (screen: string) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(screen);
  useEffect(() => {
    if (shown.current === screen) return;
    shown.current = screen;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    heading.current?.focus({ preventScroll: true });
  }, [screen]);
  return heading;
};
