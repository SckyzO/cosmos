import type { ReactNode } from 'react';
import { LinkContext, type LinkComponent } from './linkContext';

export type { LinkComponent, LinkComponentProps } from './linkContext';

export type LinkProviderProps = {
  /**
   * The component every internal link renders through, instead of `<a>`. It gets the props the
   * `<a>` would have had (see `LinkComponentProps`), `ref` included: pass them all on.
   */
  component: LinkComponent;
  children: ReactNode;
};

/**
 * LinkProvider — makes the components' links go through the app's router. Mount it once, at the
 * root. The links of `Sidebar`, `Navbar`, `Breadcrumb`, `Menu`, `Link`, `Tag`, `DataTable` rows,
 * `Row` and the other components that take an `href` then render `component` in place of `<a>`:
 * a click navigates without reloading the page, and middle-click and "Open in a new tab" keep
 * working, since the element is still a real link.
 *
 * ```tsx
 * // Next.js: its Link takes `href` as it is.
 * import NextLink from 'next/link';
 * <LinkProvider component={NextLink}>{app}</LinkProvider>
 *
 * // React Router: its Link wants `to`.
 * import { Link } from 'react-router';
 * const AppLink = ({ href, ...props }: LinkComponentProps) => <Link to={href} {...props} />;
 * <LinkProvider component={AppLink}>{app}</LinkProvider>
 * ```
 *
 * Without a provider every link is a plain `<a>`, as before. These stay a plain `<a>` under one:
 * a link with `target="_blank"`, a link with no `href` or a bare `#`, and the links in chat
 * messages (user content). A nested provider replaces the outer one for its subtree, to send one
 * part of the page through another component.
 *
 * `cosmos-react` imports no router: the adapter is yours. Keep it a plain pass-through (`ref`,
 * `className`, `onClick` and the `aria-*` and `data-*` attributes must reach the element), as a
 * component that reads them from its link, `DataTable` for one, relies on it. Define it once, at
 * module level: a function made on each render is a new component type, and every link remounts.
 */
export function LinkProvider({ component, children }: LinkProviderProps) {
  return <LinkContext value={component}>{children}</LinkContext>;
}
