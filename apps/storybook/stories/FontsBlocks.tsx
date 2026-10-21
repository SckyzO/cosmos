import { Typeset } from '@storybook/addon-docs/blocks';
import type { ReactNode } from 'react';
import { useTheme } from 'storybook/theming';
import { COSMOS_FONTS, COSMOS_TEXT_SIZES, type CosmosFont } from '../../../packages/react/src';

// Blocks for Fonts.mdx. A docs page without stories gets no theme class on
// <html>, so the Cosmos colors stay on light while the docs chrome follows the
// toolbar: everything here takes its colors from the docs theme instead.

const SAMPLE = 'Rack B-07 · 42 nodes · 99.982% uptime · p95 184 ms';
const SIZES = [11, 12, 14, 16, 20, 24, 30];

// Weight ranges of the files each import loads (packages/theme/css/fonts*.css).
const WEIGHTS: Record<CosmosFont, string> = {
  outfit: '300 to 800, one file per weight',
  inter: '100 to 900, variable',
  plex: '100 to 700, variable',
  montserrat: '100 to 900, variable',
  'open-sans': '300 to 800, variable',
  system: 'whatever the platform font has',
};

const importOf = (id: CosmosFont) =>
  id === 'system'
    ? null
    : id === 'outfit'
      ? '@sckyzo/cosmos-theme/fonts'
      : `@sckyzo/cosmos-theme/fonts/${id}`;

// The text-* sizes in rem at the default text size (tailwind-tokens.css, css-vars.css).
const SCALE: [token: string, rem: number][] = [
  ['text-3xs', 0.625],
  ['text-2xs', 0.6875],
  ['text-xs', 0.75],
  ['text-sm', 0.875],
  ['text-base', 1],
  ['text-lg', 1.125],
  ['text-xl', 1.25],
  ['text-2xl', 1.5],
  ['text-3xl', 1.875],
  ['text-4xl', 2.25],
  ['text-5xl', 3],
];

const px = (rem: number, scale: number) => `${Number((rem * 16 * scale).toFixed(1))}px`;

/** Wide tables scroll on their own instead of widening the page on a phone. */
const Scroll = ({ children }: { children: ReactNode }) => (
  <div style={{ overflowX: 'auto' }}>{children}</div>
);

/** One row per font of the Font setting, plus the mono font. */
export const FontTable = () => (
  <Scroll>
    <table>
      <thead>
        <tr>
          <th>Font</th>
          <th>
            <code>data-font</code>
          </th>
          <th>Import</th>
          <th>Weights</th>
        </tr>
      </thead>
      <tbody>
        {COSMOS_FONTS.map((f) => {
          const path = importOf(f.id);
          return (
            <tr key={f.id}>
              <td>{f.label}</td>
              <td>{f.id === 'outfit' ? 'none (default)' : <code>{f.id}</code>}</td>
              <td>{path ? <code>{path}</code> : 'nothing to import'}</td>
              <td>{WEIGHTS[f.id]}</td>
            </tr>
          );
        })}
        <tr>
          <td>
            JetBrains Mono (<code>font-mono</code>)
          </td>
          <td>none, always on</td>
          <td>
            <code>@sckyzo/cosmos-theme/fonts</code>
          </td>
          <td>400, 500 and 700</td>
        </tr>
      </tbody>
    </table>
  </Scroll>
);

const Sample = ({ family, sizes, text }: { family: string; sizes: number[]; text: string }) => {
  const theme = useTheme();
  return (
    <div style={{ color: theme.color.defaultText }}>
      <Typeset fontFamily={family} fontSizes={sizes} fontWeight={400} sampleText={text} />
    </div>
  );
};

/** A heading, the attribute to set and a Typeset sample for each font. */
export const FontSamples = () => (
  <>
    {COSMOS_FONTS.map((f) => (
      <section key={f.id} data-font-sample={f.id}>
        <h3>{f.label}</h3>
        <p>
          {f.id === 'outfit' ? (
            'The default: no attribute needed.'
          ) : (
            <code>{`<html data-font="${f.id}">`}</code>
          )}
        </p>
        <Sample family={f.family} sizes={SIZES} text={SAMPLE} />
      </section>
    ))}
    <section data-font-sample="mono">
      <h3>JetBrains Mono</h3>
      <p>
        The <code>font-mono</code> utility, for code, IDs and fixed-width figures. It doesn&apos;t
        change with <code>data-font</code>.
      </p>
      <Sample
        family="'JetBrains Mono', monospace"
        sizes={[11, 12, 14, 16]}
        text="node-b07-42  10.20.7.42  0O 1lI  184 ms"
      />
    </section>
  </>
);

/** Each text-* token in px at the four text sizes. */
export const TextSizeTable = () => (
  <Scroll>
    <table>
      <thead>
        <tr>
          <th>Token</th>
          {COSMOS_TEXT_SIZES.map((s) => (
            <th key={s.id}>
              {s.label}
              {s.id !== 'md' && (
                <>
                  {' '}
                  (<code>{s.id}</code>)
                </>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SCALE.map(([token, rem]) => (
          <tr key={token}>
            <td>
              <code>{token}</code>
            </td>
            {COSMOS_TEXT_SIZES.map((s) => (
              <td key={s.id}>{px(rem, s.scale)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Scroll>
);
