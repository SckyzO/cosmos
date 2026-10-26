import { useContext, type ComponentPropsWithRef } from 'react';
import { LinkContext } from './linkContext';

/**
 * The one place a Cosmos component draws an internal link, in place of a raw `<a>`.
 *
 * It renders the `component` of the nearest `LinkProvider` with every prop it was given, and a
 * plain `<a>` when there is none, so a component that uses it follows the app's router with no
 * code of its own. Two kinds of link stay a plain `<a>` even under a provider, because a router
 * has nothing to do with them:
 * - a link that opens in a new tab (`target="_blank"`), which leaves the app;
 * - a link with no destination: no `href` (a disabled link), or a bare `#`, the placeholder of a
 *   link that goes nowhere yet.
 *
 * The links of user content (a chat message) don't use it at all: they are a raw `<a>` on purpose.
 *
 * Internal to the package, not exported: apps reach it through `LinkProvider`.
 */
export function AppLink({ href, ...rest }: ComponentPropsWithRef<'a'>) {
  const Component = useContext(LinkContext);
  if (Component === null || href === undefined || href === '#' || rest.target === '_blank') {
    return <a href={href} {...rest} />;
  }
  // The rule takes a component read from context for one made during render. This one is the
  // provider's `component` prop: the same function for as long as the app keeps it.
  // eslint-disable-next-line react-hooks/static-components -- stable by the provider's contract
  return <Component href={href} {...rest} />;
}
