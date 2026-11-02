# Getting started

This page takes an empty app to a styled Cosmos component: requirements, install, the CSS setup
and why each line is there, a first component, the appearance settings, and one recipe for Vite
and one for Next.js (App Router). Every command and file below was run against the published
0.4.0 packages in a new app.

## Requirements

- **React 19 and React DOM 19** (`^19.0.0`), the peer dependencies of `@sckyzo/cosmos-react` and
  `@sckyzo/cosmos-charts`.
- **Tailwind CSS 4.** The components are styled with Tailwind 4 utility classes that your own
  build generates, so your app needs Tailwind 4 and its bundler plugin. The packages declare no
  peer range for Tailwind; the recipes below ran with Tailwind 4.3.3.
- **A bundler Tailwind 4 supports.** The recipes ran with Vite 8.3.5 (`@tailwindcss/vite`) and
  Next.js 16.4.3 (`@tailwindcss/turbopack`), on Node 26.12 and npm 11.20. The packages declare no
  `engines` field.

Without Tailwind, only the CSS variables of the theme are usable:
[Using the theme without Tailwind](guides/appearance.md#using-the-theme-without-tailwind).

## Install

The three packages share one version number: install the same version of each.

| Package                 | What it holds                                                        | Install it when                             |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| `@sckyzo/cosmos-theme`  | CSS only: the Tailwind tokens, the themes, the accents and the fonts | Always                                      |
| `@sckyzo/cosmos-react`  | The React components                                                 | You use the components                      |
| `@sckyzo/cosmos-charts` | The chart wrappers, drawn with Recharts, that follow the theme       | You draw charts: [charts](guides/charts.md) |

```bash
npm install @sckyzo/cosmos-theme @sckyzo/cosmos-react
# or
pnpm add @sckyzo/cosmos-theme @sckyzo/cosmos-react
# or
yarn add @sckyzo/cosmos-theme @sckyzo/cosmos-react
```

Add `@sckyzo/cosmos-charts` the same way when you need it. Four entries of `cosmos-react`
(`/code`, `/editor`, `/map`, `/qr`) need an optional peer dependency each:
[Optional entries](guides/optional-entries.md).

## Set up the styles

Put this in the CSS file your app imports once, at its root (`src/index.css` in Vite,
`src/app/globals.css` in Next.js):

```css
@import 'tailwindcss';

/* Required: Tailwind scans the compiled components for their class names.
   The path is relative to this file. */
@source '../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';

@import '@sckyzo/cosmos-theme/tailwind';
@import '@sckyzo/cosmos-theme/vars';
@import '@sckyzo/cosmos-theme/fonts';
```

What each line does:

- **`@source` is mandatory.** Tailwind 4 generates a utility class only when it finds the class
  in a file it scans, and it does not scan `node_modules`. Without this line no Cosmos class is
  generated and every component renders unstyled. I built the Vite app below without it: the CSS
  came to 58 kB instead of 252 kB and the button had no background and square corners. The path
  is relative to the CSS file; adjust the number of `../` to where the package is installed. It
  works with pnpm's symlinked `node_modules` too.
- **`@sckyzo/cosmos-theme/tailwind`** is the Tailwind `@theme` block: the palette, the fonts, the
  shadows, the spacing and radius tokens. It goes after `@import 'tailwindcss'`.
- **`@sckyzo/cosmos-theme/vars`** holds the CSS custom properties of the themes and the accents
  (`--color-bg-base`, `--color-text-base`, `--color-brand-500`…) and the density, text size and
  radius rules. It goes after `/tailwind`: the import order is part of the setup.
- **`@sckyzo/cosmos-theme/fonts`** loads Outfit and JetBrains Mono through `@fontsource`. It is
  optional: leave it out and the font stack falls back to the system's. The other fonts of the
  `data-font` attribute load from `@sckyzo/cosmos-theme/fonts/<name>`; see
  [Appearance](guides/appearance.md#fonts).

Two more lines, only when you need them:

```css
/* Calendar, DatePicker, or a component built on them. */
@import '@sckyzo/cosmos-react/calendar.css';

/* The charts carry a few Tailwind classes of their own (the legend focus ring, the calendar
   shades in a dark theme). */
@source '../node_modules/@sckyzo/cosmos-charts/dist/**/*.{js,cjs}';
```

`Calendar` and `DatePicker` wrap [react-day-picker](https://daypicker.dev), whose structural
styles are not in the JavaScript, so the package stays loadable with `require` in Node and Jest.
`calendar.css` is the explicit export that loads them; import it once, after Tailwind. Without
it the calendar still draws, but its navigation arrows and the spacing of its header sit out of
place.

## A first component

```tsx
import { Button, Card } from '@sckyzo/cosmos-react';

export default function App() {
  return (
    <main className="mx-auto max-w-md p-8">
      <Card>
        <Card.Header>Hello Cosmos</Card.Header>
        <Card.Body>
          <p className="mb-4">A themed card and a button.</p>
          <Button>Save</Button>
        </Card.Body>
      </Card>
    </main>
  );
}
```

Every component outside the [optional entries](guides/optional-entries.md) is a named export of
`@sckyzo/cosmos-react`, with its types. The
[Storybook](https://sckyzo.github.io/cosmos/) documents each one, with its props and examples;
[docs/components](README.md#components) adds notes on the larger ones.

## Set the appearance

The theme, the accent, the font, the text size, the density, the corner radius and the reading
direction are a class and attributes on `<html>`. With none set, you get the light theme, the blue
accent, Outfit, the default text size, density and radius, and left to right.

```html
<html lang="en" class="dark" data-accent="teal"></html>
```

To change them while the app runs, call `applyAppearance` from `@sckyzo/cosmos-react`. It sets
and removes the class and the attributes for you:

```tsx
import { applyAppearance } from '@sckyzo/cosmos-react';

// In an event handler, or in an effect when the app starts.
applyAppearance({ theme: 'sand', accent: 'violet', font: 'inter', density: 'compact' });
```

A font other than Outfit needs its CSS import (`@import '@sckyzo/cosmos-theme/fonts/inter';`).
Saving the user's choice is up to your app. The [Appearance](guides/appearance.md) guide lists
every value and covers the pickers (`AppearanceSettings`, `AppearanceMenu`, `Customizer`) and the
system theme.

## Recipe: Vite and React

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install @sckyzo/cosmos-theme @sckyzo/cosmos-react
npm install tailwindcss @tailwindcss/vite
```

1. `vite.config.ts`: add the Tailwind plugin.

   ```ts
   import tailwindcss from '@tailwindcss/vite';
   import react from '@vitejs/plugin-react';
   import { defineConfig } from 'vite';

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

2. `src/index.css`: replace its content with the CSS of [Set up the styles](#set-up-the-styles).
   The `@source` path is right as written: `src/index.css` sits one folder below the project
   root.
3. `src/App.tsx`: replace its content with the component of [A first component](#a-first-component)
   and delete `src/App.css`, which nothing imports any more.
4. `index.html`: put the appearance on the root element, for example
   `<html lang="en" class="dark" data-accent="teal">`.
5. Run `npm run dev`, or `npm run build` then `npm run preview`.

The page shows a dark card on a dark page, in Outfit, with a teal button. `npm run build` runs
`tsc -b` first and passes with the TypeScript the template installs (7.0.2).

## Recipe: Next.js (App Router)

```bash
npx create-next-app@latest my-app --yes --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm
cd my-app
npm install @sckyzo/cosmos-theme @sckyzo/cosmos-react
```

`--tailwind` already installs Tailwind 4 and its Turbopack loader, so there is nothing else to
add.

1. `src/app/globals.css`: replace its content with the CSS of
   [Set up the styles](#set-up-the-styles), with one more `../` in the `@source` path, because
   the file is two folders below the project root:

   ```css
   @source '../../node_modules/@sckyzo/cosmos-react/dist/**/*.{js,cjs}';
   ```

2. `src/app/layout.tsx`: drop the Geist fonts of the template (Cosmos brings its own) and put the
   appearance on `<html>`.

   ```tsx
   import type { Metadata } from 'next';
   import './globals.css';

   export const metadata: Metadata = {
     title: 'Cosmos in Next.js',
   };

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" className="dark" data-accent="teal">
         <body>{children}</body>
       </html>
     );
   }
   ```

3. `src/app/demo.tsx`: the first component, in a client file.

   ```tsx
   'use client';

   import { useState } from 'react';
   import { Button, Card } from '@sckyzo/cosmos-react';

   export function Demo() {
     const [count, setCount] = useState(0);
     return (
       <Card>
         <Card.Header>Hello Cosmos</Card.Header>
         <Card.Body>
           <p className="mb-4">A themed card and a button.</p>
           <Button onClick={() => setCount(count + 1)}>Saved {count} times</Button>
         </Card.Body>
       </Card>
     );
   }
   ```

4. `src/app/page.tsx`:

   ```tsx
   import { Badge } from '@sckyzo/cosmos-react';
   import { Demo } from './demo';

   export default function Page() {
     return (
       <main className="mx-auto max-w-md space-y-4 p-8">
         <Badge>Server rendered</Badge>
         <Demo />
       </main>
     );
   }
   ```

5. Run `npm run dev`, or `npm run build` then `npm run start`.

### Server and client components

Both packages start every file of their build with `"use client"`, so a component such as
`Badge` or `Button` imports into a Server Component and renders on the server, as in `page.tsx`
above. Two things still need a client file (`'use client'` at its top, as `demo.tsx` has):

- **The compound components.** `Card.Header`, `Card.Body`, `Modal.Body`, `Tabs.List`,
  `Menu.Item`, `Sidebar.Item` and the others written `Component.Part` are properties of a client
  component. React does not let a Server Component read a property of a client reference: it gets
  `undefined`, and `next build` fails while prerendering with "Element type is invalid: expected
  a string (for built-in components) or a class/function (for composite components) but got:
  undefined". Compose them in a file that starts with `'use client'`.
- **Functions as props.** `onClick`, `render`, `formatValue` and every other callback cannot cross
  from a Server Component to a client one. Pass them from a client file.

The root layout can stay a Server Component: the appearance is plain attributes on `<html>`.

## Next steps

- [Appearance](guides/appearance.md): the themes, accents, fonts, density and the pickers.
- [Charts](guides/charts.md) and [optional entries](guides/optional-entries.md).
- [Links and your router](guides/refs-and-routing.md#links-and-your-router): send the links of the
  components through React Router, Next.js's `Link` or any other.
- [Right to left](guides/right-to-left.md).
- [Components](README.md#components): notes per group of components.
