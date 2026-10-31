# Refs and routing

## Refs

`ref` is a regular prop (React 19), so no component needs `forwardRef`. Fields,
buttons and custom controls point it at the element you would focus, for
instance to put the focus on the first invalid field:

```tsx
import { useRef } from 'react';
import { Input } from '@sckyzo/cosmos-react';

const emailRef = useRef<HTMLInputElement>(null);

<Input ref={emailRef} label="Email" />;
// on a validation error: emailRef.current?.focus()
```

The `ref` prop of each component says what it points to: the native `<input>`
for text, number and search fields, the switch `<button>` for `Toggle`, the first
cell for `OtpInput`, the trigger for `DatePicker`, and the segment you would Tab
to for `SegmentedControl`, in either appearance (the selected one, else the first).

## Links and your router

Storybook: [LinkProvider](https://sckyzo.github.io/cosmos/?path=/docs/navigation-linkprovider--docs).

A component with an `href` (`Sidebar.Item`, `Breadcrumb`, `Menu.Item`, `Link`, `Tag`, a `Row`, a
`DataTable` row…) draws a plain `<a>`, so a click loads the page again. Mount `LinkProvider` once, at
the root of the app, to send those links through your router instead: it renders the component you
give in place of the `<a>`, so a click navigates in place, and middle-click and "Open in a new tab"
keep working, the element still being a real link. `cosmos-react` imports no router; the adapter is
yours.

```tsx
import { Link } from 'react-router';
import { LinkProvider, type LinkComponentProps } from '@sckyzo/cosmos-react';

// Define it once, at module level, and hand on every prop (`ref`, `className`, `onClick`, `aria-*`).
const AppLink = ({ href, ...props }: LinkComponentProps) => <Link to={href} {...props} />;

<LinkProvider component={AppLink}>{app}</LinkProvider>;
```

Next.js's `Link` takes `href` as it is: `<LinkProvider component={NextLink}>`. In the App Router,
mount it from a client file, since you pass it a component (`src/app/providers.tsx` below, used in
the root layout around `{children}`); a click on a Cosmos link then navigates without reloading
the page.

```tsx
'use client';

import NextLink from 'next/link';
import { LinkProvider } from '@sckyzo/cosmos-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LinkProvider component={NextLink}>{children}</LinkProvider>;
}
```

Without a provider
nothing changes. A link with `target="_blank"`, a link with no `href` or a bare `#`, and the links in
chat messages stay a plain `<a>`, and a provider inside another one replaces it for its subtree.
