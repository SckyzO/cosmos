import { createContext, type ComponentPropsWithRef, type ComponentType } from 'react';

/**
 * What a `LinkProvider`'s `component` receives: every prop the Cosmos component would have put on
 * its `<a>`, with `href` always set. That is `className`, `children` and `ref`, the `aria-*` and
 * `data-*` attributes, and `onClick`, `id`, `title`, `tabIndex`, `rel`, `target`… when the
 * component sets them. Pass them on to the element you render.
 */
export type LinkComponentProps = ComponentPropsWithRef<'a'> & { href: string };

/** A component that renders an internal link: your router's `Link`, or a thin adapter around it. */
export type LinkComponent = ComponentType<LinkComponentProps>;

/** The link component of the nearest `LinkProvider`, `null` without one. Internal to the package. */
export const LinkContext = createContext<LinkComponent | null>(null);
